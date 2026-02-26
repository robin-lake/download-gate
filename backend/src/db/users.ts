import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { UserRecord } from '../types.js';

const TABLE_NAME = process.env['USERS_TABLE'] ?? 'download-gate-users';
const client = new DynamoDBClient({
  region: process.env['AWS_REGION'] ?? 'us-east-1',
  ...(process.env['DYNAMODB_ENDPOINT'] && {
    endpoint: process.env['DYNAMODB_ENDPOINT'],
  }),
});

const PK = 'pk';
const SK = 'sk';
const GSI_EMAIL = 'gsi-email';

export async function ensureUsersTable(): Promise<void> {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    return;
  } catch {
    // Table doesn't exist, create it
  }
  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: PK, AttributeType: 'S' },
        { AttributeName: SK, AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: PK, KeyType: 'HASH' },
        { AttributeName: SK, KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: GSI_EMAIL,
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    })
  );
}

export async function putUser(user: UserRecord): Promise<void> {
  const item = {
    [PK]: `USER#${user.id}`,
    [SK]: 'PROFILE',
    id: user.id,
    email: user.email.toLowerCase(),
    passwordHash: user.passwordHash,
    name: user.name ?? null,
    createdAt: user.createdAt,
  };
  await client.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(item, { removeUndefinedValues: true }),
    })
  );
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const res = await client.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ [PK]: `USER#${id}`, [SK]: 'PROFILE' }),
    })
  );
  if (!res.Item) return null;
  const raw = unmarshall(res.Item) as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    email: raw['email'] as string,
    name: raw['name'] as string | undefined,
    passwordHash: raw['passwordHash'] as string,
    createdAt: raw['createdAt'] as string,
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const res = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_EMAIL,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: marshall({ ':email': email.toLowerCase() }),
      Limit: 1,
    })
  );
  const items = res.Items ?? [];
  if (items.length === 0) return null;
  const raw = unmarshall(items[0]!) as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    email: raw['email'] as string,
    name: raw['name'] as string | undefined,
    passwordHash: raw['passwordHash'] as string,
    createdAt: raw['createdAt'] as string,
  };
}
