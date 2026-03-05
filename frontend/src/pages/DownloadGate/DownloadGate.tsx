import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetDownloadGateById } from '../../network/downloadGates/getDownloadGateById';
import { useGetGateSteps } from '../../network/downloadGates/getGateSteps';
import { recordDownload, recordVisit } from '../../network/downloadGates/recordGateAnalytics';
import type { GateStepResponse } from '../../network/downloadGates/types';
import './DownloadGate.scss';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  email_capture: 'Enter your email',
  spotify: 'Follow on Spotify',
  soundcloud: 'Follow on SoundCloud',
  youtube: 'Subscribe on YouTube',
  instagram: 'Follow on Instagram',
  bandcamp: 'Support on Bandcamp',
  apple_music: 'Follow on Apple Music',
  deezer: 'Follow on Deezer',
  twitch: 'Follow on Twitch',
  mixcloud: 'Follow on Mixcloud',
  facebook: 'Follow on Facebook',
  twitter: 'Follow on X / Twitter',
  tiktok: 'Follow on TikTok',
  donation: 'Make a donation',
};

function stepLabel(step: GateStepResponse): string {
  return SERVICE_TYPE_LABELS[step.service_type] ?? step.service_type;
}

export default function DownloadGate() {
  const { gateIdOrSlug } = useParams<{ gateIdOrSlug: string }>();
  const { data: gate, error, isLoading } = useGetDownloadGateById({
    gateId: gateIdOrSlug,
    enabled: Boolean(gateIdOrSlug),
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visitRecordedRef = useRef(false);

  const { data: stepsData, isLoading: stepsLoading } = useGetGateSteps({
    gateId: gateIdOrSlug,
    enabled: Boolean(gateIdOrSlug) && modalOpen,
  });

  const steps = stepsData?.steps ?? [];
  const handlePlayPause = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    el.addEventListener('ended', onEnded);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('pause', onPause);
    };
  }, [gate?.audio_file_url]);

  const handleDownloadClick = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleUnlockDownload = useCallback(() => {
    if (!gate?.audio_file_url) return;
    if (gateIdOrSlug?.trim()) {
      recordDownload(gateIdOrSlug);
    }
    setUnlocked(true);
    window.open(gate.audio_file_url, '_blank', 'noopener');
  }, [gate?.audio_file_url, gateIdOrSlug]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, handleCloseModal]);

  // Record visit once when the gate page is successfully loaded
  useEffect(() => {
    if (!gate || !gateIdOrSlug?.trim() || visitRecordedRef.current) return;
    visitRecordedRef.current = true;
    recordVisit(gateIdOrSlug);
  }, [gate, gateIdOrSlug]);

  if (gateIdOrSlug === undefined) {
    return (
      <div className="app-page">
        <p>View a download gate by visiting a short link (e.g. /your-gate-id).</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (error || !gate) {
    return (
      <div className="app-page">
        <h1>Download gate not found</h1>
        <p>This link may be invalid or the gate may have been removed.</p>
      </div>
    );
  }

  const bgImage = gate.thumbnail_url ? `url(${gate.thumbnail_url})` : 'none';

  return (
    <>
      <div
        className="download-gate-view"
        style={{ '--download-gate-bg-image': bgImage } as React.CSSProperties}
      >
        <div className="download-gate-view__bg" aria-hidden />
        <div className="download-gate-view__left">
          <div
            className="download-gate-view__cover-wrap"
            onClick={handlePlayPause}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePlayPause();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={gate.audio_file_url ? 'Play or pause track' : 'Cover art'}
          >
            {gate.thumbnail_url ? (
              <img
                src={gate.thumbnail_url}
                alt=""
                className="download-gate-view__cover"
              />
            ) : (
              <div className="download-gate-view__cover-placeholder">♪</div>
            )}
            {gate.audio_file_url && (
              <button
                type="button"
                className="download-gate-view__play"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            )}
          </div>
        </div>
        <div className="download-gate-view__right">
          <h1 className="download-gate-view__title">{gate.title}</h1>
          <p className="download-gate-view__artist">{gate.artist_name}</p>
          <button
            type="button"
            className="download-gate-view__download-btn"
            onClick={handleDownloadClick}
          >
            Download
          </button>
        </div>
      </div>

      {gate.audio_file_url && (
        <audio
          ref={audioRef}
          src={gate.audio_file_url}
          preload="metadata"
          aria-hidden
        />
      )}

      {modalOpen && (
        <div
          className="download-gate-modal__backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-steps-title"
        >
          <div
            className="download-gate-modal__box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="download-gate-modal__header">
              <h2 id="gate-steps-title" className="download-gate-modal__title">
                Unlock your download
              </h2>
            </div>
            <div className="download-gate-modal__body">
              {stepsLoading ? (
                <p className="download-gate-modal__empty">Loading steps…</p>
              ) : steps.length === 0 ? (
                <p className="download-gate-modal__empty">
                  Complete the action below to get your download.
                </p>
              ) : (
                steps.map((step, i) => (
                  <div key={step.step_id} className="download-gate-modal__step">
                    <span className="download-gate-modal__step-num">{i + 1}</span>
                    <span className="download-gate-modal__step-label">
                      {stepLabel(step)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="download-gate-modal__footer">
              <button
                type="button"
                className="download-gate-modal__unlock-btn"
                onClick={handleUnlockDownload}
              >
                {unlocked ? 'Open download' : 'Get download'}
              </button>
              <button
                type="button"
                className="download-gate-modal__close"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
