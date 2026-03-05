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

/** Allowed characters for short_code: alphanumeric, hyphen, underscore. Length 3–32. */
export const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

export function isShortCodeValid(code: string): boolean {
  return SHORT_CODE_REGEX.test(code);
}

/** Generate a random 8-character alphanumeric short code. */
export function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface DownloadGate {
  user_id: string;
  gate_id: string;
  artist_name: string;
  title: string;
  short_code?: string;
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
  short_code?: string;
  thumbnail_url?: string;
  audio_file_url: string;
  gate_id?: string;
}

export interface UpdateDownloadGateInput {
  artist_name?: string;
  title?: string;
  short_code?: string;
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
    let shortCode: string | undefined = input.short_code?.trim();
    if (shortCode !== undefined && shortCode !== '') {
      if (!isShortCodeValid(shortCode)) {
        throw new Error(
          'short_code must be 3–32 characters and only contain letters, numbers, hyphens, and underscores'
        );
      }
      const existing = await this.findByShortCode(shortCode);
      if (existing) {
        throw new Error('short_code is already in use');
      }
    } else {
      shortCode = await this.generateUniqueShortCode();
    }

    const item: DownloadGate = {
      user_id: input.user_id,
      gate_id: gateId,
      artist_name: input.artist_name,
      title: input.title,
      short_code: shortCode,
      ...(input.thumbnail_url !== undefined && { thumbnail_url: input.thumbnail_url }),
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

  /** Generate a short_code that does not yet exist. */
  static async generateUniqueShortCode(maxAttempts = 10): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const code = generateShortCode();
      const existing = await this.findByShortCode(code);
      if (!existing) return code;
    }
    throw new Error('Could not generate a unique short_code');
  }

  /** Get a gate by short_code (uses GSI; for public URL lookup). */
  static async findByShortCode(shortCode: string): Promise<DownloadGate | null> {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'short_code-index',
        KeyConditionExpression: 'short_code = :short_code',
        ExpressionAttributeValues: { ':short_code': shortCode },
        Limit: 1,
      })
    );
    const item = response.Items?.[0];
    return (item as DownloadGate) ?? null;
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
      ...(response.LastEvaluatedKey != null && {
        lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown>,
      }),
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
