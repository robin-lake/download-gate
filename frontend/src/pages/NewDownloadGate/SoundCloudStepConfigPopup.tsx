import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
export interface SoundCloudStepConfig {
  follow_profile: boolean;
  like_track: boolean;
  repost_track: boolean;
  comment_on_track: boolean;
  profile_url: string;
  track_url: string;
}

const DEFAULT_CONFIG: SoundCloudStepConfig = {
  follow_profile: false,
  like_track: false,
  repost_track: false,
  comment_on_track: false,
  profile_url: "",
  track_url: "",
};

const needsTrackUrl = (c: SoundCloudStepConfig) =>
  c.like_track || c.repost_track || c.comment_on_track;

export interface SoundCloudStepConfigPopupProps {
  open: boolean;
  stepNumber?: number;
  initialConfig?: Partial<SoundCloudStepConfig>;
  initialIsSkippable?: boolean;
  isEditing: boolean;
  onSave: (config: SoundCloudStepConfig, is_skippable: boolean) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function SoundCloudStepConfigPopup({
  open,
  stepNumber = 1,
  initialConfig,
  initialIsSkippable = false,
  isEditing,
  onSave,
  onCancel,
  onDelete,
}: SoundCloudStepConfigPopupProps) {
  const [config, setConfig] = useState<SoundCloudStepConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
    profile_url: initialConfig?.profile_url ?? "",
    track_url: initialConfig?.track_url ?? "",
  });
  const [isSkippable, setIsSkippable] = useState(initialIsSkippable ?? false);
  const [errors, setErrors] = useState<{
    profile_url?: string;
    track_url?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setConfig({
        ...DEFAULT_CONFIG,
        ...initialConfig,
        profile_url: initialConfig?.profile_url ?? "",
        track_url: initialConfig?.track_url ?? "",
      });
      setIsSkippable(initialIsSkippable ?? false);
      setErrors({});
    }
  }, [open, initialConfig, initialIsSkippable]);

  const validate = (): boolean => {
    const profileUrl = config.profile_url?.trim();
    const trackUrl = config.track_url?.trim();
    const newErrors: { profile_url?: string; track_url?: string } = {};

    if (config.follow_profile) {
      if (!profileUrl) {
        newErrors.profile_url = "SoundCloud profile URL is required when Follow profile is enabled";
      } else if (!isValidSoundCloudProfileUrl(profileUrl)) {
        newErrors.profile_url = "Enter a valid SoundCloud profile URL (e.g. https://soundcloud.com/username)";
      }
    }

    if (needsTrackUrl(config)) {
      if (!trackUrl) {
        newErrors.track_url = "SoundCloud track URL is required when Like, Repost, or Comment on track is enabled";
      } else if (!isValidSoundCloudTrackUrl(trackUrl)) {
        newErrors.track_url = "Enter a valid SoundCloud track URL (e.g. https://soundcloud.com/artist/track-name)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(
      {
        ...config,
        profile_url: config.profile_url.trim(),
        track_url: config.track_url.trim(),
      },
      isSkippable
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="soundcloud-config-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-lg bg-white shadow-[0_24px_48px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 id="soundcloud-config-title" className="m-0 flex items-center gap-2 text-lg font-semibold text-black">
            <span className="inline-flex h-[22px] w-7 items-center justify-center rounded-sm bg-[#ff5500] text-[0.75rem] font-bold text-white" aria-hidden>
              SC
            </span>
            Step {stepNumber}: SoundCloud
          </h2>
          <div className="flex gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Delete step"
                className="text-gray-500"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSave}
              aria-label="Save"
              className="text-gray-500"
            >
              <Check className="size-4" />
            </Button>
          </div>
        </div>
        <div className="px-5 py-5">
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
              <Checkbox
                id="follow-profile"
                checked={config.follow_profile}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, follow_profile: checked === true }))
                }
              />
              <Label
                htmlFor="follow-profile"
                className="m-0 cursor-pointer text-sm font-medium"
              >
                Follow profile(s)
              </Label>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
              <Checkbox
                id="like-track"
                checked={config.like_track}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, like_track: checked === true }))
                }
              />
              <Label
                htmlFor="like-track"
                className="m-0 cursor-pointer text-sm font-medium"
              >
                Like track
              </Label>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
              <Checkbox
                id="skippable"
                checked={isSkippable}
                onCheckedChange={(checked) => setIsSkippable(checked === true)}
              />
              <Label
                htmlFor="skippable"
                className="m-0 cursor-pointer text-sm font-medium"
              >
                Make step skippable for fans
              </Label>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
              <Checkbox
                id="comment-track"
                checked={config.comment_on_track}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, comment_on_track: checked === true }))
                }
              />
              <Label
                htmlFor="comment-track"
                className="m-0 cursor-pointer text-sm font-medium"
              >
                Comment on track
              </Label>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
              <Checkbox
                id="repost-track"
                checked={config.repost_track}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({ ...c, repost_track: checked === true }))
                }
              />
              <Label
                htmlFor="repost-track"
                className="m-0 cursor-pointer text-sm font-medium"
              >
                Repost track
              </Label>
            </div>
          </div>

          <div className="mb-4 [&_label]:mb-2 [&_label]:block [&_label]:text-sm [&_label]:font-medium">
            <Label htmlFor="soundcloud-profile-url">
              SoundCloud profile URL{" "}
              {config.follow_profile && (
                <span className="text-red-600">*</span>
              )}
            </Label>
            <Input
              id="soundcloud-profile-url"
              type="url"
              placeholder="Enter URL"
              value={config.profile_url}
              onChange={(e) =>
                setConfig((c) => ({ ...c, profile_url: e.target.value }))
              }
              className={cn(errors.profile_url && "border-destructive")}
              aria-invalid={Boolean(errors.profile_url)}
            />
            {errors.profile_url && (
              <p className="mt-1 text-[0.8125rem] text-red-600">
                {errors.profile_url}
              </p>
            )}
          </div>
          <div className="mb-4 [&_label]:mb-2 [&_label]:block [&_label]:text-sm [&_label]:font-medium">
            <Label htmlFor="soundcloud-track-url">
              SoundCloud track URL{" "}
              {needsTrackUrl(config) && (
                <span className="text-red-600">*</span>
              )}
            </Label>
            <Input
              id="soundcloud-track-url"
              type="url"
              placeholder="Enter URL"
              value={config.track_url}
              onChange={(e) =>
                setConfig((c) => ({ ...c, track_url: e.target.value }))
              }
              className={cn(errors.track_url && "border-destructive")}
              aria-invalid={Boolean(errors.track_url)}
            />
            {errors.track_url && (
              <p className="mt-1 text-[0.8125rem] text-red-600">
                {errors.track_url}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4">
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

function isValidSoundCloudProfileUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      (u.hostname === "soundcloud.com" || u.hostname === "www.soundcloud.com") &&
      u.pathname !== "/" &&
      !u.pathname.startsWith("/embed") &&
      u.pathname.split("/").filter(Boolean).length >= 1
    );
  } catch {
    return false;
  }
}

function isValidSoundCloudTrackUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      (u.hostname === "soundcloud.com" || u.hostname === "www.soundcloud.com") &&
      u.pathname !== "/" &&
      !u.pathname.startsWith("/embed") &&
      u.pathname.split("/").filter(Boolean).length >= 2
    );
  } catch {
    return false;
  }
}
