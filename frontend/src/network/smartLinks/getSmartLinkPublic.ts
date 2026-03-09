import { useRequest, defineTypeGuard } from '../request';
import type { SmartLinkResponse } from './types';
import { isSmartLinkResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const smartLinkResponseGuard = defineTypeGuard(
  (data: unknown): data is SmartLinkResponse => isSmartLinkResponse(data)
);

export interface UseGetSmartLinkPublicParams {
  linkIdOrSlug: string | undefined;
  enabled?: boolean;
}

/**
 * Fetches GET /api/link/:idOrSlug (public, no auth required).
 * Use for the public smart link landing page.
 */
export function useGetSmartLinkPublic(params: UseGetSmartLinkPublicParams) {
  const { linkIdOrSlug, enabled = true } = params;
  const url =
    linkIdOrSlug && linkIdOrSlug.trim()
      ? `${API_BASE}/api/link/${encodeURIComponent(linkIdOrSlug.trim())}`
      : null;

  return useRequest<SmartLinkResponse>(url, {
    method: 'GET',
    typeGuard: smartLinkResponseGuard,
    enabled: Boolean(linkIdOrSlug?.trim()) && enabled,
  });
}
