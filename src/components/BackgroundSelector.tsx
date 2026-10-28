import { Tooltip } from "@cloudflare/kumo";
import { BACKGROUND_PRESETS } from "../types";

interface BackgroundSelectorProps {
  value: string;
  onChange: (background: string) => void;
}

function BackgroundSelector({ value, onChange }: BackgroundSelectorProps) {
  return (
    <div className="swatch-grid" role="radiogroup" aria-label="Background">
      {BACKGROUND_PRESETS.map((preset) => {
        const selected = value === preset.gradient;
        return (
          <Tooltip
            key={preset.name}
            content={preset.name}
            render={
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.name}
                className={`swatch${selected ? " swatch-selected" : ""}${
                  preset.gradient === "transparent" ? " swatch-transparent" : ""
                }`}
                style={
                  preset.gradient === "transparent" ? undefined : { background: preset.gradient }
                }
                onClick={() => onChange(preset.gradient)}
              />
            }
          />
        );
      })}
    </div>
  );
}

export default BackgroundSelector;
