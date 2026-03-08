import { useRequest, defineTypeGuard } from '../request';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Response shape: 204 No Content returns empty body (parsed as {}). */
export interface ExecuteSoundCloudResponse {
  [key: string]: never;
}

export function isExecuteSoundCloudResponse(
  data: unknown
): data is ExecuteSoundCloudResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.keys(data as object).length === 0
  );
}

const executeSoundCloudResponseGuard = defineTypeGuard(
  (data: unknown): data is ExecuteSoundCloudResponse =>
    isExecuteSoundCloudResponse(data)
);

export interface UseExecuteSoundCloudActionsParams {
  gateIdOrSlug: string | undefined;
  /** When true, the request is sent (e.g. after user clicks Get download and SoundCloud is connected). */
  enabled?: boolean;
  /** Comment text to post on the track when comment_on_track is enabled in the step config. */
  comment?: string;
}

/**
 * POST /api/integrations/soundcloud/execute
 * Executes SoundCloud actions (follow, like, repost, comment) for the gate's SoundCloud steps.
 * Requires credentials so the soundcloud_access_token cookie is sent.
 * Call with enabled=true when the user has connected SoundCloud and (if comment required) provided a comment.
 */
export function useExecuteSoundCloudActions(
  params: UseExecuteSoundCloudActionsParams
) {
  const { gateIdOrSlug, enabled = false, comment } = params;
  const trimmed = typeof gateIdOrSlug === 'string' ? gateIdOrSlug.trim() : '';
  const url =
    enabled && trimmed
      ? `${API_BASE}/api/integrations/soundcloud/execute`
      : null;

  return useRequest<ExecuteSoundCloudResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: url
      ? JSON.stringify({
          gateIdOrSlug: trimmed,
          ...(typeof comment === 'string' && comment.trim()
            ? { comment: comment.trim() }
            : {}),
        })
      : undefined,
    typeGuard: executeSoundCloudResponseGuard,
    enabled: Boolean(enabled && trimmed),
  });
}
