import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGetDownloadGateById } from '../../network/downloadGates/getDownloadGateById';
import { useGetGateSteps } from '../../network/downloadGates/getGateSteps';
import { recordDownload, recordVisit } from '../../network/downloadGates/recordGateAnalytics';
import { useExecuteSpotifyActions } from '../../network/downloadGates/executeSpotifyActions';
import { useExecuteSoundCloudActions } from '../../network/downloadGates/executeSoundCloudActions';
import { useExecuteInstagramActions } from '../../network/downloadGates/executeInstagramActions';
import type { GateStepResponse } from '../../network/downloadGates/types';
import { MESSAGE_TYPE as SOUNDCLOUD_MESSAGE_TYPE } from '../../pages/OAuthSoundCloudSuccess';
import { MESSAGE_TYPE as SPOTIFY_MESSAGE_TYPE } from '../../pages/OAuthSpotifySuccess';
import { MESSAGE_TYPE as INSTAGRAM_MESSAGE_TYPE } from '../../pages/OAuthInstagramSuccess';
import BlurredBackground from '../../components/BlurredBackground/BlurredBackground';
import MediaPlayerCover from '../../components/MediaPlayerCover/MediaPlayerCover';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const SOUNDCLOUD_SIGNIN_URL = `${API_BASE}/api/integrations/signin/soundcloud`;
const SPOTIFY_SIGNIN_URL = `${API_BASE}/api/integrations/signin/spotify`;
const INSTAGRAM_SIGNIN_URL = `${API_BASE}/api/integrations/signin/instagram`;

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
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramExecuteTrigger, setInstagramExecuteTrigger] = useState(false);
  const [instagramExecuted, setInstagramExecuted] = useState(false);
  const visitRecordedRef = useRef(false);

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

  const { status: instagramExecuteStatus, isLoading: instagramExecuteLoading } =
    useExecuteInstagramActions({
      gateIdOrSlug,
      enabled: instagramExecuteTrigger,
    });

  const { data: stepsData, isLoading: stepsLoading } = useGetGateSteps({
    gateId: gateIdOrSlug,
    enabled: Boolean(gateIdOrSlug) && modalOpen,
  });

  const steps = stepsData?.steps ?? [];
  const hasSoundCloudStep = steps.some((s) => s.service_type === 'soundcloud');
  const hasSpotifyStep = steps.some((s) => s.service_type === 'spotify');
  const hasInstagramStep = steps.some((s) => s.service_type === 'instagram');
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
  const canConnectSoundCloud =
    !soundcloudCommentRequired || soundcloudComment.trim().length > 0;
  const canUnlock =
    (!hasSoundCloudStep || soundcloudExecuted) &&
    (!hasSpotifyStep || spotifyConnected) &&
    (!hasInstagramStep || instagramExecuted);

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
    handleUnlockDownload();
  }, [canUnlock, handleUnlockDownload]);

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
      if (e.data?.type === SOUNDCLOUD_MESSAGE_TYPE) {
        setSoundcloudConnected(true);
        setSoundcloudExecuteTrigger(true); // Run execute right after OAuth
      }
      if (e.data?.type === SPOTIFY_MESSAGE_TYPE) setSpotifyExecuteTrigger(true);
      if (e.data?.type === INSTAGRAM_MESSAGE_TYPE) {
        setInstagramConnected(true);
        setInstagramExecuteTrigger(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Mark Spotify connected when execute request succeeds
  useEffect(() => {
    if (spotifyExecuteStatus === 'success') setSpotifyConnected(true);
  }, [spotifyExecuteStatus]);

  // Mark SoundCloud step complete when execute succeeds (after OAuth)
  useEffect(() => {
    if (soundcloudExecuteStatus === 'success') setSoundcloudExecuted(true);
  }, [soundcloudExecuteStatus]);

  // Mark Instagram step complete when execute succeeds (after OAuth)
  useEffect(() => {
    if (instagramExecuteStatus === 'success') setInstagramExecuted(true);
  }, [instagramExecuteStatus]);

  // Record visit once when the gate page is successfully loaded
  useEffect(() => {
    if (!gate || !gateIdOrSlug?.trim() || visitRecordedRef.current) return;
    visitRecordedRef.current = true;
    recordVisit(gateIdOrSlug);
  }, [gate, gateIdOrSlug]);

  if (gateIdOrSlug === undefined) {
    return (
      <div className="mx-auto max-w-prose p-8 text-center">
        <p>View a download gate by visiting a short link (e.g. /your-gate-id).</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-prose p-8 text-center">
        <p>Loading…</p>
      </div>
    );
  }

  if (error || !gate) {
    return (
      <div className="mx-auto max-w-prose p-8 text-center">
        <h1>Download gate not found</h1>
        <p>This link may be invalid or the gate may have been removed.</p>
      </div>
    );
  }

  return (
    <>
      <BlurredBackground
        imageUrl={gate.thumbnail_url}
        className="relative mx-[-1.5rem] mb-[-2rem] mt-0 flex min-h-screen flex-col overflow-hidden text-left md:flex-row"
      >
        <div className="relative z-[1] flex flex-1 flex-col md:flex-row">
          <div className="relative z-[1] flex flex-1 items-center justify-center px-6 py-8 min-h-[280px] md:min-h-0 md:p-12">
            <MediaPlayerCover
              imageUrl={gate.thumbnail_url}
              audioUrl={gate.audio_file_url}
              playButtonPosition="bottom-right"
            />
          </div>
          <div className="relative z-[1] flex w-full flex-col items-center justify-center bg-[rgba(15,25,45,0.92)] px-6 py-8 text-center md:w-[380px] md:shrink-0 md:px-8 md:py-12">
          <h1 className="m-0 mb-1 text-[1.75rem] font-bold leading-tight tracking-tight text-white md:text-[2rem]">{gate.title}</h1>
          <p className="mb-8 mt-0 text-[1.1rem] text-white/85">{gate.artist_name}</p>
          <button
            type="button"
            className="inline-flex w-full max-w-[260px] cursor-pointer items-center justify-center rounded-lg border-none bg-[#0bcca9] px-8 py-4 text-[1.1rem] font-semibold text-white transition-all hover:-translate-y-px hover:bg-[var(--button-cta)]"
            onClick={handleDownloadClick}
          >
            Download
          </button>
          </div>
        </div>
      </BlurredBackground>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-steps-title"
        >
          <div
            className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-xl bg-[#1a1a2e] shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 pb-2 pt-6">
              <h2 id="gate-steps-title" className="m-0 text-xl font-semibold text-white">
                Unlock your download
              </h2>
            </div>
            <div className="px-6 py-6">
              {stepsLoading ? (
                <p className="py-2 text-[0.95rem] text-white/60">Loading steps…</p>
              ) : steps.length === 0 ? (
                <p className="py-2 text-[0.95rem] text-white/60">
                  Complete the action below to get your download.
                </p>
              ) : (
                <>
                  {steps.map((step, i) => (
                    <div
                      key={step.step_id}
                      className="flex items-center gap-3 border-b border-white/[0.06] py-3 text-[0.95rem] text-white/90 last:border-b-0"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(229,57,53,0.2)] text-[0.8rem] font-semibold text-[var(--button-cta)]">
                        {i + 1}
                      </span>
                      <span className="flex-1">{stepLabel(step)}</span>
                    </div>
                  ))}
                  {hasSoundCloudStep && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <p className="text-[0.9rem] leading-snug text-white/75">
                        {soundcloudExecuted
                          ? 'SoundCloud step complete.'
                          : soundcloudConnected
                            ? 'Completing SoundCloud step…'
                            : 'Connect with SoundCloud to complete the following:'}
                      </p>
                      {soundcloudConfig &&
                        (soundcloudConfig.follow_profile ||
                          soundcloudConfig.like_track ||
                          soundcloudConfig.repost_track ||
                          soundcloudConfig.comment_on_track) && (
                          <ul className="mb-4 mt-0 list-none space-y-1 pl-0 text-[0.9rem] text-white/90 [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-[var(--accent-brand)] [&_li]:before:content-['•']">
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
                        <div className="mb-4">
                          <label
                            htmlFor="soundcloud-comment"
                            className="mb-2 block text-[0.9rem] font-medium text-white/90"
                          >
                            Your comment (required)
                          </label>
                          <textarea
                            id="soundcloud-comment"
                            className="box-border min-h-[72px] w-full resize-y rounded-lg border border-white/15 bg-white/[0.08] px-3 py-2 font-inherit text-[0.9rem] text-white placeholder:text-white/40 focus:border-[var(--accent-brand)] focus:outline-none"
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
                        <>
                          <a
                            href={SOUNDCLOUD_SIGNIN_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-[#ff5500] px-5 py-3.5 text-[0.95rem] font-bold tracking-wide text-white no-underline transition-all hover:-translate-y-px hover:bg-[var(--accent-brand)]",
                              !canConnectSoundCloud && "pointer-events-none opacity-60"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!canConnectSoundCloud) return;
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
                            aria-disabled={!canConnectSoundCloud}
                          >
                            <SoundCloudIcon />
                            <span>CONNECT</span>
                          </a>
                          {soundcloudCommentRequired && !canConnectSoundCloud && (
                            <p className="mt-2 text-[0.85rem] text-white/60">
                              Enter your comment above first.
                            </p>
                          )}
                        </>
                      ) : soundcloudExecuted ? (
                        <span className="inline-block text-[0.95rem] font-semibold text-[#0bcca9]">
                          ✓ Complete
                        </span>
                      ) : (
                        <span className="inline-block text-[0.95rem] font-semibold text-white/80">
                          {soundcloudExecuteLoading ? 'Completing…' : 'Connected'}
                        </span>
                      )}
                    </div>
                  )}
                  {hasInstagramStep && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <h3 className="mb-4 text-[1.1rem] font-bold uppercase tracking-wide text-white leading-snug">
                        Follow on Instagram to unlock
                      </h3>
                      {!instagramConnected ? (
                        <a
                          href={INSTAGRAM_SIGNIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] px-5 py-3.5 text-[0.95rem] font-bold tracking-wide text-white no-underline transition-all hover:-translate-y-px hover:brightness-110"
                          onClick={(e) => {
                            e.preventDefault();
                            const w = 500;
                            const h = 600;
                            const left = Math.round((window.screen.width - w) / 2);
                            const top = Math.round((window.screen.height - h) / 2);
                            window.open(
                              INSTAGRAM_SIGNIN_URL,
                              'instagram-oauth',
                              `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`
                            );
                          }}
                        >
                          <InstagramIcon />
                          <span>Connect</span>
                        </a>
                      ) : instagramExecuted ? (
                        <span className="inline-block text-[0.95rem] font-semibold text-[var(--button-cta)]">
                          ✓ Complete
                        </span>
                      ) : (
                        <span className="inline-block text-[0.95rem] font-semibold text-white/80">
                          {instagramExecuteLoading ? 'Completing…' : 'Connected'}
                        </span>
                      )}
                      <p className="m-0 text-[0.9rem] leading-relaxed text-white/75 [&_strong]:font-semibold [&_strong]:text-white/95">
                        {instagramExecuted ? (
                          <>Instagram step complete.</>
                        ) : instagramConnected ? (
                          <>Completing Instagram step…</>
                        ) : (
                          <>
                            Connect with Instagram to follow <strong>{gate?.artist_name ?? 'the artist'}</strong>.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  {hasSpotifyStep && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <h3 className="mb-4 text-[1.1rem] font-bold uppercase tracking-wide text-white leading-snug">
                        Please support the artist to unlock your download
                      </h3>
                      {!spotifyConnected ? (
                        <a
                          href={SPOTIFY_SIGNIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-[#1db954] px-5 py-3.5 text-[0.95rem] font-bold tracking-wide text-white no-underline transition-all hover:-translate-y-px hover:bg-[#1ed760]"
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
                        <span className="mb-4 inline-block text-[0.95rem] font-semibold text-[#1db954]">
                          ✓ Connected
                        </span>
                      )}
                      <p className="m-0 text-[0.9rem] leading-relaxed text-white/75 [&_strong]:font-semibold [&_strong]:text-white/95">
                        {spotifyConnected ? (
                          <>Connected with Spotify.</>
                        ) : (
                          <>
                            Connect with Spotify to follow <strong>{gate?.artist_name ?? 'the artist'}</strong> and save{' '}
                            <strong>{gate?.title ?? 'this release'}</strong> to your Spotify library.
                            <br />
                            Add future songs by {gate?.artist_name ?? 'the artist'} to my Spotify library or{' '}
                            <span className="cursor-pointer text-white/70 underline">opt out</span>.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
              <button
                type="button"
                className="w-full cursor-pointer rounded-lg border-none bg-[var(--button-cta)] px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--button-cta)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleUnlockClick}
                disabled={!canUnlock}
              >
                {unlocked ? 'Open download' : 'Get download'}
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-white/20 bg-transparent px-4 py-2 text-[0.9rem] text-white/90 transition-colors hover:bg-white/[0.06]"
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

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5 shrink-0">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5 shrink-0">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function SoundCloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5 shrink-0">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.254-2.154c-.009-.054-.049-.1-.1-.1m-.582.857c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.254-2.154c-.009-.054-.049-.1-.1-.1m.582-2.857c-.051 0-.094.046-.101.1L1.264 12.38l.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.254-2.154c-.009-.054-.049-.1-.1-.1m1.036 2.786c-.064 0-.117.05-.125.117l-.176 2.412.176 2.353c.008.067.061.118.125.118.063 0 .116-.051.124-.118l.198-2.353-.198-2.412c-.008-.067-.061-.117-.124-.117m-.454-2.786c-.064 0-.117.05-.125.117L1.4 12.38l.176 2.353c.008.067.061.118.125.118.063 0 .116-.051.124-.118l.198-2.353-.198-2.412c-.008-.067-.061-.117-.124-.117m2.267.857c-.075 0-.137.06-.146.137l-.117 2.47.117 2.334c.009.078.071.138.146.138.074 0 .137-.06.146-.138l.132-2.334-.132-2.47c-.009-.077-.072-.137-.146-.137m-.454-2.857c-.075 0-.137.06-.146.137l-.117 2.47.117 2.334c.009.078.071.138.146.138.074 0 .137-.06.146-.138l.132-2.334-.132-2.47c-.009-.077-.072-.137-.146-.137m.908 2.857c-.083 0-.151.067-.161.151l-.059 2.528.059 2.305c.01.084.078.152.161.152.082 0 .15-.068.16-.152l.067-2.305-.067-2.528c-.01-.084-.078-.151-.16-.151m-.454-2.857c-.083 0-.151.067-.161.151l-.059 2.528.059 2.305c.01.084.078.152.161.152.082 0 .15-.068.16-.152l.067-2.305-.067-2.528c-.01-.084-.078-.151-.16-.151m4.494 2.857c-.093 0-.169.075-.181.169l-.059 2.528.059 2.305c.012.094.088.169.181.169.092 0 .168-.075.18-.169l.067-2.305-.067-2.528c-.012-.094-.088-.169-.18-.169m-.454-2.857c-.093 0-.169.075-.181.169l-.059 2.528.059 2.305c.012.094.088.169.181.169.092 0 .168-.075.18-.169l.067-2.305-.067-2.528c-.012-.094-.088-.169-.18-.169m.908 2.857c-.102 0-.185.083-.198.185l-.059 2.528.059 2.305c.013.102.096.185.198.185.101 0 .184-.083.197-.185l.067-2.305-.067-2.528c-.013-.102-.096-.185-.197-.185m-.454-2.857c-.102 0-.185.083-.198.185l-.059 2.528.059 2.305c.013.102.096.185.198.185.101 0 .184-.083.197-.185l.067-2.305-.067-2.528c-.013-.102-.096-.185-.197-.185m.908 2.857c-.113 0-.205.093-.219.206l-.059 2.528.059 2.305c.014.113.106.206.219.206.112 0 .204-.093.218-.206l.067-2.305-.067-2.528c-.014-.113-.106-.206-.218-.206m-.454-2.857c-.113 0-.205.093-.219.206l-.059 2.528.059 2.305c.014.113.106.206.219.206.112 0 .204-.093.218-.206l.067-2.305-.067-2.528c-.014-.113-.106-.206-.218-.206m.908 2.857c-.124 0-.225.102-.24.226l-.059 2.528.059 2.305c.015.124.116.226.24.226.123 0 .224-.102.239-.226l.067-2.305-.067-2.528c-.015-.124-.116-.226-.239-.226m-.454-2.857c-.124 0-.225.102-.24.226l-.059 2.528.059 2.305c.015.124.116.226.24.226.123 0 .224-.102.239-.226l.067-2.305-.067-2.528c-.015-.124-.116-.226-.239-.226m.908 2.857c-.135 0-.245.111-.261.247l-.059 2.528.059 2.305c.016.136.126.247.261.247.134 0 .244-.111.26-.247l.067-2.305-.067-2.528c-.016-.136-.126-.247-.26-.247m-.454-2.857c-.135 0-.245.111-.261.247l-.059 2.528.059 2.305c.016.136.126.247.261.247.134 0 .244-.111.26-.247l.067-2.305-.067-2.528c-.016-.136-.126-.247-.26-.247m.908 2.857c-.147 0-.266.12-.283.268l-.059 2.528.059 2.305c.017.148.136.268.283.268.146 0 .265-.12.282-.268l.067-2.305-.067-2.528c-.017-.148-.136-.268-.282-.268m-.454-2.857c-.147 0-.266.12-.283.268l-.059 2.528.059 2.305c.017.148.136.268.283.268.146 0 .265-.12.282-.268l.067-2.305-.067-2.528c-.017-.148-.136-.268-.282-.268m.908 2.857c-.158 0-.287.129-.304.289l-.059 2.528.059 2.305c.017.16.146.289.304.289.157 0 .286-.129.303-.289l.067-2.305-.067-2.528c-.017-.16-.146-.289-.303-.289m-.454-2.857c-.158 0-.287.129-.304.289l-.059 2.528.059 2.305c.017.16.146.289.304.289.157 0 .286-.129.303-.289l.067-2.305-.067-2.528c-.017-.16-.146-.289-.303-.289m.908 2.857c-.17 0-.308.139-.326.31l-.059 2.528.059 2.305c.018.171.156.31.326.31.169 0 .307-.139.325-.31l.067-2.305-.067-2.528c-.018-.171-.156-.31-.325-.31m-.454-2.857c-.17 0-.308.139-.326.31l-.059 2.528.059 2.305c.018.171.156.31.326.31.169 0 .307-.139.325-.31l.067-2.305-.067-2.528c-.018-.171-.156-.31-.325-.31" />
    </svg>
  );
}
