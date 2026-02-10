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
      <label className="control-label">Language</label>
      <select
        className="control-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {COMMON_LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
