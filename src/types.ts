export interface BackgroundPreset {
  name: string;
  gradient: string;
}

export interface ThemeOption {
  id: string;
  name: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { name: "Cloudflare Light", gradient: "linear-gradient(135deg, #fef7ed 0%, #fffbf5 100%)" },
  { name: "Cloudflare Dark", gradient: "linear-gradient(135deg, #1a1209 0%, #2a2927 100%)" },
  { name: "Sunset", gradient: "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)" },
  { name: "Ocean", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Purple Haze", gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
  { name: "Midnight", gradient: "linear-gradient(135deg, #141e30 0%, #243b55 100%)" },
  { name: "Forest", gradient: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)" },
  { name: "Peach", gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
  { name: "Sky", gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)" },
  { name: "Candy", gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "Dark", gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)" },
  { name: "Light", gradient: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" },
  { name: "Transparent", gradient: "transparent" },
];

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "github-dark", name: "GitHub Dark" },
  { id: "github-light", name: "GitHub Light" },
  { id: "one-dark-pro", name: "One Dark Pro" },
  { id: "dracula", name: "Dracula" },
  { id: "nord", name: "Nord" },
  { id: "monokai", name: "Monokai" },
  { id: "solarized-dark", name: "Solarized Dark" },
  { id: "solarized-light", name: "Solarized Light" },
  { id: "catppuccin-mocha", name: "Catppuccin Mocha" },
  { id: "vitesse-dark", name: "Vitesse Dark" },
];

export type ExportAction = "r2_only" | "r2_and_download" | "download_only";

export interface LanguageOption {
  id: string;
  name: string;
}

export const COMMON_LANGUAGES: LanguageOption[] = [
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

export interface ScreenshotMeta {
  key: string;
  uploaded: string; // ISO timestamp
  size: number;     // bytes
}

export interface ScreenshotOptions {
  code: string;
  language: string;
  theme: string;
  background: string;
  padding: number;
  fontSize: number;
  showLineNumbers: boolean;
  windowTitle: string;
  cardBackground: string;
}

export interface SearchResultItem {
  file_id: string;
  filename: string;
  key: string;
  score: number;
  content: { type: "text"; text: string }[];
}

export interface SearchResponse {
  search_query: string;
  data: SearchResultItem[];
  has_more: boolean;
}

export interface ScreenshotRequest extends ScreenshotOptions {
  action?: ExportAction;
}
