# Page Pulse Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Page Pulse with deployment immunity against Wrangler CLI errors, routing mismatches, build failures, and target network blocks.

**Architecture:** Cloudflare Pages with Functions for backend API (audit endpoint), Vite React for frontend, strict separation of concerns to prevent build failures.

**Tech Stack:** TypeScript, React, Vite, Cheerio, Vitest, Wrangler, Cloudflare Pages

## Global Constraints

- Use ONLY `wrangler.toml` (NO json/jsonc config files)
- `tsconfig.json` MUST only include `["src"]` (NOT functions/)
- `compatibility_flags = ["nodejs_compat"]`
- `pages_build_output_dir = "dist"`
- All error cases MUST return appropriate HTTP status codes
- 8500ms timeout exact
- Top-level try/catch in all handlers
- Plain CSS only (no frameworks)
- Fetch timeout with AbortController
- Custom User-Agent header

---

## Task Map

1. Clean up existing files and prepare directory structure
2. Create wrangler.toml configuration
3. Create package.json with dependencies
4. Create tsconfig.json (frontend only)
5. Create tsconfig.node.json
6. Create vite.config.ts
7. Create vitest.config.ts
8. Create index.html
9. Create src/index.css
10. Create src/main.tsx
11. Create src/App.tsx
12. Create functions/api/audit.ts
13. Create tests/audit.test.ts
14. Create deploy.ps1 script
15. Run tests and verify build
16. Final verification and commit

---

## Task 1: Clean Up and Prepare Directory Structure

**Files:**
- Delete: `wrangler.jsonc` (if exists)
- Delete: Any existing source files that don't match spec
- Create: Directory structure per spec

**Interfaces:**
- Produces: Clean directory structure ready for new files

- [ ] **Step 1: Remove old config files**

```powershell
Remove-Item -Path "wrangler.jsonc" -ErrorAction SilentlyContinue
Remove-Item -Path "wrangler.json" -ErrorAction SilentlyContinue
Remove-Item -Path "src\index.ts" -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Create directory structure**

```powershell
mkdir -p "functions\api"
mkdir -p "src"
mkdir -p "tests"
mkdir -p "docs\superpowers\specs"
```

- [ ] **Step 3: Verify structure**

Run: `Get-ChildItem -Directory`
Expected: Shows functions/, src/, tests/ directories

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: clean up and prepare directory structure for rebuild"
```

---

## Task 2: Create wrangler.toml Configuration

**Files:**
- Create: `wrangler.toml`

**Interfaces:**
- Produces: Cloudflare Pages configuration with nodejs_compat

- [ ] **Step 1: Write wrangler.toml**

```toml
name = "page-pulse"
compatibility_date = "2026-07-25"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"
```

- [ ] **Step 2: Verify no JSON config exists**

Run: `Get-ChildItem -Path "wrangler.*"`
Expected: Only shows `wrangler.toml`

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml
git commit -m "config: add wrangler.toml with nodejs_compat"
```

---

## Task 3: Create package.json

**Files:**
- Create: `package.json`

**Interfaces:**
- Produces: Dependencies and build scripts

- [ ] **Step 1: Write package.json**

```json
{
  "name": "page-pulse",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "wrangler pages dev dist",
    "test": "vitest run",
    "deploy": "wrangler pages deploy dist --project-name=page-pulse-app --branch=main --commit-dirty=true"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "cheerio": "^1.0.0"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.0",
    "@cloudflare/workers-types": "^4.20240320.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12",
    "vitest": "^2.0.0",
    "wrangler": "^3.28.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: Dependencies installed, node_modules/ created

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "config: add package.json with dependencies"
```

---

## Task 4: Create tsconfig.json (Frontend Only)

**Files:**
- Create: `tsconfig.json`

**Interfaces:**
- Produces: Frontend TypeScript config (src/ only)
- Constraint: MUST NOT include functions/

- [ ] **Step 1: Write tsconfig.json**

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

- [ ] **Step 2: Verify include array**

Check that `"include": ["src"]` does NOT contain "functions"

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "config: add tsconfig.json with src-only include"
```

---

## Task 5: Create tsconfig.node.json

**Files:**
- Create: `tsconfig.node.json`

**Interfaces:**
- Produces: Vite config types

- [ ] **Step 1: Write tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 2: Commit**

```bash
git add tsconfig.node.json
git commit -m "config: add tsconfig.node.json for vite config"
```

---

## Task 6: Create vite.config.ts

**Files:**
- Create: `vite.config.ts`

**Interfaces:**
- Produces: Vite build configuration

- [ ] **Step 1: Write vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "config: add vite.config.ts"
```

---

## Task 7: Create vitest.config.ts

**Files:**
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: Vitest test configuration with workers pool

- [ ] **Step 1: Write vitest.config.ts**

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' }
      }
    }
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "config: add vitest.config.ts with workers pool"
```

---

## Task 8: Create index.html

**Files:**
- Create: `index.html`

**Interfaces:**
- Produces: HTML entry point

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page Pulse - Website Auditor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add index.html entry point"
```

---

## Task 9: Create src/index.css

**Files:**
- Create: `src/index.css`

**Interfaces:**
- Produces: Plain CSS styles (no frameworks)

- [ ] **Step 1: Write src/index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
  font-size: 2.5rem;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

input[type="url"] {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

input[type="url"]:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  color: #c33;
  margin-bottom: 20px;
}

.results {
  margin-top: 30px;
}

.results h2 {
  margin-bottom: 20px;
  color: #333;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
}

.metric-label {
  color: #666;
  font-size: 14px;
}

.metadata {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.metadata h3 {
  margin-bottom: 15px;
  color: #333;
}

.metadata-item {
  margin-bottom: 10px;
}

.metadata-item strong {
  color: #555;
}

.metadata-value {
  color: #333;
  margin-left: 10px;
}

.url-display {
  word-break: break-all;
  color: #667eea;
}

.status-ok {
  color: #4caf50;
}

.status-error {
  color: #f44336;
}

footer {
  text-align: center;
  margin-top: 40px;
  padding: 20px;
}

footer a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  opacity: 0.9;
  transition: opacity 0.2s;
}

footer a:hover {
  opacity: 1;
  text-decoration: underline;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add plain CSS styles"
```

---

## Task 10: Create src/main.tsx

**Files:**
- Create: `src/main.tsx`

**Interfaces:**
- Produces: Vite entry point

- [ ] **Step 1: Write src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Commit**

```bash
git add src/main.tsx
git commit -m "feat: add main.tsx entry point"
```

---

## Task 11: Create src/App.tsx

**Files:**
- Create: `src/App.tsx`

**Interfaces:**
- Consumes: POST /api/audit endpoint
- Produces: React UI with audit form and results display

- [ ] **Step 1: Write src/App.tsx**

```typescript
import { useState } from 'react'

interface AuditResult {
  url: string
  httpStatus: number
  responseTimeMs: number
  title: string | null
  metaDescription: string | null
  h1Count: number
  imagesMissingAlt: number
  wordCount: number
}

interface AuditError {
  error: string
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'An unexpected error occurred')
        return
      }

      setResult(data as AuditResult)
    } catch (err) {
      setError('Failed to connect to the audit service')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => num.toLocaleString()

  return (
    <div className="container">
      <div className="card">
        <h1>Page Pulse</h1>
        <p className="subtitle">Website Performance Auditor</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url">Website URL</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Auditing...' : 'Audit Website'}
          </button>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing website...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="results">
            <h2>Audit Results</h2>
            
            <div className="metadata">
              <h3>Target Information</h3>
              <div className="metadata-item">
                <strong>URL:</strong>
                <span className="metadata-value url-display">{result.url}</span>
              </div>
              <div className="metadata-item">
                <strong>HTTP Status:</strong>
                <span className={`metadata-value ${result.httpStatus >= 200 && result.httpStatus < 300 ? 'status-ok' : 'status-error'}`}>
                  {result.httpStatus}
                </span>
              </div>
              <div className="metadata-item">
                <strong>Response Time:</strong>
                <span className="metadata-value">{formatNumber(result.responseTimeMs)} ms</span>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{result.h1Count}</div>
                <div className="metric-label">H1 Tags</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{result.imagesMissingAlt}</div>
                <div className="metric-label">Images Missing Alt</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{formatNumber(result.wordCount)}</div>
                <div className="metric-label">Word Count</div>
              </div>
            </div>

            {(result.title || result.metaDescription) && (
              <div className="metadata">
                <h3>Page Metadata</h3>
                {result.title && (
                  <div className="metadata-item">
                    <strong>Title:</strong>
                    <span className="metadata-value">{result.title}</span>
                  </div>
                )}
                {result.metaDescription && (
                  <div className="metadata-item">
                    <strong>Description:</strong>
                    <span className="metadata-value">{result.metaDescription}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <footer>
        <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">
          Built for Digital Heroes Training Task
        </a>
      </footer>
    </div>
  )
}

export default App
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add App.tsx with audit UI"
```

---

## Task 12: Create functions/api/audit.ts

**Files:**
- Create: `functions/api/audit.ts`

**Interfaces:**
- Consumes: fetch API, Cheerio
- Produces: POST /api/audit endpoint with full validation pipeline

- [ ] **Step 1: Write functions/api/audit.ts**

```typescript
import * as cheerio from 'cheerio'

interface AuditRequest {
  url: string
}

interface AuditResult {
  url: string
  httpStatus: number
  responseTimeMs: number
  title: string | null
  metaDescription: string | null
  h1Count: number
  imagesMissingAlt: number
  wordCount: number
}

interface ErrorResponse {
  error: string
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PagePulseAuditor/1.0'
const TIMEOUT_MS = 8500

function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function sanitizeUrl(url: string): string {
  return url.trim()
}

function countWords(html: string): number {
  const $ = cheerio.load(html)
  
  // Remove non-visible elements
  $('head, script, style, noscript, svg, iframe').remove()
  
  // Get text from body
  const text = $('body').text() || ''
  
  // Normalize whitespace and count words
  const normalizedText = text.replace(/\s+/g, ' ').trim()
  const words = normalizedText.split(/\s+/).filter(word => word.length > 0)
  
  return words.length
}

function countImagesMissingAlt(html: string): number {
  const $ = cheerio.load(html)
  let count = 0
  
  $('img').each((_, img) => {
    const alt = $(img).attr('alt')
    if (alt === undefined || alt === '') {
      count++
    }
  })
  
  return count
}

function countH1(html: string): number {
  const $ = cheerio.load(html)
  return $('h1').length
}

function extractTitle(html: string): string | null {
  const $ = cheerio.load(html)
  const title = $('title').text().trim()
  return title || null
}

function extractMetaDescription(html: string): string | null {
  const $ = cheerio.load(html)
  const description = $('meta[name="description"]').attr('content')
  return description?.trim() || null
}

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    // Parse request body
    let requestBody: AuditRequest
    try {
      requestBody = await context.request.json() as AuditRequest
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate URL
    const rawUrl = requestBody.url
    if (!rawUrl || typeof rawUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid URL: URL is required' } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = sanitizeUrl(rawUrl)
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL: Must be a well-formed HTTP or HTTPS address' } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidHttpUrl(url)) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL: Must be a well-formed HTTP or HTTPS address' } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let response: Response
    const startTime = performance.now()

    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT
        }
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Audit request timed out after 8.5 seconds' } as ErrorResponse),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to reach target host: ${error instanceof Error ? error.message : 'Unknown error'}` } as ErrorResponse),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const responseTimeMs = Math.round(performance.now() - startTime)

    // Check Content-Type
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return new Response(
        JSON.stringify({ error: `Not an HTML page (Content-Type is '${contentType}')` } as ErrorResponse),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get HTML content (even for non-2xx status)
    const html = await response.text()

    // Extract metrics
    const result: AuditResult = {
      url,
      httpStatus: response.status,
      responseTimeMs,
      title: extractTitle(html),
      metaDescription: extractMetaDescription(html),
      h1Count: countH1(html),
      imagesMissingAlt: countImagesMissingAlt(html),
      wordCount: countWords(html)
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unhandled error in audit:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/audit.ts
git commit -m "feat: add audit.ts with full validation pipeline"
```

---

## Task 13: Create tests/audit.test.ts

**Files:**
- Create: `tests/audit.test.ts`

**Interfaces:**
- Consumes: functions/api/audit.ts
- Produces: Vitest tests with fetch mocking

- [ ] **Step 1: Write tests/audit.test.ts**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { onRequestPost } from '../functions/api/audit'

describe('POST /api/audit', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns audit results for valid HTML page', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="Test description">
        </head>
        <body>
          <h1>Main Heading</h1>
          <h1>Second H1</h1>
          <img src="test.jpg" alt="Test image">
          <img src="test2.jpg">
          <img src="test3.jpg" alt="">
          <p>This is some test content with multiple words.</p>
        </body>
      </html>
    `

    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: () => Promise.resolve(mockHtml)
    })

    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.url).toBe('https://example.com')
    expect(result.httpStatus).toBe(200)
    expect(result.title).toBe('Test Page')
    expect(result.metaDescription).toBe('Test description')
    expect(result.h1Count).toBe(2)
    expect(result.imagesMissingAlt).toBe(2)
    expect(result.wordCount).toBeGreaterThan(0)
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('returns 504 on timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    })

    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://slow-site.com' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(504)
    expect(result.error).toBe('Audit request timed out after 8.5 seconds')
  })

  it('returns 415 for non-HTML content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'content-type': 'application/pdf' }),
      text: () => Promise.resolve('PDF content')
    })

    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/file.pdf' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(415)
    expect(result.error).toContain("Not an HTML page")
  })

  it('returns 400 for invalid URL', async () => {
    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'not-a-valid-url' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Invalid URL: Must be a well-formed HTTP or HTTPS address')
  })

  it('returns 400 for non-HTTP protocols', async () => {
    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'ftp://example.com' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Invalid URL: Must be a well-formed HTTP or HTTPS address')
  })

  it('returns 400 for empty URL', async () => {
    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: '' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toContain('Invalid URL')
  })

  it('returns 502 on connection failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'))

    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://nonexistent-domain-12345.com' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(502)
    expect(result.error).toContain('Failed to reach target host')
  })

  it('handles non-2xx HTTP status gracefully', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Error Page</title></head>
        <body><h1>Error</h1><p>Not found</p></body>
      </html>
    `

    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: () => Promise.resolve(mockHtml)
    })

    const request = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/not-found' })
    })

    const response = await onRequestPost({ request })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.httpStatus).toBe(404)
    expect(result.title).toBe('Error Page')
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add tests/audit.test.ts
git commit -m "test: add audit endpoint tests with vitest"
```

---

## Task 14: Create deploy.ps1 Script

**Files:**
- Create: `deploy.ps1`

**Interfaces:**
- Produces: Non-interactive deployment script

- [ ] **Step 1: Write deploy.ps1**

```powershell
<#
.SYNOPSIS
    Deploy Page Pulse to Cloudflare Pages
.DESCRIPTION
    Non-interactive deployment script with deployment immunity guards
#>

param(
    [string]$ProjectName = "page-pulse-app",
    [string]$Branch = "main"
)

Write-Host "=== Page Pulse Deployment Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean build artifacts
Write-Host "Step 1: Cleaning build artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Path "wrangler.jsonc" -ErrorAction SilentlyContinue
Remove-Item -Path "wrangler.json" -ErrorAction SilentlyContinue
Write-Host "Clean complete." -ForegroundColor Green
Write-Host ""

# Step 2: Verify wrangler.toml exists
Write-Host "Step 2: Verifying configuration..." -ForegroundColor Yellow
if (-not (Test-Path "wrangler.toml")) {
    Write-Error "wrangler.toml not found! Deployment requires TOML configuration."
    exit 1
}

# Check for forbidden JSON configs
$jsonConfigs = Get-ChildItem -Path "wrangler.*" -Include "*.json", "*.jsonc" -ErrorAction SilentlyContinue
if ($jsonConfigs) {
    Write-Error "Found JSON config files: $($jsonConfigs.Name). Use only wrangler.toml."
    exit 1
}
Write-Host "Configuration verified." -ForegroundColor Green
Write-Host ""

# Step 3: Run build
Write-Host "Step 3: Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}
Write-Host "Build successful." -ForegroundColor Green
Write-Host ""

# Step 4: Run tests
Write-Host "Step 4: Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed!"
    exit 1
}
Write-Host "Tests passed." -ForegroundColor Green
Write-Host ""

# Step 5: Deploy
Write-Host "Step 5: Deploying to Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy dist --project-name="$ProjectName" --branch="$Branch" --commit-dirty=true
if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
```

- [ ] **Step 2: Commit**

```bash
git add deploy.ps1
git commit -m "feat: add deployment script with immunity guards"
```

---

## Task 15: Run Tests and Verify Build

**Files:**
- Run: All tests
- Verify: Build passes

- [ ] **Step 1: Run tests**

```bash
npm test
```

Expected: All 7 tests pass

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Build completes without errors, dist/ folder created

- [ ] **Step 3: Verify dist contents**

```powershell
Get-ChildItem dist
```

Expected: Shows index.html and assets/

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: verify all tests pass and build succeeds"
```

---

## Task 16: Final Verification and Commit

**Files:**
- Verify: All files present per spec
- Verify: No wrangler.json/jsonc exists
- Verify: tsconfig.json includes only src

- [ ] **Step 1: Verify directory structure**

```powershell
Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" } | Select-Object FullName
```

Expected: Shows all required files

- [ ] **Step 2: Verify no JSON configs**

```powershell
Get-ChildItem -Path "wrangler.*" -Include "*.json", "*.jsonc" -ErrorAction SilentlyContinue
```

Expected: No output (files don't exist)

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete Page Pulse rebuild with deployment immunity"
git push origin main
```

---

## Spec Coverage Check

| Spec Requirement | Task | Status |
|------------------|------|--------|
| `wrangler.toml` only | Task 2 | ✅ |
| `tsconfig.json` includes only `src` | Task 4 | ✅ |
| `nodejs_compat` flag | Task 2 | ✅ |
| `pages_build_output_dir = "dist"` | Task 2 | ✅ |
| POST /api/audit endpoint | Task 12 | ✅ |
| 8500ms timeout | Task 12 | ✅ |
| Custom User-Agent | Task 12 | ✅ |
| URL validation | Task 12 | ✅ |
| Content-Type filter | Task 12 | ✅ |
| Cheerio HTML parsing | Task 12 | ✅ |
| All HTTP error codes | Tasks 12, 13 | ✅ |
| React UI with states | Task 11 | ✅ |
| Plain CSS | Task 9 | ✅ |
| Digital Heroes footer | Task 11 | ✅ |
| Vitest tests | Task 13 | ✅ |
| Deployment script | Task 14 | ✅ |
