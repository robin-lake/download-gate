import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';
import SmartLinkCard from './SmartLinkCard/SmartLinkCard';
import DownloadGateCard from './DownloadGateCard/DownloadGateCard';
import StatCard from './StatCard';
import { useGetDashboardState } from './dashboardState';

const newItemLinkClass =
  'inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500';

const PlusIcon = () => (
  <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

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
    <div className="w-full pb-12 pt-8 text-zinc-800">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-8 text-center md:text-left">
          <p className="font-display mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            Your workspace
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            Dashboard
          </h1>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {activeTab === 'smart-links' &&
            smartLinksStats.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                showInfo={card.showInfo}
              />
            ))}
          {activeTab === 'download-gates' &&
            downloadGatesStats.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                showInfo={card.showInfo}
              />
            ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-md shadow-zinc-900/5">
          <div className="flex border-b border-zinc-200 bg-zinc-50/80">
            <button
              type="button"
              onClick={() => setActiveTab('download-gates')}
              className={cn(
                '-mb-px cursor-pointer border-b-2 border-transparent px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'download-gates'
                  ? 'border-cyan-500 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              Download Gates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('smart-links')}
              className={cn(
                '-mb-px cursor-pointer border-b-2 border-transparent px-6 py-4 text-sm font-medium transition-colors',
                activeTab === 'smart-links'
                  ? 'border-cyan-500 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              Smart Links
            </button>
          </div>

          <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
              {activeTab === 'smart-links' && (
                <Link to="/new-smart-link" className={newItemLinkClass}>
                  <PlusIcon />
                  New Smart Link
                </Link>
              )}
              {activeTab === 'download-gates' && (
                <Link to="/new-download-gate" className={newItemLinkClass}>
                  <PlusIcon />
                  New Download Gate
                </Link>
              )}
            </div>

            {activeTab === 'smart-links' ? (
              isLoadingSmartLinks ? (
                <div className="flex flex-col items-center gap-4 px-4 py-12 text-zinc-500">
                  <div
                    className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-cyan-500"
                    aria-hidden
                  />
                  <p className="text-sm">Loading smart links…</p>
                </div>
              ) : smartLinks.length ? (
                <div className="flex flex-col gap-3">
                  {smartLinks.map((entry) => (
                    <SmartLinkCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-zinc-500 [&_p]:text-sm [&_p+p]:mt-1 [&_p+p]:text-xs">
                  <p>No smart links yet.</p>
                  <p>Create one with the button above.</p>
                </div>
              )
            ) : null}
            {activeTab === 'download-gates' ? (
              isLoadingDownloadGates ? (
                <div className="flex flex-col items-center gap-4 px-4 py-12 text-zinc-500">
                  <div
                    className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-cyan-500"
                    aria-hidden
                  />
                  <p className="text-sm">Loading download gates…</p>
                </div>
              ) : downloadGates.length ? (
                <div className="flex flex-col gap-3">
                  {downloadGates.map((gate) => (
                    <DownloadGateCard
                      key={gate.id}
                      downloadGate={gate}
                      onDeleted={refetchDownloadGates}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 py-12 text-center text-zinc-500 [&_p]:text-sm [&_p+p]:mt-1 [&_p+p]:text-xs">
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
