/**
 * Public gate analytics: record a visit or download.
 * No auth required. Fire-and-forget; errors are ignored so the gate page still works if the API fails.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Validates that gateIdOrSlug is a non-empty string (type guard for API calls).
 */
export function isNonEmptyGateIdOrSlug(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * POST /api/gates/:gateIdOrSlug/visit
 * Increments the gate's visit count. Call once when the gate page is viewed.
 */
export async function recordVisit(gateIdOrSlug: string): Promise<void> {
  if (!isNonEmptyGateIdOrSlug(gateIdOrSlug)) return;
  const url = `${API_BASE}/api/gates/${encodeURIComponent(gateIdOrSlug.trim())}/visit`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      console.warn('recordVisit failed:', res.status);
    }
  } catch {
    // Ignore network errors so the gate page is not affected
  }
}

/**
 * POST /api/gates/:gateIdOrSlug/download
 * Increments the gate's download count. Call when the user clicks "Get download".
 */
export async function recordDownload(gateIdOrSlug: string): Promise<void> {
  if (!isNonEmptyGateIdOrSlug(gateIdOrSlug)) return;
  const url = `${API_BASE}/api/gates/${encodeURIComponent(gateIdOrSlug.trim())}/download`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      console.warn('recordDownload failed:', res.status);
    }
  } catch {
    // Ignore network errors
  }
}
