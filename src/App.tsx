import { useState } from "react";
import { Input, Surface } from "@cloudflare/kumo";
import Preview from "./components/Preview";
import ThemeSelector from "./components/ThemeSelector";
import BackgroundSelector from "./components/BackgroundSelector";
import LanguageSelector from "./components/LanguageSelector";
import ExportButton from "./components/ExportButton";
import { BACKGROUND_PRESETS } from "./types";
import type { ScreenshotOptions } from "./types";
import "./App.css";

const DEFAULT_CODE = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));`;

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("typescript");
  const [theme, setTheme] = useState("github-dark");
  const [background, setBackground] = useState(BACKGROUND_PRESETS[1].gradient);
  const [padding, setPadding] = useState(48);
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [windowTitle, setWindowTitle] = useState("code.tsx");
  const [cardColor, setCardColor] = useState("#1e1e2e");
  const [cardOpacity, setCardOpacity] = useState(100);

  const cardBackground = hexToRgba(cardColor, cardOpacity);

  const screenshotOptions: ScreenshotOptions = {
    code,
    language,
    theme,
    background,
    padding,
    fontSize,
    showLineNumbers,
    windowTitle,
    cardBackground,
  };

  return (
    <div className="app">
      <div className="app-sidebar">
        <div className="app-header">
          <h1 className="app-title">CodeShot</h1>
          <p className="app-subtitle">Beautiful code screenshots</p>
        </div>

        <Surface className="control-panel">
          <h2 className="section-title">Customization</h2>

          <div className="control-group">
            <label className="control-label">Window Title</label>
            <Input
              type="text"
              value={windowTitle}
              onChange={(e) => setWindowTitle(e.target.value)}
              placeholder="code.tsx"
            />
          </div>

          <LanguageSelector value={language} onChange={setLanguage} />
          <ThemeSelector value={theme} onChange={setTheme} />

          <div className="control-group">
            <label className="control-label">Font Size: {fontSize}px</label>
            <input
              type="range"
              min="10"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="control-range"
            />
          </div>

          <div className="control-group">
            <label className="control-label">Padding: {padding}px</label>
            <input
              type="range"
              min="16"
              max="96"
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              className="control-range"
            />
          </div>

          <div className="control-group">
            <label className="control-checkbox">
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
              />
              <span>Show line numbers</span>
            </label>
          </div>

          <div className="control-group">
            <label className="control-label">Card Color: {cardColor}</label>
            <input
              type="color"
              value={cardColor}
              onChange={(e) => setCardColor(e.target.value)}
              className="control-color"
            />
          </div>

          <div className="control-group">
            <label className="control-label">Card Opacity: {cardOpacity}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={cardOpacity}
              onChange={(e) => setCardOpacity(Number(e.target.value))}
              className="control-range"
            />
          </div>

          <BackgroundSelector value={background} onChange={setBackground} />
        </Surface>

        <div className="export-section">
          <ExportButton options={screenshotOptions} />
        </div>
      </div>

      <div className="app-main">
        <div
          className="preview-background"
          style={{ 
            background: background,
            padding: `${padding}px`
          }}
        >
          <Preview
            code={code}
            language={language}
            theme={theme}
            windowTitle={windowTitle}
            fontSize={fontSize}
            cardBackground={cardBackground}
            showLineNumbers={showLineNumbers}
            onChange={setCode}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
