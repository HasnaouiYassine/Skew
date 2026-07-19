import Link from "next/link";

interface NavbarProps {
  activePath?: string;
}

export default function Navbar({ activePath = "/" }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Left: hamburger + logo + nav */}
        <div className="navbar-left">
          <button className="hamburger-btn" aria-label="Open menu">
            <span />
            <span />
            <span />
          </button>
          <Link href="/" className="navbar-logo" aria-label="Skew News home">
            <span className="navbar-logo-brand">Skew</span>
            <span className="navbar-logo-sub">News</span>
          </Link>
          <nav className="navbar-nav" aria-label="Main navigation">
            <Link
              href="/"
              className={`nav-link${activePath === "/" ? " nav-link-active" : ""}`}
            >
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
