import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
export interface InstagramStepConfig {
  follow_profile_enabled: boolean;
  profile_urls: string[];
}

const DEFAULT_CONFIG: InstagramStepConfig = {
  follow_profile_enabled: false,
  profile_urls: [],
};

export interface InstagramStepConfigPopupProps {
  open: boolean;
  stepNumber?: number;
  initialConfig?: Partial<InstagramStepConfig>;
  initialIsSkippable?: boolean;
  isEditing: boolean;
  onSave: (config: InstagramStepConfig, is_skippable: boolean) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function InstagramStepConfigPopup({
  open,
  stepNumber = 1,
  initialConfig,
  initialIsSkippable = false,
  isEditing,
  onSave,
  onCancel,
  onDelete,
}: InstagramStepConfigPopupProps) {
  const [config, setConfig] = useState<InstagramStepConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
    profile_urls: initialConfig?.profile_urls?.length
      ? [...initialConfig.profile_urls]
      : [],
  });
  const [isSkippable, setIsSkippable] = useState(initialIsSkippable ?? false);
  const [newUrl, setNewUrl] = useState("");
  const [errors, setErrors] = useState<{ profile_urls?: string }>({});

  useEffect(() => {
    if (open) {
      setConfig({
        ...DEFAULT_CONFIG,
        ...initialConfig,
        profile_urls: initialConfig?.profile_urls?.length
          ? [...initialConfig.profile_urls]
          : [],
      });
      setIsSkippable(initialIsSkippable ?? false);
      setNewUrl("");
      setErrors({});
    }
  }, [open, initialConfig, initialIsSkippable]);

  const validate = (): boolean => {
    const urls = config.profile_urls.filter((u) => u.trim());
    const newErrors: { profile_urls?: string } = {};
    if (config.follow_profile_enabled && urls.length === 0) {
      newErrors.profile_urls =
        "Add at least one Instagram profile URL when Follow profile is enabled";
    } else {
      for (const url of urls) {
        if (!isValidInstagramUrl(url)) {
          newErrors.profile_urls =
            "Enter valid Instagram profile URLs (e.g. https://instagram.com/username)";
          break;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const urls = config.profile_urls.filter((u) => u.trim());
    onSave(
      {
        ...config,
        profile_urls: urls,
      },
      isSkippable
    );
  };

  const handleAddUrl = () => {
    const url = newUrl.trim();
    if (url) {
      setConfig((c) => ({ ...c, profile_urls: [...c.profile_urls, url] }));
      setNewUrl("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    setConfig((c) => ({
      ...c,
      profile_urls: c.profile_urls.filter((_, i) => i !== index),
    }));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instagram-config-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-lg bg-white shadow-[0_24px_48px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 id="instagram-config-title" className="m-0 flex items-center gap-2 text-lg font-semibold text-black">
            <span className="inline-flex h-[22px] w-7 items-center justify-center rounded bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-[0.75rem] font-bold text-white" aria-hidden>
              IG
            </span>
            Step {stepNumber}: Instagram
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
          <div className="mb-5 flex flex-wrap gap-4">
            <div className="flex min-w-[160px] flex-1 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
              <Checkbox
                id="follow-profile"
                checked={config.follow_profile_enabled}
                onCheckedChange={(checked) =>
                  setConfig((c) => ({
                    ...c,
                    follow_profile_enabled: checked === true,
                  }))
                }
              />
              <Label
                htmlFor="follow-profile"
                className="m-0 cursor-pointer text-sm font-medium"
              >
                Follow profile(s)
              </Label>
            </div>
            <div className="flex min-w-[160px] flex-1 items-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
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
          </div>

          <div className="mb-0">
            <Label
              htmlFor="instagram-url-input"
              className="mb-2 block text-sm font-medium"
            >
              Add Instagram Profile URLs
            </Label>
            <div className="flex items-start gap-2">
              <Input
                id="instagram-url-input"
                type="url"
                placeholder="https://instagram.com/username"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                className={cn(errors.profile_urls && "border-destructive")}
                aria-invalid={Boolean(errors.profile_urls)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddUrl}
                className="shrink-0"
                aria-label="Add URL"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {config.profile_urls.length > 0 && (
              <ul className="mt-3 list-none p-0">
                {config.profile_urls.map((url, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 border-b border-neutral-200 py-2 last:border-b-0">
                    <span className="instagram-config-popup__url-text">{url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUrl(i)}
                      aria-label={`Remove ${url}`}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {errors.profile_urls && (
              <p className="mt-1 text-[0.8125rem] text-red-600">{errors.profile_urls}</p>
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

function isValidInstagramUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      (u.hostname === "instagram.com" || u.hostname === "www.instagram.com") &&
      u.pathname !== "/" &&
      u.pathname.split("/").filter(Boolean).length >= 1
    );
  } catch {
    return false;
  }
}
