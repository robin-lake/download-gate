import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNonEmptyGateIdOrSlug,
  recordVisit,
  recordDownload,
} from './recordGateAnalytics';

describe('isNonEmptyGateIdOrSlug', () => {
  it('returns true for non-empty string', () => {
    expect(isNonEmptyGateIdOrSlug('gate-1')).toBe(true);
    expect(isNonEmptyGateIdOrSlug('qsro6b')).toBe(true);
    expect(isNonEmptyGateIdOrSlug('a')).toBe(true);
  });

  it('returns false for empty string or whitespace-only', () => {
    expect(isNonEmptyGateIdOrSlug('')).toBe(false);
    expect(isNonEmptyGateIdOrSlug('   ')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isNonEmptyGateIdOrSlug(null)).toBe(false);
    expect(isNonEmptyGateIdOrSlug(undefined)).toBe(false);
    expect(isNonEmptyGateIdOrSlug(123)).toBe(false);
    expect(isNonEmptyGateIdOrSlug({})).toBe(false);
    expect(isNonEmptyGateIdOrSlug([])).toBe(false);
  });
});

describe('recordVisit', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls POST /api/gates/:id/visit with encoded id', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await recordVisit('gate-1');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/api/gates/');
    expect(url).toContain('/visit');
    expect(opts?.method).toBe('POST');
  });

  it('does not throw when response is not ok', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(recordVisit('gate-1')).resolves.toBeUndefined();
  });

  it('does not call fetch when gateIdOrSlug is empty', async () => {
    await recordVisit('');
    await recordVisit('   ');

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('recordDownload', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls POST /api/gates/:id/download', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await recordDownload('qsro6b');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/api/gates/');
    expect(url).toContain('/download');
    expect(opts?.method).toBe('POST');
  });

  it('does not throw when fetch rejects', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));

    await expect(recordDownload('gate-1')).resolves.toBeUndefined();
  });
});
