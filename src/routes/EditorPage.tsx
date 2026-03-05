import { useState, useMemo } from "react";
import { Input, Label, Surface, Switch } from "@cloudflare/kumo";
import { Slider } from "@cloudflare/kumo/primitives/slider";
import Preview from "../components/Preview";
import ThemeSelector from "../components/ThemeSelector";
import BackgroundSelector from "../components/BackgroundSelector";
import LanguageSelector from "../components/LanguageSelector";
import ExportButton from "../components/ExportButton";
import { BACKGROUND_PRESETS } from "../types";
import type { ScreenshotOptions } from "../types";
import "../App.css";

const DEFAULT_CODE = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("CodeFlare"));`;

function hexToRgba(hex: string, opacity: number): string {
  // Validate hex format
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(30, 30, 46, ${opacity / 100})`; // Default fallback
  }

  // Validate opacity range
  const clampedOpacity = Math.max(0, Math.min(100, opacity));

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity / 100})`;
}

function EditorPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("typescript");
  const [theme, setTheme] = useState("github-dark");
  const [background, setBackground] = useState(BACKGROUND_PRESETS[0].gradient);
  const [padding, setPadding] = useState(48);
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [windowTitle, setWindowTitle] = useState("code.tsx");
  const [cardColor, setCardColor] = useState("#1e1e2e");
  const [cardOpacity, setCardOpacity] = useState(100);

  const cardBackground = useMemo(
    () => hexToRgba(cardColor, cardOpacity),
    [cardColor, cardOpacity],
  );

  const screenshotOptions: ScreenshotOptions = useMemo(
    () => ({
      code,
      language,
      theme,
      background,
      padding,
      fontSize,
      showLineNumbers,
      windowTitle,
      cardBackground,
    }),
    [
      code,
      language,
      theme,
      background,
      padding,
      fontSize,
      showLineNumbers,
      windowTitle,
      cardBackground,
    ],
  );

  return (
    <div className="app">
      <div className="app-sidebar">
        <Surface className="control-panel">
          <h2 className="section-title">Customization</h2>

          <div className="control-group">
            <Input
              id="window-title"
              label="Window Title"
              type="text"
              value={windowTitle}
              onChange={(e) => setWindowTitle(e.target.value)}
              placeholder="code.tsx"
              maxLength={200}
            />
          </div>

          <LanguageSelector value={language} onChange={setLanguage} />
          <ThemeSelector value={theme} onChange={setTheme} />

          <div className="control-group">
            <Label className="control-label">Font Size: {fontSize}px</Label>
            <Slider.Root
              min={10}
              max={24}
              step={1}
              value={fontSize}
              onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
              aria-label={`Font size: ${fontSize} pixels`}
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Indicator />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          </div>

          <div className="control-group">
            <Label className="control-label">Padding: {padding}px</Label>
            <Slider.Root
              min={16}
              max={96}
              step={1}
              value={padding}
              onValueChange={(v) => setPadding(Array.isArray(v) ? v[0] : v)}
              aria-label={`Padding: ${padding} pixels`}
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Indicator />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          </div>

          <div className="control-group">
            <Switch
              label="Show line numbers"
              checked={showLineNumbers}
              onCheckedChange={setShowLineNumbers}
              controlFirst={false}
            />
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="card-color">
              Card Color: {cardColor}
            </label>
            <input
              id="card-color"
              type="color"
              value={cardColor}
              onChange={(e) => setCardColor(e.target.value)}
              className="control-color"
              aria-label="Card background color"
            />
          </div>

          <div className="control-group">
            <Label className="control-label">Card Opacity: {cardOpacity}%</Label>
            <Slider.Root
              min={0}
              max={100}
              step={1}
              value={cardOpacity}
              onValueChange={(v) => setCardOpacity(Array.isArray(v) ? v[0] : v)}
              aria-label={`Card opacity: ${cardOpacity} percent`}
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Indicator />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
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
            padding: `${padding}px`,
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

export default EditorPage;
