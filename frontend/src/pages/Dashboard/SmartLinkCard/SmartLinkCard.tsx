import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
const actionIconClass =
  "rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 [&_svg]:block [&_svg]:size-4";

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
    className: actionIconClass,
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
    <div className="flex flex-col gap-4 border-b border-gray-200 bg-white p-4 sm:flex-row sm:items-start">
      <div className="flex flex-col items-start gap-2 shrink-0">
        <div className="size-20 overflow-hidden rounded-md bg-gray-200">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <svg className="size-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex gap-px">
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

      <div className="min-w-0 flex-1">
        <h3 className="m-0 cursor-pointer text-base font-semibold text-gray-900 hover:text-green-600">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 [&_strong]:font-semibold [&_strong]:text-gray-900">
          <span>Total Visits: <strong>{totalVisits}</strong></span>
          <span>Clicks: <strong>{clicks}</strong></span>
          <span>Emails captured: <strong>{emailsCaptured}</strong></span>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-link-confirm-title"
        >
          <div
            className="w-full max-w-[400px] rounded-lg bg-white p-5 shadow-[0_24px_48px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-link-confirm-title" className="m-0 mb-2 text-lg font-semibold text-gray-900">
              Delete smart link?
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-gray-500">
              &ldquo;{title}&rdquo; will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
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
