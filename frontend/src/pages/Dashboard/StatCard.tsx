export interface DashboardCardStat {
  title: string;
  value: number;
  subtitle?: string;
  showInfo?: boolean;
}

export interface DashboardCardStats {}

export default function StatCard(props: DashboardCardStat) {
  const { title, value, subtitle, showInfo } = props;
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-violet-200/80 bg-white p-5 shadow-md shadow-zinc-900/5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</span>
        {showInfo && (
          <button
            type="button"
            className="rounded p-1 text-zinc-400 transition hover:text-violet-600"
            aria-label="Info"
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      <p className="font-display mt-1 text-2xl font-bold text-zinc-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}
