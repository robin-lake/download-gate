import {Link } from 'react-router-dom';

import './Dashboard.scss';
import SmartLinkCard from './SmartLinkCard/SmartLinkCard';
import DownloadGateCard from './DownloadGateCard/DownloadGateCard';
import StatCard from './StatCard';
import { useGetDashboardState } from './dashboardState';


export default function Dashboard() {
  const {
    activeTab,
    setActiveTab,
    downloadGates,
    smartLinks,
    dashboardStats,
    downloadGatesStats,
    refetchDownloadGates,
  } = useGetDashboardState();

  return (
    <div className="dashboard">
      <div className="dashboard__inner">
        <h1 className="dashboard__title">Dashboard</h1>

        <div className="dashboard__stats">
          {activeTab === "smart-links" && (
            <>
              {dashboardStats['smart-links'].map((card, index) => (
                <StatCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  showInfo={card.showInfo}
                />
              ))}
            </>
          )}
          {activeTab === "download-gates" && (
            <>
              {downloadGatesStats.map((card, index) => (
                <StatCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  showInfo={card.showInfo}
                />
              ))}
            </>
          )}

        </div>

        <div className="dashboard__panel">
          <div className="dashboard__tabs">
            <button
              type="button"
              onClick={() => setActiveTab('download-gates')}
              className={`dashboard__tab ${activeTab === 'download-gates' ? 'dashboard__tab--active' : ''}`}
            >
              Download Gates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('smart-links')}
              className={`dashboard__tab ${activeTab === 'smart-links' ? 'dashboard__tab--active' : ''}`}
            >
              Smart Links
            </button>
          </div>

          <div className="dashboard__content">
            <div className="dashboard__action-bar">

               <div className="dashboard__sort-wrap">
               </div>
              {/* <div className="dashboard__sort-wrap">
                <span className="dashboard__sort-label">Sort:</span>
                <button type="button" className="dashboard__sort-btn">
                  Newest
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div> */}
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

            {activeTab === 'smart-links' && (
              <div className="dashboard__list">
                {smartLinks.map((entry) => (
                  <SmartLinkCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
            {activeTab === 'download-gates' && downloadGates.length ? (
              <div className="download-gates">
                {downloadGates.map((gate) => (
                  <DownloadGateCard
                    key={gate.id}
                    downloadGate={gate}
                    onDeleted={refetchDownloadGates}
                  />
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
