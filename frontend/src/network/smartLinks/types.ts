/**
 * Smart link platform (destination) shape returned by the API (snake_case).
 */
export interface SmartLinkPlatformResponse {
  smart_link_id: string;
  id: string;
  platform_name: string;
  url: string;
  click_count: number;
  action_label?: string;
  created_at?: string;
  updated_at?: string;
}

export function isSmartLinkPlatformResponse(d: unknown): d is SmartLinkPlatformResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o['smart_link_id'] === 'string' &&
    typeof o['id'] === 'string' &&
    typeof o['platform_name'] === 'string' &&
    typeof o['url'] === 'string' &&
    typeof o['click_count'] === 'number' &&
    (o['action_label'] === undefined || typeof o['action_label'] === 'string') &&
    (o['created_at'] === undefined || typeof o['created_at'] === 'string') &&
    (o['updated_at'] === undefined || typeof o['updated_at'] === 'string')
  );
}

/**
 * Smart link shape returned by the API (snake_case).
 * Aligns with backend SmartLink and docs/DATA_MODEL.md.
 * Includes platforms when returned from GET single or GET list.
 */
export interface SmartLinkResponse {
  user_id: string;
  link_id: string;
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  audio_file_url?: string;
  short_url: string;
  total_visits: number;
  total_clicks: number;
  copy_label?: string;
  created_at?: string;
  updated_at?: string;
  platforms?: SmartLinkPlatformResponse[];
}

export function isSmartLinkResponse(d: unknown): d is SmartLinkResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  const base =
    typeof o['user_id'] === 'string' &&
    typeof o['link_id'] === 'string' &&
    typeof o['title'] === 'string' &&
    typeof o['short_url'] === 'string' &&
    typeof o['total_visits'] === 'number' &&
    typeof o['total_clicks'] === 'number' &&
    (o['subtitle'] === undefined || typeof o['subtitle'] === 'string') &&
    (o['cover_image_url'] === undefined || typeof o['cover_image_url'] === 'string') &&
    (o['audio_file_url'] === undefined || typeof o['audio_file_url'] === 'string') &&
    (o['copy_label'] === undefined || typeof o['copy_label'] === 'string') &&
    (o['created_at'] === undefined || typeof o['created_at'] === 'string') &&
    (o['updated_at'] === undefined || typeof o['updated_at'] === 'string');
  if (!base) return false;
  if (o['platforms'] === undefined) return true;
  if (!Array.isArray(o['platforms'])) return false;
  return (o['platforms'] as unknown[]).every((item) => isSmartLinkPlatformResponse(item));
}

/** One platform in the create request body. */
export interface CreateSmartLinkPlatformRequest {
  platform_name: string;
  url: string;
  action_label?: string;
}

/** Request body for POST /api/smart-links */
export interface CreateSmartLinkRequest {
  title: string;
  subtitle?: string;
  cover_image_url: string;
  audio_file_url: string;
  short_url: string;
  copy_label?: string;
  platforms?: CreateSmartLinkPlatformRequest[];
}

/** Response shape of GET /api/smart-links (list for current user, paginated) */
export interface ListSmartLinksResponse {
  items: SmartLinkResponse[];
  nextToken: string | null;
}

export function isListSmartLinksResponse(d: unknown): d is ListSmartLinksResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  if (!Array.isArray(o['items'])) return false;
  if (!(o['items'] as unknown[]).every((item: unknown) => isSmartLinkResponse(item)))
    return false;
  if (o['nextToken'] !== null && typeof o['nextToken'] !== 'string') return false;
  return true;
}

/** Response shape of GET /api/smart-links/stats (summed across all user smart links). */
export interface SmartLinkStatsResponse {
  total_visits: number;
  total_clicks: number;
}

export function isSmartLinkStatsResponse(d: unknown): d is SmartLinkStatsResponse {
  if (typeof d !== 'object' || d === null) return false;
  const o = d as Record<string, unknown>;
  return (
    typeof o['total_visits'] === 'number' &&
    typeof o['total_clicks'] === 'number' &&
    Number.isInteger(o['total_visits']) &&
    Number.isInteger(o['total_clicks']) &&
    (o['total_visits'] as number) >= 0 &&
    (o['total_clicks'] as number) >= 0
  );
}
