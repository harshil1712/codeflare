import { THEME_OPTIONS } from "../types";

interface ThemeSelectorProps {
  value: string;
  onChange: (theme: string) => void;
}

function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="control-group">
      <label className="control-label">Theme</label>
      <select
        className="control-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {THEME_OPTIONS.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ThemeSelector;
