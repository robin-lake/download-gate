/**
 * Public smart link analytics: record a visit or platform click.
 * No auth required. Fire-and-forget; errors are ignored so the page still works if the API fails.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function isNonEmptyLinkIdOrSlug(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * POST /api/link/:idOrSlug/visit
 * Increments the smart link's visit count. Call once when the page is viewed.
 */
export async function recordSmartLinkVisit(linkIdOrSlug: string): Promise<void> {
  if (!isNonEmptyLinkIdOrSlug(linkIdOrSlug)) return;
  const url = `${API_BASE}/api/link/${encodeURIComponent(linkIdOrSlug.trim())}/visit`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      console.warn('recordSmartLinkVisit failed:', res.status);
    }
  } catch {
    // Ignore network errors so the page is not affected
  }
}

/**
 * POST /api/link/:idOrSlug/click/:platformId
 * Increments total_clicks and the platform's click_count. Call when the user clicks a Play or Buy button.
 */
export async function recordSmartLinkClick(
  linkIdOrSlug: string,
  platformId: string
): Promise<void> {
  if (!isNonEmptyLinkIdOrSlug(linkIdOrSlug)) return;
  if (typeof platformId !== 'string' || !platformId.trim()) return;
  const url = `${API_BASE}/api/link/${encodeURIComponent(linkIdOrSlug.trim())}/click/${encodeURIComponent(platformId.trim())}`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      console.warn('recordSmartLinkClick failed:', res.status);
    }
  } catch {
    // Ignore network errors
  }
}
