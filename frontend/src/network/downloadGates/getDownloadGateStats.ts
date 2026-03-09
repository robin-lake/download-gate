import { useMemo } from 'react';
import { useRequest, defineTypeGuard } from '../request';
import type { DownloadGateStatsResponse } from './types';
import { isDownloadGateStatsResponse } from './types';
import type { DashboardCardStat } from '@/pages/Dashboard/StatCard';

/** Re-export type guard for use in tests and consumers. */
export const isDownloadGateStatsResponseGuard = defineTypeGuard(
  (data: unknown): data is DownloadGateStatsResponse => isDownloadGateStatsResponse(data)
);

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const DEFAULT_SUBTITLE = '+0 in last 7 Days';

/**
 * Converts the API stats response to the shape expected by dashboard stat cards.
 */
export function downloadGatesStatsResponseToDashboardCardStats(
  response: DownloadGateStatsResponse
): DashboardCardStat[] {
  return [
    {
      title: 'Visits',
      value: response.total_visits,
      subtitle: DEFAULT_SUBTITLE,
    },
    {
      title: 'Downloads',
      value: response.total_downloads,
      subtitle: DEFAULT_SUBTITLE,
    },
    {
      title: 'New Followers',
      value: response.total_emails_captured,
      subtitle: DEFAULT_SUBTITLE,
    },
  ];
}

/** Default stat cards shown while loading or on error (all zeros). */
export const DEFAULT_DOWNLOAD_GATES_STAT_CARDS: DashboardCardStat[] =
  downloadGatesStatsResponseToDashboardCardStats({
    total_visits: 0,
    total_downloads: 0,
    total_emails_captured: 0,
  });

export interface UseGetDownloadGatesStatsParams {
  /** If false, the request is not sent. Default true. */
  enabled?: boolean;
}

/**
 * Fetches GET /api/download-gates/stats and returns dashboard stat cards for the download-gates tab.
 * Uses type guard to validate response. Returns default zero cards while loading or on error.
 */
export function useGetDownloadGatesStats(
  params: UseGetDownloadGatesStatsParams = {}
): DashboardCardStat[] {
  const { enabled = true } = params;
  const url = `${API_BASE}/api/download-gates/stats`;
  const { data, status } = useRequest<DownloadGateStatsResponse>(url, {
    method: 'GET',
    typeGuard: isDownloadGateStatsResponseGuard,
    enabled,
  });

  return useMemo(() => {
    if (data && isDownloadGateStatsResponse(data)) {
      return downloadGatesStatsResponseToDashboardCardStats(data);
    }
    return DEFAULT_DOWNLOAD_GATES_STAT_CARDS;
  }, [data, status]);
}
