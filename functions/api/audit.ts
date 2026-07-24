/// <reference types="@cloudflare/workers-types" />
import * as cheerio from "cheerio";

interface AuditSuccessResponse {
  url: string;
  httpStatus: number;
  responseTimeMs: number;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  imagesMissingAlt: number;
  wordCount: number;
}

interface AuditErrorResponse {
  error: string;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = (await context.request.json()) as { url?: string };
    const rawUrl = body?.url?.trim();

    if (!rawUrl) {
      return jsonResponse({ error: "URL is required" }, 400);
    }

    // 1. Validate URL protocol and structure
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return jsonResponse({ error: "Invalid URL: Only HTTP and HTTPS protocols are supported" }, 400);
      }
    } catch {
      return jsonResponse({ error: "Invalid URL: Must be a well-formed HTTP or HTTPS address" }, 400);
    }

    // 2. Fetch target with 8.5 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    const startTime = performance.now();
    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent": "PagePulseAuditBot/1.0 (+https://digitalheroesco.com)"
        }
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        return jsonResponse({ error: "Audit request timed out after 8.5 seconds" }, 504);
      }
      return jsonResponse({ error: `Failed to reach target host: ${err.message || "Network error"}` }, 502);
    } finally {
      clearTimeout(timeoutId);
    }

    const responseTimeMs = Math.round(performance.now() - startTime);
    const httpStatus = response.status;

    // 3. Check Content-Type header
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return jsonResponse({ error: `Not an HTML page (Content-Type is '${contentType || "unknown"}')` }, 415);
    }

    // 4. Parse HTML content with Cheerio
    const htmlText = await response.text();
    const $ = cheerio.load(htmlText);

    // Document Metadata (extracted before element deletion)
    const title = $("title").first().text().trim() || null;
    const metaDescription = $('meta[name="description" i]').attr("content")?.trim() || null;
    const h1Count = $("h1").length;

    // Images missing alt attributes
    let imagesMissingAlt = 0;
    $("img").each((_, el) => {
      const alt = $(el).attr("alt");
      if (alt === undefined || alt.trim() === "") {
        imagesMissingAlt++;
      }
    });

    // Approximate visible Word Count (removes non-visible elements & head metadata)
    $("head, script, style, noscript, svg, iframe").remove();
    const visibleText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = visibleText ? visibleText.split(/\s+/).length : 0;

    const result: AuditSuccessResponse = {
      url: parsedUrl.toString(),
      httpStatus,
      responseTimeMs,
      title,
      metaDescription,
      h1Count,
      imagesMissingAlt,
      wordCount
    };

    return jsonResponse(result, 200);

  } catch (err: any) {
    return jsonResponse({ error: "An unexpected internal error occurred during audit processing" }, 500);
  }
};

function jsonResponse(data: AuditSuccessResponse | AuditErrorResponse, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}