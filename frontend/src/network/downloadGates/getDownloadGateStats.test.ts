import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useGetDownloadGatesStats,
  downloadGatesStatsResponseToDashboardCardStats,
  isDownloadGateStatsResponseGuard,
  DEFAULT_DOWNLOAD_GATES_STAT_CARDS,
} from './getDownloadGateStats';

const mockGetToken = vi.fn(() => Promise.resolve('mock-token'));
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

describe('isDownloadGateStatsResponseGuard', () => {
  it('returns true for valid stats response', () => {
    expect(
      isDownloadGateStatsResponseGuard({
        total_visits: 10,
        total_downloads: 3,
        total_emails_captured: 2,
      })
    ).toBe(true);
  });

  it('returns false for invalid payload', () => {
    expect(isDownloadGateStatsResponseGuard(null)).toBe(false);
    expect(isDownloadGateStatsResponseGuard({ total_visits: 10 })).toBe(false);
    expect(isDownloadGateStatsResponseGuard({ total_visits: '10', total_downloads: 0, total_emails_captured: 0 })).toBe(false);
  });
});

describe('downloadGatesStatsResponseToDashboardCardStats', () => {
  it('maps API response to three dashboard stat cards', () => {
    const response = {
      total_visits: 100,
      total_downloads: 25,
      total_emails_captured: 10,
    };
    const cards = downloadGatesStatsResponseToDashboardCardStats(response);
    expect(cards).toHaveLength(3);
    expect(cards[0]).toEqual({
      title: 'Visits',
      value: 100,
      subtitle: '+0 in last 7 Days',
    });
    expect(cards[1]).toEqual({
      title: 'Downloads',
      value: 25,
      subtitle: '+0 in last 7 Days',
    });
    expect(cards[2]).toEqual({
      title: 'New Followers',
      value: 10,
      subtitle: '+0 in last 7 Days',
    });
  });

  it('handles zeros', () => {
    const cards = downloadGatesStatsResponseToDashboardCardStats({
      total_visits: 0,
      total_downloads: 0,
      total_emails_captured: 0,
    });
    expect(cards.every((c) => c.value === 0)).toBe(true);
    expect(cards.map((c) => c.title)).toEqual(['Visits', 'Downloads', 'New Followers']);
  });
});

describe('DEFAULT_DOWNLOAD_GATES_STAT_CARDS', () => {
  it('has three cards with zero values', () => {
    expect(DEFAULT_DOWNLOAD_GATES_STAT_CARDS).toHaveLength(3);
    expect(DEFAULT_DOWNLOAD_GATES_STAT_CARDS.map((c) => c.value)).toEqual([0, 0, 0]);
  });
});

describe('useGetDownloadGatesStats', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              total_visits: 42,
              total_downloads: 7,
              total_emails_captured: 3,
            }),
        } as Response)
      )
    );
  });

  it('fetches GET /api/download-gates/stats and returns dashboard stat cards', async () => {
    const { result } = renderHook(() => useGetDownloadGatesStats());
    await waitFor(() => {
      expect(result.current).toHaveLength(3);
      expect(result.current[0].value).toBe(42);
      expect(result.current[1].value).toBe(7);
      expect(result.current[2].value).toBe(3);
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/download-gates/stats'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns default zero cards while loading', async () => {
    const { result } = renderHook(() => useGetDownloadGatesStats());
    expect(result.current).toEqual(DEFAULT_DOWNLOAD_GATES_STAT_CARDS);
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
          json: () => Promise.resolve({ total_visits: 'not-a-number', total_downloads: 0, total_emails_captured: 0 }),
        } as Response)
      )
    );
    const { result } = renderHook(() => useGetDownloadGatesStats());
    await waitFor(() => {
      expect(result.current).toHaveLength(3);
      expect(result.current[0].value).toBe(0);
      expect(result.current[1].value).toBe(0);
      expect(result.current[2].value).toBe(0);
    });
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useGetDownloadGatesStats({ enabled: false }));
    await waitFor(() => {}, { timeout: 100 });
    expect(result.current).toEqual(DEFAULT_DOWNLOAD_GATES_STAT_CARDS);
    expect(fetch).not.toHaveBeenCalled();
  });
});
