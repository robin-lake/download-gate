import { useRequest, defineTypeGuard } from './request';

/** User shape returned by GET /api/users (list) and GET /api/users/:id */
export interface User {
  user_id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Response shape of GET /api/users */
export interface ListUsersResponse {
  items: User[];
  nextToken: string | null;
  count?: number;
}

export function isUser(d: unknown): d is User {
  return (
    typeof d === 'object' &&
    d !== null &&
    'user_id' in d &&
    'name' in d &&
    'email' in d &&
    'status' in d &&
    'created_at' in d &&
    'updated_at' in d &&
    typeof (d as User).user_id === 'string' &&
    typeof (d as User).name === 'string' &&
    typeof (d as User).email === 'string' &&
    typeof (d as User).created_at === 'string' &&
    typeof (d as User).updated_at === 'string'
  );
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
