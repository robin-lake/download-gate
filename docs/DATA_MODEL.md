# Data model (source of truth)

Backend entities, attributes, keys, and relationships. Keep this in sync with DynamoDB (and any TypeScript types) so code and AI share one mental model.

**Last updated**: 2025-03-04

---

## Overview

The system stores **users** (auth/identity), **download gates** (gate a download behind email or similar), and **smart links** (multi-platform links with visits/clicks). Download gates and smart links are owned by users and drive dashboard stats (visits, downloads, clicks, emails captured).

---

## Entities

### User

| Attribute   | Type   | Constraints | Notes                    |
|------------|--------|-------------|--------------------------|
| `user_id`  | string | PK, required| From auth (e.g. Clerk)   |
| `status`   | string | required    | GSI key; e.g. active     |

- **Storage**: DynamoDB table `Users` (see `backend/src/scripts/createTables.ts`).
- **Keys**: Partition key `user_id` (HASH). GSI `status-index` on `status` (HASH).
- **Relationships**: One user has many download gates and many smart links (ownership to be added when those tables exist).

---

### DownloadGate

| Attribute        | Type   | Constraints | Notes                          |
|-----------------|--------|-------------|--------------------------------|
| `id`            | string | PK, required| Unique gate id                 |
| `user_id`       | string | FK, required| From user table                |
| `artist_name`   | string | required    | Artist name                    |
| `title`         | string | required    | Song title                     |
| `thumbnail_url` | string | optional    | URL                            |
| `visits`        | number | required    | Count                          |
| `downloads`     | number | required    | Count                          |
| `emails_captured` | number | required  | Count                          |

- **Storage**: Not yet implemented (frontend uses mocks; see `frontend/src/pages/Dashboard/dashboardState.ts` and `DownloadGateCard.tsx`).
- **Keys**: TBD (e.g. `user_id` (PK) + `gate_id` (SK), or single-table design).
- **Relationships**: Will belong to one User (owner). No link to SmartLink in current design.

---

### SmartLink

| Attribute        | Type   | Constraints | Notes                          |
|-----------------|--------|-------------|--------------------------------|
| `id`            | string | PK, required| Unique link id                 |
| `user_id`       | string | FK, required| From user table                |
| `title`         | string | required    |                                |
| `subtitle`      | string | optional    |                                |
| `engagement`    | string | optional    | Summary text                   |
| `total_visits`  | number | required    |                                |
| `clicks`        | number | required    |                                |
| `emails_captured` | number | required  |                                |
| `platforms`     | array  | optional    | `{ name, clicks, percent }[]`  |
| `url`           | string | required    | Short link URL                 |
| `copy_label`    | string | optional    | UI label                       |

- **Storage**: Not yet implemented (frontend mocks in `dashboardState.ts` and `SmartLinkCard.tsx`).
- **Keys**: TBD (e.g. `user_id` (PK) + `link_id` (SK)).
- **Relationships**: Will belong to one User (owner).

---

## Invariants / business rules

- Every DownloadGate and SmartLink must have an owning user (to be enforced when tables exist).
- Counts (`visits`, `downloads`, `emails_captured`, `clicks`) are non-negative integers.
- `user_id` values must match the auth provider’s user id (e.g. Clerk).

---

## Changelog

- **2025-03-04**: Initial doc; User table from `createTables.ts`; DownloadGate and SmartLink from frontend types (not yet in DB).
