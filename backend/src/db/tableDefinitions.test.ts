import { describe, it, expect } from 'vitest';
import { tableDefinitions, tableEnvKeys } from './tableDefinitions.js';

describe('tableDefinitions', () => {
  const expectedTables = [
    'Users',
    'DownloadGates',
    'GateSteps',
    'SmartLinks',
    'SmartLinkDestinations',
  ];

  it('loads all expected tables from JSON', () => {
    expect(tableDefinitions).toHaveLength(expectedTables.length);
    expect(tableDefinitions.map((d) => d.tableName)).toEqual(expectedTables);
  });

  it('each definition has required partitionKey and tableName', () => {
    for (const def of tableDefinitions) {
      expect(def.tableName).toBeDefined();
      expect(def.tableName.length).toBeGreaterThan(0);
      expect(def.partitionKey).toBeDefined();
      expect(def.partitionKey.name).toBeDefined();
      expect(def.partitionKey.type).toBe('S');
    }
  });

  it('each definition has envKey for Lambda env', () => {
    for (const def of tableDefinitions) {
      expect(def.envKey).toBeDefined();
      expect(def.envKey).toMatch(/^[A-Z][A-Z0-9_]*_TABLE$/);
    }
  });

  it('tableEnvKeys has one entry per table', () => {
    expect(Object.keys(tableEnvKeys)).toHaveLength(expectedTables.length);
    for (const name of expectedTables) {
      expect(tableEnvKeys[name]).toBeDefined();
      expect(tableEnvKeys[name]).toMatch(/^[A-Z][A-Z0-9_]*_TABLE$/);
    }
  });

  it('composite-key tables have sortKey', () => {
    const composite = tableDefinitions.filter((d) => d.sortKey);
    expect(composite.map((d) => d.tableName)).toEqual([
      'DownloadGates',
      'GateSteps',
      'SmartLinks',
      'SmartLinkDestinations',
    ]);
    for (const def of composite) {
      expect(def.sortKey?.name).toBeDefined();
      expect(def.sortKey?.type).toBe('S');
    }
  });

  it('tables with GSIs have correct GSI shape', () => {
    const withGsi = tableDefinitions.filter((d) => d.gsis && d.gsis.length > 0);
    expect(withGsi.map((d) => d.tableName)).toEqual([
      'Users',
      'DownloadGates',
      'SmartLinks',
    ]);
    for (const def of withGsi) {
      for (const gsi of def.gsis ?? []) {
        expect(gsi.indexName).toBeDefined();
        expect(gsi.partitionKey?.name).toBeDefined();
        expect(gsi.partitionKey?.type).toBe('S');
      }
    }
  });
});
