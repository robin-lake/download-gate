# Data model (source of truth)

Backend entities, attributes, keys, and relationships. Keep this in sync with DynamoDB (and any TypeScript types) so code and AI share one mental model.

**Last updated**: 2025-03-04

---

## Overview

The system stores **users** (auth/identity), **download gates** (gate a download behind fan actions), **gate steps** (per-gate requirements: follow/save on Spotify, SoundCloud, Instagram, etc., or email capture), and **smart links** (multi-platform links with visits/clicks). Download gates and smart links are owned by users. Each download gate has an ordered list of **gate steps**; each step is one service type (e.g. Spotify, Email capture) with its own configurable options and targets (URLs, profiles, etc.). Each smart link has many **smart link destinations** (one per platform link shown on the page); each destination has a URL and a per-link click count.

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

| Attribute         | Type   | Constraints | Notes |
|------------------|--------|-------------|--------|
| `id`             | string | PK, required | Unique gate id. |
| `user_id`        | string | FK, required | From user table. |
| `artist_name`    | string | required    | Artist name. |
| `title`          | string | required    | Song title. |
| `thumbnail_url`  | string | optional    | URL. |
| `audio_file_url` | string | required    | **Reference only.** The actual audio file is stored in object storage (e.g. S3); this field holds the download URL (or S3 key if you issue signed URLs server-side). Max file size 100 MB (enforced at upload in business logic). |
| `visits`         | number | required    | Count. |
| `downloads`     | number | required    | Count. |
| `emails_captured` | number | required   | Count. |

- **Storage**: Not yet implemented (frontend uses mocks; see `frontend/src/pages/Dashboard/dashboardState.ts` and `DownloadGateCard.tsx`).
- **Keys**: TBD (e.g. `user_id` (PK) + `gate_id` (SK), or single-table design).
- **Relationships**: Belongs to one User (owner). Has many **GateSteps** (ordered); each step is one service type with its own config.
- **Audio file**: Store the file in S3 (or similar); store only the URL or object key in `audio_file_url`. Do not store the binary in the database.

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

A multi-platform landing page: fans visit the smart link URL and can click through to external platforms (Spotify, Bandcamp, etc.). Visits and per-destination clicks are recorded; email capture is not used for smart links.

| Attribute       | Type   | Constraints | Notes |
|-----------------|--------|-------------|--------|
| `id`            | string | PK, required | Unique smart link id. |
| `user_id`       | string | FK, required | Owner (artist). |
| `title`         | string | required    | e.g. song title. |
| `subtitle`      | string | optional    | e.g. artist name or subtitle. |
| `cover_image_url` | string | optional  | Thumbnail/art for the page. |
| `short_url`     | string | required    | Public URL for the smart link (e.g. downloadgate.com/xyz). |
| `total_visits`  | number | required    | Number of times the smart link page was visited. |
| `total_clicks`  | number | required    | Total clicks across all destinations (can be derived from **SmartLinkDestination** click counts). |
| `copy_label`    | string | optional    | UI label (e.g. "COPY LINK"). |

- **Storage**: Not yet implemented (frontend mocks in `dashboardState.ts` and `SmartLinkCard.tsx`).
- **Keys**: TBD (e.g. `user_id` (PK) + `link_id` (SK)).
- **Relationships**: Belongs to one User (owner). Has many **SmartLinkDestinations** (one row per platform link shown on the page).

---

### SmartLinkDestination

A single platform link listed on a smart link page (e.g. “Play on Spotify”, “Buy on Bandcamp”). Each row stores the destination URL and the number of clicks on that link.

| Attribute        | Type   | Constraints | Notes |
|------------------|--------|-------------|--------|
| `id`             | string | PK, required | Unique destination id. |
| `smart_link_id`  | string | FK, required | Parent SmartLink. |
| `platform_name`  | string | required    | Display name (e.g. `Spotify`, `Bandcamp`, `Apple Music`). |
| `url`            | string | required    | Destination URL for this platform. |
| `click_count`    | number | required    | Number of clicks on this link (non-negative integer). |
| `action_label`   | string | optional    | Button label (e.g. `Play`, `Buy`); can be derived from platform in business logic. |

- **Storage**: TBD (e.g. DynamoDB: partition key `smart_link_id`, sort key `id`; or separate table with `smart_link_id` as partition key).
- **Keys**: Must support “all destinations for a smart link” (e.g. query by `smart_link_id`).
- **Relationships**: Belongs to one SmartLink. No direct link to User; access via smart link.

---

## Database vs business logic

| In the database (persisted) | In business logic (code) |
|-----------------------------|---------------------------|
| Entity definitions and relationships (User, DownloadGate, GateStep, SmartLink, SmartLinkDestination). | Validation rules (e.g. “if `follow_enabled` then `target_urls` must be non-empty”). |
| Per-step config: `service_type`, `step_order`, `is_skippable`, and the `config` object (all options and target URLs/IDs the user chose). |
| Resolved provider IDs if you choose to store them (e.g. Spotify playlist ID derived from URL). | API integrations: calling Spotify, SoundCloud, Instagram, etc. to verify follows, saves, pre-saves; OAuth and API keys. |
| References to binary assets only (e.g. `audio_file_url` for DownloadGate). Actual files (audio, images) live in object storage (e.g. S3). | Upload flow: validate file type/size (e.g. audio max 100 MB), upload to S3, store resulting URL or key in DB. Download: issue redirect or signed URL from stored reference. |
| | URL parsing and resolution (user pastes URL → backend resolves to provider entity ID). |
| | Orchestration: presenting steps to the fan, checking completion, granting download. |

Each provider (Spotify, SoundCloud, Instagram, Email capture, etc.) should have its own integration module that reads `config` for that `service_type` and performs the appropriate API calls and checks.

---

## Invariants / business rules

- Every DownloadGate and SmartLink must have an owning user (to be enforced when tables exist).
- Every GateStep must reference a valid DownloadGate (`gate_id`).
- `step_order` is unique per gate (no duplicate order for the same `gate_id`).
- Counts (`visits`, `downloads`, `emails_captured` on DownloadGate, `total_visits`, `total_clicks` on SmartLink, `click_count` on SmartLinkDestination) are non-negative integers.
- Every SmartLinkDestination must reference a valid SmartLink (`smart_link_id`).
- `user_id` values must match the auth provider’s user id (e.g. Clerk).
- For each GateStep, `config` must conform to the shape for its `service_type` (enforced in business logic).
- DownloadGate audio file: max 100 MB; file stored in object storage (e.g. S3), not in the database; only URL or key stored in `audio_file_url`.

---

## Changelog

- **2025-03-04**: DownloadGate: added `audio_file_url` (reference only; file in S3, max 100 MB); documented “binary assets in object storage, not DB” in Database vs business logic.
- **2025-03-04**: Added SmartLinkDestination entity (url, click_count, smart_link_id, platform_name); updated SmartLink (removed emails_captured and platforms array, added short_url, total_clicks, cover_image_url; no email capture for smart links).
- **2025-03-04**: Added GateStep entity and service-type config (email_capture, spotify, soundcloud, instagram, bandcamp, apple_music, deezer); added “Database vs business logic” section; linked DownloadGate to GateSteps.
- **2025-03-04**: Initial doc; User table from `createTables.ts`; DownloadGate and SmartLink from frontend types (not yet in DB).
