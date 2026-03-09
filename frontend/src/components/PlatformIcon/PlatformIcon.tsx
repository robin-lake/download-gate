import './PlatformIcon.scss';

/** Platform IDs that match backend platform_name. */
export type PlatformId =
  | 'spotify'
  | 'soundcloud'
  | 'bandcamp'
  | 'itunes'
  | 'apple_music'
  | 'deezer'
  | 'tidal'
  | 'youtube_music'
  | 'youtube'
  | 'amazon'
  | 'google'
  | 'amazon_music'
  | 'google_play'
  | 'beatport';

const PLATFORM_COLORS: Partial<Record<string, string>> = {
  spotify: '#1db954',
  soundcloud: '#ff5500',
  bandcamp: '#1da0c3',
  apple_music: '#fa243c',
  deezer: '#feaa2d',
  tidal: '#000',
  youtube: '#ff0000',
  youtube_music: '#ff0000',
};

export interface PlatformIconProps {
  platformName: string;
  className?: string;
  size?: number;
}

/**
 * Renders a platform icon (first letter or simple shape) with brand color when available.
 */
export default function PlatformIcon({
  platformName,
  className = '',
  size = 24,
}: PlatformIconProps) {
  const normalized = platformName?.toLowerCase().replace(/\s+/g, '_') ?? '';
  const color = PLATFORM_COLORS[normalized] ?? 'currentColor';
  const initial = platformName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <span
      className={`platform-icon ${className}`.trim()}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: normalized === 'tidal' ? '#fff' : undefined,
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
