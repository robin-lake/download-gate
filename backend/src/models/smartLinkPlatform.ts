import { v4 as uuidv4 } from 'uuid';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/dynamodb.js';

const TABLE_NAME = process.env['SMART_LINK_DESTINATIONS_TABLE'] ?? 'SmartLinkPlatforms';

export interface SmartLinkPlatform {
  smart_link_id: string;
  id: string;
  platform_name: string;
  url: string;
  click_count: number;
  action_label?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSmartLinkPlatformInput {
  smart_link_id: string;
  platform_name: string;
  url: string;
  action_label?: string;
  id?: string;
}

export interface UpdateSmartLinkPlatformInput {
  platform_name?: string;
  url?: string;
  click_count?: number;
  action_label?: string;
}

class SmartLinkPlatformModel {
  static async create(input: CreateSmartLinkPlatformInput): Promise<SmartLinkPlatform> {
    const now = new Date().toISOString();
    const id = input.id ?? uuidv4();
    const item: SmartLinkPlatform = {
      smart_link_id: input.smart_link_id,
      id,
      platform_name: input.platform_name,
      url: input.url,
      click_count: 0,
      ...(input.action_label !== undefined && { action_label: input.action_label }),
      created_at: now,
      updated_at: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );

    return item;
  }

  /** Get a single destination by smart_link_id and id. */
  static async findBySmartLinkAndId(
    smartLinkId: string,
    destinationId: string
  ): Promise<SmartLinkPlatform | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { smart_link_id: smartLinkId, id: destinationId },
      })
    );
    return (response.Item as SmartLinkPlatform) ?? null;
  }

  /** List all destinations for a smart link. */
  static async listBySmartLinkId(smartLinkId: string): Promise<SmartLinkPlatform[]> {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'smart_link_id = :smart_link_id',
        ExpressionAttributeValues: { ':smart_link_id': smartLinkId },
      })
    );
    return (response.Items as SmartLinkPlatform[]) ?? [];
  }

  static async update(
    smartLinkId: string,
    destinationId: string,
    updates: UpdateSmartLinkPlatformInput
  ): Promise<SmartLinkPlatform> {
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
        Key: { smart_link_id: smartLinkId, id: destinationId },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ConditionExpression:
          'attribute_exists(smart_link_id) AND attribute_exists(id)',
        ReturnValues: 'ALL_NEW',
      })
    );
    return response.Attributes as SmartLinkPlatform;
  }

  /** Increment click_count by 1 for a destination. */
  static async incrementClicks(
    smartLinkId: string,
    destinationId: string
  ): Promise<SmartLinkPlatform> {
    const response = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { smart_link_id: smartLinkId, id: destinationId },
        UpdateExpression:
          'SET click_count = if_not_exists(click_count, :zero) + :one, #updated_at = :now',
        ExpressionAttributeNames: { '#updated_at': 'updated_at' },
        ExpressionAttributeValues: {
          ':zero': 0,
          ':one': 1,
          ':now': new Date().toISOString(),
        },
        ConditionExpression:
          'attribute_exists(smart_link_id) AND attribute_exists(id)',
        ReturnValues: 'ALL_NEW',
      })
    );
    return response.Attributes as SmartLinkPlatform;
  }

  static async delete(
    smartLinkId: string,
    destinationId: string
  ): Promise<SmartLinkPlatform | null> {
    const response = await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { smart_link_id: smartLinkId, id: destinationId },
        ReturnValues: 'ALL_OLD',
      })
    );
    return (response.Attributes as SmartLinkPlatform) ?? null;
  }
}

export default SmartLinkPlatformModel;
