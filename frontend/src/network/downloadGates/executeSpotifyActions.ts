import { useRequest, defineTypeGuard } from '../request';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Response shape: 204 No Content returns empty body (parsed as {}). */
export interface ExecuteSpotifyResponse {
  [key: string]: never;
}

export function isExecuteSpotifyResponse(data: unknown): data is ExecuteSpotifyResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.keys(data as object).length === 0
  );
}

const executeSpotifyResponseGuard = defineTypeGuard(
  (data: unknown): data is ExecuteSpotifyResponse => isExecuteSpotifyResponse(data)
);

export interface UseExecuteSpotifyActionsParams {
  gateIdOrSlug: string | undefined;
  /** When true, the request is sent. Set to true after Spotify OAuth success. */
  enabled?: boolean;
}

/**
 * POST /api/integrations/spotify/execute
 * Executes Spotify actions (follow artist, save track/album) for the gate's Spotify steps.
 * Requires credentials so the spotify_access_token cookie is sent.
 * Use after Spotify OAuth success by setting enabled to true.
 */
export function useExecuteSpotifyActions(params: UseExecuteSpotifyActionsParams) {
  const { gateIdOrSlug, enabled = false } = params;
  const trimmed = typeof gateIdOrSlug === 'string' ? gateIdOrSlug.trim() : '';
  const url =
    enabled && trimmed
      ? `${API_BASE}/api/integrations/spotify/execute`
      : null;

  return useRequest<ExecuteSpotifyResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: url ? JSON.stringify({ gateIdOrSlug: trimmed }) : undefined,
    typeGuard: executeSpotifyResponseGuard,
    enabled: Boolean(enabled && trimmed),
  });
}
