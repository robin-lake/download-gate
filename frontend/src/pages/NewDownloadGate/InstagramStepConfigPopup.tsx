import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import "./InstagramStepConfigPopup.scss";

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
      className="instagram-config-popup__backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instagram-config-title"
    >
      <div
        className="instagram-config-popup__box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="instagram-config-popup__header">
          <h2 id="instagram-config-title" className="instagram-config-popup__title">
            <span className="instagram-config-popup__logo" aria-hidden>
              IG
            </span>
            Step {stepNumber}: Instagram
          </h2>
          <div className="instagram-config-popup__header-actions">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Delete step"
                className="instagram-config-popup__icon-btn"
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
              className="instagram-config-popup__icon-btn"
            >
              <Check className="size-4" />
            </Button>
          </div>
        </div>
        <div className="instagram-config-popup__body">
          <div className="instagram-config-popup__checkbox-row">
            <div className="instagram-config-popup__checkbox-box">
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
                className="instagram-config-popup__checkbox-label"
              >
                Follow profile(s)
              </Label>
            </div>
            <div className="instagram-config-popup__checkbox-box">
              <Checkbox
                id="skippable"
                checked={isSkippable}
                onCheckedChange={(checked) => setIsSkippable(checked === true)}
              />
              <Label
                htmlFor="skippable"
                className="instagram-config-popup__checkbox-label"
              >
                Make step skippable for fans
              </Label>
            </div>
          </div>

          <div className="instagram-config-popup__field">
            <Label
              htmlFor="instagram-url-input"
              className="instagram-config-popup__section-label"
            >
              Add Instagram Profile URLs
            </Label>
            <div className="instagram-config-popup__input-row">
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
                className="instagram-config-popup__add-btn"
                aria-label="Add URL"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {config.profile_urls.length > 0 && (
              <ul className="instagram-config-popup__url-list">
                {config.profile_urls.map((url, i) => (
                  <li key={i} className="instagram-config-popup__url-item">
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
              <p className="instagram-config-popup__error">{errors.profile_urls}</p>
            )}
          </div>
        </div>
        <div className="instagram-config-popup__footer">
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
