import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────── */
interface Article {
  id: number;
  category: string;
  region: string;
  title: string;
  imageUrl: string;
  left: number;
  center: number;
  right: number;
  sources: number;
}

/* ─── Mock data (12 cards matching the design) ───────────── */
const MOCK_ARTICLES: Article[] = [
  {
    id: 1,
    category: "Politics",
    region: "United States",
    title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    imageUrl: "https://picsum.photos/seed/iran1/600/338",
    left: 20,
    center: 31,
    right: 49,
    sources: 12,
  },
  {
    id: 2,
    category: "Health",
    region: "United States",
    title: "Researchers Make Case for Grapes as a 'Superfood' After Review of Health Evidence",
    imageUrl: "https://picsum.photos/seed/grapes2/600/338",
    left: 18,
    center: 42,
    right: 40,
    sources: 7,
  },
  {
    id: 3,
    category: "Science",
    region: "Switzerland",
    title: "CERN Finds High-Significance Hint of Physics Beyond Standard Model",
    imageUrl: "https://picsum.photos/seed/cern3/600/338",
    left: 16,
    center: 62,
    right: 22,
    sources: 8,
  },
  {
    id: 4,
    category: "World",
    region: "Nicaragua",
    title: "Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention",
    imageUrl: "https://picsum.photos/seed/nicar4/600/338",
    left: 54,
    center: 28,
    right: 18,
    sources: 63,
  },
  {
    id: 5,
    category: "World",
    region: "Middle East",
    title: "UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon",
    imageUrl: "https://picsum.photos/seed/un5/600/338",
    left: 26,
    center: 35,
    right: 45,
    sources: 15,
  },
  {
    id: 6,
    category: "Business",
    region: "Global",
    title: "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand",
    imageUrl: "https://picsum.photos/seed/oil6/600/338",
    left: 25,
    center: 50,
    right: 29,
    sources: 11,
  },
  {
    id: 7,
    category: "Technology",
    region: "United States",
    title: "SpaceX Launches Starship Test Flight in Milestone for Mars Program",
    imageUrl: "https://picsum.photos/seed/spacex7/600/338",
    left: 12,
    center: 45,
    right: 43,
    sources: 9,
  },
  {
    id: 8,
    category: "Business",
    region: "United States",
    title: "Apple Unveils AI-Powered Features Across iPhone, iPad and Mac",
    imageUrl: "https://picsum.photos/seed/apple8/600/338",
    left: 15,
    center: 40,
    right: 45,
    sources: 10,
  },
  {
    id: 9,
    category: "Climate",
    region: "Global",
    title: "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says",
    imageUrl: "https://picsum.photos/seed/climate9/600/338",
    left: 33,
    center: 34,
    right: 33,
    sources: 14,
  },
  {
    id: 10,
    category: "Economy",
    region: "United States",
    title: "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook",
    imageUrl: "https://picsum.photos/seed/fed10/600/338",
    left: 30,
    center: 45,
    right: 25,
    sources: 13,
  },
  {
    id: 11,
    category: "Soccer",
    region: "Europe",
    title: "Real Madrid Win Champions League After Comeback Victory in Final",
    imageUrl: "https://picsum.photos/seed/madrid11/600/338",
    left: 10,
    center: 20,
    right: 70,
    sources: 26,
  },
  {
    id: 12,
    category: "Environment",
    region: "Canada",
    title: "Wildfires Force Thousands to Evacuate Across Western Canada",
    imageUrl: "https://picsum.photos/seed/fire12/600/338",
    left: 27,
    center: 33,
    right: 40,
    sources: 17,
  },
];

const CATEGORIES = [
  "World Cup",
  "IPL",
  "Social Media",
  "Business & Markets",
  "Health & Medicine",
  "Soccer",
  "Artificial Intelligence",
  "Arsenal FC",
  "Extreme Weather and Disasters",
  "Technology",
  "Climate",
  "Economy",
];

/* ─── Sub-components ─────────────────────────────────────── */

function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-inner">
        <div className="top-bar-left">
          <a href="#">Browser Extension</a>
          <span className="top-bar-sep">|</span>
          <span className="top-bar-theme-label">
            Theme:&nbsp;
            <span className="top-bar-theme-active">Light</span>
            <span>&nbsp;|&nbsp;</span>
            <span>Dark</span>
            <span>&nbsp;|&nbsp;</span>
            <span>Auto</span>
          </span>
        </div>
        <div className="top-bar-right">
          <span>Monday, June 1, 2026</span>
          <span className="top-bar-sep">·</span>
          <a href="#">Set Location</a>
          <span className="top-bar-sep">·</span>
          <a href="#">
            <span style={{ marginRight: 4 }}>🌐</span>
            International Edition ▾
          </a>
        </div>
      </div>
    </div>
  );
}

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Left: hamburger + logo */}
        <div className="navbar-left">
          <button className="hamburger-btn" aria-label="Open menu">
            <span />
            <span />
            <span />
          </button>
          <Link href="/" className="navbar-logo" aria-label="biasly News home">
            <span className="navbar-logo-brand">biasly</span>
            <span className="navbar-logo-sub">News</span>
          </Link>
          {/* Navigation */}
          <nav className="navbar-nav" aria-label="Main navigation">
            <Link href="/" className="nav-link nav-link-active">
              Home
            </Link>
            <Link href="#" className="nav-link" style={{ position: "relative" }}>
              For You
              <span className="nav-link-badge" aria-hidden="true" />
            </Link>
            <Link href="#" className="nav-link">
              Local
            </Link>
            <Link href="#" className="nav-link">
              Blindspot
            </Link>
          </nav>
        </div>

        {/* Right: CTA buttons */}
        <div className="navbar-right">
          <button className="btn btn-primary" id="subscribe-btn">
            Subscribe
          </button>
          <button className="btn btn-secondary" id="login-btn">
            Login
          </button>
        </div>
      </div>
    </header>
  );
}

function CategoryStrip() {
  return (
    <div className="category-strip" role="navigation" aria-label="Topic categories">
      <div className="category-strip-inner">
        {CATEGORIES.map((cat) => (
          <button key={cat} className="chip" id={`chip-${cat.replace(/\s+/g, "-").toLowerCase()}`}>
            <span style={{ fontSize: "0.75rem", marginRight: 2 }}>+</span>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    <div className="article-bias-bar" role="img" aria-label={`Bias: Left ${left}%, Center ${center}%, Right ${right}%`}>
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

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card" id={`article-card-${article.id}`}>
      {/* Image */}
      <div className="article-card-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.imageUrl}
          alt={article.title}
          loading="lazy"
        />
        <button
          className="article-card-info-btn"
          aria-label="Article source information"
          id={`article-info-${article.id}`}
        >
          i
        </button>
      </div>

      {/* Body */}
      <div className="article-card-body">
        {/* Meta */}
        <p className="article-card-meta">
          {article.category}
          <span className="article-card-meta-dot">·</span>
          {article.region}
        </p>

        {/* Title */}
        <h2 className="article-card-title">{article.title}</h2>

        {/* Bias meter */}
        <BiasMeter
          left={article.left}
          center={article.center}
          right={article.right}
        />

        {/* Source count */}
        <p className="article-card-sources">{article.sources} sources</p>
      </div>
    </article>
  );
}

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

function Footer() {
  return (
    <footer className="footer-dark" aria-label="Site footer">
      <div className="footer-dark-inner">
        <div className="footer-dark-grid">
          {/* Col 1: Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span className="footer-logo-brand">biasly</span>
              <span className="footer-logo-sub">News</span>
            </div>
            <p className="footer-tagline">
              Balanced news coverage,
              <br />
              powered by AI.
            </p>
          </div>

          {/* Col 2: Company */}
          <div>
            <p className="footer-col-heading">Company</p>
            <ul className="footer-col-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          {/* Col 3: Help */}
          <div>
            <p className="footer-col-heading">Help</p>
            <ul className="footer-col-links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Guides</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>

          {/* Col 4: Connect */}
          <div>
            <p className="footer-col-heading">Connect</p>
            <div className="footer-social-icons">
              {/* X / Twitter */}
              <a href="#" className="footer-social-icon" aria-label="Follow on X">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="footer-social-icon" aria-label="Follow on LinkedIn">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="footer-social-icon" aria-label="Follow on Instagram">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* YouTube */}
              <a href="#" className="footer-social-icon" aria-label="Follow on YouTube">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="footer-divider" role="separator" />
        <p className="footer-copyright">© 2026 Biasly News. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <TopBar />
      <Navbar />
      <CategoryStrip />
      <main style={{ flex: 1, backgroundColor: "var(--color-bg-primary)" }}>
        <NewsGrid />
      </main>
      <Footer />
    </>
  );
}