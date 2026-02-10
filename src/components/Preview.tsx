import { useEffect, useState } from "react";
import { createHighlighter, type Highlighter } from "shiki";
import Editor from "react-simple-code-editor";
import WindowCard from "./WindowCard";

interface PreviewProps {
  code: string;
  language: string;
  theme: string;
  windowTitle: string;
  fontSize: number;
  cardBackground: string;
  showLineNumbers: boolean;
  onChange: (code: string) => void;
}

function Preview({
  code,
  language,
  theme,
  windowTitle,
  fontSize,
  cardBackground,
  showLineNumbers,
  onChange,
}: PreviewProps) {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");

  // Create highlighter when theme or language changes
  useEffect(() => {
    createHighlighter({
      themes: [theme],
      langs: [language],
    }).then((h) => setHighlighter(h));
  }, [theme, language]);

  // Generate highlighted HTML when code, language, or theme changes
  useEffect(() => {
    if (!highlighter) {
      setHighlightedHtml("");
      return;
    }

    try {
      let html = highlighter.codeToHtml(code || " ", {
        lang: language,
        theme: theme,
      });
      
      // Extract inner HTML from Shiki's <pre><code>...</code></pre>
      // react-simple-code-editor provides its own <pre>, so we only need the inner content
      const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
      if (match) {
        html = match[1];
      }
      
      setHighlightedHtml(html);
    } catch (error) {
      console.error("Highlighting error:", error);
      setHighlightedHtml(code);
    }
  }, [highlighter, code, language, theme]);

  // Generate line numbers for the gutter
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className="preview-container">
      <WindowCard title={windowTitle} background={cardBackground}>
        <div className="editor-wrapper">
          {showLineNumbers && (
            <div className="line-gutter" aria-hidden="true">
              {lineNumbers}
            </div>
          )}
          <Editor
            value={code}
            onValueChange={onChange}
            highlight={() => highlightedHtml}
            padding={0}
            style={{
              fontFamily: 'ui-monospace, "Fira Code", "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
              fontSize: `${fontSize}px`,
              lineHeight: '1.6',
              minHeight: '200px',
            }}
            textareaClassName="code-textarea"
            preClassName="code-pre"
          />
        </div>
      </WindowCard>
    </div>
  );
}

export default Preview;
