import { useRequest, defineTypeGuard } from '../request';
import type { SmartLinkResponse } from './types';
import { isSmartLinkResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Re-export type guard for use in tests and consumers. */
export const isSmartLinkResponseGuard = defineTypeGuard(
  (data: unknown): data is SmartLinkResponse => isSmartLinkResponse(data)
);

export interface UseGetSmartLinkParams {
  linkId: string | undefined;
  enabled?: boolean;
}

/**
 * Fetches GET /api/smart-links/:linkId for the authenticated user.
 * Returns a single smart link. Uses type guard to validate response.
 */
export function useGetSmartLink(params: UseGetSmartLinkParams) {
  const { linkId, enabled = true } = params;
  const url =
    linkId && linkId.trim()
      ? `${API_BASE}/api/smart-links/${encodeURIComponent(linkId.trim())}`
      : null;

  return useRequest<SmartLinkResponse>(url, {
    method: 'GET',
    typeGuard: isSmartLinkResponseGuard,
    enabled: Boolean(linkId?.trim()) && enabled,
  });
}
