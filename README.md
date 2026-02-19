# CodeFlare

Generate beautiful, shareable code screenshots — powered by Cloudflare Workers.

Paste your code, customize the styling, and export a pixel-perfect PNG rendered by a headless browser at 2× device pixel ratio. Screenshots can be downloaded directly or stored in Cloudflare R2.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/harshil1712/codeflare)

---

## Features

- **Live preview** — real-time syntax-highlighted preview as you type
- **10 themes** — GitHub Dark/Light, One Dark Pro, Dracula, Nord, Monokai, Solarized, Catppuccin Mocha, Vitesse Dark
- **13 background presets** — gradients ranging from Sunset to Midnight, plus transparent
- **Configurable styling** — font size, padding, card background color/opacity, line numbers, window title
- **Server-side PNG rendering** — Puppeteer via Cloudflare Browser Rendering at 2× DPI
- **Flexible export** — download only, upload to R2 only, or both
- **Rate limiting** — 10 requests per 60 seconds per IP

---

## Tech Stack

| Layer               | Technology                                |
| ------------------- | ----------------------------------------- |
| Frontend            | React 19, TypeScript, Vite + SWC          |
| Syntax highlighting | Shiki (frontend preview + worker render)  |
| UI components       | @cloudflare/kumo, @phosphor-icons/react   |
| Code editor         | react-simple-code-editor                  |
| Backend             | Hono 4 on Cloudflare Workers              |
| Screenshot engine   | @cloudflare/puppeteer (Browser Rendering) |
| Storage             | Cloudflare R2                             |
| Rate limiting       | Cloudflare Rate Limiting binding          |
| Deployment          | Cloudflare Pages + Workers (Wrangler)     |

---

## Local Development

### Prerequisites

- Node.js 18+
- A Cloudflare account with Workers, R2, and Browser Rendering access
- Wrangler CLI (`npm install -g wrangler` or use the local dev dependency)

### Setup

```bash
git clone <repo-url>
cd codeflare
npm install
```

### Run the dev server

```bash
npm run dev
```

This starts the Vite dev server at `http://localhost:5173` with HMR. The frontend and worker are bundled together via the `@cloudflare/vite-plugin`.

### Notes on Cloudflare bindings in development

The worker uses three Cloudflare bindings (`BROWSER`, `SCREENSHOTS`, `RATE_LIMITER`). In local development these are provided by Wrangler's local simulation. Some bindings (notably Browser Rendering) require a remote connection to Cloudflare:

- `BROWSER` is configured with `"remote": true` in `wrangler.jsonc`, so screenshot generation will make live calls to Cloudflare's Browser Rendering service during dev.
- `SCREENSHOTS` (R2) and `RATE_LIMITER` are simulated locally by Wrangler.

You must be logged in to Wrangler for remote bindings to work:

```bash
npx wrangler login
```

---

## Deployment

### 1. Create Cloudflare resources

Before deploying, ensure the following exist in your Cloudflare account:

**R2 Bucket**
```bash
npx wrangler r2 bucket create codeflare-screenshots
```

**Rate Limiting namespace** — configured in `wrangler.jsonc` under `ratelimits`. The `namespace_id` must match a rate limit namespace in your account. Update `wrangler.jsonc` with the correct ID if needed.

**Browser Rendering** — enabled automatically for your account; no manual creation required.

### 2. Deploy

```bash
npm run deploy
```

This runs `tsc -b` (type-check), `vite build` (bundle frontend + worker), then `wrangler deploy` to push everything to Cloudflare.

### Wrangler bindings reference (`wrangler.jsonc`)

| Binding        | Type              | Name                    |
| -------------- | ----------------- | ----------------------- |
| `BROWSER`      | Browser Rendering | —                       |
| `SCREENSHOTS`  | R2 Bucket         | `codeflare-screenshots` |
| `RATE_LIMITER` | Rate Limit        | 10 req / 60 s per IP    |

After any changes to `wrangler.jsonc`, regenerate the Worker type definitions:

```bash
npm run cf-typegen
```

---

## API Reference

### `POST /api/screenshot`

Generates a PNG screenshot of the provided code.

**Request body** (`application/json`):

| Field             | Type      | Required | Description                                                                    |
| ----------------- | --------- | -------- | ------------------------------------------------------------------------------ |
| `code`            | `string`  | Yes      | The source code to render                                                      |
| `language`        | `string`  | Yes      | Programming language for syntax highlighting (e.g. `"typescript"`, `"python"`) |
| `theme`           | `string`  | Yes      | Shiki theme ID (see [Configuration reference](#configuration-reference))       |
| `background`      | `string`  | Yes      | CSS gradient string for the outer background                                   |
| `padding`         | `number`  | Yes      | Padding (px) around the code card                                              |
| `fontSize`        | `number`  | Yes      | Font size (px) for the code                                                    |
| `showLineNumbers` | `boolean` | Yes      | Whether to render line numbers                                                 |
| `windowTitle`     | `string`  | Yes      | Title shown in the macOS-style window title bar                                |
| `cardBackground`  | `string`  | Yes      | CSS color value for the code card background                                   |
| `action`          | `string`  | Yes      | Export action: `"download_only"`, `"r2_only"`, or `"r2_and_download"`          |

**Responses:**

| Scenario                             | Status | Body                                 |
| ------------------------------------ | ------ | ------------------------------------ |
| `download_only` or `r2_and_download` | `200`  | PNG binary (`image/png`)             |
| `r2_only`                            | `200`  | `{ "key": "<r2-object-key>" }`       |
| Validation error                     | `400`  | `{ "error": "<message>" }`           |
| Rate limit exceeded                  | `429`  | `{ "error": "Rate limit exceeded" }` |
| Server error                         | `500`  | `{ "error": "<message>" }`           |

**Example:**

```bash
curl -X POST https://<your-worker>.workers.dev/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const hello = \"world\";",
    "language": "typescript",
    "theme": "github-dark",
    "background": "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    "padding": 40,
    "fontSize": 14,
    "showLineNumbers": true,
    "windowTitle": "hello.ts",
    "cardBackground": "rgba(30,30,30,0.85)",
    "action": "download_only"
  }' --output screenshot.png
```

---

## Configuration Reference

### Themes (`theme` field)

| ID                 | Name             |
| ------------------ | ---------------- |
| `github-dark`      | GitHub Dark      |
| `github-light`     | GitHub Light     |
| `one-dark-pro`     | One Dark Pro     |
| `dracula`          | Dracula          |
| `nord`             | Nord             |
| `monokai`          | Monokai          |
| `solarized-dark`   | Solarized Dark   |
| `solarized-light`  | Solarized Light  |
| `catppuccin-mocha` | Catppuccin Mocha |
| `vitesse-dark`     | Vitesse Dark     |

### Background presets

| Name             | Description         |
| ---------------- | ------------------- |
| Cloudflare Light | Warm white gradient |
| Cloudflare Dark  | Dark warm gradient  |
| Sunset           | Red to yellow       |
| Ocean            | Blue to purple      |
| Purple Haze      | Aqua to pink        |
| Midnight         | Deep navy           |
| Forest           | Teal to green       |
| Peach            | Warm peach tones    |
| Sky              | Cyan to blue        |
| Candy            | Pink to yellow      |
| Dark             | Near-black grey     |
| Light            | Soft grey-white     |
| Transparent      | No background       |

### Export actions (`action` field)

| Value             | Behavior                                         |
| ----------------- | ------------------------------------------------ |
| `download_only`   | Returns PNG directly in the response body        |
| `r2_only`         | Saves PNG to R2; returns `{ "key": "..." }`      |
| `r2_and_download` | Saves to R2 and returns PNG in the response body |

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch
2. Make your changes, following the code style in `AGENTS.md`
3. Run lint and build before opening a PR:
   ```bash
   npm run lint
   npm run build
   ```
4. Open a pull request with a clear description of what changed and why

**Note:** There is no test framework configured. Type correctness (`tsc -b`) and linting (`eslint .`) are the primary automated checks.

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 Harshil Agrawal
