import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
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

// Security headers middleware
app.use("/api/*", secureHeaders());

// CORS configuration - restrict to your domain(s) in production
// Change this to your actual domain(s) before deploying
app.use("/api/*", cors({
  origin: (origin) => {
    // Allow all origins in development, or specify your domains
    // Example: return origin.endsWith('.yourdomain.com') ? origin : 'https://yourdomain.com';
    return origin;
  },
  allowMethods: ["POST", "GET", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  maxAge: 86400,
}));

// Simple rate limiter using module-level Map (persists across requests in same isolate)
// PRODUCTION RECOMMENDATION: Use one of these instead:
// 1. Cloudflare Rate Limiting Rules (https://developers.cloudflare.com/waf/rate-limiting-rules/)
// 2. Cloudflare Durable Objects for distributed rate limiting
// 3. Cloudflare KV with expiring keys
// This implementation is suitable for moderate traffic but may not scale for high traffic
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  // Lazy cleanup: periodically clear old entries to prevent memory growth
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  // Check if this IP has a rate limit record
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

// Validate CSS color value
function isValidCssValue(value: string): boolean {
  // Allow hex colors, rgb/rgba, named colors, gradients
  const hexPattern = /^#[0-9a-fA-F]{3,8}$/;
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
  const gradientPattern = /^(linear|radial)-gradient\([^)]+\)$/;
  const namedColors = /^(transparent|black|white|red|green|blue|yellow|purple|pink|orange|gray|grey)$/i;
  
  return hexPattern.test(value) || 
         rgbPattern.test(value) || 
         gradientPattern.test(value) || 
         namedColors.test(value);
}

// Module-level cache for Shiki highlighters
const highlighterCache = new Map<string, ReturnType<typeof createHighlighter>>();

async function getHighlighter(theme: string, lang: string) {
  const key = `${theme}:${lang}`;
  if (!highlighterCache.has(key)) {
    highlighterCache.set(key, createHighlighter({
      themes: [theme],
      langs: [lang],
      engine: createJavaScriptRegexEngine(),
    }));
  }
  return highlighterCache.get(key)!;
}

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
    // Rate limiting
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return c.json({ error: "Rate limit exceeded. Please try again later." }, 429);
    }

    // Parse and validate JSON
    let body: ScreenshotRequest;
    try {
      body = await c.req.json<ScreenshotRequest>();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

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

    // Validate required field
    if (!code || typeof code !== "string") {
      return c.json({ error: "Code is required and must be a string" }, 400);
    }

    // Validate code length (max 50KB)
    if (code.length > 50000) {
      return c.json({ error: "Code is too long (max 50KB)" }, 400);
    }

    // Validate language
    if (!language || typeof language !== "string" || language.length > 50) {
      return c.json({ error: "Invalid language" }, 400);
    }

    // Validate theme
    if (!theme || typeof theme !== "string" || theme.length > 100) {
      return c.json({ error: "Invalid theme" }, 400);
    }

    // Validate background CSS value
    if (!background || typeof background !== "string" || !isValidCssValue(background)) {
      return c.json({ error: "Invalid background value" }, 400);
    }

    // Validate cardBackground CSS value
    if (!cardBackground || typeof cardBackground !== "string" || !isValidCssValue(cardBackground)) {
      return c.json({ error: "Invalid cardBackground value" }, 400);
    }

    // Validate padding
    if (typeof padding !== "number" || padding < 0 || padding > 200 || !Number.isFinite(padding)) {
      return c.json({ error: "Invalid padding (must be 0-200)" }, 400);
    }

    // Validate fontSize
    if (typeof fontSize !== "number" || fontSize < 8 || fontSize > 72 || !Number.isFinite(fontSize)) {
      return c.json({ error: "Invalid fontSize (must be 8-72)" }, 400);
    }

    // Validate windowTitle length
    if (typeof windowTitle !== "string" || windowTitle.length > 200) {
      return c.json({ error: "Invalid windowTitle (max 200 characters)" }, 400);
    }

    // Sanitize windowTitle to prevent XSS
    const safeWindowTitle = escapeHtml(windowTitle);

    // Initialize Shiki highlighter (using cache)
    const highlighter = await getHighlighter(theme, language);

    // Generate highlighted HTML
    const highlighted = highlighter.codeToHtml(code, {
      lang: language,
      theme: theme,
      transformers: showLineNumbers ? [lineNumberTransformer] : [],
    });
    
    // Strip leading/trailing newlines inside <code> to prevent cursor offset
    // Also strip newlines between .line spans to prevent extra spacing
    const html = highlighted
      .replace(/<code>\n/g, '<code>')
      .replace(/\n<\/code>/g, '</code>')
      .replace(/\n(?=<span class="line")/g, '');

    // Build self-contained HTML page for screenshot
    const screenshotHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none';">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ui-monospace, 'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    
    #container {
      display: inline-block;
      background: ${background};
      padding: ${padding}px;
      border-radius: 12px;
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
  <div id="container">
    <div class="window">
      <div class="title-bar">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
        <div class="title">${safeWindowTitle}</div>
      </div>
      <div class="code-container">
        ${html}
      </div>
    </div>
  </div>
</body>
</html>`;

    // Launch browser and take screenshot
    let browser;
    try {
      browser = await puppeteer.launch(c.env.BROWSER as Fetcher);
      const page = await browser.newPage();

      await page.setContent(screenshotHtml, { timeout: 10000 });
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

      // Screenshot just the container element for tight cropping
      const container = await page.$('#container');
      if (!container) {
        return c.json({ error: "Container element not found" }, 500);
      }

      const screenshot = await container.screenshot({
        type: "png",
        omitBackground: background === "transparent",
      });

      return new Response(screenshot, {
        headers: {
          "Content-Type": "image/png",
        },
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error("Screenshot error:", error);
    return c.json(
      {
        error: "Failed to generate screenshot",
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
