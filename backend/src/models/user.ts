import { v4 as uuidv4 } from 'uuid';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/dynamodb.js';

const TABLE_NAME = process.env['USERS_TABLE'] ?? 'Users';

export interface User {
  user_id: string;
  name: string;
  email: string;
  status: 'active' | string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface UpdateUserInput {
  [key: string]: unknown;
}

export interface ListOptions {
  limit?: number;
  lastKey?: string | null;
}

export interface ListResult {
  items: User[];
  nextToken: string | null;
  count?: number;
}

class UserModel {
  /** Create a new user */
  static async create({ name, email }: CreateUserInput): Promise<User> {
    const now = new Date().toISOString();
    const userRecord: User = {
      user_id: uuidv4(),
      name,
      email,
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    // PutItem with a condition to prevent overwriting existing items
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: userRecord,
      ConditionExpression: 'attribute_not_exists(user_id)',
    }));

    return userRecord;
  }

  /** Get a single user by ID */
  static async findById(userId: string): Promise<User | null> {
    const response = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { user_id: userId },
    }));

    return (response.Item as User) ?? null;
  }

  /** Find users by status using a GSI */
  static async findByStatus(status: string, limit = 20): Promise<User[]> {
    const response = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      Limit: limit,
    }));

    return (response.Items as User[]) ?? [];
  }

  /** Update specific fields on a user */
  static async update(userId: string, updates: UpdateUserInput): Promise<User> {
    // Build the update expression dynamically from the provided fields
    const expressionParts: string[] = [];
    const expressionNames: Record<string, string> = {};
    const expressionValues: Record<string, unknown> = {};

    Object.entries(updates).forEach(([key, value]) => {
      const nameKey = `#${key}`;
      const valueKey = `:${key}`;
      expressionParts.push(`${nameKey} = ${valueKey}`);
      expressionNames[nameKey] = key;
      expressionValues[valueKey] = value;
    });

    // Always update the updated_at timestamp
    expressionParts.push('#updated_at = :updated_at');
    expressionNames['#updated_at'] = 'updated_at';
    expressionValues[':updated_at'] = new Date().toISOString();

    const response = await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { user_id: userId },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ConditionExpression: 'attribute_exists(user_id)',
      ReturnValues: 'ALL_NEW',
    }));

    return response.Attributes as User;
  }

  /** Delete a user */
  static async delete(userId: string): Promise<User | null> {
    const response = await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { user_id: userId },
      ReturnValues: 'ALL_OLD',
    }));

    return (response.Attributes as User) ?? null;
  }

  /** List all users with pagination */
  static async list({ limit = 20, lastKey = null }: ListOptions = {}): Promise<ListResult> {
    const params: {
      TableName: string;
      Limit: number;
      ExclusiveStartKey?: Record<string, unknown>;
    } = {
      TableName: TABLE_NAME,
      Limit: limit,
    };

    // Support cursor-based pagination
    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(
        Buffer.from(lastKey, 'base64').toString()
      );
    }

    const response = await docClient.send(new ScanCommand(params));

    // Encode the last evaluated key for the next page
    let nextToken = null;
    if (response.LastEvaluatedKey) {
      nextToken = Buffer.from(
        JSON.stringify(response.LastEvaluatedKey)
      ).toString('base64');
    }

    return {
      items: (response.Items as User[]) ?? [],
      nextToken,
      count: response.Count,
    };
  }
}

export default UserModel;