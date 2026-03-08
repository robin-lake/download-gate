import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetDownloadGateById } from '../../network/downloadGates/getDownloadGateById';
import { useGetGateSteps } from '../../network/downloadGates/getGateSteps';
import { recordDownload, recordVisit } from '../../network/downloadGates/recordGateAnalytics';
import { useExecuteSpotifyActions } from '../../network/downloadGates/executeSpotifyActions';
import { useExecuteSoundCloudActions } from '../../network/downloadGates/executeSoundCloudActions';
import type { GateStepResponse } from '../../network/downloadGates/types';
import { MESSAGE_TYPE as SOUNDCLOUD_MESSAGE_TYPE } from '../../pages/OAuthSoundCloudSuccess';
import { MESSAGE_TYPE as SPOTIFY_MESSAGE_TYPE } from '../../pages/OAuthSpotifySuccess';
import './DownloadGate.scss';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const SOUNDCLOUD_SIGNIN_URL = `${API_BASE}/api/integrations/signin/soundcloud`;
const SPOTIFY_SIGNIN_URL = `${API_BASE}/api/integrations/signin/spotify`;

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
  const [soundcloudConnected, setSoundcloudConnected] = useState(false);
  const [soundcloudComment, setSoundcloudComment] = useState('');
  const [soundcloudExecuteTrigger, setSoundcloudExecuteTrigger] = useState(false);
  const [soundcloudExecuted, setSoundcloudExecuted] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyExecuteTrigger, setSpotifyExecuteTrigger] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visitRecordedRef = useRef(false);
  const pendingUnlockAfterSoundCloudRef = useRef(false);

  const { status: spotifyExecuteStatus } = useExecuteSpotifyActions({
    gateIdOrSlug,
    enabled: spotifyExecuteTrigger,
  });

  const { status: soundcloudExecuteStatus, isLoading: soundcloudExecuteLoading } =
    useExecuteSoundCloudActions({
      gateIdOrSlug,
      enabled: soundcloudExecuteTrigger,
      comment: soundcloudComment,
    });

  const { data: stepsData, isLoading: stepsLoading } = useGetGateSteps({
    gateId: gateIdOrSlug,
    enabled: Boolean(gateIdOrSlug) && modalOpen,
  });

  const steps = stepsData?.steps ?? [];
  const hasSoundCloudStep = steps.some((s) => s.service_type === 'soundcloud');
  const hasSpotifyStep = steps.some((s) => s.service_type === 'spotify');
  const soundcloudStep = steps.find((s) => s.service_type === 'soundcloud');
  const soundcloudConfig = soundcloudStep?.config as {
    follow_profile?: boolean;
    like_track?: boolean;
    repost_track?: boolean;
    comment_on_track?: boolean;
    profile_url?: string;
    track_url?: string;
  } | undefined;
  const soundcloudCommentRequired = Boolean(
    soundcloudConfig?.comment_on_track
  );
  const canUnlock =
    (!hasSoundCloudStep ||
      (soundcloudConnected &&
        (!soundcloudCommentRequired || soundcloudComment.trim().length > 0))) &&
    (!hasSpotifyStep || spotifyConnected);
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

  const handleUnlockClick = useCallback(() => {
    if (!canUnlock) return;
    if (
      hasSoundCloudStep &&
      soundcloudConnected &&
      !soundcloudExecuted
    ) {
      pendingUnlockAfterSoundCloudRef.current = true;
      setSoundcloudExecuteTrigger(true);
    } else {
      handleUnlockDownload();
    }
  }, [
    canUnlock,
    hasSoundCloudStep,
    soundcloudConnected,
    soundcloudExecuted,
    handleUnlockDownload,
  ]);

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

  // Listen for SoundCloud and Spotify OAuth success from popup
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === SOUNDCLOUD_MESSAGE_TYPE) setSoundcloudConnected(true);
      if (e.data?.type === SPOTIFY_MESSAGE_TYPE) setSpotifyExecuteTrigger(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Mark Spotify connected when execute request succeeds
  useEffect(() => {
    if (spotifyExecuteStatus === 'success') setSpotifyConnected(true);
  }, [spotifyExecuteStatus]);

  // When SoundCloud execute succeeds and we were waiting to unlock, unlock now
  useEffect(() => {
    if (
      soundcloudExecuteStatus === 'success' &&
      pendingUnlockAfterSoundCloudRef.current
    ) {
      pendingUnlockAfterSoundCloudRef.current = false;
      setSoundcloudExecuted(true);
      setSoundcloudExecuteTrigger(false);
      handleUnlockDownload();
    }
  }, [soundcloudExecuteStatus, handleUnlockDownload]);

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
                <>
                  {steps.map((step, i) => (
                    <div key={step.step_id} className="download-gate-modal__step">
                      <span className="download-gate-modal__step-num">{i + 1}</span>
                      <span className="download-gate-modal__step-label">
                        {stepLabel(step)}
                      </span>
                    </div>
                  ))}
                  {hasSoundCloudStep && (
                    <div className="download-gate-modal__soundcloud">
                      <p className="download-gate-modal__soundcloud-desc">
                        {soundcloudConnected
                          ? 'Connected with SoundCloud.'
                          : 'Connect with SoundCloud to complete the following:'}
                      </p>
                      {soundcloudConfig &&
                        (soundcloudConfig.follow_profile ||
                          soundcloudConfig.like_track ||
                          soundcloudConfig.repost_track ||
                          soundcloudConfig.comment_on_track) && (
                          <ul className="download-gate-modal__soundcloud-actions">
                            {soundcloudConfig.follow_profile && (
                              <li>Follow {gate?.artist_name ?? 'the artist'}</li>
                            )}
                            {soundcloudConfig.like_track && (
                              <li>Like the track</li>
                            )}
                            {soundcloudConfig.repost_track && (
                              <li>Repost the track</li>
                            )}
                            {soundcloudConfig.comment_on_track && (
                              <li>Comment on the track</li>
                            )}
                          </ul>
                        )}
                      {soundcloudCommentRequired && (
                        <div className="download-gate-modal__soundcloud-comment">
                          <label
                            htmlFor="soundcloud-comment"
                            className="download-gate-modal__soundcloud-comment-label"
                          >
                            Your comment (required)
                          </label>
                          <textarea
                            id="soundcloud-comment"
                            className="download-gate-modal__soundcloud-comment-input"
                            placeholder="Write a comment for the track..."
                            value={soundcloudComment}
                            onChange={(e) =>
                              setSoundcloudComment(e.target.value)
                            }
                            rows={3}
                          />
                        </div>
                      )}
                      {!soundcloudConnected ? (
                        <a
                          href={SOUNDCLOUD_SIGNIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-gate-modal__soundcloud-connect"
                          onClick={(e) => {
                            e.preventDefault();
                            const w = 500;
                            const h = 600;
                            const left = Math.round((window.screen.width - w) / 2);
                            const top = Math.round((window.screen.height - h) / 2);
                            window.open(
                              SOUNDCLOUD_SIGNIN_URL,
                              'soundcloud-oauth',
                              `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`
                            );
                          }}
                        >
                          <SoundCloudIcon />
                          <span>CONNECT</span>
                        </a>
                      ) : (
                        <span className="download-gate-modal__soundcloud-done">✓ Connected</span>
                      )}
                    </div>
                  )}
                  {hasSpotifyStep && (
                    <div className="download-gate-modal__spotify">
                      <h3 className="download-gate-modal__spotify-heading">
                        Please support the artist to unlock your download
                      </h3>
                      {!spotifyConnected ? (
                        <a
                          href={SPOTIFY_SIGNIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-gate-modal__spotify-connect"
                          onClick={(e) => {
                            e.preventDefault();
                            const w = 500;
                            const h = 600;
                            const left = Math.round((window.screen.width - w) / 2);
                            const top = Math.round((window.screen.height - h) / 2);
                            window.open(
                              SPOTIFY_SIGNIN_URL,
                              'spotify-oauth',
                              `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`
                            );
                          }}
                        >
                          <SpotifyIcon />
                          <span>Connect</span>
                        </a>
                      ) : (
                        <span className="download-gate-modal__spotify-done">✓ Connected</span>
                      )}
                      <p className="download-gate-modal__spotify-desc">
                        {spotifyConnected ? (
                          <>Connected with Spotify.</>
                        ) : (
                          <>
                            Connect with Spotify to follow <strong>{gate?.artist_name ?? 'the artist'}</strong> and save{' '}
                            <strong>{gate?.title ?? 'this release'}</strong> to your Spotify library.
                            <br />
                            Add future songs by {gate?.artist_name ?? 'the artist'} to my Spotify library or{' '}
                            <span className="download-gate-modal__spotify-optout">opt out</span>.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="download-gate-modal__footer">
              <button
                type="button"
                className="download-gate-modal__unlock-btn"
                onClick={handleUnlockClick}
                disabled={!canUnlock || soundcloudExecuteLoading}
              >
                {soundcloudExecuteLoading
                  ? 'Completing…'
                  : unlocked
                    ? 'Open download'
                    : 'Get download'}
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

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="download-gate-modal__spotify-icon">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function SoundCloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="download-gate-modal__soundcloud-icon">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.254-2.154c-.009-.054-.049-.1-.1-.1m-.582.857c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.254-2.154c-.009-.054-.049-.1-.1-.1m.582-2.857c-.051 0-.094.046-.101.1L1.264 12.38l.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.254-2.154c-.009-.054-.049-.1-.1-.1m1.036 2.786c-.064 0-.117.05-.125.117l-.176 2.412.176 2.353c.008.067.061.118.125.118.063 0 .116-.051.124-.118l.198-2.353-.198-2.412c-.008-.067-.061-.117-.124-.117m-.454-2.786c-.064 0-.117.05-.125.117L1.4 12.38l.176 2.353c.008.067.061.118.125.118.063 0 .116-.051.124-.118l.198-2.353-.198-2.412c-.008-.067-.061-.117-.124-.117m2.267.857c-.075 0-.137.06-.146.137l-.117 2.47.117 2.334c.009.078.071.138.146.138.074 0 .137-.06.146-.138l.132-2.334-.132-2.47c-.009-.077-.072-.137-.146-.137m-.454-2.857c-.075 0-.137.06-.146.137l-.117 2.47.117 2.334c.009.078.071.138.146.138.074 0 .137-.06.146-.138l.132-2.334-.132-2.47c-.009-.077-.072-.137-.146-.137m.908 2.857c-.083 0-.151.067-.161.151l-.059 2.528.059 2.305c.01.084.078.152.161.152.082 0 .15-.068.16-.152l.067-2.305-.067-2.528c-.01-.084-.078-.151-.16-.151m-.454-2.857c-.083 0-.151.067-.161.151l-.059 2.528.059 2.305c.01.084.078.152.161.152.082 0 .15-.068.16-.152l.067-2.305-.067-2.528c-.01-.084-.078-.151-.16-.151m4.494 2.857c-.093 0-.169.075-.181.169l-.059 2.528.059 2.305c.012.094.088.169.181.169.092 0 .168-.075.18-.169l.067-2.305-.067-2.528c-.012-.094-.088-.169-.18-.169m-.454-2.857c-.093 0-.169.075-.181.169l-.059 2.528.059 2.305c.012.094.088.169.181.169.092 0 .168-.075.18-.169l.067-2.305-.067-2.528c-.012-.094-.088-.169-.18-.169m.908 2.857c-.102 0-.185.083-.198.185l-.059 2.528.059 2.305c.013.102.096.185.198.185.101 0 .184-.083.197-.185l.067-2.305-.067-2.528c-.013-.102-.096-.185-.197-.185m-.454-2.857c-.102 0-.185.083-.198.185l-.059 2.528.059 2.305c.013.102.096.185.198.185.101 0 .184-.083.197-.185l.067-2.305-.067-2.528c-.013-.102-.096-.185-.197-.185m.908 2.857c-.113 0-.205.093-.219.206l-.059 2.528.059 2.305c.014.113.106.206.219.206.112 0 .204-.093.218-.206l.067-2.305-.067-2.528c-.014-.113-.106-.206-.218-.206m-.454-2.857c-.113 0-.205.093-.219.206l-.059 2.528.059 2.305c.014.113.106.206.219.206.112 0 .204-.093.218-.206l.067-2.305-.067-2.528c-.014-.113-.106-.206-.218-.206m.908 2.857c-.124 0-.225.102-.24.226l-.059 2.528.059 2.305c.015.124.116.226.24.226.123 0 .224-.102.239-.226l.067-2.305-.067-2.528c-.015-.124-.116-.226-.239-.226m-.454-2.857c-.124 0-.225.102-.24.226l-.059 2.528.059 2.305c.015.124.116.226.24.226.123 0 .224-.102.239-.226l.067-2.305-.067-2.528c-.015-.124-.116-.226-.239-.226m.908 2.857c-.135 0-.245.111-.261.247l-.059 2.528.059 2.305c.016.136.126.247.261.247.134 0 .244-.111.26-.247l.067-2.305-.067-2.528c-.016-.136-.126-.247-.26-.247m-.454-2.857c-.135 0-.245.111-.261.247l-.059 2.528.059 2.305c.016.136.126.247.261.247.134 0 .244-.111.26-.247l.067-2.305-.067-2.528c-.016-.136-.126-.247-.26-.247m.908 2.857c-.147 0-.266.12-.283.268l-.059 2.528.059 2.305c.017.148.136.268.283.268.146 0 .265-.12.282-.268l.067-2.305-.067-2.528c-.017-.148-.136-.268-.282-.268m-.454-2.857c-.147 0-.266.12-.283.268l-.059 2.528.059 2.305c.017.148.136.268.283.268.146 0 .265-.12.282-.268l.067-2.305-.067-2.528c-.017-.148-.136-.268-.282-.268m.908 2.857c-.158 0-.287.129-.304.289l-.059 2.528.059 2.305c.017.16.146.289.304.289.157 0 .286-.129.303-.289l.067-2.305-.067-2.528c-.017-.16-.146-.289-.303-.289m-.454-2.857c-.158 0-.287.129-.304.289l-.059 2.528.059 2.305c.017.16.146.289.304.289.157 0 .286-.129.303-.289l.067-2.305-.067-2.528c-.017-.16-.146-.289-.303-.289m.908 2.857c-.17 0-.308.139-.326.31l-.059 2.528.059 2.305c.018.171.156.31.326.31.169 0 .307-.139.325-.31l.067-2.305-.067-2.528c-.018-.171-.156-.31-.325-.31m-.454-2.857c-.17 0-.308.139-.326.31l-.059 2.528.059 2.305c.018.171.156.31.326.31.169 0 .307-.139.325-.31l.067-2.305-.067-2.528c-.018-.171-.156-.31-.325-.31" />
    </svg>
  );
}
