export default function TopBar() {
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
