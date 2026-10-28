import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Slider, Switch, Tabs, Text } from "@cloudflare/kumo";
import { Shuffle } from "@phosphor-icons/react";
import Preview from "../components/Preview";
import ThemeSelector from "../components/ThemeSelector";
import BackgroundSelector from "../components/BackgroundSelector";
import LanguageSelector from "../components/LanguageSelector";
import ExportButton from "../components/ExportButton";
import CardColorInput from "../components/CardColorInput";
import InspectorSection from "../components/InspectorSection";
import InspectorRow from "../components/InspectorRow";
import { BACKGROUND_PRESETS, PADDING_OPTIONS } from "../types";
import type { ScreenshotOptions } from "../types";

const DEFAULT_CODE = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("CodeFlare"));`;

/** Export renders at deviceScaleFactor 2 (see worker/index.ts). */
const EXPORT_SCALE = 2;

const PADDING_TABS = PADDING_OPTIONS.map((p) => ({ value: String(p), label: String(p) }));

function hexToRgba(hex: string, opacity: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `rgba(30, 30, 46, ${opacity / 100})`;
  }
  const clampedOpacity = Math.max(0, Math.min(100, opacity));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity / 100})`;
}

function sliderValue(v: number | readonly number[]): number {
  return typeof v === "number" ? v : v[0];
}

function EditorPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("typescript");
  const [theme, setTheme] = useState("github-dark");
  const [background, setBackground] = useState(BACKGROUND_PRESETS[0].gradient);
  const [padding, setPadding] = useState<number>(48);
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [windowTitle, setWindowTitle] = useState("code.tsx");
  const [cardColor, setCardColor] = useState("#1e1e2e");
  const [cardOpacity, setCardOpacity] = useState(100);

  // Live size of the framed preview, shown as the approximate export resolution.
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setFrameSize({ width: el.offsetWidth, height: el.offsetHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cardBackground = useMemo(() => hexToRgba(cardColor, cardOpacity), [cardColor, cardOpacity]);
  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const presetName = BACKGROUND_PRESETS.find((p) => p.gradient === background)?.name;

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

  const shuffleBackground = () => {
    const others = BACKGROUND_PRESETS.filter(
      (p) => p.gradient !== background && p.gradient !== "transparent",
    );
    setBackground(others[Math.floor(Math.random() * others.length)].gradient);
  };

  const isTransparent = background === "transparent";

  return (
    <div className="editor">
      <main className="editor-canvas">
        <div className="stage">
          <div className="stage-meta">
            <Text variant="mono-secondary" truncate>
              {windowTitle || "untitled"} · {lineCount} {lineCount === 1 ? "line" : "lines"}
              {presetName ? ` · ${presetName}` : ""}
            </Text>
            {frameSize.width > 0 && (
              <Text variant="mono-secondary">
                <span className="stage-meta-size">
                  {frameSize.width * EXPORT_SCALE} × {frameSize.height * EXPORT_SCALE}
                </span>{" "}
                · {EXPORT_SCALE}x
              </Text>
            )}
          </div>

          <div
            ref={frameRef}
            className={`stage-frame${isTransparent ? " stage-frame-transparent" : ""}`}
            style={{ background: isTransparent ? undefined : background, padding }}
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

          <span className="stage-handle stage-handle-tl" aria-hidden="true" />
          <span className="stage-handle stage-handle-tr" aria-hidden="true" />
          <span className="stage-handle stage-handle-bl" aria-hidden="true" />
          <span className="stage-handle stage-handle-br" aria-hidden="true" />
        </div>
      </main>

      <aside className="inspector" aria-label="Screenshot settings">
        <div className="inspector-scroll">
          <InspectorSection title="Code">
            <InspectorRow label="Language">
              <LanguageSelector value={language} onChange={setLanguage} />
            </InspectorRow>
            <InspectorRow label="Theme">
              <ThemeSelector value={theme} onChange={setTheme} />
            </InspectorRow>
            <Slider
              label="Font size"
              size="sm"
              min={10}
              max={24}
              value={fontSize}
              onValueChange={(v) => setFontSize(sliderValue(v))}
            />
            <InspectorRow label="Line numbers">
              <Switch
                variant="neutral"
                size="sm"
                checked={showLineNumbers}
                onCheckedChange={setShowLineNumbers}
                aria-label="Show line numbers"
              />
            </InspectorRow>
          </InspectorSection>

          <InspectorSection title="Window">
            <InspectorRow label="Title" htmlFor="window-title">
              <Input
                id="window-title"
                size="sm"
                className="inspector-control mono-input"
                value={windowTitle}
                onChange={(e) => setWindowTitle(e.target.value)}
                placeholder="code.tsx"
                maxLength={200}
                spellCheck={false}
              />
            </InspectorRow>
            <InspectorRow label="Fill" htmlFor="card-color">
              <CardColorInput id="card-color" value={cardColor} onChange={setCardColor} />
            </InspectorRow>
            <Slider
              label="Opacity"
              size="sm"
              min={0}
              max={100}
              value={cardOpacity}
              onValueChange={(v) => setCardOpacity(sliderValue(v))}
              format={{ style: "unit", unit: "percent" }}
            />
          </InspectorSection>

          <InspectorSection
            title="Canvas"
            action={
              <Button variant="ghost" size="xs" icon={Shuffle} onClick={shuffleBackground}>
                Shuffle
              </Button>
            }
          >
            <BackgroundSelector value={background} onChange={setBackground} />
            <InspectorRow label="Padding">
              <Tabs
                variant="segmented"
                size="sm"
                className="inspector-control"
                tabs={PADDING_TABS}
                value={String(padding)}
                onValueChange={(v) => setPadding(Number(v))}
              />
            </InspectorRow>
          </InspectorSection>
        </div>

        <footer className="inspector-footer">
          <ExportButton options={screenshotOptions} />
        </footer>
      </aside>
    </div>
  );
}

export default EditorPage;
