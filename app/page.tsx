import Link from "next/link";
import TopBar from "@/app/_components/TopBar";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import { getArticlesWithAnalysis } from "@/lib/supabase/queries/articles";
import type { ArticleWithAnalysis } from "@/lib/supabase/types";
import { CATEGORIES } from "@/app/_lib/mock-data";

/* ─── Bias meter bar ─────────────────────────────────────── */
function BiasMeter({
  left,
  center,
  right,
}: {
  left: number;
  center: number;
  right: number;
}) {
  return (
    <div
      className="article-bias-bar"
      role="img"
      aria-label={`Bias: Left ${left}%, Center ${center}%, Right ${right}%`}
    >
      <div
        className="article-bias-seg article-bias-seg--left"
        style={{ width: `${left}%` }}
      >
        {left >= 12 ? `L ${left}%` : ""}
      </div>
      <div
        className="article-bias-seg article-bias-seg--center"
        style={{ width: `${center}%` }}
      >
        {center >= 15 ? `Center ${center}%` : ""}
      </div>
      <div
        className="article-bias-seg article-bias-seg--right"
        style={{ width: `${right}%` }}
      >
        {right >= 12 ? `Right ${right}%` : ""}
      </div>
    </div>
  );
}

/* ─── Article card ───────────────────────────────────────── */
function ArticleCard({ article }: { article: ArticleWithAnalysis }) {
  const left = article.analysis?.left_percentage ?? 33;
  const center = article.analysis?.center_percentage ?? 34;
  const right = article.analysis?.right_percentage ?? 33;
  const biasLabel = article.analysis?.bias_label ?? "pending";
  const sentimentLabel = article.analysis?.sentiment_label ?? "pending";

  // Format the published date
  const dateStr = new Date(article.published_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/news/${article.id}`}
      className="article-card"
      id={`article-card-${article.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      {/* Image */}
      <div className="article-card-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.image_url} alt={article.title} loading="lazy" />
        <span
          className="article-card-info-btn"
          aria-label="Article source information"
          id={`article-info-${article.id}`}
        >
          i
        </span>
      </div>

      {/* Body */}
      <div className="article-card-body">
        <p className="article-card-meta">
          {article.source?.name ?? "Unknown Source"}
          <span className="article-card-meta-dot">·</span>
          {dateStr}
        </p>
        <h2 className="article-card-title">{article.title}</h2>
        {article.analysis && (
          <>
            <BiasMeter left={left} center={center} right={right} />
            <p className="article-card-sources">
              {biasLabel} · {sentimentLabel}
            </p>
          </>
        )}
      </div>
    </Link>
  );
}

/* ─── Category strip ─────────────────────────────────────── */
function CategoryStrip() {
  return (
    <div
      className="category-strip"
      role="navigation"
      aria-label="Topic categories"
    >
      <div className="category-strip-inner">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className="chip"
            id={`chip-${cat.replace(/\s+/g, "-").toLowerCase()}`}
          >
            <span style={{ fontSize: "0.75rem", marginRight: 2 }}>+</span>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────── */
function EmptyState() {
  return (
    <section className="news-section" aria-label="No articles yet">
      <div className="news-section-inner" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h1 className="news-section-heading">Top News</h1>
        <p style={{ color: "var(--color-text-secondary, #888)", fontSize: "1.1rem", marginTop: "1rem" }}>
          No analyzed articles yet. Once scraping and AI analysis run, articles will appear here.
        </p>
      </div>
    </section>
  );
}

/* ─── News grid ──────────────────────────────────────────── */
function NewsGrid({ articles }: { articles: ArticleWithAnalysis[] }) {
  if (articles.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="news-section" aria-label="Top News">
      <div className="news-section-inner">
        <h1 className="news-section-heading">Top News</h1>
        <div className="news-grid">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page (Server Component — fetches from Supabase) ────── */
export default async function HomePage() {
  const articles = await getArticlesWithAnalysis(20);

  return (
    <>
      <TopBar />
      <Navbar activePath="/" />
      <CategoryStrip />
      <main style={{ flex: 1, backgroundColor: "var(--color-bg-primary)" }}>
        <NewsGrid articles={articles} />
      </main>
      <Footer />
    </>
  );
}