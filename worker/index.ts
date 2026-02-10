import { Hono } from "hono";
import { cors } from "hono/cors";
import puppeteer from "@cloudflare/puppeteer";
import { createHighlighter, type ShikiTransformer } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const lineNumberTransformer: ShikiTransformer = {
  line(node, line) {
    node.properties['data-line'] = line;
  }
};

interface AppEnv {
  Bindings: {
    BROWSER: Fetcher;
  };
}

const app = new Hono<AppEnv>();

app.use("/api/*", cors());

interface ScreenshotRequest {
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

app.post("/api/screenshot", async (c) => {
  try {
    const body = await c.req.json<ScreenshotRequest>();
    const {
      code,
      language,
      theme,
      background,
      padding = 48,
      fontSize = 14,
      showLineNumbers = true,
      windowTitle = "code.tsx",
      cardBackground = "#1e1e2e",
    } = body;

    if (!code) {
      return c.json({ error: "Code is required" }, 400);
    }

    // Initialize Shiki highlighter
    const highlighter = await createHighlighter({
      themes: [theme],
      langs: [language],
      engine: createJavaScriptRegexEngine(),
    });

    // Generate highlighted HTML
    const highlighted = highlighter.codeToHtml(code, {
      lang: language,
      theme: theme,
      transformers: showLineNumbers ? [lineNumberTransformer] : [],
    });
    
    // Strip leading/trailing newlines inside <code> to prevent cursor offset
    const html = highlighted.replace(/<code>\n/g, '<code>').replace(/\n<\/code>/g, '</code>');

    // Build self-contained HTML page for screenshot
    const screenshotHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ui-monospace, 'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
      background: ${background};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${padding}px;
      min-height: 100vh;
    }
    
    .window {
      background: ${cardBackground};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    }
    
    .title-bar {
      background: rgba(255, 255, 255, 0.1);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }
    
    .title {
      margin-left: 8px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      font-weight: 500;
    }
    
    .code-container {
      padding: 24px;
    }
    
    pre {
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      font-size: ${fontSize}px !important;
      line-height: 1.6 !important;
    }
    
    code {
      font-family: inherit !important;
    }
    
    .line {
      display: block;
      position: relative;
      padding-left: 3.5em;
    }
    
    .line::before {
      content: attr(data-line);
      position: absolute;
      left: 0;
      width: 2.5em;
      text-align: right;
      padding-right: 1em;
      color: rgba(255, 255, 255, 0.3);
      user-select: none;
    }
    
    ${!showLineNumbers ? ".line::before { display: none !important; } .line { padding-left: 0 !important; }" : ""}
  </style>
</head>
<body>
  <div class="window">
    <div class="title-bar">
      <div class="dot dot-red"></div>
      <div class="dot dot-yellow"></div>
      <div class="dot dot-green"></div>
      <div class="title">${windowTitle}</div>
    </div>
    <div class="code-container">
      ${html}
    </div>
  </div>
</body>
</html>`;

    // Launch browser and take screenshot
    const browser = await puppeteer.launch(c.env.BROWSER as Fetcher);
    const page = await browser.newPage();

    await page.setContent(screenshotHtml);
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

    const screenshot = await page.screenshot({
      type: "png",
      omitBackground: background === "transparent",
    });

    await browser.close();

    return new Response(screenshot, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Screenshot error:", error);
    return c.json(
      {
        error: "Failed to generate screenshot",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

app.get("/api/", (c) => {
  return c.json({
    name: "CodeShot API",
    version: "1.0.0",
    endpoints: ["/api/screenshot"],
  });
});

export default app;
