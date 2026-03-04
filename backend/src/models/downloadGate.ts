import { v4 as uuidv4 } from 'uuid';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/dynamodb.js';

const TABLE_NAME = process.env['DOWNLOAD_GATES_TABLE'] ?? 'DownloadGates';

export interface DownloadGate {
  user_id: string;
  gate_id: string;
  artist_name: string;
  title: string;
  thumbnail_url?: string;
  audio_file_url: string;
  visits: number;
  downloads: number;
  emails_captured: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDownloadGateInput {
  user_id: string;
  artist_name: string;
  title: string;
  thumbnail_url?: string;
  audio_file_url: string;
  gate_id?: string;
}

export interface UpdateDownloadGateInput {
  artist_name?: string;
  title?: string;
  thumbnail_url?: string;
  audio_file_url?: string;
  visits?: number;
  downloads?: number;
  emails_captured?: number;
}

export interface ListByUserOptions {
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
}

export interface ListByUserResult {
  items: DownloadGate[];
  lastEvaluatedKey?: Record<string, unknown>;
}

class DownloadGateModel {
  static async create(input: CreateDownloadGateInput): Promise<DownloadGate> {
    const now = new Date().toISOString();
    const gateId = input.gate_id ?? uuidv4();
    const item: DownloadGate = {
      user_id: input.user_id,
      gate_id: gateId,
      artist_name: input.artist_name,
      title: input.title,
      thumbnail_url: input.thumbnail_url,
      audio_file_url: input.audio_file_url,
      visits: 0,
      downloads: 0,
      emails_captured: 0,
      created_at: now,
      updated_at: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(gate_id)',
      })
    );

    return item;
  }

  /** Get a gate by user_id and gate_id (primary key). */
  static async findByUserAndGateId(
    userId: string,
    gateId: string
  ): Promise<DownloadGate | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, gate_id: gateId },
      })
    );
    return (response.Item as DownloadGate) ?? null;
  }

  /** Get a gate by gate_id only (uses GSI; use for public download page). */
  static async findByGateId(gateId: string): Promise<DownloadGate | null> {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'gate_id-index',
        KeyConditionExpression: 'gate_id = :gate_id',
        ExpressionAttributeValues: { ':gate_id': gateId },
        Limit: 1,
      })
    );
    const item = response.Items?.[0];
    return (item as DownloadGate) ?? null;
  }

  /** List all gates for a user. */
  static async listByUserId(
    userId: string,
    options: ListByUserOptions = {}
  ): Promise<ListByUserResult> {
    const { limit = 50, exclusiveStartKey } = options;
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'user_id = :user_id',
        ExpressionAttributeValues: { ':user_id': userId },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
      })
    );
    return {
      items: (response.Items as DownloadGate[]) ?? [],
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  }

  static async update(
    userId: string,
    gateId: string,
    updates: UpdateDownloadGateInput
  ): Promise<DownloadGate> {
    const now = new Date().toISOString();
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

    expressionParts.push('#updated_at = :updated_at');
    expressionNames['#updated_at'] = 'updated_at';
    expressionValues[':updated_at'] = now;

    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, gate_id: gateId },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ConditionExpression: 'attribute_exists(user_id) AND attribute_exists(gate_id)',
        ReturnValues: 'ALL_NEW',
      })
    );
    return response.Attributes as DownloadGate;
  }

  /** Increment visits, downloads, or emails_captured by 1. */
  static async incrementCount(
    userId: string,
    gateId: string,
    field: 'visits' | 'downloads' | 'emails_captured'
  ): Promise<DownloadGate> {
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, gate_id: gateId },
        UpdateExpression: `SET #field = if_not_exists(#field, :zero) + :one, #updated_at = :now`,
        ExpressionAttributeNames: {
          '#field': field,
          '#updated_at': 'updated_at',
        },
        ExpressionAttributeValues: {
          ':zero': 0,
          ':one': 1,
          ':now': new Date().toISOString(),
        },
        ConditionExpression: 'attribute_exists(user_id) AND attribute_exists(gate_id)',
        ReturnValues: 'ALL_NEW',
      })
    );
    return response.Attributes as DownloadGate;
  }

  static async delete(userId: string, gateId: string): Promise<DownloadGate | null> {
    const response = await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, gate_id: gateId },
        ReturnValues: 'ALL_OLD',
      })
    );
    return (response.Attributes as DownloadGate) ?? null;
  }
}

export default DownloadGateModel;
