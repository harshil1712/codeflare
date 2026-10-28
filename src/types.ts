export interface BackgroundPreset {
  name: string;
  gradient: string;
}

export interface ThemeOption {
  id: string;
  name: string;
}

// Curated from uiGradients (MIT, https://uigradients.com): warm, varied hues plus a dark row.
// Each value is a single linear-gradient() so it passes the worker's isValidCssValue() check.
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  // Vivid
  { name: "Radar", gradient: "linear-gradient(135deg, #a770ef, #cf8bf3, #fdb99b)" },
  { name: "Blush", gradient: "linear-gradient(135deg, #b24592, #f15f79)" },
  { name: "Day Tripper", gradient: "linear-gradient(135deg, #f857a6, #ff5858)" },
  { name: "Sweet Morning", gradient: "linear-gradient(135deg, #ff5f6d, #ffc371)" },
  { name: "Ed's Sunset", gradient: "linear-gradient(135deg, #ff7e5f, #feb47b)" },
  { name: "Mango", gradient: "linear-gradient(135deg, #ffe259, #ffa751)" },
  { name: "Wiretap", gradient: "linear-gradient(135deg, #8a2387, #e94057, #f27121)" },
  // Soft
  { name: "Anamnisar", gradient: "linear-gradient(135deg, #9796f0, #fbc7d4)" },
  { name: "Almost", gradient: "linear-gradient(135deg, #ddd6f3, #faaca8)" },
  { name: "Roseanna", gradient: "linear-gradient(135deg, #ffafbd, #ffc3a0)" },
  { name: "Tranquil", gradient: "linear-gradient(135deg, #eecda3, #ef629f)" },
  { name: "Moonrise", gradient: "linear-gradient(135deg, #dae2f8, #d6a4a4)" },
  { name: "Pale Wood", gradient: "linear-gradient(135deg, #eacda3, #d6ae7b)" },
  { name: "Peach Sea", gradient: "linear-gradient(135deg, #e6ae8c, #a8cecf)" },
  // Dark
  { name: "Witching Hour", gradient: "linear-gradient(135deg, #c31432, #240b36)" },
  { name: "Celestial", gradient: "linear-gradient(135deg, #c33764, #1d2671)" },
  { name: "eXpresso", gradient: "linear-gradient(135deg, #ad5389, #3c1053)" },
  { name: "Mauve", gradient: "linear-gradient(135deg, #42275a, #734b6d)" },
  { name: "Taran Tado", gradient: "linear-gradient(135deg, #23074d, #cc5333)" },
  { name: "Hersheys", gradient: "linear-gradient(135deg, #1e130c, #9a8478)" },
  { name: "Transparent", gradient: "transparent" },
];

export const PADDING_OPTIONS = [16, 32, 48, 64, 96] as const;

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
  size: number; // bytes
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
