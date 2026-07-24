# Page Pulse - Deployment Immune Rebuild Design

**Date:** 2026-07-25  
**Status:** Approved  
**Goal:** Rebuild with absolute deployment immunity against Wrangler CLI errors, routing mismatches, build failures, and target network blocks.

---

## 1. CORE ARCHITECTURE & DIRECTORY STRUCTURE

```
page-pulse/
├── functions/
│   └── api/
│       └── audit.ts              # POST /api/audit - Single audit endpoint
├── src/
│   ├── App.tsx                   # React UI with audit form
│   ├── main.tsx                  # Vite Entry Point
│   └── index.css                 # Plain CSS (no frameworks)
├── tests/
│   └── audit.test.ts             # Vitest worker tests
├── index.html                    # Vite HTML entry
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # Frontend compiler config (include: ["src"])
├── tsconfig.node.json            # Vite config types
├── vite.config.ts                # Vite build config
├── vitest.config.ts              # Vitest test config
├── wrangler.toml                 # ONLY TOML configuration (NO json/jsonc)
└── README.md                     # Project documentation
```

---

## 2. CONFIGURATION & PRE-FLIGHT DEPLOYMENT GUARDS

### A. `wrangler.toml` Rules

- **Output directory:** MUST match Vite build: `pages_build_output_dir = "dist"`
- **Compatibility date:** MUST be current (`2026-01-01` or later)
- **Node.js polyfills:** `compatibility_flags = ["nodejs_compat"]`
- **NO JSON/JSONC:** Forbid any `wrangler.json` or `wrangler.jsonc` files to prevent configuration ambiguity

### B. `tsconfig.json` Decoupling Guard

- MUST ONLY compile `["src"]` for Vite
- DO NOT reference `functions/` in `include` array to prevent tsc from breaking frontend build
- Cloudflare handles Pages Functions types independently via Wrangler

---

## 3. BACKEND SPECIFICATION (`functions/api/audit.ts`)

### Endpoint
- **Method:** `POST /api/audit`
- **Request Body:** `{ "url": string }`

### Validation Pipeline

#### 1. URL Sanitization
- Trim input string
- Reject empty values
- Reject invalid syntax
- Reject protocols other than `http:` / `https:`
- **Error:** HTTP 400 `{ "error": "Invalid URL: Must be a well-formed HTTP or HTTPS address" }`

#### 2. Fetch Execution
- **Timeout:** AbortController set to exactly **8500ms**
- **User-Agent:** `"Mozilla/5.0 (Windows NT 10.0; Win64; x64) PagePulseAuditor/1.0"`
- **Response time:** Measure with `performance.now()` → `responseTimeMs`
- **AbortError:** Return HTTP 504 `{ "error": "Audit request timed out after 8.5 seconds" }`
- **Connection failures:** Return HTTP 502 `{ "error": "Failed to reach target host: <message>" }`

#### 3. Content-Type Filter
- Check `response.headers.get("content-type")`
- If not contains `text/html`, return HTTP 415 `{ "error": "Not an HTML page (Content-Type is '...')" }`

#### 4. HTML Parsing (Cheerio)
- Handle Non-2xx HTTP status gracefully (extract metrics, don't crash)
- **Metadata:**
  - `<title>` - trimmed or `null`
  - `<meta name="description">` - trimmed or `null`
- **H1 Count:** `$('h1').length`
- **Alt Text Counter:** Count `<img>` where `alt` is missing or empty string
- **Word Count:**
  - Strip non-visible trees: `head`, `script`, `style`, `noscript`, `svg`, `iframe`
  - Extract body text
  - Normalize whitespace
  - Count visible words

#### 5. Crash Prevention
- Wrap handler in top-level `try/catch`
- Always return `{ "error": string }` on unhandled errors with HTTP 500

### Response Schema (Success)
```typescript
{
  url: string;
  httpStatus: number;
  responseTimeMs: number;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  imagesMissingAlt: number;
  wordCount: number;
}
```

---

## 4. FRONTEND SPECIFICATION (`src/App.tsx`)

### UI States

#### Idle State
- Form with URL input field
- Submit button: "Audit Website"

#### Loading State
- Button disabled
- Text: "Auditing..."
- Spinner or loading indicator

#### Success State
- Grid displaying:
  - `url`
  - `httpStatus`
  - `responseTimeMs`
  - `h1Count`
  - `imagesMissingAlt`
  - `wordCount`
  - `title`
  - `metaDescription`

#### Error State
- Friendly red alert box
- Display backend error string
- Never display unhandled JS stack traces

### Footer
Required visible anchor tag:
```html
<a href="https://digitalheroesco.com" target="_blank">Built for Digital Heroes Training Task</a>
```

### Technical Requirements
- Clean React (no UI component libraries)
- Fetch to relative path `/api/audit`
- Plain CSS only (no Tailwind, no CSS-in-JS)

---

## 5. AUTOMATED UNIT TESTS (`tests/audit.test.ts`)

Use Vitest with global `fetch` mocking.

### Test Cases

1. **Happy Path**
   - Mock 200 OK HTML payload
   - Validate title, H1s, missing alts, word count

2. **Timeout Case**
   - Mock fetch throwing `AbortError`
   - Expect 504 status and timeout message

3. **Non-HTML Case**
   - Mock response header `Content-Type: application/pdf`
   - Expect 415 status

4. **Invalid URL Case**
   - Send malformed string
   - Expect 400 status

---

## 6. DEPLOYMENT SCRIPT

Non-interactive PowerShell script:

```powershell
# Clean build
Remove-Item -Recurse -Force dist, wrangler.jsonc -ErrorAction SilentlyContinue
npm run build

# Non-interactive Cloudflare Pages Deploy
npx wrangler pages deploy dist --project-name="page-pulse-app" --branch="main" --commit-dirty=true
```

---

## 7. FILE SPECIFICATIONS

### package.json
- Dependencies: react, react-dom, cheerio
- DevDependencies: typescript, vite, @vitejs/plugin-react, vitest, @cloudflare/vitest-pool-workers, wrangler, @types/react, @types/react-dom, @types/node

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src"]
}
```

### wrangler.toml
```toml
name = "page-pulse"
compatibility_date = "2026-07-25"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"
```

---

## 8. DEPLOYMENT IMMUNITY CHECKLIST

- [ ] No `wrangler.json` or `wrangler.jsonc` files exist
- [ ] `wrangler.toml` is the only config file
- [ ] `tsconfig.json` includes only `["src"]`
- [ ] `functions/` directory contains only the API endpoint
- [ ] All error cases handled with appropriate HTTP status codes
- [ ] Top-level try/catch in audit.ts
- [ ] 8500ms timeout implemented
- [ ] Custom User-Agent header set
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Deployment script runs non-interactively
