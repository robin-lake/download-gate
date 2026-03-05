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
    await createTable(
      buildCreateTableInput(def, tableName, { useOnDemand })
    );
  }
  const list = await client.send(new ListTablesCommand({}));
  console.log('Tables:', list.TableNames ?? []);
}

main().catch((err) => {
  console.error('Failed to create tables:', err);
  process.exit(1);
});
