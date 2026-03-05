import { Select } from "@cloudflare/kumo";
import { COMMON_LANGUAGES } from "../types";

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="control-group">
      <Select
        label="Language"
        value={value}
        onValueChange={(val) => onChange(val as string)}
      >
        {COMMON_LANGUAGES.map((lang) => (
          <Select.Option key={lang.id} value={lang.id}>
            {lang.name}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
}

export default LanguageSelector;
