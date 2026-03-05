/**
 * Download gate shape returned by the API (snake_case).
 * Aligns with backend DownloadGate and docs/DATA_MODEL.md.
 */
export interface DownloadGateResponse {
  user_id: string;
  gate_id: string;
  artist_name: string;
  title: string;
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
    (o['thumbnail_url'] === undefined || typeof o['thumbnail_url'] === 'string') &&
    (o['created_at'] === undefined || typeof o['created_at'] === 'string') &&
    (o['updated_at'] === undefined || typeof o['updated_at'] === 'string')
  );
}

/** Request body for POST /api/download-gates */
export interface CreateDownloadGateRequest {
  artist_name: string;
  title: string;
  audio_file_url: string;
  thumbnail_url?: string;
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
