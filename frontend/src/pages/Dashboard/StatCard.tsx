export default function StatCard({
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