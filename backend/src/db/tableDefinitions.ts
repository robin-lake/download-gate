/**
 * Single source of truth for DynamoDB table schemas (data lives in tableDefinitions.json).
 * Consumed by:
 * - backend/src/scripts/createTables.ts (local / one-off table creation)
 * - cdk/lib/backend-stack.ts (CDK deploy: reads the JSON, creates tables and passes names to Lambda)
 *
 * When adding a table: add an entry to tableDefinitions.json, add tableEnvKeys below, then add the model in backend/src/models/.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface KeySchemaAttribute {
  name: string;
  type: 'S';
}

export interface TableDefinition {
  /** Logical table name (e.g. 'Users'). CDK may suffix with stage (e.g. 'Users-staging'). */
  tableName: string;
  /** Env var name for this table (e.g. USERS_TABLE). Present in tableDefinitions.json. */
  envKey?: string;
  partitionKey: KeySchemaAttribute;
  sortKey?: KeySchemaAttribute;
  gsis?: Array<{
    indexName: string;
    partitionKey: KeySchemaAttribute;
    sortKey?: KeySchemaAttribute;
  }>;
}

const raw = readFileSync(join(__dirname, 'tableDefinitions.json'), 'utf-8');
export const tableDefinitions: TableDefinition[] = JSON.parse(raw) as TableDefinition[];

/** Env var key for each table (derived from JSON; used by Lambda and createTables script). */
export const tableEnvKeys: Record<string, string> = Object.fromEntries(
  tableDefinitions.filter((d) => d.envKey).map((d) => [d.tableName, d.envKey!])
);
