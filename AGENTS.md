# AGENTS.md – Coding Guidelines for Agent-Based Development

## Project Overview

**CodeFlare** – a full-stack tool for generating beautiful code screenshots.
Users paste code into the editor, configure styling, and export a PNG via a
headless-browser screenshot pipeline running on Cloudflare Workers.

- **Frontend**: React 19 SPA (TypeScript, Vite + SWC) in `src/`
- **Backend**: Cloudflare Worker API using Hono 4.11 (TypeScript) in `worker/`
- **Deployment**: Cloudflare Pages (frontend) + Cloudflare Workers (backend via Wrangler)
- **Package Manager**: npm
- **TypeScript Version**: ~5.8.3 (strict mode enforced)

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `shiki` | Syntax highlighting (used in both frontend preview and worker) |
| `@cloudflare/kumo` | Cloudflare UI kit (Button, Input, Select, Switch, Surface) |
| `@cloudflare/puppeteer` | Headless browser for server-side PNG generation |
| `@phosphor-icons/react` | Icon library |
| `react-simple-code-editor` | Textarea-based code editor with highlight overlay |
| `hono` | HTTP framework for the Cloudflare Worker API |

## Architecture

The project uses **TypeScript project references** across three `tsconfig` files:
- `tsconfig.app.json` – Frontend (ES2022, DOM + JSX)
- `tsconfig.node.json` – Build tooling (ES2023)
- `tsconfig.worker.json` – Cloudflare Worker (extends node config)

Frontend and backend are loosely coupled:
- Frontend (`src/App.tsx`) fetches from `/api/screenshot`
- Worker (`worker/index.ts`) serves the API via Hono
- Wrangler bundles both together; frontend assets are served by Workers as SPA
- **`src/types.ts`** is the canonical location for shared interfaces, types, and constants
  (`ScreenshotOptions`, `ExportAction`, `BACKGROUND_PRESETS`, `THEME_OPTIONS`, etc.)

## Build, Lint, and Test Commands

```bash
npm run dev          # Start Vite dev server with HMR (localhost:5173)
npm run build        # Type-check (tsc -b) then bundle frontend + worker
npm run lint         # Run ESLint on all .ts/.tsx files (flat config)
npm run preview      # Build and preview production locally
npm run deploy       # Build and deploy to Cloudflare Workers + Pages
npm run cf-typegen   # Regenerate Cloudflare Worker types (worker-configuration.d.ts)
```

**No test framework is currently configured.** To add tests, use Vitest (Vite-native).

**Quick checks**: `npx eslint src/App.tsx` (single file) or `npm run build` (full type-check).

## Code Style Guidelines

### TypeScript & Compilation

- **Strict mode** – `strict: true` in all tsconfigs
- **No unused variables** – `noUnusedLocals: true`, `noUnusedParameters: true`
- **`verbatimModuleSyntax: true`** – type-only imports **must** use `import type`:
  ```ts
  import type { ScreenshotOptions } from "../types";
  ```
- **`erasableSyntaxOnly: true`** – avoid TypeScript-only syntax that requires emit (e.g., `enum`, `namespace`)
- **`noUncheckedSideEffectImports: true`** – all side-effect imports must be intentional
- **JSX mode** – `jsx: "react-jsx"` (automatic transform; never import React explicitly)
- **Non-null assertions** – allowed but use sparingly; only when existence is guaranteed

### Formatting

| Aspect | Style | Notes |
|--------|-------|-------|
| **Indentation** | 2 spaces | All `.ts`, `.tsx`, `.js` files |
| **Quotes** | Double `"` | Prefer double quotes in code |
| **Semicolons** | Yes | End all statements with semicolons |
| **Trailing commas** | Yes | In objects, arrays, and JSX props |
| **Line length** | Soft limit 100 cols | No hard enforce; be reasonable |

No Prettier is configured. Follow `src/App.tsx` as the reference for formatting style.

### Imports

**Order and grouping:**
1. External packages (`react`, `hono`, `@cloudflare/kumo`, `shiki`)
2. Local components and modules (`./components/Preview`, `../types`)
3. Type-only imports (`import type { ... }`)
4. CSS and asset imports (`./App.css`)

**Example** (from `src/App.tsx`):
```tsx
import { useState, useMemo } from "react";
import { Button, Select } from "@cloudflare/kumo";

import { Preview } from "./components/Preview";
import { BACKGROUND_PRESETS } from "./types";
import type { ScreenshotOptions } from "./types";
import "./App.css";
```

- **Named imports** from packages: `{ useState }`, `{ Hono }`
- **Default imports** for local components: `import App from "./App"`
- No path aliases configured; use relative paths (`./`, `../`)
- Always use `import type` for type-only imports (`verbatimModuleSyntax` enforces this)

### Naming Conventions

| Element | Convention | Examples |
|---------|-----------|----------|
| React components | PascalCase | `App.tsx`, `WindowCard.tsx` |
| Component files | `.tsx` extension | `Preview.tsx` |
| Variables & functions | camelCase | `count`, `setCount`, `handleClick` |
| Directories | lowercase | `src/`, `worker/`, `components/` |
| CSS classes | kebab-case | `card-title`, `sidebar-panel` |
| Constants | UPPER_SNAKE_CASE | `BACKGROUND_PRESETS`, `THEME_OPTIONS` |
| Type/interface names | PascalCase | `interface ScreenshotOptions`, `type ExportAction` |

### Type Annotations

- **Interfaces for objects**, **types for unions/aliases**:
  ```ts
  interface ScreenshotOptions { code: string; language: string; }
  type ExportAction = "r2_only" | "r2_and_download" | "download_only";
  ```
- **Inline type assertions** are acceptable: `res.json() as { error?: string }`
- **Type definition files** (`.d.ts`) live in the project root or alongside their modules
- **Shared types and constants** belong in `src/types.ts`; import from there rather than
  redefining locally

### React Component Patterns

- **Functional components only** – use `function` keyword, not arrow functions:
  ```tsx
  function Preview({ code, language }: PreviewProps) {
    const [highlighted, setHighlighted] = useState("");
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  }
  export default Preview;
  ```
- **`ErrorBoundary` is the sole class component** – class components are only acceptable
  when React lifecycle methods unavailable to hooks are required (e.g., `getDerivedStateFromError`)
- **Hooks**: `useState`, `useEffect`, `useMemo` — prefer these over external state libraries
- **Fragment shorthand** – `<>...</>` not `<React.Fragment>`
- **Export at bottom** – `export default ComponentName;`
- **StrictMode enabled** in `main.tsx` for dev-time checks

### Async Patterns

**Cancellation in `useEffect`** – use a cancelled flag to avoid state updates after unmount:
```tsx
useEffect(() => {
  let cancelled = false;
  async function load() {
    const result = await expensiveOp();
    if (!cancelled) setState(result);
  }
  load();
  return () => { cancelled = true; };
}, [dep]);
```

**Module-level caching in the Worker** – use a `Map` at module scope to cache
expensive-to-create objects (e.g., Shiki highlighters) across requests:
```ts
const highlighterCache = new Map<string, Highlighter>();
```

### Error Handling

- **Frontend**: try/catch in async functions; `ErrorBoundary` at the root for React render errors
- **Backend (Hono)**: `c.json({ error: "..." }, statusCode)` for API errors; top-level
  try/catch in route handlers; `finally` block to always release Puppeteer resources
- **Type safety**: leverage TypeScript strict mode over runtime checks where possible
- **Avoid `alert()`** for error reporting; prefer in-component state-driven UI feedback

### Exports

- **Default exports** for: React components, config files, the Hono app instance
- **Named exports** for: utilities, types, constants, hooks
  ```ts
  export default app;                         // Hono worker
  export function formatDate(d: Date) { ... } // utility
  export type { ApiError };                   // type
  export { BACKGROUND_PRESETS };              // constant
  ```

## Cloudflare Worker

### Bindings (defined in `wrangler.jsonc`)

| Binding | Type | Purpose |
|---------|------|---------|
| `BROWSER` | Browser Rendering | Puppeteer launch for screenshot generation |
| `SCREENSHOTS` | R2 Bucket (`codeflare-screenshots`) | Optional persistent screenshot storage |
| `RATE_LIMITER` | Rate Limit (10 req / 60 s) | Per-IP abuse prevention |

Type them via the `AppEnv` interface in `worker/index.ts`:
```ts
interface AppEnv {
  Bindings: { BROWSER: Fetcher; SCREENSHOTS: R2Bucket; RATE_LIMITER: RateLimit; };
}
const app = new Hono<AppEnv>();
```

Regenerate `worker-configuration.d.ts` with `npm run cf-typegen` after any `wrangler.jsonc` changes.

### Security Conventions

- Validate and sanitize all request body fields before use
- Escape user-controlled strings inserted into generated HTML (`escapeHtml()`)
- Include a `Content-Security-Policy` header in any HTML generated server-side
- Check `RATE_LIMITER` at the top of every user-facing route

## CSS Conventions

- **Plain CSS only** – no Tailwind, no CSS Modules, no preprocessors
- **Dark-first design** – base background `#111111`, sidebar `#161616`
- **Brand accent**: Cloudflare orange `#F6821F` for active states, focus rings, scrollbars
- Component styles live in `App.css` (organized with comment banners); global reset in `index.css`
- CSS class names are kebab-case globals (no scoping)

## ESLint Configuration

- **Flat config** in `eslint.config.js` (ESLint 9+), targeting `**/*.{ts,tsx}`
- **Enforced rulesets**: `@eslint/js` recommended, `typescript-eslint` recommended,
  `eslint-plugin-react-hooks` recommended-latest, `eslint-plugin-react-refresh` vite preset
- **Ignored**: `dist/`
- **Run**: `npm run lint` or `npx eslint .`

## Notes for Agents

- **Run `npm run build` before finishing** – it type-checks all three tsconfig targets together
- **No test framework exists** – focus on type correctness (`tsc -b`) and linting (`eslint .`)
- **`src/types.ts` is the source of truth** for shared interfaces, union types, and constants;
  add new shared types there rather than defining them inline or in component files
- **`verbatimModuleSyntax`** will cause a compile error if you forget `import type` on
  type-only imports — always check after adding imports
- **Avoid enums and namespaces** (`erasableSyntaxOnly` flag); use union types and plain objects
- **Regenerate CF types** (`npm run cf-typegen`) when modifying `wrangler.jsonc`
- **CORS** in `worker/index.ts` currently allows all origins — tighten before production use
- Follow `src/App.tsx` as the formatting reference; scaffold files may be inconsistent
