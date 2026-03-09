import { v4 as uuidv4 } from 'uuid';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/dynamodb.js';

const TABLE_NAME = process.env['SMART_LINKS_TABLE'] ?? 'SmartLinks';

export interface SmartLink {
  user_id: string;
  link_id: string;
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  audio_file_url?: string;
  short_url: string;
  total_visits: number;
  total_clicks: number;
  copy_label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSmartLinkInput {
  user_id: string;
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  audio_file_url?: string;
  short_url: string;
  copy_label?: string;
  link_id?: string;
}

export interface UpdateSmartLinkInput {
  title?: string;
  subtitle?: string;
  cover_image_url?: string;
  short_url?: string;
  total_visits?: number;
  total_clicks?: number;
  copy_label?: string;
}

export interface ListByUserOptions {
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
}

export interface ListByUserResult {
  items: SmartLink[];
  lastEvaluatedKey?: Record<string, unknown>;
}

class SmartLinkModel {
  static async create(input: CreateSmartLinkInput): Promise<SmartLink> {
    const now = new Date().toISOString();
    const linkId = input.link_id ?? uuidv4();
    const item: SmartLink = {
      user_id: input.user_id,
      link_id: linkId,
      title: input.title,
      subtitle: input.subtitle,
      cover_image_url: input.cover_image_url,
      audio_file_url: input.audio_file_url,
      short_url: input.short_url,
      total_visits: 0,
      total_clicks: 0,
      copy_label: input.copy_label,
      created_at: now,
      updated_at: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(link_id)',
      })
    );

    return item;
  }

  /** Get a smart link by user_id and link_id (primary key). */
  static async findByUserAndLinkId(
    userId: string,
    linkId: string
  ): Promise<SmartLink | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, link_id: linkId },
      })
    );
    return (response.Item as SmartLink) ?? null;
  }

  /** Get a smart link by short_url (uses GSI; for public page). */
  static async findByShortUrl(shortUrl: string): Promise<SmartLink | null> {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'short_url-index',
        KeyConditionExpression: 'short_url = :short_url',
        ExpressionAttributeValues: { ':short_url': shortUrl },
        Limit: 1,
      })
    );
    const item = response.Items?.[0];
    return (item as SmartLink) ?? null;
  }

  /** List all smart links for a user. */
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
      items: (response.Items as SmartLink[]) ?? [],
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  }

  static async update(
    userId: string,
    linkId: string,
    updates: UpdateSmartLinkInput
  ): Promise<SmartLink> {
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
        Key: { user_id: userId, link_id: linkId },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ConditionExpression: 'attribute_exists(user_id) AND attribute_exists(link_id)',
        ReturnValues: 'ALL_NEW',
      })
    );
    return response.Attributes as SmartLink;
  }

  /** Increment total_visits or total_clicks by 1. */
  static async incrementCount(
    userId: string,
    linkId: string,
    field: 'total_visits' | 'total_clicks'
  ): Promise<SmartLink> {
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, link_id: linkId },
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
        ConditionExpression: 'attribute_exists(user_id) AND attribute_exists(link_id)',
        ReturnValues: 'ALL_NEW',
      })
    );
    return response.Attributes as SmartLink;
  }

  static async delete(userId: string, linkId: string): Promise<SmartLink | null> {
    const response = await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId, link_id: linkId },
        ReturnValues: 'ALL_OLD',
      })
    );
    return (response.Attributes as SmartLink) ?? null;
  }
}

export default SmartLinkModel;
