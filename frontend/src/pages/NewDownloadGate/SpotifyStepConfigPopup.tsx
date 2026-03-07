import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import "./SpotifyStepConfigPopup.scss";

export interface SpotifyStepConfig {
  follow_artist: boolean;
  save_track_or_album: boolean;
  artist_profile_url: string;
  track_or_album_url: string;
}

const DEFAULT_CONFIG: SpotifyStepConfig = {
  follow_artist: true,
  save_track_or_album: true,
  artist_profile_url: "",
  track_or_album_url: "",
};

export interface SpotifyStepConfigPopupProps {
  open: boolean;
  initialConfig?: Partial<SpotifyStepConfig>;
  isEditing: boolean;
  onSave: (config: SpotifyStepConfig) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function SpotifyStepConfigPopup({
  open,
  initialConfig,
  isEditing,
  onSave,
  onCancel,
  onDelete,
}: SpotifyStepConfigPopupProps) {
  const [config, setConfig] = useState<SpotifyStepConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const [errors, setErrors] = useState<{ artist_profile_url?: string; track_or_album_url?: string }>({});

  useEffect(() => {
    if (open) {
      setConfig({ ...DEFAULT_CONFIG, ...initialConfig });
      setErrors({});
    }
  }, [open, initialConfig]);

  const validate = (): boolean => {
    const artistProfileUrl = config.artist_profile_url?.trim();
    const trackOrAlbumUrl = config.track_or_album_url?.trim();
    const newErrors: { artist_profile_url?: string; track_or_album_url?: string } = {};
    if (config.follow_artist) {
      if (!artistProfileUrl) {
        newErrors.artist_profile_url = "Artist profile URL is required";
      } else if (!isValidSpotifyUrl(artistProfileUrl, "artist")) {
        newErrors.artist_profile_url = "Enter a valid Spotify artist URL (e.g. https://open.spotify.com/artist/...)";
      }
    }
    if (config.save_track_or_album) {
      if (!trackOrAlbumUrl) {
        newErrors.track_or_album_url = "Track or album URL is required";
      } else if (!isValidSpotifyUrl(trackOrAlbumUrl, "track_or_album")) {
        newErrors.track_or_album_url = "Enter a valid Spotify URL (e.g. https://open.spotify.com/track/... or .../album/...)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...config,
      artist_profile_url: config.artist_profile_url.trim(),
      track_or_album_url: config.track_or_album_url.trim(),
    });
  };

  if (!open) return null;

  return (
    <div
      className="spotify-config-popup__backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="spotify-config-title"
    >
      <div
        className="spotify-config-popup__box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spotify-config-popup__header">
          <h2 id="spotify-config-title" className="spotify-config-popup__title">
            Step 1: Spotify
          </h2>
          <div className="spotify-config-popup__header-actions">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                aria-label="Delete step"
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              aria-label="Close"
            >
              ×
            </Button>
          </div>
        </div>
        <div className="spotify-config-popup__body">
          <div className="spotify-config-popup__field">
            <div className="spotify-config-popup__checkbox-row">
              <Checkbox
                id="follow-artist"
                checked={config.follow_artist}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, follow_artist: checked === true }))
                }
              />
              <Label htmlFor="follow-artist" className="spotify-config-popup__checkbox-label">
                Follow artist profile (not playlist)
              </Label>
            </div>
          </div>
          <div className="spotify-config-popup__field">
            <div className="spotify-config-popup__checkbox-row">
              <Checkbox
                id="save-track-album"
                checked={config.save_track_or_album}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, save_track_or_album: checked === true }))
                }
              />
              <Label htmlFor="save-track-album" className="spotify-config-popup__checkbox-label">
                Save track or album to fan&apos;s library
              </Label>
            </div>
          </div>
          <div className="spotify-config-popup__field">
            <Label htmlFor="artist-profile-url">
              Artist profile URL {config.follow_artist && <span className="spotify-config-popup__required">*</span>}
            </Label>
            <Input
              id="artist-profile-url"
              type="url"
              placeholder="https://open.spotify.com/artist/..."
              value={config.artist_profile_url}
              onChange={(e) =>
                setConfig((c) => ({ ...c, artist_profile_url: e.target.value }))
              }
              className={cn(errors.artist_profile_url && "border-destructive")}
              aria-invalid={Boolean(errors.artist_profile_url)}
            />
            {errors.artist_profile_url && (
              <p className="spotify-config-popup__error">{errors.artist_profile_url}</p>
            )}
          </div>
          <div className="spotify-config-popup__field">
            <Label htmlFor="track-album-url">
              Spotify track or album URL {config.save_track_or_album && <span className="spotify-config-popup__required">*</span>}
            </Label>
            <Input
              id="track-album-url"
              type="url"
              placeholder="https://open.spotify.com/track/... or .../album/..."
              value={config.track_or_album_url}
              onChange={(e) =>
                setConfig((c) => ({ ...c, track_or_album_url: e.target.value }))
              }
              className={cn(errors.track_or_album_url && "border-destructive")}
              aria-invalid={Boolean(errors.track_or_album_url)}
            />
            {errors.track_or_album_url && (
              <p className="spotify-config-popup__error">{errors.track_or_album_url}</p>
            )}
          </div>
        </div>
        <div className="spotify-config-popup__footer">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function isValidSpotifyArtistUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      (u.hostname === "open.spotify.com" || u.hostname === "spotify.link") &&
      /\/artist\/[a-zA-Z0-9]+/.test(u.pathname)
    );
  } catch {
    return false;
  }
}

function isValidSpotifyTrackOrAlbumUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      (u.hostname === "open.spotify.com" || u.hostname === "spotify.link") &&
      (/\/track\/[a-zA-Z0-9]+/.test(u.pathname) || /\/album\/[a-zA-Z0-9]+/.test(u.pathname))
    );
  } catch {
    return false;
  }
}

function isValidSpotifyUrl(url: string, type: "artist" | "track_or_album"): boolean {
  return type === "artist" ? isValidSpotifyArtistUrl(url) : isValidSpotifyTrackOrAlbumUrl(url);
}
