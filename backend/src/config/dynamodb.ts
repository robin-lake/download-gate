import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Set DYNAMODB_ENDPOINT=http://localhost:8000 for local (Docker). Omit for real AWS.
const endpoint = process.env['DYNAMODB_ENDPOINT'];

const client = new DynamoDBClient({
  region: process.env['AWS_REGION'] ?? 'us-east-1',
  ...(endpoint && { endpoint }),
  ...(endpoint?.includes('localhost') && {
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});