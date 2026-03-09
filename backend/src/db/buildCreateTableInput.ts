import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import type { TableDefinition } from './tableDefinitions.js';

/**
 * Collect all attribute names used in keys and GSIs (for AttributeDefinitions).
 */
export function collectAttributeNames(def: TableDefinition): Set<string> {
  const names = new Set<string>();
  names.add(def.partitionKey.name);
  if (def.sortKey) names.add(def.sortKey.name);
  def.gsis?.forEach((gsi) => {
    names.add(gsi.partitionKey.name);
    if (gsi.sortKey) names.add(gsi.sortKey.name);
  });
  return names;
}

export interface BuildCreateTableInputOptions {
  /** If true, omit ProvisionedThroughput (on-demand). Default true for tests/local. */
  useOnDemand?: boolean;
}

/**
 * Build CreateTableCommandInput from a table definition. Pure function for testing and reuse.
 */
export function buildCreateTableInput(
  def: TableDefinition,
  tableName: string,
  options: BuildCreateTableInputOptions = {}
): CreateTableCommandInput {
  const { useOnDemand = true } = options;
  const throughput = useOnDemand
    ? {}
    : {
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      };
  const gsiThroughput = useOnDemand
    ? {}
    : {
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      };

  const attrNames = collectAttributeNames(def);
  const attributeDefinitions = Array.from(attrNames).map((name) => ({
    AttributeName: name,
    AttributeType: 'S' as const,
  }));

  const keySchema = [
    { AttributeName: def.partitionKey.name, KeyType: 'HASH' as const },
    ...(def.sortKey ? [{ AttributeName: def.sortKey.name, KeyType: 'RANGE' as const }] : []),
  ];

  const globalSecondaryIndexes = def.gsis?.map((gsi) => ({
    IndexName: gsi.indexName,
    KeySchema: [
      { AttributeName: gsi.partitionKey.name, KeyType: 'HASH' as const },
      ...(gsi.sortKey ? [{ AttributeName: gsi.sortKey.name, KeyType: 'RANGE' as const }] : []),
    ],
    Projection: { ProjectionType: 'ALL' as const },
    ...gsiThroughput,
  }));

  return {
    TableName: tableName,
    AttributeDefinitions: attributeDefinitions,
    KeySchema: keySchema,
    ...(globalSecondaryIndexes?.length ? { GlobalSecondaryIndexes: globalSecondaryIndexes } : {}),
    BillingMode: useOnDemand ? 'PAY_PER_REQUEST' : 'PROVISIONED',
    ...throughput,
  };
}
