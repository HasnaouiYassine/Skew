import { notFound } from "next/navigation";
import Link from "next/link";
import TopBar from "@/app/_components/TopBar";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import { MOCK_ARTICLES } from "@/app/_lib/mock-data";

/* ─── Static params generation ───────────────────────────── */
export async function generateStaticParams() {
  return MOCK_ARTICLES.map((article) => ({
    id: String(article.id),
  }));
}

/* ─── Page metadata ──────────────────────────────────────── */
interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const article = MOCK_ARTICLES.find((a) => String(a.id) === id);
  return {
    title: article ? `${article.title} - Skew News` : "Article Not Found - Skew News",
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

/* ─── Details Page Component ─────────────────────────────── */
// Authentication is enforced by the Clerk middleware in proxy.ts.
// No page-level auth.protect() needed — that caused the infinite redirect loop.
export default async function NewsDetailsPage({ params }: PageProps) {

  const { id } = await params;
  const article = MOCK_ARTICLES.find((a) => String(a.id) === id);

  if (!article) {
    notFound();
  }

  // Get up to 6 related stories (excluding current article)
  const relatedArticles = MOCK_ARTICLES.filter((a) => a.id !== article.id).slice(0, 6);

  // Derive political framing labels & colors for sidebar
  let biasColorClass = "sidebar-bias-value--mixed";
  let biasSubColorClass = "sidebar-bias-sub--center";
  let overallLabel = "Mixed";

  if (article.left > 45) {
    biasColorClass = "sidebar-bias-value--left";
    biasSubColorClass = "sidebar-bias-sub--left";
    overallLabel = `Left ${article.left}%`;
  } else if (article.right > 45) {
    biasColorClass = "sidebar-bias-value--right";
    biasSubColorClass = "sidebar-bias-sub--right";
    overallLabel = `Right ${article.right}%`;
  } else if (article.center > 45) {
    biasColorClass = "sidebar-bias-value--center";
    biasSubColorClass = "sidebar-bias-sub--center";
    overallLabel = `Center ${article.center}%`;
  } else {
    // Mixed / balanced representation
    if (article.right > article.left) {
      biasColorClass = "sidebar-bias-value--right";
      biasSubColorClass = "sidebar-bias-sub--right";
      overallLabel = `Right ${article.right}%`;
    } else if (article.left > article.right) {
      biasColorClass = "sidebar-bias-value--left";
      biasSubColorClass = "sidebar-bias-sub--left";
      overallLabel = `Left ${article.left}%`;
    }
  }

  // Count source alignments for sidebar panel C
  const leftSourcesCount = article.sourceList.filter((s) => s.bias === "Left").length;
  const centerSourcesCount = article.sourceList.filter((s) => s.bias === "Center").length;
  const rightSourcesCount = article.sourceList.filter((s) => s.bias === "Right").length;

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
                <span>{article.category}</span>
                <span className="article-breadcrumb-sep">·</span>
                <span>{article.region}</span>
              </div>

              {/* Title */}
              <h1 className="article-h1">{article.title}</h1>

              {/* Byline + actions */}
              <div className="article-meta-row">
                <div className="article-byline">
                  <span>By {article.author}</span>
                  <span className="byline-sep">|</span>
                  <span>{article.date}</span>
                  <span className="byline-sep">|</span>
                  <span>{article.readTime}</span>
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
                src={article.imageUrl}
                alt={article.title}
                className="article-hero-img"
              />
              <p className="article-caption">{article.imageCaption}</p>

              {/* Proportional Bias Distribution Block */}
              <div className="bias-distribution-block">
                <h4 className="bias-distribution-label">
                  Bias Distribution
                  <span className="bias-distribution-info-icon" title="View details info">i</span>
                </h4>
                <div
                  className="bias-distribution-bar"
                  role="img"
                  aria-label={`Bias Distribution: Left ${article.left}%, Center ${article.center}%, Right ${article.right}%`}
                >
                  <div
                    className="bias-distribution-seg bias-distribution-seg--left"
                    style={{ width: `${article.left}%` }}
                  >
                    {article.left >= 12 ? `Left ${article.left}%` : ""}
                  </div>
                  <div
                    className="bias-distribution-seg bias-distribution-seg--center"
                    style={{ width: `${article.center}%` }}
                  >
                    {article.center >= 15 ? `Center ${article.center}%` : ""}
                  </div>
                  <div
                    className="bias-distribution-seg bias-distribution-seg--right"
                    style={{ width: `${article.right}%` }}
                  >
                    {article.right >= 12 ? `Right ${article.right}%` : ""}
                  </div>
                </div>
                <p className="bias-distribution-sources">{article.sources} sources</p>
              </div>

              {/* Article Paragraphs */}
              <div className="article-body">
                {article.body.slice(0, 3).map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
                
                {article.quote && (
                  <blockquote className="article-blockquote">
                    {article.quote}
                  </blockquote>
                )}

                {article.body.slice(3).map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Related Stories Grid */}
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
                        src={rel.imageUrl}
                        alt={rel.title}
                        className="related-card-img"
                        loading="lazy"
                      />
                      <div className="related-card-body">
                        <p className="related-card-meta">
                          {rel.category}
                          <span className="article-breadcrumb-sep">·</span>
                          {rel.region}
                        </p>
                        <h4 className="related-card-title">{rel.title}</h4>
                        <p className="related-card-info">
                          {rel.date}
                          <span className="byline-sep" style={{ margin: "0 6px" }}>|</span>
                          {rel.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </article>

            {/* Right Column: Sticky Sidebar Panels */}
            <aside className="article-detail-sidebar" aria-label="Analysis Sidebar">
              {/* Panel A: Bias Analysis */}
              <div className="sidebar-panel">
                <div className="sidebar-panel-header">
                  <h4 className="sidebar-panel-title">Bias Analysis</h4>
                  <span className="sidebar-info-icon" title="Bias Analysis Details">i</span>
                </div>
                <p className="sidebar-bias-caption">Overall Bias</p>
                <h2 className={`sidebar-bias-value ${biasColorClass}`}>{overallLabel}</h2>
                <p className={`sidebar-bias-sub ${biasSubColorClass}`}>
                  Based on {article.sources} balanced sources
                </p>

                {/* Left Row */}
                <div className="bias-row">
                  <span className="bias-row-label">Left</span>
                  <div className="bias-progress-track">
                    <div
                      className="bias-progress-fill bias-progress-fill--left"
                      style={{ width: `${article.left}%` }}
                    />
                  </div>
                  <span className="bias-row-pct">{article.left}%</span>
                </div>

                {/* Center Row */}
                <div className="bias-row">
                  <span className="bias-row-label">Center</span>
                  <div className="bias-progress-track">
                    <div
                      className="bias-progress-fill bias-progress-fill--center"
                      style={{ width: `${article.center}%` }}
                    />
                  </div>
                  <span className="bias-row-pct">{article.center}%</span>
                </div>

                {/* Right Row */}
                <div className="bias-row">
                  <span className="bias-row-label">Right</span>
                  <div className="bias-progress-track">
                    <div
                      className="bias-progress-fill bias-progress-fill--right"
                      style={{ width: `${article.right}%` }}
                    />
                  </div>
                  <span className="bias-row-pct">{article.right}%</span>
                </div>

                <p className="sidebar-disclaimer">
                  Our analysis is based on the political leaning of the publication and how the story is framed. Sources are weighted by reliability and recency.
                </p>
                <button className="btn btn-secondary sidebar-panel-cta">
                  How We Analyze Bias
                </button>
              </div>

              {/* Panel B: AI Summary */}
              <div className="sidebar-panel">
                <div className="sidebar-panel-header">
                  <h4 className="sidebar-panel-title">AI Summary</h4>
                  <span className="sidebar-info-icon" title="AI Summary Info">i</span>
                </div>
                <p className="ai-summary-meta">
                  Generated {article.date} · 3 min read
                </p>
                <ul className="ai-summary-list">
                  {article.aiSummary.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
                <p className="sidebar-disclaimer">
                  AI summaries can make mistakes.
                </p>
                <button className="btn btn-secondary sidebar-panel-cta">
                  Provide Feedback
                </button>
              </div>

              {/* Panel C: Source Breakdown */}
              <div className="sidebar-panel">
                <div className="sidebar-panel-header">
                  <h4 className="sidebar-panel-title">Source Breakdown</h4>
                  <span className="sidebar-info-icon" title="Source Breakdown Info">i</span>
                </div>
                <p className="source-count-label">{article.sources} Total Sources</p>

                <div className="source-breakdown-rows">
                  {/* Left sources */}
                  <div className="source-breakdown-row">
                    <span className="source-breakdown-row-label">Left</span>
                    <div className="bias-progress-track">
                      <div
                        className="bias-progress-fill bias-progress-fill--left"
                        style={{ width: `${(leftSourcesCount / article.sourceList.length) * 100}%` }}
                      />
                    </div>
                    <span className="source-breakdown-row-count">
                      {leftSourcesCount} ({Math.round((leftSourcesCount / article.sourceList.length) * 100)}%)
                    </span>
                  </div>

                  {/* Center sources */}
                  <div className="source-breakdown-row">
                    <span className="source-breakdown-row-label">Center</span>
                    <div className="bias-progress-track">
                      <div
                        className="bias-progress-fill bias-progress-fill--center"
                        style={{ width: `${(centerSourcesCount / article.sourceList.length) * 100}%` }}
                      />
                    </div>
                    <span className="source-breakdown-row-count">
                      {centerSourcesCount} ({Math.round((centerSourcesCount / article.sourceList.length) * 100)}%)
                    </span>
                  </div>

                  {/* Right sources */}
                  <div className="source-breakdown-row">
                    <span className="source-breakdown-row-label">Right</span>
                    <div className="bias-progress-track">
                      <div
                        className="bias-progress-fill bias-progress-fill--right"
                        style={{ width: `${(rightSourcesCount / article.sourceList.length) * 100}%` }}
                      />
                    </div>
                    <span className="source-breakdown-row-count">
                      {rightSourcesCount} ({Math.round((rightSourcesCount / article.sourceList.length) * 100)}%)
                    </span>
                  </div>
                </div>

                {/* Source Table */}
                <div className="top-sources-header">
                  <span>Top Sources</span>
                  <span>Bias</span>
                </div>
                <div style={{ marginBottom: "var(--space-4)" }}>
                  {article.sourceList.map((src, idx) => (
                    <div key={idx} className="source-row">
                      <span className="source-row-name">{src.name}</span>
                      <span
                        className={`source-bias-label--${src.bias.toLowerCase()}`}
                      >
                        {src.bias}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-secondary sidebar-panel-cta">
                  View All Sources
                </button>
              </div>
            </aside>

          </div>
        </div>
      </main>

      <NewsletterBar />
      <Footer />
    </>
  );
}
