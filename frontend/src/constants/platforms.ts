/** Music platforms for smart links (display order). */
export const SMART_LINK_PLATFORMS = [
  { id: "spotify", label: "Spotify" },
  { id: "itunes", label: "iTunes Store" },
  { id: "youtube", label: "Youtube" },
  { id: "amazon", label: "Amazon" },
  { id: "google", label: "Google" },
  { id: "deezer", label: "Deezer" },
  { id: "soundcloud", label: "SoundCloud" },
  { id: "apple_music", label: "Apple Music" },
  { id: "youtube_music", label: "Youtube Music" },
  { id: "amazon_music", label: "Amazon Music" },
  { id: "google_play", label: "Google Play" },
  { id: "beatport", label: "Beatport" },
] as const;

export type SmartLinkPlatformId = (typeof SMART_LINK_PLATFORMS)[number]["id"];

/** Regex patterns for validating track/store URLs per platform. */
export const PLATFORM_TRACK_URL_PATTERNS: Record<SmartLinkPlatformId, RegExp> = {
  spotify: /^https?:\/\/(open\.spotify\.com|spotify\.link)\/(track|album)\/[a-zA-Z0-9]+/,
  itunes: /^https?:\/\/(music\.apple\.com|itunes\.apple\.com)\/.*\/(song|album|music-video)\//,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/,
  amazon: /^https?:\/\/(www\.)?amazon\.(com|co\.uk|de|fr|it|es|ca)\/.*(dp|gp\/product)\/[a-zA-Z0-9]+/,
  google: /^https?:\/\/play\.google\.com\/store\/music/,
  deezer: /^https?:\/\/(www\.)?deezer\.com\/([a-z]+\/)?(track|album)\/[0-9]+/,
  soundcloud: /^https?:\/\/(www\.|m\.)?soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/,
  apple_music: /^https?:\/\/music\.apple\.com\/[a-z]{2}\/.*\/(song|album|music-video)\//,
  youtube_music: /^https?:\/\/music\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/,
  amazon_music: /^https?:\/\/(music\.)?amazon\.(com|co\.uk|de|fr|it|es|ca)\/.*(albums|songs)\//,
  google_play: /^https?:\/\/play\.google\.com\/store\/music/,
  beatport: /^https?:\/\/(www\.)?beatport\.com\/(track|release)\/[a-zA-Z0-9-]+\/[0-9]+/,
};

/** Validation messages when URL doesn't match platform. */
export const PLATFORM_TRACK_URL_MESSAGES: Record<SmartLinkPlatformId, string> = {
  spotify: "Enter a valid Spotify track or album URL (e.g. https://open.spotify.com/track/...)",
  itunes: "Enter a valid iTunes Store URL (e.g. https://music.apple.com/.../song/...)",
  youtube: "Enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)",
  amazon: "Enter a valid Amazon music product URL",
  google: "Enter a valid Google Play Music URL",
  deezer: "Enter a valid Deezer track or album URL (e.g. https://deezer.com/track/...)",
  soundcloud: "Enter a valid SoundCloud track URL (e.g. https://soundcloud.com/artist/track)",
  apple_music: "Enter a valid Apple Music track or album URL",
  youtube_music: "Enter a valid YouTube Music URL",
  amazon_music: "Enter a valid Amazon Music URL",
  google_play: "Enter a valid Google Play Music URL",
  beatport: "Enter a valid Beatport track or release URL",
};

export function validatePlatformTrackUrl(
  platformId: SmartLinkPlatformId,
  url: string
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return PLATFORM_TRACK_URL_PATTERNS[platformId].test(trimmed);
}
