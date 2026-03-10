import { useState, useMemo } from 'react';

import type { DownloadGate } from './DownloadGateCard/DownloadGateCard';
import type { SmartLink } from './SmartLinkCard/SmartLinkCard';
import type { DashboardCardStat } from './StatCard';
import { useGetDownloadGates, mapDownloadGateResponseToCard } from '@/network/downloadGates/getDownloadGates';
import { useGetDownloadGatesStats } from '@/network/downloadGates/getDownloadGateStats';
import { useGetSmartLinks } from '@/network/smartLinks/getSmartLinks';
import { useGetSmartLinksStats } from '@/network/smartLinks/getSmartLinkStats';
import type { SmartLinkResponse } from '@/network/smartLinks/types';
type TabId = 'smart-links' | 'download-gates';
export type DashboardStats = Record<'smart-links' | 'download-gates', DashboardCardStat[]> 

const MOCK_STATS:DashboardStats = {
  'smart-links':[
   {
    title: 'Visits',
    value: 0,
    subtitle: '+0 in last 7 Days',
  },
   {
    title: 'Clicks',
    value: 0,
    subtitle: '+0 in last 7 Days',
    showInfo: true,
  },
  ],
  'download-gates': [
  {
    title: 'Visits',
    value: 999,
    subtitle: '+0 in last 7 Days',
  },
  {
    title: 'Downloads',
    value: 999,
    subtitle: '+0 in last 7 Days',
  },
  {
    title: 'New Followers',
    value: 999,
    subtitle: '+0 in last 7 Days',
  },
  ]
};

function mapSmartLinkResponseToSmartLink(link: SmartLinkResponse): SmartLink {
  const totalClicks = link.total_clicks;
  const totalVisits = link.total_visits;
  const engagementPercent =
    totalVisits > 0 ? Math.round((totalClicks / totalVisits) * 100) : 0;
  const platforms = (link.platforms ?? []).map((p) => ({
    name: p.platform_name,
    clicks: p.click_count,
    percent: totalClicks > 0 ? Math.round((p.click_count / totalClicks) * 100) : 0,
  }));

  return {
    id: link.link_id,
    title: link.title,
    subtitle: link.subtitle ?? '',
    engagement: `${engagementPercent}% of fans who visited successfully engaged.`,
    totalVisits,
    clicks: totalClicks,
    emailsCaptured: 0,
    platforms,
    url: link.short_url,
    copyLabel: link.copy_label ?? 'COPY LINK',
    coverImageUrl: link.cover_image_url,
  };
}


export function useGetDashboardState() {
  const [activeTab, setActiveTab] = useState<TabId>('download-gates');
  const { data: downloadGatesData, isLoading: isLoadingDownloadGates, refetch: refetchDownloadGates } = useGetDownloadGates();
  const downloadGates: DownloadGate[] = useMemo(
    () => (downloadGatesData?.items ?? []).map(mapDownloadGateResponseToCard),
    [downloadGatesData]
  );
  const { data: smartLinksData, isLoading: isLoadingSmartLinks, refetch: refetchSmartLinks } = useGetSmartLinks();
  const smartLinks: SmartLink[] = useMemo(
    () => (smartLinksData?.items ?? []).map(mapSmartLinkResponseToSmartLink),
    [smartLinksData]
  );
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(MOCK_STATS);
  const downloadGatesStats = useGetDownloadGatesStats();
  const smartLinksStats = useGetSmartLinksStats();

  return {
    activeTab,
    setActiveTab,
    downloadGates,
    isLoadingDownloadGates,
    refetchDownloadGates,
    smartLinks,
    isLoadingSmartLinks,
    refetchSmartLinks,
    dashboardStats,
    setDashboardStats,
    downloadGatesStats,
    smartLinksStats,
  };
}