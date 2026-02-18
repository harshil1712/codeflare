import { Select } from "@cloudflare/kumo";

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

const COMMON_LANGUAGES = [
  { id: "typescript", name: "TypeScript" },
  { id: "javascript", name: "JavaScript" },
  { id: "tsx", name: "TSX" },
  { id: "jsx", name: "JSX" },
  { id: "python", name: "Python" },
  { id: "rust", name: "Rust" },
  { id: "go", name: "Go" },
  { id: "java", name: "Java" },
  { id: "c", name: "C" },
  { id: "cpp", name: "C++" },
  { id: "csharp", name: "C#" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "json", name: "JSON" },
  { id: "yaml", name: "YAML" },
  { id: "markdown", name: "Markdown" },
  { id: "bash", name: "Bash" },
  { id: "sql", name: "SQL" },
  { id: "php", name: "PHP" },
  { id: "ruby", name: "Ruby" },
];

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
