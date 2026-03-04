import {useState} from 'react';

import type { DownloadGate } from './DownloadGateCard/DownloadGateCard';
import type { SmartLink } from './SmartLinkCard/SmartLinkCard';
type TabId = 'smart-links' | 'download-gates';

const MOCK_DOWNLOAD_GATES: DownloadGate[] = [
  {
    id: '1',
    title: 'Lilotus',
    subtitle: 'Saxy Sax',
    thumbnailUrl: 'https://picsum.photos/seed/lilotus/80/80',
    visits: 33,
    downloads: 0,
    emailsCaptured: 0,
  },
  {
    id: '2',
    title: 'Lotus Grrl',
    subtitle: 'In My Mind',
    thumbnailUrl: 'https://picsum.photos/seed/lotus/80/80',
    visits: 12,
    downloads: 4,
    emailsCaptured: 2,
  },
  {
    id: '3',
    title: 'New Release',
    subtitle: 'Single - Out Now',
    visits: 8,
    downloads: 1,
    emailsCaptured: 0,
  },
];

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


export function useGetDashboardState(){
  const [activeTab, setActiveTab] = useState<TabId>('download-gates');
  const [downloadGates, setDownloadGates] = useState<DownloadGate[]>(MOCK_DOWNLOAD_GATES);
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>(MOCK_SMART_LINKS);

  return {
    activeTab,
    setActiveTab,
    downloadGates,
    setDownloadGates,
    smartLinks,
    setSmartLinks
  }
}