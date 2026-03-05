/**
 * CloudFormation Custom Resource handler: verifies that all expected DynamoDB
 * tables exist. If any were deleted outside CloudFormation (e.g. in the console),
 * the resource fails so the stack update fails instead of succeeding with a broken app.
 *
 * ResourceProperties: { TableNames: string[] }
 * On Create/Update: DescribeTable each; if any missing → FAILED.
 * On Delete: SUCCESS (no-op).
 */

import { DynamoDBClient, DescribeTableCommand, ResourceNotFoundException } from '@aws-sdk/client-dynamodb';

interface CfnEvent {
  RequestType: 'Create' | 'Update' | 'Delete';
  ResponseURL: string;
  StackId: string;
  RequestId: string;
  ResourceType: string;
  LogicalResourceId: string;
  PhysicalResourceId?: string;
  ResourceProperties?: Record<string, unknown>;
}

interface CfnContext {
  awsRequestId: string;
}

const dynamo = new DynamoDBClient({});

interface ResourceProperties {
  TableNames: string[];
}

async function sendResponse(
  event: CfnEvent,
  status: 'SUCCESS' | 'FAILED',
  reason?: string,
  physicalId?: string
): Promise<void> {
  const body = JSON.stringify({
    Status: status,
    Reason: reason,
    PhysicalResourceId: physicalId ?? event.PhysicalResourceId ?? event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: {},
  });

  const res = await fetch(event.ResponseURL, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to send CFN response: ${res.status} ${res.statusText}`);
  }
}

export async function handler(event: CfnEvent, context: CfnContext): Promise<void> {
  const props = (event.ResourceProperties ?? {}) as ResourceProperties;
  const tableNames: string[] = props.TableNames ?? [];

  try {
    if (event.RequestType === 'Delete') {
      await sendResponse(event, 'SUCCESS', undefined, event.PhysicalResourceId);
      return;
    }

    if (tableNames.length === 0) {
      await sendResponse(event, 'SUCCESS');
      return;
    }

    const missing: string[] = [];
    for (const name of tableNames) {
      try {
        await dynamo.send(new DescribeTableCommand({ TableName: name }));
      } catch (err) {
        if (err instanceof ResourceNotFoundException) {
          missing.push(name);
        } else {
          console.error(`DescribeTable ${name} failed:`, err);
          await sendResponse(
            event,
            'FAILED',
            `DescribeTable ${name} failed: ${(err as Error).message}`
          );
          return;
        }
      }
    }

    if (missing.length > 0) {
      const message =
        `DynamoDB tables were deleted outside CloudFormation: ${missing.join(', ')}. ` +
        'Run "cdk destroy" for this stack, then "cdk deploy" to recreate tables.';
      console.error(message);
      await sendResponse(event, 'FAILED', message);
      return;
    }

    await sendResponse(event, 'SUCCESS', undefined, `tables-ok-${context.awsRequestId}`);
  } catch (err) {
    console.error('Handler error:', err);
    await sendResponse(event, 'FAILED', (err as Error).message);
  }
}
