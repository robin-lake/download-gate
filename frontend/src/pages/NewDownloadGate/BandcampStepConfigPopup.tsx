import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import "./BandcampStepConfigPopup.scss";

export interface BandcampStepConfig {
  follow_profile_enabled: boolean;
  profile_urls: string[];
}

const DEFAULT_CONFIG: BandcampStepConfig = {
  follow_profile_enabled: false,
  profile_urls: [],
};

export interface BandcampStepConfigPopupProps {
  open: boolean;
  stepNumber?: number;
  initialConfig?: Partial<BandcampStepConfig>;
  initialIsSkippable?: boolean;
  isEditing: boolean;
  onSave: (config: BandcampStepConfig, is_skippable: boolean) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function BandcampStepConfigPopup({
  open,
  stepNumber = 1,
  initialConfig,
  initialIsSkippable = false,
  isEditing,
  onSave,
  onCancel,
  onDelete,
}: BandcampStepConfigPopupProps) {
  const [config, setConfig] = useState<BandcampStepConfig>({
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
      newErrors.profile_urls = "Add at least one Bandcamp artist profile URL when Follow profile is enabled";
    } else {
      for (const url of urls) {
        if (!isValidBandcampUrl(url)) {
          newErrors.profile_urls = "Enter valid Bandcamp artist profile URLs (e.g. https://artist.bandcamp.com)";
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
      className="bandcamp-config-popup__backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bandcamp-config-title"
    >
      <div
        className="bandcamp-config-popup__box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bandcamp-config-popup__header">
          <h2 id="bandcamp-config-title" className="bandcamp-config-popup__title">
            <span className="bandcamp-config-popup__logo" aria-hidden>bc</span>
            Step {stepNumber}: Bandcamp
          </h2>
          <div className="bandcamp-config-popup__header-actions">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Delete step"
                className="bandcamp-config-popup__icon-btn"
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
              className="bandcamp-config-popup__icon-btn"
            >
              <Check className="size-4" />
            </Button>
          </div>
        </div>
        <div className="bandcamp-config-popup__body">
          <div className="bandcamp-config-popup__checkbox-row">
            <div className="bandcamp-config-popup__checkbox-box">
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
                className="bandcamp-config-popup__checkbox-label"
              >
                Follow profile
              </Label>
              <Info
                className="bandcamp-config-popup__info-icon"
                size={14}
                aria-hidden
              />
            </div>
            <div className="bandcamp-config-popup__checkbox-box">
              <Checkbox
                id="skippable"
                checked={isSkippable}
                onCheckedChange={(checked) => setIsSkippable(checked === true)}
              />
              <Label
                htmlFor="skippable"
                className="bandcamp-config-popup__checkbox-label"
              >
                Make step skippable for fans
              </Label>
            </div>
          </div>

          <div className="bandcamp-config-popup__field">
            <div className="bandcamp-config-popup__label-row">
              <Label
                htmlFor="bandcamp-url-input"
                className="bandcamp-config-popup__section-label"
              >
                Add Bandcamp Artist Profile URLs
              </Label>
              <Info
                className="bandcamp-config-popup__info-icon"
                size={14}
                aria-hidden
              />
            </div>
            <Input
              id="bandcamp-url-input"
              type="url"
              placeholder="Enter URL"
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
              className="bandcamp-config-popup__add-btn"
              aria-label="Add URL"
            >
              <Plus className="size-4" />
            </Button>
            {config.profile_urls.length > 0 && (
              <ul className="bandcamp-config-popup__url-list">
                {config.profile_urls.map((url, i) => (
                  <li key={i} className="bandcamp-config-popup__url-item">
                    <span className="bandcamp-config-popup__url-text">{url}</span>
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
              <p className="bandcamp-config-popup__error">{errors.profile_urls}</p>
            )}
          </div>
        </div>
        <div className="bandcamp-config-popup__footer">
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

function isValidBandcampUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      u.hostname.endsWith(".bandcamp.com") ||
      u.hostname === "bandcamp.com"
    );
  } catch {
    return false;
  }
}
