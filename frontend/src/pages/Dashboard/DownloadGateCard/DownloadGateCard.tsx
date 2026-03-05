import './DownloadGateCard.scss';

export interface DownloadGate {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl?: string;
  visits: number;
  downloads: number;
  emailsCaptured: number;
  /** Path to open the gate in a new tab (e.g. /abc123 or /gate-id). */
  publicPath: string;
}

function ActionIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button type="button" className="download-gate-card__action-icon" aria-label={label}>
      {children}
    </button>
  );
}

interface DownloadGateCardProps {
  downloadGate: DownloadGate;
}

export default function DownloadGateCard({ downloadGate }: DownloadGateCardProps) {
  const { title, subtitle, thumbnailUrl, visits, downloads, emailsCaptured } = downloadGate;

  return (
    <div className="download-gate-card">
      <div className="download-gate-card__media">
        <div className="download-gate-card__thumb">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="download-gate-card__thumb-img" />
          ) : (
            <div className="download-gate-card__thumb-placeholder">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
        <div className="download-gate-card__actions">
          <ActionIcon label="Status">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </ActionIcon>
          <a
            href={downloadGate.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="download-gate-card__action-icon"
            aria-label="Open external link"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <ActionIcon label="Edit">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </ActionIcon>
          <ActionIcon label="Analytics">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </ActionIcon>
          <ActionIcon label="Document">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </ActionIcon>
          <ActionIcon label="Folder">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </ActionIcon>
        </div>
      </div>

      <div className="download-gate-card__body">
        <h3 className="download-gate-card__title">{title}</h3>
        <p className="download-gate-card__subtitle">{subtitle}</p>
        <div className="download-gate-card__metrics">
          <span>Visits: <strong>{visits}</strong></span>
          <span>Downloads: <strong>{downloads}</strong></span>
          <span>Emails captured: <strong>{emailsCaptured}</strong></span>
        </div>
      </div>

    </div>
  );
}
