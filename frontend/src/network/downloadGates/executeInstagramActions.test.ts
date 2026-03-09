import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useExecuteInstagramActions,
  isExecuteInstagramResponse,
  executeInstagramResponseGuard,
} from './executeInstagramActions';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('isExecuteInstagramResponse', () => {
  it('returns true for empty object (204 No Content)', () => {
    expect(isExecuteInstagramResponse({})).toBe(true);
  });

  it('returns false for non-object values', () => {
    expect(isExecuteInstagramResponse(null)).toBe(false);
    expect(isExecuteInstagramResponse(undefined)).toBe(false);
    expect(isExecuteInstagramResponse('')).toBe(false);
    expect(isExecuteInstagramResponse([])).toBe(false);
  });

  it('returns false for object with keys', () => {
    expect(isExecuteInstagramResponse({ error: 'bad' })).toBe(false);
  });
});

describe('executeInstagramResponseGuard', () => {
  it('returns true for valid empty response', () => {
    expect(executeInstagramResponseGuard({})).toBe(true);
  });

  it('returns false for invalid payload', () => {
    expect(executeInstagramResponseGuard(null)).toBe(false);
    expect(executeInstagramResponseGuard({ data: 'invalid' })).toBe(false);
  });
});

describe('useExecuteInstagramActions', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      )
    );
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() =>
      useExecuteInstagramActions({ gateIdOrSlug: 'gate-1', enabled: false })
    );
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when gateIdOrSlug is undefined', async () => {
    const { result } = renderHook(() =>
      useExecuteInstagramActions({ gateIdOrSlug: undefined, enabled: true })
    );
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches POST /api/integrations/instagram/execute when enabled', async () => {
    const { result } = renderHook(() =>
      useExecuteInstagramActions({ gateIdOrSlug: 'gate-1', enabled: true })
    );
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/integrations/instagram/execute'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ gateIdOrSlug: 'gate-1' }),
      })
    );
  });

  it('sets error when response fails type guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ error: 'unexpected' }),
        } as Response)
      )
    );
    const { result } = renderHook(() =>
      useExecuteInstagramActions({ gateIdOrSlug: 'gate-1', enabled: true })
    );
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('type guard');
  });
});
