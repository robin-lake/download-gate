import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  validatePlatformTrackUrl,
  PLATFORM_TRACK_URL_MESSAGES,
  type SmartLinkPlatformId,
} from "@/constants/platforms";
import type { SmartLinkPlatform as SmartLinkPlatformType } from "@/types/smartLink";
import "./SmartLinkPlatform.scss";

export interface SmartLinkPlatformProps {
  platformId: SmartLinkPlatformId;
  label: string;
  value: SmartLinkPlatformType;
  onChange: (value: SmartLinkPlatformType) => void;
}

const DEFAULT_PLATFORM_VALUE: SmartLinkPlatformType = {
  trackUrl: "",
};

export default function SmartLinkPlatform({
  platformId,
  label,
  value,
  onChange,
}: SmartLinkPlatformProps) {
  const [open, setOpen] = useState(false);
  const [trackUrl, setTrackUrl] = useState(value.trackUrl);
  const [trackUrlError, setTrackUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTrackUrl(value.trackUrl);
      setTrackUrlError(null);
    }
  }, [open, value.trackUrl]);

  const handleSave = () => {
    const trimmedUrl = trackUrl.trim();
    setTrackUrlError(null);
    if (trimmedUrl && !validatePlatformTrackUrl(platformId, trimmedUrl)) {
      setTrackUrlError(PLATFORM_TRACK_URL_MESSAGES[platformId]);
      return;
    }
    onChange({ trackUrl: trimmedUrl });
    setOpen(false);
  };

  const handleCancel = () => {
    setTrackUrlError(null);
    setOpen(false);
  };

  const isConfigured = Boolean(value.trackUrl.trim());

  return (
    <>
      <button
        type="button"
        className={cn(
          "smart-link-platform__trigger",
          isConfigured && "smart-link-platform__trigger--configured"
        )}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="smart-link-platform__trigger-label">{label}</span>
        <span className="smart-link-platform__trigger-icon">{isConfigured ? "✓" : "+"}</span>
      </button>

      {open && (
        <div
          className="smart-link-platform__backdrop"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`smart-link-platform-title-${platformId}`}
        >
          <div
            className="smart-link-platform__box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="smart-link-platform__header">
              <h2
                id={`smart-link-platform-title-${platformId}`}
                className="smart-link-platform__title"
              >
                {label} link
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                aria-label="Close"
              >
                ×
              </Button>
            </div>
            <div className="smart-link-platform__body">
              <div className="smart-link-platform__field">
                <Label htmlFor={`track-url-${platformId}`}>Track link URL</Label>
                <Input
                  id={`track-url-${platformId}`}
                  type="url"
                  placeholder="https://..."
                  value={trackUrl}
                  onChange={(e) => {
                    setTrackUrl(e.target.value);
                    if (trackUrlError) setTrackUrlError(null);
                  }}
                  className={cn(trackUrlError && "border-destructive")}
                  aria-invalid={Boolean(trackUrlError)}
                />
                {trackUrlError && (
                  <p className="smart-link-platform__error" role="alert">
                    {trackUrlError}
                  </p>
                )}
              </div>
            </div>
            <div className="smart-link-platform__footer">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { DEFAULT_PLATFORM_VALUE };
