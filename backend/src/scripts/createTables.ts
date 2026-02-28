import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env['USERS_TABLE'] ?? 'Users';
const REGION = process.env['AWS_REGION'] ?? 'us-east-1';
// Default to DynamoDB Local so "npm run db:create" works after Docker restart without extra env
const ENDPOINT =
  process.env['DYNAMODB_ENDPOINT'] ?? 'http://localhost:8000';

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

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch {
    return false;
  }
}

async function createUsersTable(): Promise<void> {
  if (await tableExists(TABLE_NAME)) {
    console.log(`Table "${TABLE_NAME}" already exists, skipping creation.`);
    return;
  }

  const useOnDemand = ENDPOINT.includes('localhost');

  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
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
          ...(useOnDemand
            ? {}
            : {
                ProvisionedThroughput: {
                  ReadCapacityUnits: 5,
                  WriteCapacityUnits: 5,
                },
              }),
        },
      ],
      BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
      ...(useOnDemand
        ? {}
        : {
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          }),
    })
  );

  console.log(`Table "${TABLE_NAME}" created successfully.`);
}

createUsersTable().catch((err) => {
  console.error('Failed to create tables:', err);
  process.exit(1);
});
