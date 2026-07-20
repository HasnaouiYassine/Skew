import { notFound } from "next/navigation";
import Link from "next/link";
import TopBar from "@/app/_components/TopBar";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import {
  getArticleWithAnalysis,
  getArticlesWithAnalysis,
} from "@/lib/supabase/queries/articles";

/* ─── Page metadata ──────────────────────────────────────── */
interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleWithAnalysis(id);
  return {
    title: article
      ? `${article.title} - Skew News`
      : "Article Not Found - Skew News",
  };
}

/* ─── Newsletter Signup Bar ──────────────────────────────── */
function NewsletterBar() {
  return (
    <section className="newsletter-bar" aria-label="Newsletter Subscription">
      <div className="newsletter-bar-inner">
        <div>
          <h3 className="newsletter-bar-heading">Stay Informed. Stay Balanced.</h3>
          <p className="newsletter-bar-sub">
            Get the top stories and bias analysis delivered to your inbox.
          </p>
        </div>
        <form className="newsletter-bar-form">
          <input
            type="email"
            placeholder="Enter your email"
            className="newsletter-bar-input"
            required
            aria-label="Email address"
          />
          <button type="submit" className="btn btn-primary">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 250));
  return `${minutes} min read`;
}

/** Split raw text into paragraphs for display. */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/* ─── Details Page Component ─────────────────────────────── */
// Authentication is enforced by the Clerk middleware in proxy.ts.
export default async function NewsDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleWithAnalysis(id);

  if (!article) {
    notFound();
  }

  const analysis = article.analysis;
  const left = analysis?.left_percentage ?? 33;
  const center = analysis?.center_percentage ?? 34;
  const right = analysis?.right_percentage ?? 33;
  const dateStr = formatDate(article.published_at);
  const readTime = estimateReadTime(article.raw_text);
  const paragraphs = splitParagraphs(article.raw_text);

  // Get up to 6 related stories (excluding current article)
  const allArticles = await getArticlesWithAnalysis(7);
  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id)
    .slice(0, 6);

  // Derive political framing labels & colors for sidebar
  let biasColorClass = "sidebar-bias-value--mixed";
  let biasSubColorClass = "sidebar-bias-sub--center";
  let overallLabel = "Mixed";

  if (analysis) {
    if (left > 45) {
      biasColorClass = "sidebar-bias-value--left";
      biasSubColorClass = "sidebar-bias-sub--left";
      overallLabel = `Left ${left}%`;
    } else if (right > 45) {
      biasColorClass = "sidebar-bias-value--right";
      biasSubColorClass = "sidebar-bias-sub--right";
      overallLabel = `Right ${right}%`;
    } else if (center > 45) {
      biasColorClass = "sidebar-bias-value--center";
      biasSubColorClass = "sidebar-bias-sub--center";
      overallLabel = `Center ${center}%`;
    } else {
      if (right > left) {
        biasColorClass = "sidebar-bias-value--right";
        biasSubColorClass = "sidebar-bias-sub--right";
        overallLabel = `Right ${right}%`;
      } else if (left > right) {
        biasColorClass = "sidebar-bias-value--left";
        biasSubColorClass = "sidebar-bias-sub--left";
        overallLabel = `Left ${left}%`;
      }
    }
  }

  return (
    <>
      <TopBar />
      <Navbar activePath="" />

      <main style={{ flex: 1, backgroundColor: "var(--color-bg-primary)" }}>
        <div className="article-detail-outer">
          <div className="article-detail-layout">

            {/* Left Column: Core content */}
            <article className="article-detail-main">
              {/* Breadcrumb */}
              <div className="article-breadcrumb">
                <span>{article.source?.name ?? "Unknown Source"}</span>
                <span className="article-breadcrumb-sep">·</span>
                <span>{analysis?.bias_label ?? "Pending"}</span>
              </div>

              {/* Title */}
              <h1 className="article-h1">{article.title}</h1>

              {/* Byline + actions */}
              <div className="article-meta-row">
                <div className="article-byline">
                  <span>{article.source?.name}</span>
                  <span className="byline-sep">|</span>
                  <span>{dateStr}</span>
                  <span className="byline-sep">|</span>
                  <span>{readTime}</span>
                </div>
                <div className="article-actions">
                  <button className="article-action-btn" aria-label="Save article">
                    <span style={{ fontSize: "1.1rem", marginRight: 4 }}>🔖</span>
                    Save
                  </button>
                  <button className="article-action-btn" aria-label="Share article">
                    <span style={{ fontSize: "1.1rem", marginRight: 4 }}>📤</span>
                    Share
                  </button>
                  <button className="article-action-btn" aria-label="More options">
                    <span style={{ fontWeight: "bold" }}>···</span>
                  </button>
                </div>
              </div>

              {/* Hero Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image_url}
                alt={article.title}
                className="article-hero-img"
              />

              {/* Proportional Bias Distribution Block */}
              {analysis && (
                <div className="bias-distribution-block">
                  <h4 className="bias-distribution-label">
                    Bias Distribution
                    <span className="bias-distribution-info-icon" title="View details info">i</span>
                  </h4>
                  <div
                    className="bias-distribution-bar"
                    role="img"
                    aria-label={`Bias Distribution: Left ${left}%, Center ${center}%, Right ${right}%`}
                  >
                    <div
                      className="bias-distribution-seg bias-distribution-seg--left"
                      style={{ width: `${left}%` }}
                    >
                      {left >= 12 ? `Left ${left}%` : ""}
                    </div>
                    <div
                      className="bias-distribution-seg bias-distribution-seg--center"
                      style={{ width: `${center}%` }}
                    >
                      {center >= 15 ? `Center ${center}%` : ""}
                    </div>
                    <div
                      className="bias-distribution-seg bias-distribution-seg--right"
                      style={{ width: `${right}%` }}
                    >
                      {right >= 12 ? `Right ${right}%` : ""}
                    </div>
                  </div>
                  <p className="bias-distribution-sources">
                    Confidence: {Math.round((analysis.confidence ?? 0) * 100)}%
                  </p>
                </div>
              )}

              {/* Article Paragraphs */}
              <div className="article-body">
                {paragraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Related Stories Grid */}
              {relatedArticles.length > 0 && (
                <section className="related-stories-section">
                  <h3 className="related-stories-heading">Related Stories</h3>
                  <div className="related-stories-grid">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/news/${rel.id}`}
                        className="related-card"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rel.image_url}
                          alt={rel.title}
                          className="related-card-img"
                          loading="lazy"
                        />
                        <div className="related-card-body">
                          <p className="related-card-meta">
                            {rel.source?.name ?? "Unknown"}
                            <span className="article-breadcrumb-sep">·</span>
                            {rel.analysis?.bias_label ?? "Pending"}
                          </p>
                          <h4 className="related-card-title">{rel.title}</h4>
                          <p className="related-card-info">
                            {formatDate(rel.published_at)}
                            <span className="byline-sep" style={{ margin: "0 6px" }}>|</span>
                            {estimateReadTime(rel.raw_text)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* Right Column: Sticky Sidebar Panels */}
            <aside className="article-detail-sidebar" aria-label="Analysis Sidebar">
              {/* Panel A: Bias Analysis */}
              {analysis ? (
                <div className="sidebar-panel">
                  <div className="sidebar-panel-header">
                    <h4 className="sidebar-panel-title">Bias Analysis</h4>
                    <span className="sidebar-info-icon" title="Bias Analysis Details">i</span>
                  </div>
                  <p className="sidebar-bias-caption">Overall Bias</p>
                  <h2 className={`sidebar-bias-value ${biasColorClass}`}>{overallLabel}</h2>
                  <p className={`sidebar-bias-sub ${biasSubColorClass}`}>
                    AI-estimated political framing
                  </p>

                  {/* Left Row */}
                  <div className="bias-row">
                    <span className="bias-row-label">Left</span>
                    <div className="bias-progress-track">
                      <div
                        className="bias-progress-fill bias-progress-fill--left"
                        style={{ width: `${left}%` }}
                      />
                    </div>
                    <span className="bias-row-pct">{left}%</span>
                  </div>

                  {/* Center Row */}
                  <div className="bias-row">
                    <span className="bias-row-label">Center</span>
                    <div className="bias-progress-track">
                      <div
                        className="bias-progress-fill bias-progress-fill--center"
                        style={{ width: `${center}%` }}
                      />
                    </div>
                    <span className="bias-row-pct">{center}%</span>
                  </div>

                  {/* Right Row */}
                  <div className="bias-row">
                    <span className="bias-row-label">Right</span>
                    <div className="bias-progress-track">
                      <div
                        className="bias-progress-fill bias-progress-fill--right"
                        style={{ width: `${right}%` }}
                      />
                    </div>
                    <span className="bias-row-pct">{right}%</span>
                  </div>

                  {analysis.disclaimer && (
                    <p className="sidebar-disclaimer">{analysis.disclaimer}</p>
                  )}
                  <button className="btn btn-secondary sidebar-panel-cta">
                    How We Analyze Bias
                  </button>
                </div>
              ) : (
                <div className="sidebar-panel">
                  <div className="sidebar-panel-header">
                    <h4 className="sidebar-panel-title">Bias Analysis</h4>
                  </div>
                  <p className="sidebar-disclaimer" style={{ padding: "1rem 0" }}>
                    Analysis pending. This article has not been processed by the AI yet.
                  </p>
                </div>
              )}

              {/* Panel B: AI Summary */}
              {analysis ? (
                <div className="sidebar-panel">
                  <div className="sidebar-panel-header">
                    <h4 className="sidebar-panel-title">AI Summary</h4>
                    <span className="sidebar-info-icon" title="AI Summary Info">i</span>
                  </div>
                  <p className="ai-summary-meta">
                    Generated {formatDate(analysis.created_at)} · {analysis.model}
                  </p>
                  <div className="ai-summary-list" style={{ whiteSpace: "pre-wrap" }}>
                    <p>{analysis.summary}</p>
                  </div>

                  {/* Framing notes */}
                  {analysis.framing_notes && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <p className="sidebar-bias-caption" style={{ marginBottom: "0.25rem" }}>
                        Framing Notes
                      </p>
                      <p className="sidebar-disclaimer">{analysis.framing_notes}</p>
                    </div>
                  )}

                  {/* Loaded terms */}
                  {analysis.loaded_terms && analysis.loaded_terms.length > 0 && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <p className="sidebar-bias-caption" style={{ marginBottom: "0.25rem" }}>
                        Loaded Terms
                      </p>
                      <p className="sidebar-disclaimer">
                        {analysis.loaded_terms.join(", ")}
                      </p>
                    </div>
                  )}

                  <p className="sidebar-disclaimer">
                    AI summaries can make mistakes.
                  </p>
                  <button className="btn btn-secondary sidebar-panel-cta">
                    Provide Feedback
                  </button>
                </div>
              ) : (
                <div className="sidebar-panel">
                  <div className="sidebar-panel-header">
                    <h4 className="sidebar-panel-title">AI Summary</h4>
                  </div>
                  <p className="sidebar-disclaimer" style={{ padding: "1rem 0" }}>
                    Summary pending. This article has not been analyzed yet.
                  </p>
                </div>
              )}

              {/* Panel C: Sentiment */}
              {analysis && (
                <div className="sidebar-panel">
                  <div className="sidebar-panel-header">
                    <h4 className="sidebar-panel-title">Sentiment</h4>
                    <span className="sidebar-info-icon" title="Sentiment Info">i</span>
                  </div>
                  <p className="source-count-label" style={{ textTransform: "capitalize" }}>
                    {analysis.sentiment_label}
                  </p>
                  <div className="bias-row" style={{ marginTop: "0.5rem" }}>
                    <span className="bias-row-label">Score</span>
                    <div className="bias-progress-track">
                      <div
                        className="bias-progress-fill bias-progress-fill--center"
                        style={{ width: `${((analysis.sentiment_score + 1) / 2) * 100}%` }}
                      />
                    </div>
                    <span className="bias-row-pct">
                      {analysis.sentiment_score.toFixed(2)}
                    </span>
                  </div>
                  <p className="sidebar-disclaimer" style={{ marginTop: "0.5rem" }}>
                    Sentiment ranges from −1 (negative) to +1 (positive).
                  </p>
                </div>
              )}
            </aside>

          </div>
        </div>
      </main>

      <NewsletterBar />
      <Footer />
    </>
  );
}
