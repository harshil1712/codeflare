import { Label } from "@cloudflare/kumo";
import { BACKGROUND_PRESETS } from "../types";

interface BackgroundSelectorProps {
  value: string;
  onChange: (background: string) => void;
}

function BackgroundSelector({ value, onChange }: BackgroundSelectorProps) {
  return (
    <div className="control-group">
      <Label className="control-label">Background</Label>
      <div className="background-grid">
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            key={preset.name}
            className={`background-option ${
              value === preset.gradient ? "background-option-active" : ""
            }`}
            style={{ background: preset.gradient }}
            onClick={() => onChange(preset.gradient)}
            title={preset.name}
            aria-label={`Select ${preset.name} background`}
          />
        ))}
      </div>
    </div>
  );
}

export default BackgroundSelector;
