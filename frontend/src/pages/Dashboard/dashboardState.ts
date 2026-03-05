import { useState, useMemo } from 'react';

import type { DownloadGate } from './DownloadGateCard/DownloadGateCard';
import type { SmartLink } from './SmartLinkCard/SmartLinkCard';
import type { DashboardCardStat } from './StatCard';
import { useGetDownloadGates, mapDownloadGateResponseToCard } from '@/network/downloadGates/getDownloadGates';
type TabId = 'smart-links' | 'download-gates';
export type DashboardStats = Record<'smart-links' | 'download-gates', DashboardCardStat[]> 

const MOCK_STATS:DashboardStats = {
  'smart-links':[
   {
    title: 'Visits',
    value: 10402,
    subtitle: '+0 in last 7 Days',
  },
   {
    title: 'Clicks',
    value: 3000,
    subtitle: '+0 in last 7 Days',
    showInfo: true,
  },
   {
    title: 'Fans',
    value: 10,
    subtitle: '+0 in last 7 Days',
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

const MOCK_SMART_LINKS = [
  {
    id: '1',
    title: 'Artist Profile: Lilotus',
    subtitle: 'Breaks And Warmth',
    engagement: '50% of fans who visited your artist profile successfully engaged with your music.',
    totalVisits: 12,
    clicks: 6,
    emailsCaptured: 3,
    platforms: [
      { name: 'Spotify', clicks: 1, percent: 100 },
      { name: 'Apple Music', clicks: 0, percent: 0 },
      { name: 'Deezer', clicks: 0, percent: 0 },
    ],
    url: 'hypeddit.com/xgbmuf',
    copyLabel: 'COPY ARTIST LINK',
  },
  {
    id: '2',
    title: 'Lotus Grrl',
    subtitle: 'In My Mind',
    engagement: '50% of fans who visited your artist profile successfully engaged with your music.',
    totalVisits: 8,
    clicks: 4,
    emailsCaptured: 2,
    platforms: [
      { name: 'Spotify', clicks: 2, percent: 50 },
      { name: 'Apple Music', clicks: 2, percent: 50 },
      { name: 'Deezer', clicks: 0, percent: 0 },
    ],
    url: 'hypeddit.com/abc123',
    copyLabel: 'COPY LINK',
  },
  {
    id: '3',
    title: 'Smart Link: New Release',
    subtitle: 'Single - Out Now',
    engagement: '35% of fans who visited successfully engaged.',
    totalVisits: 24,
    clicks: 8,
    emailsCaptured: 5,
    platforms: [
      { name: 'Spotify', clicks: 5, percent: 62 },
      { name: 'Apple Music', clicks: 2, percent: 25 },
      { name: 'Bandcamp', clicks: 1, percent: 13 },
    ],
    url: 'hypeddit.com/xyz789',
    copyLabel: 'COPY LINK',
  },
];


export function useGetDashboardState() {
  const [activeTab, setActiveTab] = useState<TabId>('download-gates');
  const { data: downloadGatesData, refetch: refetchDownloadGates } = useGetDownloadGates();
  const downloadGates: DownloadGate[] = useMemo(
    () => (downloadGatesData?.items ?? []).map(mapDownloadGateResponseToCard),
    [downloadGatesData]
  );
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>(MOCK_SMART_LINKS);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(MOCK_STATS);

  return {
    activeTab,
    setActiveTab,
    downloadGates,
    refetchDownloadGates,
    smartLinks,
    setSmartLinks,
    dashboardStats,
    setDashboardStats,
  };
}