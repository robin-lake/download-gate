import 'dotenv/config';
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  UpdateTableCommand,
  type CreateTableCommandInput,
  type TableDescription,
} from '@aws-sdk/client-dynamodb';
import {
  tableDefinitions,
  tableEnvKeys,
  type TableDefinition,
} from '../db/tableDefinitions.js';
import { buildCreateTableInput } from '../db/buildCreateTableInput.js';

const REGION = process.env['AWS_REGION'] ?? 'local-env';
const ENDPOINT = process.env['DYNAMODB_ENDPOINT'] ?? 'http://localhost:8000';

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  ...(ENDPOINT.includes('localhost') && {
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

const useOnDemand = ENDPOINT.includes('localhost');

/** Poll until table status is ACTIVE (or timeout). */
async function waitForTableActive(
  tableName: string,
  timeoutMs = 60_000,
  pollIntervalMs = 2000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const out = await client.send(new DescribeTableCommand({ TableName: tableName }));
    const status = out.Table?.TableStatus;
    if (status === 'ACTIVE') return;
    if (status !== 'UPDATING' && status !== 'CREATING') {
      throw new Error(`Table "${tableName}" in unexpected status: ${status}`);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error(`Table "${tableName}" did not become ACTIVE within ${timeoutMs}ms`);
}

function getTableName(def: TableDefinition): string {
  const envKey = def.envKey ?? tableEnvKeys[def.tableName];
  const fromEnv = envKey ? process.env[envKey] : undefined;
  return fromEnv ?? def.tableName;
}

async function describeTable(tableName: string): Promise<TableDescription | null> {
  try {
    const out = await client.send(new DescribeTableCommand({ TableName: tableName }));
    return out.Table ?? null;
  } catch {
    return null;
  }
}

/** Add any missing GSIs to an existing table. One GSI per UpdateTable call; waits for ACTIVE between calls. */
async function updateTableIfNeeded(
  def: TableDefinition,
  tableName: string
): Promise<void> {
  const table = await describeTable(tableName);
  if (!table) return;

  const existingIndexNames = new Set(
    (table.GlobalSecondaryIndexes ?? []).map((g) => g.IndexName)
  );
  const desiredGSIs = def.gsis ?? [];
  const missing = desiredGSIs.filter((g) => !existingIndexNames.has(g.indexName));
  if (missing.length === 0) {
    console.log(`Table "${tableName}" already has all GSIs, skipping update.`);
    return;
  }

  console.log(`Table "${tableName}": adding ${missing.length} GSI(s): ${missing.map((g) => g.indexName).join(', ')}`);

  for (const gsi of missing) {
    const keySchema = [
      { AttributeName: gsi.partitionKey.name, KeyType: 'HASH' as const },
      ...(gsi.sortKey
        ? [{ AttributeName: gsi.sortKey.name, KeyType: 'RANGE' as const }]
        : []),
    ];
    const attributeDefinitions = [
      { AttributeName: gsi.partitionKey.name, AttributeType: 'S' as const },
      ...(gsi.sortKey
        ? [{ AttributeName: gsi.sortKey.name, AttributeType: 'S' as const }]
        : []),
    ];

    await client.send(
      new UpdateTableCommand({
        TableName: tableName,
        AttributeDefinitions: attributeDefinitions,
        GlobalSecondaryIndexUpdates: [
          {
            Create: {
              IndexName: gsi.indexName,
              KeySchema: keySchema,
              Projection: { ProjectionType: 'ALL' },
              ...(useOnDemand ? {} : { ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 } }),
            },
          },
        ],
      })
    );
    console.log(`  Added GSI "${gsi.indexName}".`);
    await waitForTableActive(tableName);
  }
}

async function createOrUpdateTable(
  params: CreateTableCommandInput,
  def: TableDefinition,
  tableName: string
): Promise<void> {
  const existing = await describeTable(tableName);
  if (!existing) {
    await client.send(new CreateTableCommand(params));
    console.log(`Table "${tableName}" created.`);
    return;
  }

  await updateTableIfNeeded(def, tableName);
}

async function main(): Promise<void> {
  console.log(`DynamoDB endpoint: ${ENDPOINT}`);
  for (const def of tableDefinitions) {
    const tableName = getTableName(def);
    await createOrUpdateTable(
      buildCreateTableInput(def, tableName, { useOnDemand }),
      def,
      tableName
    );
  }
  const list = await client.send(new ListTablesCommand({}));
  console.log('Tables:', list.TableNames ?? []);
}

main().catch((err) => {
  console.error('Failed to create tables:', err);
  process.exit(1);
});
