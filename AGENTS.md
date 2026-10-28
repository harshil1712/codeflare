# AGENTS.md – Coding Guidelines for Agent-Based Development

## Project Overview

**CodeFlare** – a full-stack tool for generating beautiful code screenshots.
Users paste code into the editor, configure styling, and export a PNG via a
headless-browser screenshot pipeline running on Cloudflare Workers.

- **Frontend**: React 19 SPA (TypeScript, Vite+ / Vite 8 + SWC) in `src/`
- **Toolchain**: [Vite+](https://viteplus.dev) (`vite-plus`, `vp` CLI) – dev/build, Oxlint, Oxfmt
- **Backend**: Cloudflare Worker API using Hono 4.13 (TypeScript) in `worker/`
- **Deployment**: Cloudflare Pages (frontend) + Cloudflare Workers (backend via Wrangler)
- **Package Manager**: npm, driven through `vp` (`vp install`, `vp add`, `vpx`)
- **TypeScript**: strict mode enforced; type-checking runs in `vp check` via the bundled
  TypeScript 7 (tsgo) toolchain. `typescript` ~6.0.3 stays installed for editor tooling

### Key Dependencies

| Package                    | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `shiki`                    | Syntax highlighting (used in both frontend preview and worker) |
| `@cloudflare/kumo`         | Cloudflare UI kit v2 (Button, Input, Select, Switch, Surface)  |
| `@cloudflare/puppeteer`    | Headless browser for server-side PNG generation                |
| `@phosphor-icons/react`    | Icon library                                                   |
| `react-simple-code-editor` | Textarea-based code editor with highlight overlay              |
| `hono`                     | HTTP framework for the Cloudflare Worker API                   |

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
vp install           # Install dependencies (delegates to npm; pinned via devEngines)
vp dev               # Vite dev server with HMR (localhost:5173)
vp check             # Format check + Oxlint + type-check (all three tsconfigs) in one pass
vp check --fix       # Same, applying formatter and lint autofixes
vp lint              # Oxlint only (type-aware)
vp fmt               # Oxfmt only
vp build             # Bundle frontend + worker (does NOT type-check; run vp check first)
vp preview           # Preview the production build (run vp build first)
vp run deploy        # vp check && vp build && wrangler deploy
vp run cf-typegen    # Regenerate Cloudflare Worker types (worker-configuration.d.ts)
vp run db:generate   # drizzle-kit: generate migrations from src/db/schema.ts
vp run db:migrate    # Apply D1 migrations locally
vp run auth:generate # Regenerate src/db/auth-schema.ts with the Better Auth CLI
```

**Use `vp`, not `npm`/`npx`.** `vp add <pkg>` / `vp add -D <pkg>` / `vp remove <pkg>` manage
dependencies, `vp outdated` / `vp update` handle upgrades, and `vpx <bin>` runs local binaries
(e.g. `vpx wrangler d1 list`). Built-in commands (`dev`, `build`, `check`, `lint`, `fmt`,
`preview`, `test`) cannot be overridden by `package.json` scripts, so `package.json` only holds
project tasks, run with `vp run <name>`. Node.js and npm versions are declared as ranges in
`package.json#devEngines`; `vp` downloads matching versions automatically.

**No test framework is currently configured.** To add tests, use `vp test` (Vitest bundled in
Vite+); import from `vite-plus/test`, not `vitest`.

**Quick checks**: `vp lint src/App.tsx` (single file) or `vp check` (everything).

All tool config (Vite, `lint`, `fmt`) lives in `vite.config.ts`; import `defineConfig` from
`vite-plus`, not `vite`. There is no `eslint.config.js`, `.oxlintrc.json`, or `.prettierrc`.

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

| Aspect              | Style               | Notes                              |
| ------------------- | ------------------- | ---------------------------------- |
| **Indentation**     | 2 spaces            | All `.ts`, `.tsx`, `.js` files     |
| **Quotes**          | Double `"`          | Prefer double quotes in code       |
| **Semicolons**      | Yes                 | End all statements with semicolons |
| **Trailing commas** | Yes                 | In objects, arrays, and JSX props  |
| **Line length**     | Soft limit 100 cols | No hard enforce; be reasonable     |

Enforced by Oxfmt (`fmt` block in `vite.config.ts`); run `vp fmt` rather than formatting
by hand. Generated files (`worker-configuration.d.ts`, `drizzle/**`, `src/db/auth-schema.ts`)
are excluded.

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

| Element               | Convention       | Examples                                           |
| --------------------- | ---------------- | -------------------------------------------------- |
| React components      | PascalCase       | `App.tsx`, `WindowCard.tsx`                        |
| Component files       | `.tsx` extension | `Preview.tsx`                                      |
| Variables & functions | camelCase        | `count`, `setCount`, `handleClick`                 |
| Directories           | lowercase        | `src/`, `worker/`, `components/`                   |
| CSS classes           | kebab-case       | `card-title`, `sidebar-panel`                      |
| Constants             | UPPER_SNAKE_CASE | `BACKGROUND_PRESETS`, `THEME_OPTIONS`              |
| Type/interface names  | PascalCase       | `interface ScreenshotOptions`, `type ExportAction` |

### Type Annotations

- **Interfaces for objects**, **types for unions/aliases**:
  ```ts
  interface ScreenshotOptions {
    code: string;
    language: string;
  }
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
  return () => {
    cancelled = true;
  };
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

| Binding        | Type                                | Purpose                                    |
| -------------- | ----------------------------------- | ------------------------------------------ |
| `BROWSER`      | Browser Rendering                   | Puppeteer launch for screenshot generation |
| `SCREENSHOTS`  | R2 Bucket (`codeflare-screenshots`) | Optional persistent screenshot storage     |
| `RATE_LIMITER` | Rate Limit (10 req / 60 s)          | Per-IP abuse prevention                    |

Type them via the `AppEnv` interface in `worker/index.ts`:

```ts
interface AppEnv {
  Bindings: { BROWSER: BrowserRun; SCREENSHOTS: R2Bucket; RATE_LIMITER: RateLimit };
}
const app = new Hono<AppEnv>();
```

Regenerate `worker-configuration.d.ts` with `vp run cf-typegen` after any `wrangler.jsonc` changes.

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

## Lint Configuration (Oxlint)

- **`lint` block in `vite.config.ts`**, migrated from the former ESLint flat config; rules for
  `**/*.{ts,tsx}` live in `lint.overrides`
- **Rulesets**: ESLint recommended equivalents, typescript-eslint recommended equivalents, React
  hooks + React Compiler rules (e.g. `react/set-state-in-effect` — derive state with `useMemo`
  or set it in async callbacks instead of synchronously in effects), `react/only-export-components`
- **Type-aware**: `typeAware` + `typeCheck` are on, so rules like `no-floating-promises` apply
  (`await` promises or mark intentional fire-and-forget calls with `void`)
- **`no-undef` is off** for TS files – TypeScript already reports undefined identifiers
- **Suppressions**: `// oxlint-disable-next-line <rule>` (not `eslint-disable`)
- **Ignored**: `dist/`, `worker-configuration.d.ts` (generated)
- **Run**: `vp lint` or `vp check`

## Notes for Agents

- **Run `vp check` and `vp build` before finishing** – `check` covers format, lint, and types
  across all three tsconfig targets; `build` bundles
- **No test framework exists** – focus on type correctness and linting (`vp check`)
- **`src/types.ts` is the source of truth** for shared interfaces, union types, and constants;
  add new shared types there rather than defining them inline or in component files
- **`verbatimModuleSyntax`** will cause a compile error if you forget `import type` on
  type-only imports — always check after adding imports
- **Avoid enums and namespaces** (`erasableSyntaxOnly` flag); use union types and plain objects
- **Regenerate CF types** (`vp run cf-typegen`) when modifying `wrangler.jsonc`
- **Workers Builds (CI)** is connected to this repo: build command `npx vp check && npx vp build`,
  deploy `npx wrangler deploy` (`main`) / `npx wrangler versions upload` (other branches). It
  reads Node from `.node-version` and npm from the exact `packageManager` field – keep both in
  sync with `devEngines` when bumping versions
- **CORS** in `worker/index.ts` currently allows all origins — tighten before production use
- **Compatibility date** is `2026-10-23` (latest supported by the installed workerd); review the
  [compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/)
  before bumping it
- Formatting is automated by Oxfmt; don't hand-tune style
