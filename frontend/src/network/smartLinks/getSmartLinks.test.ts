import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useGetSmartLinks,
  mapSmartLinkResponseToCard,
  isListSmartLinksResponseGuard,
} from './getSmartLinks';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('isListSmartLinksResponseGuard', () => {
  it('returns true for valid list response', () => {
    expect(
      isListSmartLinksResponseGuard({
        items: [
          {
            user_id: 'u1',
            link_id: 'l1',
            title: 'T',
            short_url: 'x',
            total_visits: 0,
            total_clicks: 0,
          },
        ],
        nextToken: null,
      })
    ).toBe(true);
  });

  it('returns false for invalid payload', () => {
    expect(isListSmartLinksResponseGuard(null)).toBe(false);
    expect(
      isListSmartLinksResponseGuard({ items: 'not-array', nextToken: null })
    ).toBe(false);
  });
});

describe('mapSmartLinkResponseToCard', () => {
  it('maps API response to dashboard card shape', () => {
    const apiLink = {
      user_id: 'user-1',
      link_id: 'link-abc',
      title: 'My Link',
      subtitle: 'Sub',
      cover_image_url: 'https://example.com/cover.jpg',
      short_url: 'xyz',
      total_visits: 10,
      total_clicks: 3,
      copy_label: 'Copy',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    };
    const card = mapSmartLinkResponseToCard(apiLink);
    expect(card).toEqual({
      id: 'link-abc',
      title: 'My Link',
      subtitle: 'Sub',
      coverImageUrl: 'https://example.com/cover.jpg',
      shortUrl: 'xyz',
      totalVisits: 10,
      totalClicks: 3,
      copyLabel: 'Copy',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      platforms: [],
    });
  });
});

describe('useGetSmartLinks', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  user_id: 'user-1',
                  link_id: 'link-1',
                  title: 'Link One',
                  short_url: 'abc',
                  total_visits: 0,
                  total_clicks: 0,
                },
              ],
              nextToken: null,
            }),
        } as Response)
      )
    );
  });

  it('fetches GET /api/smart-links when enabled', async () => {
    const { result } = renderHook(() => useGetSmartLinks());
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].link_id).toBe('link-1');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/smart-links'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useGetSmartLinks({ enabled: false }));
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current.status).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('appends limit and cursor to URL when provided', async () => {
    renderHook(() => useGetSmartLinks({ limit: 20, cursor: 'cursor-xyz' }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('limit=20');
    expect(callUrl).toContain('cursor=cursor-xyz');
  });

  it('sets error when response fails type guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: 'invalid', nextToken: null }),
        } as Response)
      )
    );
    const { result } = renderHook(() => useGetSmartLinks());
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('type guard');
  });
});
