import { v4 as uuidv4 } from 'uuid';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/dynamodb.js';

const TABLE_NAME = process.env['GATE_STEPS_TABLE'] ?? 'GateSteps';

/** Service-type config is a flexible object; shape depends on service_type. See DATA_MODEL.md. */
export type GateStepConfig = Record<string, unknown>;

export interface GateStep {
  gate_id: string;
  step_id: string;
  service_type: string;
  step_order: number;
  is_skippable: boolean;
  config: GateStepConfig;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGateStepInput {
  gate_id: string;
  service_type: string;
  step_order: number;
  is_skippable: boolean;
  config: GateStepConfig;
  step_id?: string;
}

export interface UpdateGateStepInput {
  service_type?: string;
  step_order?: number;
  is_skippable?: boolean;
  config?: GateStepConfig;
}

class GateStepModel {
  static async create(input: CreateGateStepInput): Promise<GateStep> {
    const now = new Date().toISOString();
    const stepId = input.step_id ?? uuidv4();
    const item: GateStep = {
      gate_id: input.gate_id,
      step_id: stepId,
      service_type: input.service_type,
      step_order: input.step_order,
      is_skippable: input.is_skippable,
      config: input.config,
      created_at: now,
      updated_at: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(step_id)',
      })
    );

    return item;
  }

  /** Get a single step by gate_id and step_id. */
  static async findByGateAndStepId(
    gateId: string,
    stepId: string
  ): Promise<GateStep | null> {
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { gate_id: gateId, step_id: stepId },
      })
    );
    return (response.Item as GateStep) ?? null;
  }

  /** List all steps for a gate, ordered by step_order. */
  static async listByGateId(gateId: string): Promise<GateStep[]> {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'gate_id = :gate_id',
        ExpressionAttributeValues: { ':gate_id': gateId },
      })
    );
    const items = (response.Items as GateStep[]) ?? [];
    return items.sort((a, b) => a.step_order - b.step_order);
  }

  static async update(
    gateId: string,
    stepId: string,
    updates: UpdateGateStepInput
  ): Promise<GateStep> {
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
        Key: { gate_id: gateId, step_id: stepId },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ConditionExpression: 'attribute_exists(gate_id) AND attribute_exists(step_id)',
        ReturnValues: 'ALL_NEW',
      })
    );
    return response.Attributes as GateStep;
  }

  static async delete(gateId: string, stepId: string): Promise<GateStep | null> {
    const response = await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { gate_id: gateId, step_id: stepId },
        ReturnValues: 'ALL_OLD',
      })
    );
    return (response.Attributes as GateStep) ?? null;
  }
}

export default GateStepModel;
