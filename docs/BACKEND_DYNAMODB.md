# Backend DynamoDB structure

How tables and data access are organized for maintainability. Aligns with `docs/DATA_MODEL.md`.

## Table layout and keys

| Table | Partition key (PK) | Sort key (SK) | GSIs | Access pattern |
|-------|--------------------|---------------|------|----------------|
| **Users** | `user_id` | — | `status-index` (PK: status) | Get by user_id; query by status. |
| **DownloadGates** | `user_id` | `gate_id` | `gate_id-index` (PK: gate_id) | List gates by user; get gate by (user_id, gate_id); get by gate_id only (public page). |
| **GateSteps** | `gate_id` | `step_id` | — | List steps by gate; get step by (gate_id, step_id). |
| **SmartLinks** | `user_id` | `link_id` | `short_url-index` (PK: short_url) | List links by user; get by (user_id, link_id); get by short_url (public page). |
| **SmartLinkDestinations** | `smart_link_id` | `id` | — | List destinations by smart link. |

- **One model file per table** under `backend/src/models/` (e.g. `downloadGate.ts`, `gateStep.ts`).
- Each model exports: entity interface, input types, and a default-export class with static methods (e.g. `create`, `findById`, `listByUserId`, `update`, `delete`).
- Table names come from env (e.g. `DOWNLOAD_GATES_TABLE`); see `scripts/createTables.ts` and each model’s `TABLE_NAME`.

## Conventions

1. **Keys**: Use the same attribute names as in `DATA_MODEL.md` (e.g. `user_id`, `gate_id`, `step_id`, `smart_link_id`).
2. **No binary blobs**: Store only references (e.g. `audio_file_url`); files live in S3.
3. **Timestamps**: Optional `created_at` / `updated_at` on entities; models can set them in `create` / `update`.
4. **Ids**: Use UUIDs for `gate_id`, `step_id`, `link_id`, destination `id`; can be generated in the model or route.
5. **Env**: Each table has an env var (e.g. `DOWNLOAD_GATES_TABLE`); defaults for local dev are set in the create script and in the model.

## Where to add code

- **New table**: Add an entry to `backend/src/db/tableDefinitions.json` (include `envKey`, e.g. `MY_TABLE` for Lambda env). Then add `backend/src/models/<entity>.ts` with types and static access methods. CDK reads the same JSON and creates the table on deploy; the createTables script uses it for local DynamoDB.
- **New access pattern**: Add a method on the relevant model (e.g. `findByShortUrl` on SmartLinkModel using the GSI).
- **New route**: Add a route file under `backend/src/routes/` and mount it in `app.ts`; use the model for DB access.
