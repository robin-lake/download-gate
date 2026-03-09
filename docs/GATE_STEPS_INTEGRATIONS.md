# Gate steps integrations: architecture recommendation

This doc recommends how to add **gate step flows** for SoundCloud, Spotify, and Instagram: component design, auth flows, and file/directory structure. The goal is a single pattern that scales to multiple services without becoming cumbersome.

**References:** [SoundCloud API Guide](https://developers.soundcloud.com/docs/api/guide), existing `GateStep` model and `docs/DATA_MODEL.md`.

---

## 1. Context and constraints

- **GateStep** already exists: `service_type`, `step_order`, `is_skippable`, `config` (service-specific). Service types include `soundcloud`, `spotify`, `instagram`, etc.
- **Public gate page** fetches steps via `GET /api/gates/:id/steps` and shows labels; there is no step completion or verification yet.
- **Auth today:** Clerk only (app users = artists). Gate page is unauthenticated (fans).
- **SoundCloud:** OAuth 2.1, PKCE required for auth code flow; Client Credentials for public-only (search, resolve, stream). All API calls need `Authorization: OAuth ACCESS_TOKEN`. Rate limits on client credentials (e.g. 50 tokens/12h per app) → reuse one token.
- **Spotify / Instagram:** Similarly use OAuth (and possibly app-only tokens where applicable). Each has its own scopes, token endpoints, and APIs for “follow” / “like” etc.

We need to support:

1. **Authentication** — who connects and what we store: app-level credentials, optional artist-level “connected accounts”, and fan-side flows to complete steps (e.g. “Sign in with SoundCloud” to verify follow).
2. **Access keys / tokens** — stored securely (env, secrets, or DB) and refreshed where needed.
3. **Per-service step logic** — different actions per service (follow profile, like track, etc.) and optional verification.

---

## 2. High-level architecture: provider adapter pattern

Use one **adapter per service** (SoundCloud, Spotify, Instagram). Each adapter implements a small, shared contract so the rest of the app stays service-agnostic.

- **Backend:** Each provider lives under a single namespace (e.g. `integrations/soundcloud/`). It owns: auth (OAuth init/callback, token exchange, refresh), API client, step config validation, and “step handler” (build redirect URL or run verification).
- **Frontend:** One “step executor” (or modal) that, given `service_type` and `config`, renders the right UI (e.g. “Follow on SoundCloud” button, or “Sign in with SoundCloud” then “Follow”). Shared types for step config and completion.
- **Orchestration:** A thin layer (e.g. `gateStepsService` or route handlers) resolves the gate, loads steps, and for each step calls the right adapter: “get redirect URL” or “verify completion” (and optionally “mark step complete” or “unlock download”).

This keeps SoundCloud-, Spotify-, and Instagram-specific details inside their own modules and makes adding a new provider a matter of adding one new adapter and registering it.

---

## 3. Auth flows (three levels)

### 3.1 App-level credentials (backend only)

- **Purpose:** Call provider APIs that don’t require a user (e.g. resolve URL → resource ID, or unauthenticated playback info). SoundCloud supports **Client Credentials** for this.
- **Storage:** Env vars or secret manager (e.g. `SOUNDCLOUD_CLIENT_ID`, `SOUNDCLOUD_CLIENT_SECRET`). Not in DB.
- **Usage:** One long-lived (or periodically refreshed) app token per provider, reused across requests. SoundCloud: reuse to avoid rate limits (50 tokens/12h per app).
- **Who:** Backend only; frontend never sees these.

### 3.2 Artist-level connections (optional but recommended)

- **Purpose:** When an artist configures a gate step (e.g. “follow my SoundCloud profile”), we need to know *which* profile or track. Options: (a) artist pastes URL and we resolve it with app credentials, or (b) artist “connects” their account once and we store their resource IDs (or a token to resolve them).
- **Storage:** A **UserConnection** (or similar) table: `user_id`, `provider` (e.g. `soundcloud`), `access_token`, `refresh_token`, `expires_at`, optional `resource_id` (e.g. profile id). Encrypt tokens at rest.
- **Flow:** “Connect SoundCloud” → redirect to provider OAuth (PKCE for SoundCloud) → callback → exchange code for tokens → store and optionally call “me” or “resolve” to get profile/track IDs. Same idea for Spotify/Instagram.
- **Usage:** When building step config or verifying, backend can resolve URLs with app credentials or use stored artist connection to get profile/track IDs.

### 3.3 Fan-side step completion (redirect vs verify)

Two patterns; you can support both and choose per step type or config:

- **Redirect-only (no verification):** Step has links (e.g. “Follow on SoundCloud” → `https://soundcloud.com/...`). Fan clicks, completes action on provider, returns to your site. You do **not** verify; you either trust or add a “I’ve done it” button. Easiest; no fan OAuth.
- **Verify via fan OAuth:** Fan clicks “Complete step” → redirect to SoundCloud (or Spotify/Instagram) OAuth → callback with code → backend exchanges for token → backend calls provider API (e.g. “does this user follow artist X?”) → if yes, mark step complete and optionally unlock download. Requires storing minimal fan state (e.g. session or short-lived cookie) for the callback.

For SoundCloud, the [API Guide](https://developers.soundcloud.com/docs/api/guide) states that acting on behalf of a user (e.g. follow, like) uses the **Authorization Code** flow (with PKCE). So any “verify fan followed” flow would use that.

Recommendation: start with **redirect-only** plus a “Mark as done” or “Get download” that doesn’t verify; add **fan OAuth + verification** per provider when you need it, using the same adapter interface (e.g. `getVerificationUrl`, `verifyCallback`).

---

## 4. Component design

### 4.1 Backend: adapter contract

Define a small interface that every provider implements (e.g. in `backend/src/integrations/types.ts`):

```ts
// Pseudo-signature; adapt to your types
interface GateStepAdapter {
  readonly serviceType: 'soundcloud' | 'spotify' | 'instagram';

  /** Validate step config for this service (e.g. profile_urls required). */
  validateConfig(config: Record<string, unknown>): Promise<ValidationResult>;

  /** Return URL to send the fan to (e.g. follow profile, like track). Redirect-only flow. */
  getStepRedirectUrl(step: GateStep): Promise<string | null>;

  /** Optional: return URL to start fan OAuth for verification. */
  getVerificationStartUrl?(gateId: string, stepId: string, returnUrl: string): Promise<string>;

  /** Optional: handle OAuth callback, verify action, return success/failure. */
  verifyStepCompletion?(gateId: string, stepId: string, callbackParams: CallbackParams): Promise<VerifyResult>;
}
```

- **validateConfig:** Used when creating/updating a GateStep (and optionally when listing steps) so invalid configs are rejected or normalized.
- **getStepRedirectUrl:** Used by the public gate page: “Complete this step” → redirect to SoundCloud/Spotify/Instagram. No fan token needed for redirect-only.
- **getVerificationStartUrl** / **verifyStepCompletion:** Implement when you add “Sign in with X and we verify” flows.

Each adapter also owns:

- **Auth:** OAuth routes (e.g. `/api/auth/soundcloud/connect`, `/api/auth/soundcloud/callback`) for artist connection; optionally `/api/gates/:id/steps/:stepId/verify-start` and callback for fan verification.
- **Token handling:** Client credentials (in-memory or cached), refresh of artist tokens, and (if needed) one-time use of fan token in callback then discard.

### 4.2 Backend: per-provider layout

One folder per provider keeps auth, client, and step logic together:

```
backend/src/integrations/
  types.ts              # Adapter interface, shared types (ValidationResult, CallbackParams, etc.)
  index.ts              # Registry: getAdapter(serviceType) -> GateStepAdapter
  soundcloud/
    index.ts            # Export adapter + routes
    adapter.ts          # Implements GateStepAdapter (validateConfig, getStepRedirectUrl, …)
    auth.ts             # Client credentials, refresh; OAuth URLs and token exchange for artist/fan
    client.ts           # Wrapper for SoundCloud API (resolve, me, follow check, etc.)
    config.ts           # Env: SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET, redirect URIs
  spotify/
    index.ts
    adapter.ts
    auth.ts
    client.ts
    config.ts
  instagram/
    ...
```

- **config.ts:** Read env; no secrets in code. Validate presence of required vars at startup or first use.
- **auth.ts:** For SoundCloud: build authorize URL (with PKCE and state), exchange code for tokens, refresh. Same pattern for Spotify/Instagram with their endpoints and scopes.
- **client.ts:** Thin wrapper around HTTP calls to the provider API (e.g. resolve URL, get current user, check follow). Use tokens from auth (app or artist).
- **adapter.ts:** Implements the shared interface: validate config (e.g. `profile_urls`, `track_url`), build redirect URL from step config (and optionally from resolved IDs), and if you support verification, implement `getVerificationStartUrl` and `verifyStepCompletion`.

### 4.3 Public API for steps

Keep the existing **GET /api/gates/:gateIdOrSlug/steps**; it already returns steps with `service_type` and `config`. Add:

- **GET (or POST) /api/gates/:gateIdOrSlug/steps/:stepId/redirect**  
  Returns `{ url: string }` for the current step so the frontend can open it in a new tab or redirect. Backend uses `getAdapter(step.service_type).getStepRedirectUrl(step)`.

- **Optional (when you add verification):**  
  - **GET /api/gates/:gateIdOrSlug/steps/:stepId/verify**  
    Redirects the fan to provider OAuth (e.g. SoundCloud) with state that encodes gateId, stepId, and return URL.  
  - **GET /api/auth/soundcloud/callback** (or under `/api/gates/...`)  
    Exchanges code, verifies follow/like via client, marks step complete in session (or DB), redirects back to gate page.

You can also add **artist** routes under `/api/users/connections` (or `/api/me/connections`):  
`GET` (list), `POST /soundcloud` (redirect to connect), `GET /soundcloud/callback`, and same for Spotify/Instagram.

### 4.4 Frontend: step UI components

- **Single “step executor” component** that receives a step (`GateStepResponse`) and gate id:
  - Renders label (reuse existing `SERVICE_TYPE_LABELS` or derive from adapter).
  - For “redirect-only”: a button “Follow on SoundCloud” that calls `GET .../steps/:stepId/redirect` and opens `url` in a new tab (or same tab).
  - Optional: “I’ve completed this” checkbox or button that doesn’t call provider (trust-based), or a “Sign in with SoundCloud to verify” that sends the user to the verify URL.

- **Per-service optional overrides:** If one provider needs a different UX (e.g. Instagram in-app browser constraints), you can add `StepCardSoundCloud`, `StepCardSpotify`, and a small map `service_type → StepCard`; default to the generic step executor.

- **Unlock download:** When all steps are “done” (either by verification or by user marking done), enable “Get download” and call your existing download endpoint. You can track “step completed” in React state only (redirect-only) or in session/backend when verification is implemented.

This keeps the gate page and modal mostly provider-agnostic; only the redirect URL and optional verify flow are provider-specific and live in the backend adapters.

---

## 5. File and directory structure (summary)

### Backend

```
backend/src/
  integrations/
    types.ts              # Adapter interface + shared types
    index.ts              # getAdapter(serviceType), register adapters
    soundcloud/
      index.ts            # Export adapter + mount auth routes
      adapter.ts          # validateConfig, getStepRedirectUrl, (verify)
      auth.ts             # OAuth URLs, token exchange, refresh, client credentials
      client.ts           # SoundCloud API calls
      config.ts           # Env and redirect URIs
    spotify/
      ...
    instagram/
      ...
  routes/
    publicGates.ts        # Existing; add /steps/:stepId/redirect (and verify if needed)
    ...
  models/
    userConnection.ts    # Optional: user_id, provider, tokens, expires_at (new table)
```

- **Config / secrets:** App credentials in env (e.g. `SOUNDCLOUD_CLIENT_ID`, `SOUNDCLOUD_CLIENT_SECRET`). Artist (and fan) tokens in DB or session; encrypt at rest.

### Frontend

```
frontend/src/
  pages/DownloadGate/
    DownloadGate.tsx           # Existing; use StepExecutor for each step
    components/
      StepExecutor.tsx        # Generic: label + redirect button (+ optional verify)
      steps/                  # Optional per-service overrides
        SoundCloudStep.tsx
        SpotifyStep.tsx
        InstagramStep.tsx
  network/
    downloadGates/
      getStepRedirect.ts      # GET .../gates/:id/steps/:stepId/redirect
      ...
```

### Data model (align with DATA_MODEL.md)

- **GateStep** already has `service_type` and `config`; no change needed. Keep validating `config` per `service_type` in the adapter’s `validateConfig`.
- **UserConnection** (new entity): For artist-linked accounts. Attributes: `user_id`, `provider`, `access_token`, `refresh_token`, `expires_at`, optional `provider_user_id` or `resource_ids`. Store in a new DynamoDB table; partition key `user_id`, sort key `provider` (or `provider#resource_type`). See DATA_MODEL.md for how to document new entities.

---

## 6. SoundCloud-specific notes (from API guide)

- **OAuth 2.1:** Use PKCE for authorization code flow; required for “Sign in with SoundCloud.”
- **Client credentials:** `POST https://secure.soundcloud.com/oauth/token` with `Authorization: Basic Base64(client_id:client_secret)` and `grant_type=client_credentials`. Reuse one token; limit 50 tokens/12h per app.
- **Authorization header:** `Authorization: OAuth ACCESS_TOKEN` or `Bearer ACCESS_TOKEN` for API requests.
- **Resolve URL:** `GET https://api.soundcloud.com/resolve?url=...` with app or user token to get resource (user, track, playlist) and IDs for building follow/like links.
- **Follow/like:** Use user-scoped token (auth code flow); see Follow & Like and Playing Tracks in the [API Guide](https://developers.soundcloud.com/docs/api/guide).

---

## 7. Implementation order suggestion

1. **Adapter contract + SoundCloud only**  
   Add `integrations/types.ts` and `integrations/soundcloud/*` with `validateConfig` and `getStepRedirectUrl` (resolve URLs with client credentials if needed; build follow/track links from config). No artist or fan OAuth yet.

2. **Public redirect endpoint**  
   Add `GET /api/gates/:gateIdOrSlug/steps/:stepId/redirect`; resolve step, call `getAdapter(step.service_type).getStepRedirectUrl(step)`, return `{ url }`.

3. **Frontend StepExecutor**  
   In the gate modal, for each step call redirect endpoint and show “Open SoundCloud” (or “Follow on SoundCloud”) that opens the URL. Keep “Get download” as today (or gate it on “all steps opened” if you prefer).

4. **Artist connections (optional)**  
   Add UserConnection model and SoundCloud OAuth routes; when artist “connects SoundCloud,” store tokens and optionally resolve profile ID so step config can default to “your profile.”

5. **Spotify and Instagram adapters**  
   Same structure: config, auth (client credentials + optional artist OAuth), client, adapter with `getStepRedirectUrl`. Register in `integrations/index.ts`.

6. **Fan verification (optional, later)**  
   Add `getVerificationStartUrl` and `verifyStepCompletion` for one provider (e.g. SoundCloud); add verify route and callback; then replicate for Spotify/Instagram.

This keeps the design expandable without one big “gate steps” monolith: each new provider is a new folder under `integrations/` and a new entry in the adapter registry.
