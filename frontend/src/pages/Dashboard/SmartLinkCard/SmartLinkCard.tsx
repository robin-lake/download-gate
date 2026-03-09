function ActionIcon({ label }: { label: string }) {
  return (
    <button type="button" className="dashboard-entry__action-icon" aria-label={label}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>
  );
}
export interface SmartLink {
  id: string;
  title: string;
  subtitle: string;
  engagement: string;
  totalVisits: number;
  clicks: number;
  emailsCaptured: number;
  platforms: { name: string; clicks: number; percent: number }[];
  url: string;
  copyLabel: string;
}

interface SmartLinkCardProps {
  entry: SmartLink;
}

export default function SmartLinkCard({ entry }: SmartLinkCardProps) {
  return (
    <div className="dashboard-entry">
      <div className="dashboard-entry__media">
        <div className="dashboard-entry__thumb">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <div className="dashboard-entry__actions">
          <ActionIcon label="External link" />
          <ActionIcon label="Edit" />
          <ActionIcon label="Stats" />
          <ActionIcon label="Folder" />
          <ActionIcon label="Document" />
        </div>
      </div>

      <div className="dashboard-entry__body">
        <h3 className="dashboard-entry__title">{entry.title}</h3>
        <p className="dashboard-entry__subtitle">{entry.subtitle}</p>
        <p className="dashboard-entry__engagement">{entry.engagement}</p>
        <div className="dashboard-entry__metrics">
          <span>Total Visits: {entry.totalVisits}</span>
          <span>Clicks: {entry.clicks}</span>
          <span>Emails captured: {entry.emailsCaptured}</span>
        </div>
        <div className="dashboard-entry__platforms">
          {entry.platforms.map((p) => (
            <div key={p.name}>
              {p.name}: {p.clicks} clicks ({p.percent}%)
            </div>
          ))}
          <button type="button" className="dashboard-entry__show-more">
            Show more
          </button>
        </div>
      </div>

      <div className="dashboard-entry__aside">
        <span className="dashboard-entry__url">{entry.url}</span>
        <button type="button" className="dashboard-entry__copy-btn">
          {entry.copyLabel}
        </button>
      </div>
    </div>
  );
}