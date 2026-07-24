import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { onRequestPost } from "../functions/api/audit";

function createMockContext(requestBody: any): any {
  return {
    request: new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    })
  };
}

describe("POST /api/audit Function", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("1. Happy path — parses normal HTML page correctly", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Title</title>
          <meta name="description" content="Test description content">
        </head>
        <body>
          <h1>First Heading</h1>
          <h1>Second Heading</h1>
          <p>Hello world from test page.</p>
          <img src="test1.png" alt="Valid alt text" />
          <img src="test2.png" alt="" />
          <img src="test3.png" />
        </body>
      </html>
    `;

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(mockHtml, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      })
    );

    const context = createMockContext({ url: "https://example.com" });
    const response = await onRequestPost(context);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.title).toBe("Test Title");
    expect(data.metaDescription).toBe("Test description content");
    expect(data.h1Count).toBe(2);
    expect(data.imagesMissingAlt).toBe(2);
    expect(data.wordCount).toBe(9);
    expect(data.httpStatus).toBe(200);
  });

  it("2. Failure case — returns timeout error shape when request times out", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    const context = createMockContext({ url: "https://slow-website.com" });
    const response = await onRequestPost(context);
    const data = await response.json() as any;

    expect(response.status).toBe(504);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("timed out");
  });

  it("3. Failure case — returns non-HTML error shape when Content-Type is PDF", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("%PDF-1.4...", {
        status: 200,
        headers: { "Content-Type": "application/pdf" }
      })
    );

    const context = createMockContext({ url: "https://example.com/document.pdf" });
    const response = await onRequestPost(context);
    const data = await response.json() as any;

    expect(response.status).toBe(415);
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Not an HTML page");
  });

  it("4. Failure case — rejects invalid or non-HTTP URLs", async () => {
    const context = createMockContext({ url: "ftp://invalid-protocol.com" });
    const response = await onRequestPost(context);
    const data = await response.json() as any;

    expect(response.status).toBe(400);
    expect(data.error).toContain("HTTP and HTTPS");
  });
});
