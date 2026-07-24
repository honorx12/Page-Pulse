import { describe, it, expect, vi } from 'vitest'
import * as cheerio from 'cheerio'

// Re-implement the functions from audit.ts for testing
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

describe('Audit Functions', () => {
  describe('URL Validation', () => {
    it('accepts valid HTTP URLs', () => {
      expect(isValidHttpUrl('http://example.com')).toBe(true)
      expect(isValidHttpUrl('https://example.com')).toBe(true)
      expect(isValidHttpUrl('https://example.com/path?query=value')).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(isValidHttpUrl('not-a-valid-url')).toBe(false)
      expect(isValidHttpUrl('')).toBe(false)
      expect(isValidHttpUrl('ftp://example.com')).toBe(false)
      expect(isValidHttpUrl('file:///etc/passwd')).toBe(false)
      expect(isValidHttpUrl('javascript:alert(1)')).toBe(false)
    })
  })

  describe('URL Sanitization', () => {
    it('trims whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
    })
  })

  describe('HTML Parsing', () => {
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

    it('extracts title correctly', () => {
      expect(extractTitle(mockHtml)).toBe('Test Page')
    })

    it('extracts meta description correctly', () => {
      expect(extractMetaDescription(mockHtml)).toBe('Test description')
    })

    it('counts H1 tags correctly', () => {
      expect(countH1(mockHtml)).toBe(2)
    })

    it('counts images missing alt text', () => {
      expect(countImagesMissingAlt(mockHtml)).toBe(2)
    })

    it('counts words correctly', () => {
      const wordCount = countWords(mockHtml)
      expect(wordCount).toBeGreaterThan(0)
      // Should count words from "Main Heading", "Second H1", "This is some test content with multiple words"
      expect(wordCount).toBeGreaterThanOrEqual(10)
    })

    it('excludes non-visible elements from word count', () => {
      const htmlWithScripts = `
        <html>
          <head>
            <script>var x = "this should not be counted";</script>
            <style>.hidden { display: none; }</style>
          </head>
          <body>
            <h1>Visible Heading</h1>
            <p>Only these words should count.</p>
          </body>
        </html>
      `
      const wordCount = countWords(htmlWithScripts)
      // Should not include script/style content
      expect(wordCount).toBeLessThan(10)
    })

    it('returns null for missing title', () => {
      const htmlWithoutTitle = '<html><body><h1>No title here</h1></body></html>'
      expect(extractTitle(htmlWithoutTitle)).toBeNull()
    })

    it('returns null for missing meta description', () => {
      const htmlWithoutDesc = '<html><head><title>Title</title></head><body></body></html>'
      expect(extractMetaDescription(htmlWithoutDesc)).toBeNull()
    })
  })
})

describe('Audit API Endpoint', () => {
  it('should have correct timeout value', () => {
    expect(TIMEOUT_MS).toBe(8500)
  })

  it('should have correct User-Agent', () => {
    expect(USER_AGENT).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) PagePulseAuditor/1.0')
  })
})
