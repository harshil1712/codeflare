import { Select } from "@cloudflare/kumo";
import { THEME_OPTIONS } from "../types";

interface ThemeSelectorProps {
  value: string;
  onChange: (theme: string) => void;
}

function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="control-group">
      <Select
        label="Theme"
        value={value}
        onValueChange={(val) => onChange(val as string)}
      >
        {THEME_OPTIONS.map((theme) => (
          <Select.Option key={theme.id} value={theme.id}>
            {theme.name}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
}

export default ThemeSelector;
