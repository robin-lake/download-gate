import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRequest, defineTypeGuard } from './request.js';

const mockGetToken = vi.fn(() => Promise.resolve(null));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('defineTypeGuard', () => {
  it('returns a function that narrows type when guard returns true', () => {
    const isString = defineTypeGuard((x: unknown): x is string => typeof x === 'string');
    expect(isString('hello')).toBe(true);
    expect(isString(42)).toBe(false);
  });
});

describe('useRequest', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'ok' }),
        } as Response)
      )
    );
  });

  it('stays idle when url is null', async () => {
    const { result } = renderHook(() => useRequest(null));
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBe(null);
    await waitFor(() => {}, { timeout: 50 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() =>
      useRequest('https://api.example.com', { enabled: false })
    );
    expect(result.current.status).toBe('idle');
    await waitFor(() => {}, { timeout: 50 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches when url is set and enabled is true', async () => {
    const { result } = renderHook(() => useRequest('https://api.example.com'));
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.data).toEqual({ data: 'ok' });
    expect(fetch).toHaveBeenCalledWith('https://api.example.com', expect.any(Object));
  });
});
