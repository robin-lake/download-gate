import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SpotifyStepConfigPopup, {
  type SpotifyStepConfig,
} from "./SpotifyStepConfigPopup";
import BandcampStepConfigPopup, {
  type BandcampStepConfig,
} from "./BandcampStepConfigPopup";
import SoundCloudStepConfigPopup, {
  type SoundCloudStepConfig,
} from "./SoundCloudStepConfigPopup";
import InstagramStepConfigPopup, {
  type InstagramStepConfig,
} from "./InstagramStepConfigPopup";

/** One gate step in the form (selection order = step_order). */
export interface GateStepFormItem {
  service_type: string;
  is_skippable: boolean;
  config: Record<string, unknown>;
}

export interface GateStepProps {
  label: string;
  service_type: string;
  value: GateStepFormItem[];
  onChange: (steps: GateStepFormItem[]) => void;
}

export default function GateStep(props: GateStepProps) {
  const { label, service_type, value, onChange } = props;
  const [configPopupOpen, setConfigPopupOpen] = useState(false);

  const existingStep = value.find((s) => s.service_type === service_type);
  const isSelected = Boolean(existingStep);

  const handleClick = () => {
    if (service_type === "spotify" || service_type === "bandcamp" || service_type === "soundcloud" || service_type === "instagram") {
      setConfigPopupOpen(true);
    } else {
      // Simple add/remove for other integration types
      if (isSelected) {
        onChange(value.filter((s) => s.service_type !== service_type));
      } else {
        onChange([
          ...value,
          { service_type, is_skippable: false, config: {} },
        ]);
      }
    }
  };

  const handleSpotifySave = (config: SpotifyStepConfig) => {
    const others = value.filter((s) => s.service_type !== service_type);
    onChange([
      ...others,
      {
        service_type,
        is_skippable: false,
        config: config as unknown as Record<string, unknown>,
      },
    ]);
    setConfigPopupOpen(false);
  };

  const handleSpotifyCancel = () => {
    setConfigPopupOpen(false);
  };

  const handleSpotifyDelete = () => {
    onChange(value.filter((s) => s.service_type !== service_type));
    setConfigPopupOpen(false);
  };

  const handleBandcampSave = (config: BandcampStepConfig, is_skippable: boolean) => {
    const others = value.filter((s) => s.service_type !== service_type);
    const { follow_profile_enabled, profile_urls } = config;
    onChange([
      ...others,
      {
        service_type,
        is_skippable,
        config: { follow_profile_enabled, profile_urls } as unknown as Record<string, unknown>,
      },
    ]);
    setConfigPopupOpen(false);
  };

  const handleBandcampCancel = () => {
    setConfigPopupOpen(false);
  };

  const handleBandcampDelete = () => {
    onChange(value.filter((s) => s.service_type !== service_type));
    setConfigPopupOpen(false);
  };

  const handleSoundCloudSave = (config: SoundCloudStepConfig, is_skippable: boolean) => {
    const others = value.filter((s) => s.service_type !== service_type);
    const { follow_profile, like_track, repost_track, comment_on_track, profile_url, track_url } = config;
    onChange([
      ...others,
      {
        service_type,
        is_skippable,
        config: {
          follow_profile,
          like_track,
          repost_track,
          comment_on_track,
          profile_url,
          track_url,
        } as unknown as Record<string, unknown>,
      },
    ]);
    setConfigPopupOpen(false);
  };

  const handleSoundCloudCancel = () => {
    setConfigPopupOpen(false);
  };

  const handleSoundCloudDelete = () => {
    onChange(value.filter((s) => s.service_type !== service_type));
    setConfigPopupOpen(false);
  };

  const handleInstagramSave = (config: InstagramStepConfig, is_skippable: boolean) => {
    const others = value.filter((s) => s.service_type !== service_type);
    const { follow_profile_enabled, profile_urls } = config;
    onChange([
      ...others,
      {
        service_type,
        is_skippable,
        config: { follow_profile_enabled, profile_urls } as unknown as Record<string, unknown>,
      },
    ]);
    setConfigPopupOpen(false);
  };

  const handleInstagramCancel = () => {
    setConfigPopupOpen(false);
  };

  const handleInstagramDelete = () => {
    onChange(value.filter((s) => s.service_type !== service_type));
    setConfigPopupOpen(false);
  };

  const spotifyConfig = existingStep?.config as Partial<SpotifyStepConfig> | undefined;
  const bandcampConfig = existingStep?.config as Partial<BandcampStepConfig> | undefined;
  const soundcloudConfig = existingStep?.config as Partial<SoundCloudStepConfig> | undefined;
  const instagramConfig = existingStep?.config as Partial<InstagramStepConfig> | undefined;

  return (
    <>
      <Button
        key={service_type}
        type="button"
        variant={isSelected ? "default" : "outline"}
        className={cn(
          "new-download-gate__gate-step",
          isSelected && "new-download-gate__gate-step--selected"
        )}
        onClick={handleClick}
      >
        {label} +
      </Button>
      {service_type === "spotify" && (
        <SpotifyStepConfigPopup
          open={configPopupOpen}
          initialConfig={spotifyConfig}
          isEditing={isSelected}
          onSave={handleSpotifySave}
          onCancel={handleSpotifyCancel}
          onDelete={isSelected ? handleSpotifyDelete : undefined}
        />
      )}
      {service_type === "bandcamp" && (
        <BandcampStepConfigPopup
          open={configPopupOpen}
          stepNumber={
            existingStep
              ? value.findIndex((s) => s.service_type === "bandcamp") + 1
              : value.length + 1
          }
          initialConfig={bandcampConfig}
          initialIsSkippable={existingStep?.is_skippable ?? false}
          isEditing={isSelected}
          onSave={handleBandcampSave}
          onCancel={handleBandcampCancel}
          onDelete={isSelected ? handleBandcampDelete : undefined}
        />
      )}
      {service_type === "soundcloud" && (
        <SoundCloudStepConfigPopup
          open={configPopupOpen}
          stepNumber={
            existingStep
              ? value.findIndex((s) => s.service_type === "soundcloud") + 1
              : value.length + 1
          }
          initialConfig={soundcloudConfig}
          initialIsSkippable={existingStep?.is_skippable ?? false}
          isEditing={isSelected}
          onSave={handleSoundCloudSave}
          onCancel={handleSoundCloudCancel}
          onDelete={isSelected ? handleSoundCloudDelete : undefined}
        />
      )}
      {service_type === "instagram" && (
        <InstagramStepConfigPopup
          open={configPopupOpen}
          stepNumber={
            existingStep
              ? value.findIndex((s) => s.service_type === "instagram") + 1
              : value.length + 1
          }
          initialConfig={instagramConfig}
          initialIsSkippable={existingStep?.is_skippable ?? false}
          isEditing={isSelected}
          onSave={handleInstagramSave}
          onCancel={handleInstagramCancel}
          onDelete={isSelected ? handleInstagramDelete : undefined}
        />
      )}
    </>
  );
}
