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
