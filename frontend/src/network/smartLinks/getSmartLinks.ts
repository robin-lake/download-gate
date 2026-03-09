import { useRequest, defineTypeGuard } from '../request';
import type { ListSmartLinksResponse, SmartLinkResponse } from './types';
import { isListSmartLinksResponse } from './types';

/** Re-export type guard for use in tests and consumers. */
export const isListSmartLinksResponseGuard = defineTypeGuard(
  (data: unknown): data is ListSmartLinksResponse => isListSmartLinksResponse(data)
);

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UseGetSmartLinksParams {
  limit?: number;
  cursor?: string | null;
  /** If false, the request is not sent. Default true. */
  enabled?: boolean;
}

/**
 * Fetches GET /api/smart-links (list for current user) with optional pagination.
 * Returns display info for all smart links for the user. Uses type guard to validate response.
 */
export function useGetSmartLinks(params: UseGetSmartLinksParams = {}) {
  const { limit, cursor, enabled = true } = params;
  const search = new URLSearchParams();
  if (limit != null) search.set('limit', String(limit));
  if (cursor != null && cursor !== '') search.set('cursor', cursor);
  const query = search.toString();
  const url = `${API_BASE}/api/smart-links${query ? `?${query}` : ''}`;

  return useRequest<ListSmartLinksResponse>(url, {
    method: 'GET',
    typeGuard: isListSmartLinksResponseGuard,
    enabled,
  });
}

/**
 * Maps API SmartLinkResponse to dashboard card display shape.
 */
export function mapSmartLinkResponseToCard(link: SmartLinkResponse) {
  return {
    id: link.link_id,
    title: link.title,
    subtitle: link.subtitle,
    coverImageUrl: link.cover_image_url,
    shortUrl: link.short_url,
    totalVisits: link.total_visits,
    totalClicks: link.total_clicks,
    copyLabel: link.copy_label,
    createdAt: link.created_at,
    updatedAt: link.updated_at,
    platforms: link.platforms ?? [],
  };
}
