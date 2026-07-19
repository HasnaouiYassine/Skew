import Link from "next/link";
import TopBar from "@/app/_components/TopBar";
import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import { MOCK_ARTICLES, CATEGORIES, type Article } from "@/app/_lib/mock-data";

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
function ArticleCard({ article }: { article: Article }) {
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
        <img src={article.imageUrl} alt={article.title} loading="lazy" />
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
          {article.category}
          <span className="article-card-meta-dot">·</span>
          {article.region}
        </p>
        <h2 className="article-card-title">{article.title}</h2>
        <BiasMeter
          left={article.left}
          center={article.center}
          right={article.right}
        />
        <p className="article-card-sources">{article.sources} sources</p>
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

/* ─── News grid ──────────────────────────────────────────── */
function NewsGrid() {
  return (
    <section className="news-section" aria-label="Top News">
      <div className="news-section-inner">
        <h1 className="news-section-heading">Top News</h1>
        <div className="news-grid">
          {MOCK_ARTICLES.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <TopBar />
      <Navbar activePath="/" />
      <CategoryStrip />
      <main style={{ flex: 1, backgroundColor: "var(--color-bg-primary)" }}>
        <NewsGrid />
      </main>
      <Footer />
    </>
  );
}