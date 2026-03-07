import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SpotifyStepConfigPopup, {
  type SpotifyStepConfig,
} from "./SpotifyStepConfigPopup";

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
    if (service_type === "spotify") {
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

  const spotifyConfig = existingStep?.config as Partial<SpotifyStepConfig> | undefined;

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
    </>
  );
}
