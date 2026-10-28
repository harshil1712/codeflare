import { Select } from "@cloudflare/kumo";
import { COMMON_LANGUAGES } from "../types";

const LANGUAGE_ITEMS = Object.fromEntries(COMMON_LANGUAGES.map((lang) => [lang.id, lang.name]));

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <Select
      aria-label="Language"
      size="sm"
      className="inspector-control"
      items={LANGUAGE_ITEMS}
      value={value}
      onValueChange={(val) => onChange(val as string)}
    />
  );
}

export default LanguageSelector;
