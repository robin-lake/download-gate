# Data model (source of truth)

Backend entities, attributes, keys, and relationships. Keep this in sync with DynamoDB (and any TypeScript types) so code and AI share one mental model.

**Last updated**: 2026-05-06

---

## Overview

The system stores **users** (auth/identity), **download gates** (gate a download behind fan actions), **gate steps** (per-gate requirements: follow/save on Spotify, SoundCloud, Instagram, etc., or email capture), and **smart links** (multi-platform links with visits/clicks). Download gates and smart links are owned by users. Each download gate has an ordered list of **gate steps**; each step is one service type (e.g. Spotify, Email capture) with its own configurable options and targets (URLs, profiles, etc.). Each smart link has many **smart link platforms** (one per platform link shown on the page); each destination has a URL and a per-link click count.

**DynamoDB definitions** live in `backend/src/db/tableDefinitions.json`. Local table creation uses `backend/src/scripts/createTables.ts`, which builds tables from those definitions (see also `backend/src/db/buildCreateTableInput.ts`). Runtime table names are overridden per environment via env vars (see **Table env keys** below).

---

## Table env keys

| Table              | Env var                      |
|--------------------|------------------------------|
| `Users`            | `USERS_TABLE`                |
| `DownloadGates`    | `DOWNLOAD_GATES_TABLE`       |
| `GateSteps`        | `GATE_STEPS_TABLE`           |
| `SmartLinks`         | `SMART_LINKS_TABLE`          |
| `SmartLinkPlatforms` | `SMART_LINK_PLATFORMS_TABLE` |

---

## Entities

### User

| Attribute    | Type   | Constraints   | Notes                         |
|-------------|--------|---------------|-------------------------------|
| `user_id`   | string | PK, required  | From auth (e.g. Clerk `user_xxx`) |
| `name`      | string | required      | Display name.                 |
| `email`     | string | required      | Email address.                |
| `status`    | string | required      | GSI key; e.g. `active`.       |
| `created_at`| string | required      | ISO 8601 timestamp.           |
| `updated_at`| string | required      | ISO 8601 timestamp.           |

- **Storage**: DynamoDB table `Users` (`backend/src/db/tableDefinitions.json`).
- **Keys**: Partition key `user_id` (HASH). GSI `status-index` on `status` (HASH).
- **Relationships**: One user has many download gates and many smart links.

---

### DownloadGate

| Attribute          | Type   | Constraints      | Notes |
|-------------------|--------|------------------|--------|
| `gate_id`         | string | PK (sort key), required | Unique gate id (UUID). |
| `user_id`         | string | PK (partition), required | Owner; matches User. |
| `artist_name`     | string | required         | Artist name. |
| `title`           | string | required         | Song title. |
| `short_code`      | string | optional, unique | Public slug (e.g. `qsro6b`, `saxy-sax`). Alphanumeric, hyphen, underscore; 3–32 chars. Unique across all gates. GSI `short_code-index`. |
| `thumbnail_url`   | string | optional         | URL. |
| `audio_file_url`  | string | required         | **Reference only.** Audio in object storage (e.g. S3); this field holds URL or key. Max file size 100 MB (enforced at upload). |
| `visits`          | number | required         | Count. |
| `downloads`       | number | required         | Count. |
| `emails_captured` | number | required         | Count. |
| `created_at`      | string | optional         | ISO 8601. |
| `updated_at`      | string | optional         | ISO 8601. |

- **Storage**: DynamoDB table `DownloadGates`.
- **Keys**: Partition key `user_id` (HASH), sort key `gate_id` (RANGE). GSI `gate_id-index` on `gate_id` (HASH). GSI `short_code-index` on `short_code` (HASH) for public lookup by short URL.
- **Relationships**: Belongs to one User (owner). Has many **GateSteps** (ordered); each step is one service type with its own config.
- **Audio file**: Store the file in S3 (or similar); store only the URL or object key in `audio_file_url`. Do not store the binary in the database.

---

### GateStep

A single “step” in a download gate: one service type (e.g. Spotify, Email capture) with its options and targets. Steps are ordered; fans complete them in sequence (or skip if allowed).

| Attribute      | Type    | Constraints | Notes |
|----------------|---------|-------------|--------|
| `gate_id`      | string  | PK (partition), required | Parent DownloadGate. |
| `step_id`      | string  | PK (sort), required | Unique per step (e.g. UUID). |
| `service_type` | string  | required    | One of: `email_capture`, `spotify`, `soundcloud`, `instagram`, `bandcamp`, `apple_music`, `deezer`. |
| `step_order`   | number  | required    | 1-based order in the gate (Step 1, Step 2, …). |
| `is_skippable` | boolean | required    | If true, fans can skip this step and still get the download. |
| `config`       | object  | required    | Service-specific options and targets; see **Service-type config** below. |
| `created_at`   | string  | optional    | ISO 8601. |
| `updated_at`   | string  | optional    | ISO 8601. |

- **Storage**: DynamoDB table `GateSteps`.
- **Keys**: Partition key `gate_id` (HASH), sort key `step_id` (RANGE). Supports “all steps for a gate” via `Query` on `gate_id`, and “one step” via `GetItem` on (`gate_id`, `step_id`).
- **Relationships**: Belongs to one DownloadGate. No direct link to User; access via gate.

**Download Gate Service-type config** (stored in `config`; validated and interpreted in business logic):

| Download Gate Service type | Config fields (all optional unless noted) | Notes |
|----------------------------|--------------------------------------------|--------|
| `email_capture`            | `collect_email: boolean`, `collect_first_name: boolean` | |
| `spotify`                  | `follow_enabled: boolean`, `save_enabled: boolean`, `presave_enabled: boolean`, `target_urls: string[]` | |
| `instagram`                | `follow_profile_enabled: boolean`, `profile_urls: string[]` | |
| `soundcloud`               | `follow_profiles_enabled: boolean`, `like_track_enabled: boolean`, `repost_track_enabled: boolean`, `comment_on_track_enabled: boolean`, `profile_urls: string[]`, `track_url: string` | |
| `bandcamp`                 | `follow_profile_enabled: boolean`, `profile_urls: string[]` | Artist profile URLs. |
| `apple_music`              | `like_enabled: boolean`, `save_enabled: boolean`, `preadd_unreleased_enabled: boolean`, `target_urls: string[]` | |
| `deezer`                   | `follow_enabled: boolean`, `save_enabled: boolean`, `preadd_unreleased_enabled: boolean`, `target_urls: string[]` | |

Use a single flexible `config` object (e.g. JSON/document) so new service types or new options can be added without schema migrations. Backend validates required fields per `service_type` and resolves URLs to provider IDs where needed.

---

### SmartLink

A multi-platform landing page: fans visit the smart link URL and can click through to external platforms (Spotify, Bandcamp, etc.). Visits and per-destination clicks are recorded; email capture is not used for smart links.

| Attribute         | Type   | Constraints | Notes |
|-------------------|--------|-------------|--------|
| `link_id`         | string | PK (sort), required | Unique smart link id (UUID). API responses may expose this as `link_id`. |
| `user_id`         | string | PK (partition), required | Owner (artist). |
| `title`           | string | required    | e.g. song title. |
| `subtitle`        | string | optional    | e.g. artist name or subtitle. |
| `cover_image_url` | string | optional    | Thumbnail/art for the page. |
| `audio_file_url`  | string | optional    | Optional audio reference (same pattern as download gates). |
| `short_url`       | string | required    | Public slug used for lookup (indexed). The frontend shows smart links at `/link/:slug`; the API resolves public requests via GSI `short_url-index`. |
| `total_visits`    | number | required    | Page visits. |
| `total_clicks`    | number | required    | Total clicks across platforms (sum aligns with **SmartLinkPlatform** click counts). |
| `copy_label`      | string | optional    | UI label (e.g. "COPY LINK"). |
| `created_at`      | string | optional    | ISO 8601. |
| `updated_at`      | string | optional    | ISO 8601. |

- **Storage**: DynamoDB table `SmartLinks`. Implemented in `backend/src/models/smartLink.ts`; consumed by the dashboard and public routes.
- **Keys**: Partition key `user_id` (HASH), sort key `link_id` (RANGE). GSI `short_url-index` on `short_url` (HASH) for public fetch by slug.
- **Relationships**: Belongs to one User (owner). Has many **SmartLinkPlatforms** (one row per platform link on the page).

---

### SmartLinkPlatform

A single platform link listed on a smart link page (e.g. “Play on Spotify”, “Buy on Bandcamp”). Each row stores the destination URL and the number of clicks on that link.

| Attribute        | Type   | Constraints | Notes |
|------------------|--------|-------------|--------|
| `smart_link_id`  | string | PK (partition), required | Parent SmartLink (`link_id` of the parent row). |
| `id`             | string | PK (sort), required | Unique destination id (UUID). |
| `platform_name`  | string | required    | Display name (e.g. `Spotify`, `Bandcamp`, `Apple Music`). |
| `url`            | string | required    | Destination URL for this platform. |
| `click_count`    | number | required    | Clicks on this link (non-negative integer). |
| `action_label`   | string | optional    | Button label (e.g. `Play`, `Buy`). |
| `created_at`     | string | optional    | ISO 8601. |
| `updated_at`     | string | optional    | ISO 8601. |

- **Storage**: DynamoDB table `SmartLinkPlatforms`.
- **Keys**: Partition key `smart_link_id` (HASH), sort key `id` (RANGE). Query all platforms for a link with `Query` on `smart_link_id`.
- **Relationships**: Belongs to one SmartLink. No direct link to User; access via smart link.

---

## Database vs business logic

| In the database (persisted) | In business logic (code) |
|-----------------------------|---------------------------|
| Entity definitions and relationships (User, DownloadGate, GateStep, SmartLink, SmartLinkPlatform). | Validation rules (e.g. “if `follow_enabled` then `target_urls` must be non-empty”). |
| Per-step config: `service_type`, `step_order`, `is_skippable`, and the `config` object (all options and target URLs/IDs the user chose). |
| Resolved provider IDs if you choose to store them (e.g. Spotify playlist ID derived from URL). | API integrations: calling Spotify, SoundCloud, Instagram, etc. to verify follows, saves, pre-saves; OAuth and API keys. |
| References to binary assets only (e.g. `audio_file_url` for DownloadGate; optional `audio_file_url` / `cover_image_url` for SmartLink). Actual files live in object storage (e.g. S3). | Upload flow: validate file type/size (e.g. audio max 100 MB), upload to S3, store resulting URL or key in DB. Download: issue redirect or signed URL from stored reference. |
| | URL parsing and resolution (user pastes URL → backend resolves to provider entity ID). |
| | Orchestration: presenting steps to the fan, checking completion, granting download. |

Each provider (Spotify, SoundCloud, Instagram, Email capture, etc.) should have its own integration module that reads `config` for that `service_type` and performs the appropriate API calls and checks.

---

## Invariants / business rules

- Every DownloadGate and SmartLink has an owning `user_id` that matches a User (enforced by application logic on create/update).
- Every GateStep must reference a valid DownloadGate (`gate_id`).
- `step_order` should be unique per gate (no duplicate order for the same `gate_id`); enforce in business logic on create/update.
- Counts (`visits`, `downloads`, `emails_captured` on DownloadGate; `total_visits`, `total_clicks` on SmartLink; `click_count` on SmartLinkPlatform) are non-negative integers.
- Every SmartLinkPlatform must reference a valid SmartLink (`smart_link_id` = parent’s `link_id`).
- `user_id` values must match the auth provider’s user id (e.g. Clerk).
- For each GateStep, `config` must conform to the shape for its `service_type` (enforced in business logic).
- DownloadGate audio file: max 100 MB; file stored in object storage (e.g. S3), not in the database; only URL or key stored in `audio_file_url`.
- DownloadGate `short_code` is unique across all gates (enforced at create; optional; used for public short URL).

---

## Changelog

- **2026-05-06**: Aligned doc with implemented DynamoDB tables and TypeScript models: User attributes (`name`, `email`, timestamps); DownloadGate `gate_id` (not `id`); GateSteps and SmartLinks/SmartLinkPlatforms storage and keys; SmartLink `link_id`, optional `audio_file_url`, GSI `short_url-index`; table env keys; removed outdated “not yet implemented” notes.
- **2025-03-05**: DownloadGate: added `short_code` (optional, unique); GSI `short_code-index` for public URL lookup.
- **2025-03-04**: DownloadGate: added `audio_file_url` (reference only; file in S3, max 100 MB); documented “binary assets in object storage, not DB” in Database vs business logic.
- **2025-03-04**: Added SmartLinkPlatform entity (url, click_count, smart_link_id, platform_name); updated SmartLink (removed emails_captured and platforms array, added short_url, total_clicks, cover_image_url; no email capture for smart links).
- **2025-03-04**: Added GateStep entity and service-type config (email_capture, spotify, soundcloud, instagram, bandcamp, apple_music, deezer); added “Database vs business logic” section; linked DownloadGate to GateSteps.
- **2025-03-04**: Initial doc; User table from `createTables.ts`; DownloadGate and SmartLink from frontend types (not yet in DB).
