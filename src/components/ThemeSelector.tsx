import { Select } from "@cloudflare/kumo";
import { THEME_OPTIONS } from "../types";

const THEME_ITEMS = Object.fromEntries(THEME_OPTIONS.map((theme) => [theme.id, theme.name]));

interface ThemeSelectorProps {
  value: string;
  onChange: (theme: string) => void;
}

function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <Select
      aria-label="Theme"
      size="sm"
      className="inspector-control"
      items={THEME_ITEMS}
      value={value}
      onValueChange={(val) => onChange(val as string)}
    />
  );
}

export default ThemeSelector;
