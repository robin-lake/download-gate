import { describe, it, expect } from 'vitest';
import { tableDefinitions } from './tableDefinitions.js';
import {
  buildCreateTableInput,
  collectAttributeNames,
} from './buildCreateTableInput.js';

describe('buildCreateTableInput', () => {
  it('produces valid input for every table definition', () => {
    for (const def of tableDefinitions) {
      const input = buildCreateTableInput(def, def.tableName);
      expect(input.TableName).toBe(def.tableName);
      expect(input.AttributeDefinitions).toBeDefined();
      expect(Array.isArray(input.AttributeDefinitions)).toBe(true);
      expect(input.KeySchema).toBeDefined();
      expect(input.KeySchema?.length).toBe(def.sortKey ? 2 : 1);
      expect(input.BillingMode).toBe('PAY_PER_REQUEST');
    }
  });

  it('KeySchema HASH is partition key, RANGE is sort key when present', () => {
    for (const def of tableDefinitions) {
      const input = buildCreateTableInput(def, def.tableName);
      const hashKey = input.KeySchema?.find((k) => k.KeyType === 'HASH');
      const rangeKey = input.KeySchema?.find((k) => k.KeyType === 'RANGE');
      expect(hashKey?.AttributeName).toBe(def.partitionKey.name);
      if (def.sortKey) {
        expect(rangeKey?.AttributeName).toBe(def.sortKey.name);
      } else {
        expect(rangeKey).toBeUndefined();
      }
    }
  });

  it('AttributeDefinitions includes every key attribute used in KeySchema and GSIs', () => {
    for (const def of tableDefinitions) {
      const input = buildCreateTableInput(def, def.tableName);
      const attrNames = new Set(
        input.AttributeDefinitions?.map((a) => a.AttributeName) ?? []
      );
      expect(attrNames.has(def.partitionKey.name)).toBe(true);
      if (def.sortKey) expect(attrNames.has(def.sortKey.name)).toBe(true);
      def.gsis?.forEach((gsi) => {
        expect(attrNames.has(gsi.partitionKey.name)).toBe(true);
        if (gsi.sortKey) expect(attrNames.has(gsi.sortKey.name)).toBe(true);
      });
    }
  });

  it('GSI count and index names match definition', () => {
    for (const def of tableDefinitions) {
      const input = buildCreateTableInput(def, def.tableName);
      const expectedGsiCount = def.gsis?.length ?? 0;
      if (expectedGsiCount === 0) {
        expect(input.GlobalSecondaryIndexes).toBeUndefined();
      } else {
        expect(input.GlobalSecondaryIndexes).toHaveLength(expectedGsiCount);
        expect(input.GlobalSecondaryIndexes?.map((g) => g.IndexName)).toEqual(
          def.gsis?.map((g) => g.indexName)
        );
      }
    }
  });

  it('with useOnDemand false, includes ProvisionedThroughput', () => {
    const def = tableDefinitions[0];
    const input = buildCreateTableInput(def, def.tableName, {
      useOnDemand: false,
    });
    expect(input.BillingMode).toBe('PROVISIONED');
    expect(input.ProvisionedThroughput).toBeDefined();
    expect(input.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
    expect(input.ProvisionedThroughput?.WriteCapacityUnits).toBe(5);
  });
});

describe('collectAttributeNames', () => {
  it('returns partition key for table without sort key or GSI', () => {
    const def = {
      tableName: 'Test',
      partitionKey: { name: 'pk', type: 'S' as const },
    };
    const names = collectAttributeNames(def);
    expect(names).toEqual(new Set(['pk']));
  });

  it('includes partition key, sort key, and all GSI keys', () => {
    const def = {
      tableName: 'Test',
      partitionKey: { name: 'pk', type: 'S' as const },
      sortKey: { name: 'sk', type: 'S' as const },
      gsis: [
        { indexName: 'gsi1', partitionKey: { name: 'gsi_pk', type: 'S' as const } },
      ],
    };
    const names = collectAttributeNames(def);
    expect(names).toEqual(new Set(['pk', 'sk', 'gsi_pk']));
  });
});
