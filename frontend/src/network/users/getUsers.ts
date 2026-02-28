import { useRequest, defineTypeGuard } from '../request';
import type { User } from './types.ts';
import { isUser } from './types.ts';

/** Response shape of GET /api/users */
export interface ListUsersResponse {
  items: User[];
  nextToken: string | null;
  count?: number;
}

export const isListUsersResponse = defineTypeGuard((data: unknown): data is ListUsersResponse => {
  if (typeof data !== 'object' || data === null) return false;
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o['items'])) return false;
  if (!o['items'].every((item: unknown) => isUser(item))) return false;
  if (o['nextToken'] !== null && typeof o['nextToken'] !== 'string') return false;
  if (o['count'] !== undefined && typeof o['count'] !== 'number') return false;
  return true;
});

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UseGetUsersParams {
  limit?: number;
  cursor?: string | null;
}

/**
 * Fetches GET /api/users with optional pagination. Uses isListUsersResponse type guard.
 */
export function useGetUsers(params: UseGetUsersParams = {}) {
  const { limit, cursor } = params;
  const search = new URLSearchParams();
  if (limit != null) search.set('limit', String(limit));
  if (cursor != null && cursor !== '') search.set('cursor', cursor);
  const query = search.toString();
  const url = `${API_BASE}/api/users${query ? `?${query}` : ''}`;

  return useRequest<ListUsersResponse>(url, {
    method: 'GET',
    typeGuard: isListUsersResponse,
  });
}
