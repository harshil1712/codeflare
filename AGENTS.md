# AGENTS.md – Coding Guidelines for Agent-Based Development

## Project Overview

This is a full-stack web application:
- **Frontend**: React 19 SPA (TypeScript, Vite bundler) in `src/`
- **Backend**: Cloudflare Worker API using Hono 4.11 (TypeScript) in `worker/`
- **Deployment**: Cloudflare Pages (frontend) + Cloudflare Workers (backend via Wrangler)
- **Package Manager**: npm
- **TypeScript Version**: ~5.8.3 (strict mode enforced)

## Architecture

The project uses **TypeScript project references** across three `tsconfig` files:
- `tsconfig.app.json` – Frontend (ES2022, DOM + JSX)
- `tsconfig.node.json` – Build tooling (ES2023)
- `tsconfig.worker.json` – Cloudflare Worker (extends node config)

Frontend and backend are loosely coupled:
- Frontend (`src/App.tsx`) fetches from `/api/` endpoint
- Worker (`worker/index.ts`) serves the API via Hono
- Wrangler bundles both together; frontend assets are served by Workers as SPA

## Build, Lint, and Test Commands

```bash
npm run dev          # Start Vite dev server with HMR (localhost:5173)
npm run build        # Type-check (tsc -b) then bundle frontend + worker
npm run lint         # Run ESLint on all .ts/.tsx files (flat config)
npm run preview      # Build and preview production locally
npm run deploy       # Build and deploy to Cloudflare Workers + Pages
npm run cf-typegen   # Regenerate Cloudflare Worker types (worker-configuration.d.ts)
```

**No test framework is currently configured.** To add tests in the future, use Vitest (Vite-native) or Jest.

**For a single test or quick linting**: `npx eslint src/App.tsx` (ESLint single file)

## Code Style Guidelines

### TypeScript & Compilation

- **Strict mode enabled** – `strict: true` in `tsconfig.app.json`
- **No unused variables** – `noUnusedLocals: true`, `noUnusedParameters: true`
- **Explicit module syntax** – `verbatimModuleSyntax: true` (no implicit `any`)
- **Non-null assertions allowed but use sparingly** – e.g., `document.getElementById('root')!`
- **JSX mode** – `jsx: "react-jsx"` (automatic JSX transform, no need to import React)

### Formatting

| Aspect | Style | Notes |
|--------|-------|-------|
| **Indentation** | 2 spaces | All `.ts`, `.tsx`, `.js` files |
| **Quotes** | Double `"` | Prefer double quotes in code (not configurable yet) |
| **Semicolons** | Yes | End all statements with semicolons |
| **Trailing commas** | Yes | Use in objects, arrays, and JSX |
| **Line length** | Soft limit 100 cols | No hard enforce; be reasonable |

*Note: No Prettier is configured. Formatting rules above are conventions; consistency varies in scaffold files. Consider adding `.prettierrc` to enforce.*

### Imports

**Order and grouping:**
1. React/external packages (e.g., `react`, `hono`, `@cloudflare/kumo`)
2. Local modules and components (e.g., `./App`, `./api/client`)
3. CSS and asset imports (e.g., `./App.css`, `./logo.svg`)

**Example** (from `src/App.tsx`):
```tsx
import { useState } from "react";
import { Button, Input, Surface } from "@cloudflare/kumo";

import { SomeComponent } from "./components/SomeComponent";
import "./App.css";
```

- Use **named imports** from packages: `{ useState }`, `{ Hono }`
- Use **default imports** for local components: `import App from "./App"`
- No path aliases configured; use relative paths (`./`, `../`)

### Naming Conventions

| Element | Convention | Examples |
|---------|-----------|----------|
| React components | PascalCase | `App.tsx`, `Button.tsx` |
| Component files | `.tsx` extension | `App.tsx` |
| Variables & functions | camelCase | `count`, `setCount`, `handleClick`, `fetchData` |
| Directories | lowercase | `src/`, `worker/`, `components/`, `utils/` |
| CSS classes | kebab-case | `card-title`, `logo-spin`, `read-the-docs` |
| Constants | UPPER_SNAKE_CASE | `const API_BASE = "/api"` |
| Type/interface names | PascalCase | `interface User`, `type Response` |

### Type Annotations

- **Interfaces for objects**, **types for unions/aliases**
  ```tsx
  interface User {
    id: string;
    name: string;
  }
  type ApiResponse = { data: User } | { error: string };
  ```
- **Inline type assertions** are acceptable in strict mode:
  ```tsx
  .then((res) => res.json() as Promise<{ name: string }>)
  ```
- **Type definition files** (`.d.ts`) live in project root or with their modules
- **React props** – define as interface or inline type:
  ```tsx
  interface AppProps { title: string }
  function App({ title }: AppProps) { ... }
  ```

### React Component Patterns

- **Functional components only** – use `function` keyword (not arrow functions)
  ```tsx
  function App() {
    const [count, setCount] = useState(0);
    return <div>{count}</div>;
  }
  ```
- **Fragment shorthand** – `<>...</>` not `<React.Fragment>`
- **Hooks** – use `useState`, `useEffect`, etc. No class components
- **Export at bottom** – `export default App;`
- **StrictMode enabled** in entry point for dev-time checks

### Error Handling

- **Frontend**: Use `.catch()` chains or try/catch in async functions; consider error boundaries for React error handling
- **Backend (Hono)**: Return appropriate HTTP status codes via Hono context (e.g., `c.json({ error: "..." }, 400)`)
- **Type safety**: Leverage TypeScript strict mode instead of runtime checks where possible
- **Avoid non-null assertions** except when absolutely certain (e.g., DOM element that's guaranteed to exist)

### Exports

- **Default exports** for: components, config files, workers/servers
- **Named exports** for: utilities, types, constants, hooks
  ```tsx
  // Component
  export default App;
  
  // Utility
  export function formatDate(d: Date) { ... }
  export type ApiError = { code: string };
  ```

## Cloudflare & Wrangler Configuration

- **`wrangler.jsonc`** – Main Worker config (main entry: `worker/index.ts`, compatibility_date: 2026-02-05)
- **`worker-configuration.d.ts`** – Auto-generated types; regenerate with `npm run cf-typegen` after config changes
- **`Env` type** – Extends `Cloudflare.Env`; use with `new Hono<Env>()` in the worker
- **Assets handling** – Configured for SPA (`not_found_handling: "single-page-application"`)

## ESLint Configuration

- **Flat config** format in `eslint.config.js` (ESLint 9+)
- **Enforced rulesets**:
  - `@eslint/js` recommended
  - `typescript-eslint` recommended
  - `eslint-plugin-react-hooks` (latest)
  - `eslint-plugin-react-refresh` (Vite support)
- **Ignored**: `dist/` directory
- **Run with**: `npm run lint` or `npx eslint .`

## Notes for Agents

- No test framework exists yet; focus on type correctness and linting
- The scaffold has formatting inconsistencies (quotes, semicolons) between files – follow `src/App.tsx` as the main pattern
- When adding new features, regenerate Cloudflare types if you modify `wrangler.jsonc`
- The frontend and worker are bundled together; test the full build (`npm run build`) before deployment
- React 19's automatic JSX transform means React is always available; no explicit import needed
