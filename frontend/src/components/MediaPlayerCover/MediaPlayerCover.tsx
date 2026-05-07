import { useRef, useState, useCallback, useEffect } from 'react';
import { PlayIcon, PauseIcon } from './PlayPauseIcons';
import { cn } from "@/lib/utils";

export interface MediaPlayerCoverProps {
  imageUrl?: string | null;
  audioUrl?: string | null;
  className?: string;
  /** Custom class for the play button (e.g. for centering vs corner) */
  playButtonPosition?: 'center' | 'bottom-right';
}

/**
 * Cover image with optional play/pause button for audio.
 * Used by DownloadGate and SmartLink views.
 */
export default function MediaPlayerCover({
  imageUrl,
  audioUrl,
  className = '',
  playButtonPosition = 'bottom-right',
}: MediaPlayerCoverProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  }, [audioUrl]);

  const hasAudio = Boolean(audioUrl?.trim());
  const showPlayButton = hasAudio;

  return (
    <>
      <div
        className={cn(
          "relative aspect-square w-full max-w-[280px] cursor-pointer overflow-hidden rounded-lg shadow-[0_24px_48px_rgba(0,0,0,0.4)] md:max-w-[320px]",
          className
        )}
        onClick={hasAudio ? handlePlayPause : undefined}
        onKeyDown={
          hasAudio
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePlayPause();
                }
              }
            : undefined
        }
        role={hasAudio ? 'button' : undefined}
        tabIndex={hasAudio ? 0 : undefined}
        aria-label={hasAudio ? 'Play or pause track' : 'Cover art'}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="block size-full bg-[#1a1a2e] object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-5xl text-white/40">
            ♪
          </div>
        )}
        {showPlayButton && (
          <button
            type="button"
            className={cn(
              "absolute flex items-center justify-center rounded-full border-none bg-[#4b88e3] text-white shadow-md transition-all duration-150 hover:scale-105 hover:bg-[var(--button-cta)] [&_svg]:size-6",
              playButtonPosition === "bottom-right" &&
                "bottom-3 right-3 size-14 [&_svg]:size-6",
              playButtonPosition === "center" &&
                "left-1/2 top-1/2 size-[72px] -translate-x-1/2 -translate-y-1/2 hover:scale-105 [&_svg]:size-8"
            )}
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
      {hasAudio && (
        <audio
          ref={audioRef}
          src={audioUrl!}
          preload="metadata"
          aria-hidden
        />
      )}
    </>
  );
}
