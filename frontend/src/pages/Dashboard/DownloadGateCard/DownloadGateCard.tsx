import { useEffect, useState } from 'react';
import { useDeleteDownloadGate } from '@/network/downloadGates/deleteDownloadGate';
import { Button } from '@/components/ui/button';
const actionIconClass =
  "rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 [&_svg]:block [&_svg]:size-4";

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

function ActionIcon({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={actionIconClass}
      aria-label={label}
      onClick={onClick}
      title={label}
    >
      {children}
    </button>
  );
}

interface DownloadGateCardProps {
  downloadGate: DownloadGate;
  /** Called after the gate is successfully deleted (e.g. to refetch the list). */
  onDeleted?: () => void;
}

export default function DownloadGateCard({ downloadGate, onDeleted }: DownloadGateCardProps) {
  const { title, subtitle, thumbnailUrl, visits, downloads, emailsCaptured } = downloadGate;
  const { deleteGate, status } = useDeleteDownloadGate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setShowDeleteConfirm(false);
      onDeleted?.();
    }
  }, [status, onDeleted]);

  const handleConfirmDelete = () => {
    deleteGate(downloadGate.id);
  };

  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 py-4 last:border-b-0 sm:flex-row sm:items-start">
      <div className="flex flex-col items-start gap-2 shrink-0">
        <div className="size-20 overflow-hidden rounded-md bg-gray-200">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <svg className="size-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex gap-px">
          <a
            href={downloadGate.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className={actionIconClass}
            aria-label="Open external link"
            title="visit"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          {/* <ActionIcon label="Edit">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </ActionIcon> */}
          {/* <ActionIcon label="Analytics">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </ActionIcon> */}
          {/* <ActionIcon label="Duplicate">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </ActionIcon> */}
          <ActionIcon
            label="Delete gate"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {/* <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg> */}
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </ActionIcon>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="m-0 cursor-pointer text-base font-semibold text-gray-900 hover:text-green-600">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 [&_strong]:font-semibold [&_strong]:text-gray-900">
          <span>Visits: <strong>{visits}</strong></span>
          <span>Downloads: <strong>{downloads}</strong></span>
          <span>Emails captured: <strong>{emailsCaptured}</strong></span>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-gate-confirm-title"
        >
          <div
            className="w-full max-w-[400px] rounded-lg bg-white p-5 shadow-[0_24px_48px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-gate-confirm-title" className="m-0 mb-2 text-lg font-semibold text-gray-900">
              Delete download gate?
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-gray-500">
              &ldquo;{title}&rdquo; by {subtitle} will be permanently deleted. This cannot be undone.
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
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
