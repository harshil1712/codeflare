import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import puppeteer from "@cloudflare/puppeteer";
import { createHighlighter, type ShikiTransformer } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { createAuth } from "../lib/auth";
import type { ScreenshotRequest } from "../src/types";

const lineNumberTransformer: ShikiTransformer = {
  line(node, line) {
    node.properties["data-line"] = line;
  },
};

const app = new Hono<{ Bindings: Cloudflare.Env }>();

// Security headers middleware
app.use("/api/*", secureHeaders());

// TODO: Tighten CORS before production — currently allows all origins.
// Replace the origin callback with your actual domain(s), e.g.:
//   origin: (origin) => origin.endsWith('.yourdomain.com') ? origin : 'https://yourdomain.com',
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      return origin;
    },
    allowMethods: ["POST", "GET", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  }),
);

// Better Auth handler — must be after CORS so auth endpoints receive correct headers
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env.DB);
  return auth.handler(c.req.raw);
});

// Rate limiting middleware for all non-auth API routes
app.use("/api/*", async (c, next) => {
  // Skip rate limiting for auth endpoints (handled by better-auth)
  if (c.req.path.startsWith("/api/auth")) {
    return next();
  }
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for") ||
    "unknown";
  const { success } = await c.env.RATE_LIMITER.limit({ key: ip });
  if (!success) {
    return c.json(
      { error: "Rate limit exceeded. Please try again later." },
      429,
    );
  }
  return next();
});

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

// Validate CSS color value
function isValidCssValue(value: string): boolean {
  // Allow hex colors, rgb/rgba, named colors, gradients
  const hexPattern = /^#[0-9a-fA-F]{3,8}$/;
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
  const gradientPattern = /^(linear|radial)-gradient\(([^()]*|\([^()]*\))*\)$/;
  const namedColors =
    /^(transparent|black|white|red|green|blue|yellow|purple|pink|orange|gray|grey)$/i;

  return (
    hexPattern.test(value) ||
    rgbPattern.test(value) ||
    gradientPattern.test(value) ||
    namedColors.test(value)
  );
}

// Module-level cache for Shiki highlighters
const highlighterCache = new Map<
  string,
  ReturnType<typeof createHighlighter>
>();

async function getHighlighter(theme: string, lang: string) {
  const key = `${theme}:${lang}`;
  if (!highlighterCache.has(key)) {
    highlighterCache.set(
      key,
      createHighlighter({
        themes: [theme],
        langs: [lang],
        engine: createJavaScriptRegexEngine(),
      }),
    );
  }
  return highlighterCache.get(key)!;
}

app.post("/api/screenshot", async (c) => {
  try {
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
      action = "download_only",
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
    if (
      !background ||
      typeof background !== "string" ||
      !isValidCssValue(background)
    ) {
      return c.json({ error: "Invalid background value" }, 400);
    }

    // Validate cardBackground CSS value
    if (
      !cardBackground ||
      typeof cardBackground !== "string" ||
      !isValidCssValue(cardBackground)
    ) {
      return c.json({ error: "Invalid cardBackground value" }, 400);
    }

    // Validate padding
    if (
      typeof padding !== "number" ||
      padding < 0 ||
      padding > 200 ||
      !Number.isFinite(padding)
    ) {
      return c.json({ error: "Invalid padding (must be 0-200)" }, 400);
    }

    // Validate fontSize
    if (
      typeof fontSize !== "number" ||
      fontSize < 8 ||
      fontSize > 72 ||
      !Number.isFinite(fontSize)
    ) {
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
      .replace(/<code>\n/g, "<code>")
      .replace(/\n<\/code>/g, "</code>")
      .replace(/\n(?=<span class="line")/g, "");

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
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      });

      // Screenshot just the container element for tight cropping
      const container = await page.$("#container");
      if (!container) {
        return c.json({ error: "Container element not found" }, 500);
      }

      const screenshot = await container.screenshot({
        type: "png",
        omitBackground: background === "transparent",
      });

      // Store in R2 if requested — requires an authenticated session
      if (action === "r2_only" || action === "r2_and_download") {
        const auth = createAuth(c.env.DB);
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });
        if (!session) {
          return c.json(
            { error: "Authentication required to save screenshots" },
            401,
          );
        }

        const key = `screenshots/${session.user.id}/${Date.now()}-${crypto.randomUUID()}.png`;
        await c.env.SCREENSHOTS.put(key, screenshot, {
          httpMetadata: { contentType: "image/png" },
        });

        if (action === "r2_only") {
          return c.json({ success: true, key });
        }
      }

      // Download: return raw PNG bytes
      return new Response(screenshot, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="codeflare-${Date.now()}.png"`,
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
      500,
    );
  }
});

// List all saved screenshots — requires authentication
app.get("/api/screenshots", async (c) => {
  const auth = createAuth(c.env.DB);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    const listed = await c.env.SCREENSHOTS.list({
      prefix: `screenshots/${session.user.id}/`,
    });
    const screenshots = listed.objects.map((obj) => ({
      key: obj.key,
      uploaded: obj.uploaded.toISOString(),
      size: obj.size,
    }));
    return c.json({ screenshots });
  } catch (error) {
    console.error("List screenshots error:", error);
    return c.json({ error: "Failed to list screenshots" }, 500);
  }
});

// Serve a single screenshot from R2 — requires authentication and ownership
app.get("/api/screenshots/*", async (c) => {
  const auth = createAuth(c.env.DB);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Authentication required" }, 401);
  }

  // Use the raw URL so percent-encoded slashes (%2F) are preserved before decoding,
  // ensuring the full R2 key (e.g. "screenshots/userId/foo.png") is reconstructed correctly.
  const rawPath = new URL(c.req.raw.url).pathname;
  const key = decodeURIComponent(rawPath.replace(/^\/api\/screenshots\//, ""));
  if (!key) {
    return c.json({ error: "Missing screenshot key" }, 400);
  }

  // Verify the key belongs to the authenticated user
  if (!key.startsWith(`screenshots/${session.user.id}/`)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    const object = await c.env.SCREENSHOTS.get(key);
    if (!object) {
      return c.json({ error: "Screenshot not found" }, 404);
    }

    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set("Cache-Control", "private, max-age=31536000, immutable");

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Get screenshot error:", error);
    return c.json({ error: "Failed to retrieve screenshot" }, 500);
  }
});

// Delete a screenshot from R2 — requires authentication
app.delete("/api/screenshots/*", async (c) => {
  const auth = createAuth(c.env.DB);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const rawPath = new URL(c.req.raw.url).pathname;
  const key = decodeURIComponent(rawPath.replace(/^\/api\/screenshots\//, ""));
  if (!key) {
    return c.json({ error: "Missing screenshot key" }, 400);
  }

  // Verify the key belongs to the authenticated user
  if (!key.startsWith(`screenshots/${session.user.id}/`)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    await c.env.SCREENSHOTS.delete(key);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete screenshot error:", error);
    return c.json({ error: "Failed to delete screenshot" }, 500);
  }
});

// AI Search — search saved screenshots by code content
const AI_SEARCH_INSTANCE = "codeflare-search";

app.get("/api/search", async (c) => {
  const auth = createAuth(c.env.DB);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const query = c.req.query("q");
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return c.json({ error: "Query parameter 'q' is required" }, 400);
  }

  if (query.length > 500) {
    return c.json({ error: "Query too long (max 500 characters)" }, 400);
  }

  const userPrefix = `screenshots/${session.user.id}/`;

  try {
    const result = await c.env.AI.autorag(AI_SEARCH_INSTANCE).search({
      query: query.trim(),
      max_num_results: 10,
      rewrite_query: true,
      filters: {
        type: "and",
        filters: [
          { type: "gt", key: "folder", value: `${userPrefix}/` },
          { type: "lte", key: "folder", value: `${userPrefix}z` },
        ],
      },
    });

    return c.json({
      search_query: result.search_query,
      data: result.data,
      has_more: result.has_more,
    });
  } catch (error) {
    console.error("AI Search error:", error);
    return c.json({ error: "Search failed" }, 500);
  }
});

app.get("/api/", (c) => {
  return c.json({
    name: "CodeFlare API",
    version: "1.0.0",
    endpoints: ["/api/screenshot", "/api/screenshots", "/api/search"],
  });
});

export default app;
