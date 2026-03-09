import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGetSmartLink, isSmartLinkResponseGuard } from './getSmartLink';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('isSmartLinkResponseGuard', () => {
  it('returns true for valid smart link response', () => {
    expect(
      isSmartLinkResponseGuard({
        user_id: 'u1',
        link_id: 'l1',
        title: 'T',
        short_url: 'x',
        total_visits: 0,
        total_clicks: 0,
      })
    ).toBe(true);
  });

  it('returns false for invalid payload', () => {
    expect(isSmartLinkResponseGuard(null)).toBe(false);
    expect(isSmartLinkResponseGuard({ link_id: 'l1' })).toBe(false);
  });
});

describe('useGetSmartLink', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user_id: 'user-1',
              link_id: 'link-123',
              title: 'My Link',
              short_url: 'xyz',
              total_visits: 10,
              total_clicks: 5,
            }),
        } as Response)
      )
    );
  });

  it('fetches GET /api/smart-links/:linkId when linkId is set and enabled', async () => {
    const { result } = renderHook(() =>
      useGetSmartLink({ linkId: 'link-123' })
    );
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.link_id).toBe('link-123');
    expect(result.current.data?.title).toBe('My Link');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/smart-links\/link-123$/),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('does not fetch when linkId is undefined', async () => {
    const { result } = renderHook(() => useGetSmartLink({ linkId: undefined }));
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when linkId is empty string', async () => {
    const { result } = renderHook(() => useGetSmartLink({ linkId: '' }));
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() =>
      useGetSmartLink({ linkId: 'link-123', enabled: false })
    );
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sets error when response fails type guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'shape' }),
        } as Response)
      )
    );
    const { result } = renderHook(() =>
      useGetSmartLink({ linkId: 'link-123' })
    );
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('type guard');
  });
});
