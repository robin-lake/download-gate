import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import './SmartLinkCard.scss';

function ActionIcon({
  label,
  children,
  onClick,
  href,
  to,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  to?: string;
}) {
  const commonProps = {
    className: 'smart-link-card__action-icon',
    'aria-label': label,
    title: label,
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...commonProps}>
        {children}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} {...commonProps}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" {...commonProps} onClick={onClick}>
      {children}
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
  coverImageUrl?: string;
}

interface SmartLinkCardProps {
  entry: SmartLink;
}

export default function SmartLinkCard({ entry }: SmartLinkCardProps) {
  const { title, subtitle, coverImageUrl, totalVisits, clicks, emailsCaptured, url } = entry;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleConfirmDelete = () => {
    // TODO: Wire to delete smart link API when available
    setShowDeleteConfirm(false);
  };

  return (
    <div className="smart-link-card">
      <div className="smart-link-card__media">
        <div className="smart-link-card__thumb">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="" className="smart-link-card__thumb-img" />
          ) : (
            <div className="smart-link-card__thumb-placeholder">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
        <div className="smart-link-card__actions">
          <ActionIcon label="Open link" href={`/link/${url}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </ActionIcon>
          {/* <ActionIcon label="Edit link" to={`/edit-smart-link/${entry.id}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </ActionIcon> */}
          <ActionIcon label="Delete link" onClick={() => setShowDeleteConfirm(true)}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </ActionIcon>
        </div>
      </div>

      <div className="smart-link-card__body">
        <h3 className="smart-link-card__title">{title}</h3>
        <p className="smart-link-card__subtitle">{subtitle}</p>
        <div className="smart-link-card__metrics">
          <span>Total Visits: <strong>{totalVisits}</strong></span>
          <span>Clicks: <strong>{clicks}</strong></span>
          <span>Emails captured: <strong>{emailsCaptured}</strong></span>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="smart-link-card__confirm-backdrop"
          onClick={() => setShowDeleteConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-link-confirm-title"
        >
          <div
            className="smart-link-card__confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-link-confirm-title" className="smart-link-card__confirm-title">
              Delete smart link?
            </h2>
            <p className="smart-link-card__confirm-message">
              &ldquo;{title}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
            <div className="smart-link-card__confirm-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
