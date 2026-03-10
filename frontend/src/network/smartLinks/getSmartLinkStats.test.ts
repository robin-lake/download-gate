import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useGetSmartLinksStats,
  smartLinksStatsResponseToDashboardCardStats,
  isSmartLinkStatsResponseGuard,
  DEFAULT_SMART_LINKS_STAT_CARDS,
} from './getSmartLinkStats';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('isSmartLinkStatsResponseGuard', () => {
  it('returns true for valid stats response', () => {
    expect(
      isSmartLinkStatsResponseGuard({
        total_visits: 10,
        total_clicks: 3,
      })
    ).toBe(true);
  });

  it('returns false for invalid payload', () => {
    expect(isSmartLinkStatsResponseGuard(null)).toBe(false);
    expect(isSmartLinkStatsResponseGuard({ total_visits: 10 })).toBe(false);
    expect(
      isSmartLinkStatsResponseGuard({
        total_visits: '10',
        total_clicks: 0,
      })
    ).toBe(false);
  });
});

describe('smartLinksStatsResponseToDashboardCardStats', () => {
  it('maps API response to two dashboard stat cards', () => {
    const response = {
      total_visits: 100,
      total_clicks: 25,
    };
    const cards = smartLinksStatsResponseToDashboardCardStats(response);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toEqual({
      title: 'Visits',
      value: 100,
      subtitle: '+0 in last 7 Days',
    });
    expect(cards[1]).toEqual({
      title: 'Clicks',
      value: 25,
      subtitle: '+0 in last 7 Days',
      showInfo: true,
    });
  });

  it('handles zeros', () => {
    const cards = smartLinksStatsResponseToDashboardCardStats({
      total_visits: 0,
      total_clicks: 0,
    });
    expect(cards.every((c) => c.value === 0)).toBe(true);
    expect(cards.map((c) => c.title)).toEqual(['Visits', 'Clicks']);
  });
});

describe('DEFAULT_SMART_LINKS_STAT_CARDS', () => {
  it('has two cards with zero values', () => {
    expect(DEFAULT_SMART_LINKS_STAT_CARDS).toHaveLength(2);
    expect(DEFAULT_SMART_LINKS_STAT_CARDS.map((c) => c.value)).toEqual([0, 0]);
  });
});

describe('useGetSmartLinksStats', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              total_visits: 42,
              total_clicks: 7,
            }),
        } as Response)
      )
    );
  });

  it('fetches GET /api/smart-links/stats and returns dashboard stat cards', async () => {
    const { result } = renderHook(() => useGetSmartLinksStats());
    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current[0].value).toBe(42);
      expect(result.current[1].value).toBe(7);
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/smart-links/stats'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns default zero cards while loading', async () => {
    const { result } = renderHook(() => useGetSmartLinksStats());
    expect(result.current).toEqual(DEFAULT_SMART_LINKS_STAT_CARDS);
    await waitFor(() => {
      expect(result.current[0].value).toBe(42);
    });
  });

  it('returns default zero cards when response fails type guard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              total_visits: 'not-a-number',
              total_clicks: 0,
            }),
        } as Response)
      )
    );
    const { result } = renderHook(() => useGetSmartLinksStats());
    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current[0].value).toBe(0);
      expect(result.current[1].value).toBe(0);
    });
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useGetSmartLinksStats({ enabled: false }));
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current).toEqual(DEFAULT_SMART_LINKS_STAT_CARDS);
    expect(fetch).not.toHaveBeenCalled();
  });
});
