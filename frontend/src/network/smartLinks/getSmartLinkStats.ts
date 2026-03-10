import { useMemo } from 'react';
import { useRequest, defineTypeGuard } from '../request';
import type { SmartLinkStatsResponse } from './types';
import { isSmartLinkStatsResponse } from './types';
import type { DashboardCardStat } from '@/pages/Dashboard/StatCard';

/** Re-export type guard for use in tests and consumers. */
export const isSmartLinkStatsResponseGuard = defineTypeGuard(
  (data: unknown): data is SmartLinkStatsResponse => isSmartLinkStatsResponse(data)
);

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const DEFAULT_SUBTITLE = '+0 in last 7 Days';

/**
 * Converts the API stats response to the shape expected by dashboard stat cards.
 */
export function smartLinksStatsResponseToDashboardCardStats(
  response: SmartLinkStatsResponse
): DashboardCardStat[] {
  return [
    {
      title: 'Visits',
      value: response.total_visits,
      subtitle: DEFAULT_SUBTITLE,
    },
    {
      title: 'Clicks',
      value: response.total_clicks,
      subtitle: DEFAULT_SUBTITLE,
      showInfo: true,
    },
  ];
}

/** Default stat cards shown while loading or on error (all zeros). */
export const DEFAULT_SMART_LINKS_STAT_CARDS: DashboardCardStat[] =
  smartLinksStatsResponseToDashboardCardStats({
    total_visits: 0,
    total_clicks: 0,
  });

export interface UseGetSmartLinksStatsParams {
  /** If false, the request is not sent. Default true. */
  enabled?: boolean;
}

/**
 * Fetches GET /api/smart-links/stats and returns dashboard stat cards for the smart-links tab.
 * Uses type guard to validate response. Returns default zero cards while loading or on error.
 */
export function useGetSmartLinksStats(
  params: UseGetSmartLinksStatsParams = {}
): DashboardCardStat[] {
  const { enabled = true } = params;
  const url = `${API_BASE}/api/smart-links/stats`;
  const { data, status } = useRequest<SmartLinkStatsResponse>(url, {
    method: 'GET',
    typeGuard: isSmartLinkStatsResponseGuard,
    enabled,
  });

  return useMemo(() => {
    if (data && isSmartLinkStatsResponse(data)) {
      return smartLinksStatsResponseToDashboardCardStats(data);
    }
    return DEFAULT_SMART_LINKS_STAT_CARDS;
  }, [data, status]);
}
