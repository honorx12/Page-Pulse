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
