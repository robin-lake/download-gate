import 'dotenv/config';
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  type CreateTableCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  tableDefinitions,
  tableEnvKeys,
  type TableDefinition,
} from '../db/tableDefinitions.js';

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
const throughput = useOnDemand
  ? {}
  : {
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };
const gsiThroughput = useOnDemand
  ? {}
  : {
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };

function collectAttributeNames(def: TableDefinition): Set<string> {
  const names = new Set<string>();
  names.add(def.partitionKey.name);
  if (def.sortKey) names.add(def.sortKey.name);
  def.gsis?.forEach((gsi) => {
    names.add(gsi.partitionKey.name);
    if (gsi.sortKey) names.add(gsi.sortKey.name);
  });
  return names;
}

function toCreateTableInput(def: TableDefinition, tableName: string): CreateTableCommandInput {
  const attrNames = collectAttributeNames(def);
  const attributeDefinitions = Array.from(attrNames).map((name) => ({
    AttributeName: name,
    AttributeType: 'S' as const,
  }));

  const keySchema = [
    { AttributeName: def.partitionKey.name, KeyType: 'HASH' as const },
    ...(def.sortKey ? [{ AttributeName: def.sortKey.name, KeyType: 'RANGE' as const }] : []),
  ];

  const globalSecondaryIndexes = def.gsis?.map((gsi) => ({
    IndexName: gsi.indexName,
    KeySchema: [
      { AttributeName: gsi.partitionKey.name, KeyType: 'HASH' as const },
      ...(gsi.sortKey ? [{ AttributeName: gsi.sortKey.name, KeyType: 'RANGE' as const }] : []),
    ],
    Projection: { ProjectionType: 'ALL' as const },
    ...gsiThroughput,
  }));

  return {
    TableName: tableName,
    AttributeDefinitions: attributeDefinitions,
    KeySchema: keySchema,
    ...(globalSecondaryIndexes?.length ? { GlobalSecondaryIndexes: globalSecondaryIndexes } : {}),
    BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
    ...throughput,
  };
}

function getTableName(def: TableDefinition): string {
  const envKey = def.envKey ?? tableEnvKeys[def.tableName];
  const fromEnv = envKey ? process.env[envKey] : undefined;
  return fromEnv ?? def.tableName;
}

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch {
    return false;
  }
}

async function createTable(params: CreateTableCommandInput): Promise<void> {
  const tableName = params.TableName as string;
  if (await tableExists(tableName)) {
    console.log(`Table "${tableName}" already exists, skipping.`);
    return;
  }
  await client.send(new CreateTableCommand(params));
  console.log(`Table "${tableName}" created.`);
}

async function main(): Promise<void> {
  console.log(`DynamoDB endpoint: ${ENDPOINT}`);
  for (const def of tableDefinitions) {
    const tableName = getTableName(def);
    await createTable(toCreateTableInput(def, tableName));
  }
  const list = await client.send(new ListTablesCommand({}));
  console.log('Tables:', list.TableNames ?? []);
}

main().catch((err) => {
  console.error('Failed to create tables:', err);
  process.exit(1);
});
