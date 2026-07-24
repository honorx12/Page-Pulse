import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Globe, 
  Clock, 
  FileText, 
  Image, 
  Hash, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Search,
  Moon,
  Sun,
  BarChart3,
  Layers,
  Sparkles,
  Shield,
  Loader2
} from "lucide-react";

interface AuditReport {
  url: string;
  httpStatus: number;
  responseTimeMs: number;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  imagesMissingAlt: number;
  wordCount: number;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme based on system preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      // Type the JSON response explicitly so 'data.error' passes strict TypeScript checks
      const data = (await res.json()) as { error?: string } & AuditReport;

      if (!res.ok || data.error) {
        setError(data.error || "An unknown error occurred during audit");
      } else {
        setReport(data);
      }
    } catch (err) {
      setError("Failed to communicate with audit server. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: number) => {
    if (status >= 200 && status < 300) {
      return { 
        icon: CheckCircle2, 
        class: "success", 
        label: "Success",
        description: "Page loaded successfully"
      };
    }
    if (status >= 300 && status < 400) {
      return { 
        icon: Layers, 
        class: "redirect", 
        label: "Redirect",
        description: "Page redirects to another URL"
      };
    }
    if (status >= 400 && status < 500) {
      return { 
        icon: AlertCircle, 
        class: "client-error", 
        label: "Client Error",
        description: "Request error - check the URL"
      };
    }
    return { 
      icon: XCircle, 
      class: "server-error", 
      label: "Server Error",
      description: "Server error - page may be down"
    };
  };

  const getPerformanceScore = (responseTimeMs: number) => {
    if (responseTimeMs < 500) return { score: "A", color: "excellent", text: "Excellent" };
    if (responseTimeMs < 1500) return { score: "B", color: "good", text: "Good" };
    if (responseTimeMs < 3000) return { score: "C", color: "fair", text: "Fair" };
    return { score: "D", color: "poor", text: "Slow" };
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Animated Background */}
      <div className="ambient-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <Activity className="logo-symbol" />
            </div>
            <div className="brand">
              <h1 className="brand-name">PagePulse</h1>
              <span className="brand-tagline">Web Performance Analyzer</span>
            </div>
          </div>
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Instant Website Analysis</span>
          </div>
          <h2 className="hero-title">
            Analyze Your Web Pages
            <span className="hero-title-gradient">in Seconds</span>
          </h2>
          <p className="hero-subtitle">
            Comprehensive audits for performance, SEO, accessibility, and content structure.
            Get actionable insights to optimize your web presence.
          </p>
        </section>

        {/* Input Section */}
        <section className="input-section">
          <div className="input-card glass">
            <form onSubmit={handleAudit} className="audit-form">
              <div className="input-group">
                <div className="input-wrapper">
                  <Globe className="input-icon" size={20} />
                  <input
                    type="url"
                    className="url-input"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="audit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="btn-icon spinning" size={18} />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="btn-icon" size={18} />
                      <span>Audit Page</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="error-toast">
                <AlertCircle size={20} />
                <div className="error-content">
                  <strong>Audit Failed</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        {report && (
          <section className="results-section">
            {/* Overview Cards */}
            <div className="overview-grid">
              {/* Status Card */}
              <div className="metric-card status-card">
                <div className="metric-header">
                  <Shield size={16} />
                  <span>HTTP Status</span>
                </div>
                <div className="metric-body">
                  {(() => {
                    const statusInfo = getStatusInfo(report.httpStatus);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <>
                        <div className={`status-badge ${statusInfo.class}`}>
                          <StatusIcon size={24} />
                          <span className="status-code">{report.httpStatus}</span>
                        </div>
                        <span className="status-label">{statusInfo.label}</span>
                        <span className="status-description">{statusInfo.description}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Performance Card */}
              <div className="metric-card performance-card">
                <div className="metric-header">
                  <Zap size={16} />
                  <span>Response Time</span>
                </div>
                <div className="metric-body">
                  {(() => {
                    const perf = getPerformanceScore(report.responseTimeMs);
                    return (
                      <>
                        <div className="performance-ring">
                          <span className={`performance-score ${perf.color}`}>{perf.score}</span>
                        </div>
                        <span className="metric-value">{report.responseTimeMs}ms</span>
                        <span className="performance-label">{perf.text}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Word Count Card */}
              <div className="metric-card">
                <div className="metric-header">
                  <FileText size={16} />
                  <span>Word Count</span>
                </div>
                <div className="metric-body">
                  <span className="metric-large">{report.wordCount.toLocaleString()}</span>
                  <span className="metric-sub">words</span>
                </div>
              </div>

              {/* H1 Count Card */}
              <div className="metric-card">
                <div className="metric-header">
                  <Hash size={16} />
                  <span>H1 Tags</span>
                </div>
                <div className="metric-body">
                  <span className="metric-large">{report.h1Count}</span>
                  <span className="metric-sub">headings</span>
                </div>
              </div>

              {/* Images Card */}
              <div className="metric-card">
                <div className="metric-header">
                  <Image size={16} />
                  <span>Images Missing Alt</span>
                </div>
                <div className="metric-body">
                  <span className={`metric-large ${report.imagesMissingAlt > 0 ? 'warning' : 'success'}`}>
                    {report.imagesMissingAlt}
                  </span>
                  <span className="metric-sub">images</span>
                </div>
              </div>

              {/* SEO Score Card */}
              <div className="metric-card seo-card">
                <div className="metric-header">
                  <BarChart3 size={16} />
                  <span>SEO Health</span>
                </div>
                <div className="metric-body">
                  {(() => {
                    let seoScore = 100;
                    if (!report.title) seoScore -= 30;
                    if (!report.metaDescription) seoScore -= 30;
                    if (report.h1Count === 0) seoScore -= 20;
                    if (report.imagesMissingAlt > 0) seoScore -= 20;
                    
                    const getScoreColor = (score: number) => {
                      if (score >= 80) return 'excellent';
                      if (score >= 60) return 'good';
                      if (score >= 40) return 'fair';
                      return 'poor';
                    };
                    
                    return (
                      <>
                        <div className="seo-ring">
                          <span className={`seo-score ${getScoreColor(seoScore)}`}>{seoScore}</span>
                        </div>
                        <span className="seo-label">
                          {seoScore >= 80 ? 'Excellent' : seoScore >= 60 ? 'Good' : seoScore >= 40 ? 'Fair' : 'Poor'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="details-grid">
              {/* Title & Meta */}
              <div className="detail-panel glass">
                <div className="panel-header">
                  <div className="panel-icon">
                    <Search size={18} />
                  </div>
                  <h3>Content Analysis</h3>
                </div>
                <div className="panel-content">
                  <div className="detail-item">
                    <span className="detail-label">Page Title</span>
                    <div className={`detail-value ${report.title ? 'has-content' : 'empty'}`}>
                      {report.title || (
                        <span className="empty-state">
                          <AlertCircle size={14} />
                          No title tag found
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Meta Description</span>
                    <div className={`detail-value ${report.metaDescription ? 'has-content' : 'empty'}`}>
                      {report.metaDescription || (
                        <span className="empty-state">
                          <AlertCircle size={14} />
                          No meta description found
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="detail-item url-item">
                    <span className="detail-label">Audited URL</span>
                    <div className="detail-value url-value">
                      <Globe size={14} />
                      <span className="url-text">{report.url}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="detail-panel glass recommendations">
                <div className="panel-header">
                  <div className="panel-icon accent">
                    <Sparkles size={18} />
                  </div>
                  <h3>Recommendations</h3>
                </div>
                <div className="panel-content">
                  <ul className="recommendation-list">
                    {!report.title && (
                      <li className="rec-item critical">
                        <XCircle size={16} />
                        <span>Add a descriptive &lt;title&gt; tag</span>
                      </li>
                    )}
                    {!report.metaDescription && (
                      <li className="rec-item critical">
                        <XCircle size={16} />
                        <span>Add a meta description for SEO</span>
                      </li>
                    )}
                    {report.h1Count === 0 && (
                      <li className="rec-item warning">
                        <AlertCircle size={16} />
                        <span>Add at least one H1 heading</span>
                      </li>
                    )}
                    {report.h1Count > 1 && (
                      <li className="rec-item warning">
                        <AlertCircle size={16} />
                        <span>Multiple H1 tags - consider using only one</span>
                      </li>
                    )}
                    {report.imagesMissingAlt > 0 && (
                      <li className="rec-item warning">
                        <AlertCircle size={16} />
                        <span>Add alt text to {report.imagesMissingAlt} image(s) for accessibility</span>
                      </li>
                    )}
                    {report.responseTimeMs > 2000 && (
                      <li className="rec-item warning">
                        <Clock size={16} />
                        <span>Page load time is slow - optimize assets</span>
                      </li>
                    )}
                    {report.title && report.metaDescription && report.h1Count === 1 && report.imagesMissingAlt === 0 && report.responseTimeMs < 1000 && (
                      <li className="rec-item success">
                        <CheckCircle2 size={16} />
                        <span>Great job! Page follows best practices</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Activity size={16} />
            <span>PagePulse</span>
          </div>
          <div className="footer-links">
            <span>Built with</span>
            <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">
              Digital Heroes
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
