# Testing guide

How to keep the data layer and CDK/deploy path reliable. All tests live in the **backend** (Vitest); run with `npm run test` or `npm run test:run`.

## What’s covered

### 1. Table definitions (unit)

**File:** `backend/src/db/tableDefinitions.test.ts`

- `tableDefinitions.json` loads and parses.
- Expected tables exist (Users, DownloadGates, GateSteps, SmartLinks, SmartLinkPlatforms).
- Each definition has required fields: `tableName`, `partitionKey`, `envKey`.
- `tableEnvKeys` has one entry per table and correct naming.
- Composite-key tables have `sortKey`; tables with GSIs have valid GSI shape.

**Why:** Prevents bad or incomplete edits to the single source of truth. CDK and `createTables` both depend on this JSON.

### 2. Schema → CreateTable input (unit)

**File:** `backend/src/db/buildCreateTableInput.test.ts`  
**Module:** `backend/src/db/buildCreateTableInput.ts` (used by `createTables.ts`)

- For every table definition, `buildCreateTableInput(def, tableName)` returns valid `CreateTableCommandInput`.
- KeySchema: HASH = partition key, RANGE = sort key when present.
- AttributeDefinitions includes every attribute used in KeySchema and GSIs.
- GSI count and index names match the definition.
- With `useOnDemand: false`, provisioned throughput is set.

**Why:** Ensures the script and CDK (which uses the same schema) would create the same key layout and indexes. Changing the JSON or the builder is caught here.

### 3. Models (unit with mocked DynamoDB)

**File:** `backend/src/models/downloadGate.test.ts` (pattern for other models)

- **create:** `docClient.send` is called with a PutCommand whose Item has the right shape (user_id, gate_id, counts, timestamps) and condition.
- **findByUserAndGateId:** GetCommand is called with the correct Key; returns item or null.
- **findByGateId:** QueryCommand uses `gate_id-index` and returns first item or null.

`docClient` is mocked via `vi.mock('../config/dynamodb.js')`; no real DynamoDB. Same pattern can be used for `gateStep`, `smartLink`, `SmartLinkPlatform`, and `user`.

**Why:** Protects CRUD and key usage. Refactors (e.g. renaming attributes) stay safe if you update tests with the new shape.

## What you could add

- **Integration tests (DynamoDB Local):** Start Local, run `createTables`, then run model create/get/update/delete/list and assert on real data. Slower but catches marshalling and key bugs.
- **CDK snapshot or synth test:** In `cdk/`, run `cdk synth` and assert the template contains the expected number of `AWS::DynamoDB::Table` resources and that the Lambda env has all `*_TABLE` variables. Ensures the stack still reads `tableDefinitions.json` and wires tables correctly.

## Running tests

```bash
cd backend
npm run test        # watch
npm run test:run    # single run
```

When adding a new table: add it to `tableDefinitions.json`, then run the table-def and buildCreateTableInput tests; add a model and mirror the downloadGate model tests with a mocked client.
