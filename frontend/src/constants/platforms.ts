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
