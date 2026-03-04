import 'dotenv/config';
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  type CreateTableCommandInput,
} from '@aws-sdk/client-dynamodb';

const REGION = process.env['AWS_REGION'] ?? 'local-env';
const ENDPOINT = process.env['DYNAMODB_ENDPOINT'] ?? 'http://localhost:8000';

const USERS_TABLE = process.env['USERS_TABLE'] ?? 'Users';
const DOWNLOAD_GATES_TABLE = process.env['DOWNLOAD_GATES_TABLE'] ?? 'DownloadGates';
const GATE_STEPS_TABLE = process.env['GATE_STEPS_TABLE'] ?? 'GateSteps';
const SMART_LINKS_TABLE = process.env['SMART_LINKS_TABLE'] ?? 'SmartLinks';
const SMART_LINK_DESTINATIONS_TABLE =
  process.env['SMART_LINK_DESTINATIONS_TABLE'] ?? 'SmartLinkDestinations';

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

async function createUsersTable(): Promise<void> {
  await createTable({
    TableName: USERS_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ...gsiThroughput,
      },
    ],
    BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
    ...throughput,
  });
}

async function createDownloadGatesTable(): Promise<void> {
  await createTable({
    TableName: DOWNLOAD_GATES_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'gate_id', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'gate_id', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'gate_id-index',
        KeySchema: [{ AttributeName: 'gate_id', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ...gsiThroughput,
      },
    ],
    BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
    ...throughput,
  });
}

async function createGateStepsTable(): Promise<void> {
  await createTable({
    TableName: GATE_STEPS_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'gate_id', AttributeType: 'S' },
      { AttributeName: 'step_id', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'gate_id', KeyType: 'HASH' },
      { AttributeName: 'step_id', KeyType: 'RANGE' },
    ],
    BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
    ...throughput,
  });
}

async function createSmartLinksTable(): Promise<void> {
  await createTable({
    TableName: SMART_LINKS_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'link_id', AttributeType: 'S' },
      { AttributeName: 'short_url', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'link_id', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'short_url-index',
        KeySchema: [{ AttributeName: 'short_url', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ...gsiThroughput,
      },
    ],
    BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
    ...throughput,
  });
}

async function createSmartLinkDestinationsTable(): Promise<void> {
  await createTable({
    TableName: SMART_LINK_DESTINATIONS_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'smart_link_id', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'smart_link_id', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' },
    ],
    BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
    ...throughput,
  });
}

async function main(): Promise<void> {
  console.log(`DynamoDB endpoint: ${ENDPOINT}`);
  await createUsersTable();
  await createDownloadGatesTable();
  await createGateStepsTable();
  await createSmartLinksTable();
  await createSmartLinkDestinationsTable();
  const list = await client.send(new ListTablesCommand({}));
  console.log('Tables:', list.TableNames ?? []);
}

main().catch((err) => {
  console.error('Failed to create tables:', err);
  process.exit(1);
});
