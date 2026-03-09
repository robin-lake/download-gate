import { useRef, useState, useCallback, useEffect } from 'react';
import { PlayIcon, PauseIcon } from './PlayPauseIcons';
import './MediaPlayerCover.scss';

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
        className={`media-player-cover ${className}`.trim()}
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
          <img src={imageUrl} alt="" className="media-player-cover__image" />
        ) : (
          <div className="media-player-cover__placeholder">♪</div>
        )}
        {showPlayButton && (
          <button
            type="button"
            className={`media-player-cover__play media-player-cover__play--${playButtonPosition}`}
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
