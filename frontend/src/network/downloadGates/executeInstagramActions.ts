import { useRequest, defineTypeGuard } from '../request';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Response shape: 204 No Content returns empty body (parsed as {}). */
export interface ExecuteInstagramResponse {
  [key: string]: never;
}

export function isExecuteInstagramResponse(
  data: unknown
): data is ExecuteInstagramResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.keys(data as object).length === 0
  );
}

export const executeInstagramResponseGuard = defineTypeGuard(
  (data: unknown): data is ExecuteInstagramResponse =>
    isExecuteInstagramResponse(data)
);

export interface UseExecuteInstagramActionsParams {
  gateIdOrSlug: string | undefined;
  /** When true, the request is sent (e.g. after Instagram OAuth success). */
  enabled?: boolean;
}

/**
 * POST /api/integrations/instagram/execute
 * Executes Instagram actions (follow profile) for the gate's Instagram steps.
 * Requires credentials so the instagram_access_token cookie is sent.
 * Call with enabled=true when the user has connected Instagram.
 */
export function useExecuteInstagramActions(
  params: UseExecuteInstagramActionsParams
) {
  const { gateIdOrSlug, enabled = false } = params;
  const trimmed = typeof gateIdOrSlug === 'string' ? gateIdOrSlug.trim() : '';
  const url =
    enabled && trimmed
      ? `${API_BASE}/api/integrations/instagram/execute`
      : null;

  return useRequest<ExecuteInstagramResponse>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: url ? JSON.stringify({ gateIdOrSlug: trimmed }) : undefined,
    typeGuard: executeInstagramResponseGuard,
    enabled: Boolean(enabled && trimmed),
  });
}
