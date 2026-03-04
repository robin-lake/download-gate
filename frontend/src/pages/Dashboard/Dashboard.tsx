import { useState } from 'react';
import {Link } from 'react-router-dom';

import './Dashboard.scss';
// import SmartLinkCard from './SmartLinkCard/SmartLinkCard';
import DownloadGateCard from './DownloadGateCard/DownloadGateCard';
import type { DownloadGate } from './DownloadGateCard/DownloadGateCard';

// type TabId = 'smart-links' | 'download-gates';
type TabId = 'smart-links' | 'download-gates';

const MOCK_STATS = {
  visits: { value: '10,402', change: '+0 in last 7 Days' },
  clicks: { value: '3,344', change: '+0 in last 7 Days' },
  lifetimeFans: { value: '0', locked: true },
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

function StatCard({
  title,
  value,
  subtitle,
  locked,
  showInfo,
}: {
  title: string;
  value: string;
  subtitle?: string;
  locked?: boolean;
  showInfo?: boolean;
}) {
  return (
    <div className="dashboard__stat-card">
      <div className="dashboard__stat-header">
        <span className="dashboard__stat-title">{title}</span>
        {showInfo && (
          <button type="button" className="dashboard__stat-info-btn" aria-label="Info">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <p className="dashboard__stat-value">{value}</p>
      {locked ? (
        <div className="dashboard__stat-locked">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm2-2a2 2 0 014 0v2H7V7z" clipRule="evenodd" />
          </svg>
          <span>Unlock To Grow</span>
        </div>
      ) : (
        subtitle && <p className="dashboard__stat-subtitle">{subtitle}</p>
      )}
    </div>
  );
}





export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('download-gates');
  const [downloadGates, setDownloadGates] = useState<DownloadGate[]>(MOCK_DOWNLOAD_GATES);

  return (
    <div className="dashboard">
      <div className="dashboard__inner">
        <h1 className="dashboard__title">Dashboard</h1>

        <div className="dashboard__stats">
          <StatCard
            title="Visits"
            value={MOCK_STATS.visits.value}
            subtitle={MOCK_STATS.visits.change}
          />
          <StatCard
            title="Clicks"
            value={MOCK_STATS.clicks.value}
            subtitle={MOCK_STATS.clicks.change}
          />
          <StatCard
            title="Lifetime Fans"
            value={MOCK_STATS.lifetimeFans.value}
            locked={MOCK_STATS.lifetimeFans.locked}
            showInfo
          />
        </div>

        <div className="dashboard__panel">
          <div className="dashboard__tabs">
            {/* <button
              type="button"
              onClick={() => setActiveTab('smart-links')}
              className={`dashboard__tab ${activeTab === 'smart-links' ? 'dashboard__tab--active' : ''}`}
            >
              Smart Links
            </button> */}
            <button
              type="button"
              onClick={() => setActiveTab('download-gates')}
              className={`dashboard__tab ${activeTab === 'download-gates' ? 'dashboard__tab--active' : ''}`}
            >
              Download Gates
            </button>
          </div>

          <div className="dashboard__content">
            <div className="dashboard__action-bar">
              <div className="dashboard__sort-wrap">
                <span className="dashboard__sort-label">Sort:</span>
                <button type="button" className="dashboard__sort-btn">
                  Newest
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>
              {activeTab === 'smart-links' && (
                <button type="button" className="dashboard__new-btn">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Smart Link
                </button>
              )}
              {activeTab === 'download-gates' && (
                <button type="button" className="dashboard__new-btn">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <Link to="/new-download-gate">
                    New Download Gate
                  </Link>
                </button>
              )}
            </div>
{/* 
            {activeTab === 'smart-links' && (
              <div className="dashboard__list">
                {MOCK_SMART_LINKS.map((entry) => (
                  // <SmartLinkEntry key={entry.id} entry={entry} />
                  <SmartLinkCard key={entry.id} entry={entry} />
                ))}
              </div>
            )} */}
            {activeTab === 'download-gates' && downloadGates.length ? (
              <div className="download-gates">
                {downloadGates.map((gate) => (
                  <DownloadGateCard key={gate.id} downloadGate={gate} />
                ))}
              </div>
            ) : (
              <div className="dashboard__empty">
                <p>No download gates yet.</p>
                <p>Create one with the button above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
