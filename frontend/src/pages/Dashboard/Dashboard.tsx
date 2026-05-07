import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';
import SmartLinkCard from './SmartLinkCard/SmartLinkCard';
import DownloadGateCard from './DownloadGateCard/DownloadGateCard';
import StatCard from './StatCard';
import { useGetDashboardState } from './dashboardState';


export default function Dashboard() {
  const location = useLocation();
  const {
    activeTab,
    setActiveTab,
    downloadGates,
    smartLinks,
    downloadGatesStats,
    smartLinksStats,
    refetchDownloadGates,
    isLoadingDownloadGates,
    isLoadingSmartLinks,
  } = useGetDashboardState();

  useEffect(() => {
    const state = location.state as { activeTab?: 'smart-links' | 'download-gates' } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state, setActiveTab]);

  return (
    <div className="my-8 min-h-screen w-[min(800px,95vw)] bg-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 text-center text-2xl font-bold uppercase tracking-wider text-gray-800">
          Dashboard
        </h1>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {activeTab === "smart-links" && (
            <>
              {smartLinksStats.map((card, index) => (
                <StatCard
                  key={index}
                  title={card.title}
                  value={card.value}
                  // subtitle={card.subtitle}
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
                  // subtitle={card.subtitle}
                  showInfo={card.showInfo}
                />
              ))}
            </>
          )}

        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('download-gates')}
              className={cn(
                '-mb-px cursor-pointer border-b-2 border-transparent bg-white px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'download-gates'
                  ? 'border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Download Gates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('smart-links')}
              className={cn(
                '-mb-px cursor-pointer border-b-2 border-transparent bg-white px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'smart-links'
                  ? 'border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Smart Links
            </button>
          </div>

          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">

               <div />
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
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white bg-green-600 hover:bg-green-700"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <Link className="text-inherit no-underline hover:text-inherit" to="/new-smart-link">
                    New Smart Link
                  </Link>
                </button>
              )}
              {activeTab === 'download-gates' && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 rounded px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white bg-green-600 hover:bg-green-700"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <Link className="text-inherit no-underline hover:text-inherit" to="/new-download-gate">
                    New Download Gate
                  </Link>
                </button>
              )}
            </div>

            {activeTab === 'smart-links' ? (
              isLoadingSmartLinks ? (
                <div className="flex flex-col items-center gap-4 px-4 py-12 text-gray-500">
                  <div
                    className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-600"
                    aria-hidden
                  />
                  <p className="text-sm">Loading smart links…</p>
                </div>
              ) : smartLinks.length ? (
                <div className="flex flex-col gap-4">
                  {smartLinks.map((entry) => (
                    <SmartLinkCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-gray-500 [&_p]:text-sm [&_p+p]:mt-1 [&_p+p]:text-xs">
                  <p>No smart links yet.</p>
                  <p>Create one with the button above.</p>
                </div>
              )
            ) : null}
            {activeTab === 'download-gates' ? (
              isLoadingDownloadGates ? (
                <div className="flex flex-col items-center gap-4 px-4 py-12 text-gray-500">
                  <div
                    className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-600"
                    aria-hidden
                  />
                  <p className="text-sm">Loading download gates…</p>
                </div>
              ) : downloadGates.length ? (
                <div className="flex flex-col">
                  {downloadGates.map((gate) => (
                    <DownloadGateCard
                      key={gate.id}
                      downloadGate={gate}
                      onDeleted={refetchDownloadGates}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-gray-500 [&_p]:text-sm [&_p+p]:mt-1 [&_p+p]:text-xs">
                  <p>No download gates yet.</p>
                  <p>Create one with the button above.</p>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
