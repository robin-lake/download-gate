import { useRequest, defineTypeGuard } from '../request';
import type { ListDownloadGatesResponse, DownloadGateResponse } from './types';
import { isListDownloadGatesResponse } from './types';

/** Re-export type guard for use in tests and consumers. */
export const isListDownloadGatesResponseGuard = defineTypeGuard(
  (data: unknown): data is ListDownloadGatesResponse => isListDownloadGatesResponse(data)
);

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UseGetDownloadGatesParams {
  limit?: number;
  cursor?: string | null;
  /** If false, the request is not sent. Default true. */
  enabled?: boolean;
}

/**
 * Fetches GET /api/download-gates (list for current user) with optional pagination.
 * Uses type guard to validate response.
 */
export function useGetDownloadGates(params: UseGetDownloadGatesParams = {}) {
  const { limit, cursor, enabled = true } = params;
  const search = new URLSearchParams();
  if (limit != null) search.set('limit', String(limit));
  if (cursor != null && cursor !== '') search.set('cursor', cursor);
  const query = search.toString();
  const url = `${API_BASE}/api/download-gates${query ? `?${query}` : ''}`;

  return useRequest<ListDownloadGatesResponse>(url, {
    method: 'GET',
    typeGuard: isListDownloadGatesResponseGuard,
    enabled,
  });
}

/**
 * Maps API DownloadGateResponse to dashboard card shape (id, title, subtitle, etc.).
 */
export function mapDownloadGateResponseToCard(gate: DownloadGateResponse) {
  return {
    id: gate.gate_id,
    title: gate.title,
    subtitle: gate.artist_name,
    thumbnailUrl: gate.thumbnail_url,
    visits: gate.visits,
    downloads: gate.downloads,
    emailsCaptured: gate.emails_captured,
  };
}
