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
          "flex w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3 text-left text-sm text-black transition-colors hover:border-neutral-300 hover:bg-neutral-50",
          isConfigured && "border-green-500 bg-green-50"
        )}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="font-medium">{label}</span>
        <span
          className={cn(
            "text-lg text-neutral-500",
            isConfigured && "text-green-600"
          )}
        >
          {isConfigured ? "✓" : "+"}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`smart-link-platform-title-${platformId}`}
        >
          <div
            className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-lg bg-white shadow-[0_24px_48px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h2
                id={`smart-link-platform-title-${platformId}`}
                className="m-0 text-lg font-semibold text-black"
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
            <div className="px-5 py-5">
              <div className="mb-4 last:mb-0 [&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
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
                  <p className="mt-1 text-[0.8125rem] text-red-600" role="alert">
                    {trackUrlError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4">
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
