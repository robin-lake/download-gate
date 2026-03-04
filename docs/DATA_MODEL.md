# Data model (source of truth)

Backend entities, attributes, keys, and relationships. Keep this in sync with DynamoDB (and any TypeScript types) so code and AI share one mental model.

**Last updated**: 2025-03-04

---

## Overview

The system stores **users** (auth/identity), **download gates** (gate a download behind fan actions), **gate steps** (per-gate requirements: follow/save on Spotify, SoundCloud, Instagram, etc., or email capture), and **smart links** (multi-platform links with visits/clicks). Download gates and smart links are owned by users. Each download gate has an ordered list of **gate steps**; each step is one service type (e.g. Spotify, Email capture) with its own configurable options and targets (URLs, profiles, etc.).

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
- **Relationships**: Belongs to one User (owner). Has many **GateSteps** (ordered); each step is one service type with its own config.

---

### GateStep

A single “step” in a download gate: one service type (e.g. Spotify, Email capture) with its options and targets. Steps are ordered; fans complete them in sequence (or skip if allowed).

| Attribute      | Type   | Constraints | Notes |
|----------------|--------|-------------|--------|
| `step_id`      | string | PK, required | Unique per step (e.g. UUID). |
| `gate_id`      | string | FK, required | Parent DownloadGate. |
| `service_type` | string | required    | One of: `email_capture`, `spotify`, `soundcloud`, `instagram`, `bandcamp`, `apple_music`, `deezer`. |
| `step_order`   | number | required    | 1-based order in the gate (Step 1, Step 2, …). |
| `is_skippable` | boolean| required    | If true, fans can skip this step and still get the download. |
| `config`       | object | required    | Service-specific options and targets; see **Service-type config** below. |

- **Storage**: TBD (e.g. DynamoDB: partition key `gate_id`, sort key `step_id`; or single-table with `PK = gate_id`, `SK = step#{step_order}`).
- **Keys**: Must support “all steps for a gate” and “get step by id”.
- **Relationships**: Belongs to one DownloadGate. No direct link to User; access via gate.

**Download Gate Service-type config** (stored in `config`; validated and interpreted in business logic):

| Download Gate Service type   | Config fields (all optional unless noted) | Notes |
|----------------|-------------------------------------------|--------|
| `email_capture`| `collect_email: boolean`, `collect_first_name: boolean` | |
| `spotify`      | `follow_enabled: boolean`, `save_enabled: boolean`, `presave_enabled: boolean`, `target_urls: string[]` | 
| `instagram`    | `follow_profile_enabled: boolean`, `profile_urls: string[]` | |
| `soundcloud`   | `follow_profiles_enabled: boolean`, `like_track_enabled: boolean`, `repost_track_enabled: boolean`, `comment_on_track_enabled: boolean`, `profile_urls: string[]`, `track_url: string` | 
| `bandcamp`     | `follow_profile_enabled: boolean`, `profile_urls: string[]` | Artist profile URLs. |
| `apple_music`  | `like_enabled: boolean`, `save_enabled: boolean`, `preadd_unreleased_enabled: boolean`, `target_urls: string[]` | 
| `deezer`       | `follow_enabled: boolean`, `save_enabled: boolean`, `preadd_unreleased_enabled: boolean`, `target_urls: string[]` | 

Use a single flexible `config` object (e.g. JSON/document) so new service types or new options can be added without schema migrations. Backend validates required fields per `service_type` and resolves URLs to provider IDs where needed.

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
| `platforms`     | array  | optional    |                                |
| `url`           | string | required    | Short link URL                 |
| `copy_label`    | string | optional    | UI label                       |

- **Storage**: Not yet implemented (frontend mocks in `dashboardState.ts` and `SmartLinkCard.tsx`).
- **Keys**: TBD (e.g. `user_id` (PK) + `link_id` (SK)).
- **Relationships**: Will belong to one User (owner).

---

## Database vs business logic

| In the database (persisted) | In business logic (code) |
|-----------------------------|---------------------------|
| Entity definitions and relationships (User, DownloadGate, GateStep, SmartLink). | Validation rules (e.g. “if `follow_enabled` then `target_urls` must be non-empty”). |
| Per-step config: `service_type`, `step_order`, `is_skippable`, and the `config` object (all options and target URLs/IDs the user chose). |
| Resolved provider IDs if you choose to store them (e.g. Spotify playlist ID derived from URL). | API integrations: calling Spotify, SoundCloud, Instagram, etc. to verify follows, saves, pre-saves; OAuth and API keys. |
| | URL parsing and resolution (user pastes URL → backend resolves to provider entity ID). |
| | Orchestration: presenting steps to the fan, checking completion, granting download. |

Each provider (Spotify, SoundCloud, Instagram, Email capture, etc.) should have its own integration module that reads `config` for that `service_type` and performs the appropriate API calls and checks.

---

## Invariants / business rules

- Every DownloadGate and SmartLink must have an owning user (to be enforced when tables exist).
- Every GateStep must reference a valid DownloadGate (`gate_id`).
- `step_order` is unique per gate (no duplicate order for the same `gate_id`).
- Counts (`visits`, `downloads`, `emails_captured`, `clicks`) are non-negative integers.
- `user_id` values must match the auth provider’s user id (e.g. Clerk).
- For each GateStep, `config` must conform to the shape for its `service_type` (enforced in business logic).

---

## Changelog

- **2025-03-04**: Added GateStep entity and service-type config (email_capture, spotify, soundcloud, instagram, bandcamp, apple_music, deezer); added “Database vs business logic” section; linked DownloadGate to GateSteps.
- **2025-03-04**: Initial doc; User table from `createTables.ts`; DownloadGate and SmartLink from frontend types (not yet in DB).
