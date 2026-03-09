/**
 * Download gate shape returned by the API (snake_case).
 * Aligns with backend DownloadGate and docs/DATA_MODEL.md.
 */
export interface DownloadGateResponse {
  user_id: string;
  gate_id: string;
  artist_name: string;
  title: string;
  short_code?: string;
  thumbnail_url?: string;
  audio_file_url: string;
  visits: number;
  downloads: number;
  emails_captured: number;
  created_at?: string;
  updated_at?: string;
}

export function isDownloadGateResponse(d: unknown): d is DownloadGateResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o['user_id'] === 'string' &&
    typeof o['gate_id'] === 'string' &&
    typeof o['artist_name'] === 'string' &&
    typeof o['title'] === 'string' &&
    typeof o['audio_file_url'] === 'string' &&
    typeof o['visits'] === 'number' &&
    typeof o['downloads'] === 'number' &&
    typeof o['emails_captured'] === 'number' &&
    (o['short_code'] === undefined || typeof o['short_code'] === 'string') &&
    (o['thumbnail_url'] === undefined || typeof o['thumbnail_url'] === 'string') &&
    (o['created_at'] === undefined || typeof o['created_at'] === 'string') &&
    (o['updated_at'] === undefined || typeof o['updated_at'] === 'string')
  );
}

/** One gate step in the create-gate request (order = array index). */
export interface CreateGateStepRequest {
  service_type: string;
  is_skippable?: boolean;
  config?: Record<string, unknown>;
}

/** Request body for POST /api/download-gates */
export interface CreateDownloadGateRequest {
  artist_name: string;
  title: string;
  audio_file_url: string;
  thumbnail_url?: string;
  short_code?: string;
  /** Optional gate steps to create with the gate (order = array order). */
  steps?: CreateGateStepRequest[];
}

/** Response shape of GET /api/download-gates (list for current user) */
export interface ListDownloadGatesResponse {
  items: DownloadGateResponse[];
  nextToken: string | null;
}

export function isListDownloadGatesResponse(d: unknown): d is ListDownloadGatesResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  if (!Array.isArray(o['items'])) return false;
  if (!o['items'].every((item: unknown) => isDownloadGateResponse(item))) return false;
  if (o['nextToken'] !== null && typeof o['nextToken'] !== 'string') return false;
  return true;
}

/** Gate step shape from API (snake_case). Used on the public gate page. */
export interface GateStepResponse {
  gate_id: string;
  step_id: string;
  service_type: string;
  step_order: number;
  is_skippable: boolean;
  config: Record<string, unknown>;
}

export interface GateStepsResponse {
  steps: GateStepResponse[];
}

export function isGateStepsResponse(d: unknown): d is GateStepsResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  return Array.isArray(o['steps']);
}

/** Response shape of GET /api/download-gates/stats (summed across all user gates). */
export interface DownloadGateStatsResponse {
  total_visits: number;
  total_downloads: number;
  total_emails_captured: number;
}

export function isDownloadGateStatsResponse(d: unknown): d is DownloadGateStatsResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o['total_visits'] === 'number' &&
    typeof o['total_downloads'] === 'number' &&
    typeof o['total_emails_captured'] === 'number' &&
    Number.isInteger(o['total_visits']) &&
    Number.isInteger(o['total_downloads']) &&
    Number.isInteger(o['total_emails_captured']) &&
    (o['total_visits'] as number) >= 0 &&
    (o['total_downloads'] as number) >= 0 &&
    (o['total_emails_captured'] as number) >= 0
  );
}

/** Response shape of DELETE /api/download-gates/:gateId */
export interface DeleteDownloadGateResponse {
  deleted: true;
}

export function isDeleteDownloadGateResponse(d: unknown): d is DeleteDownloadGateResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  return o['deleted'] === true;
}