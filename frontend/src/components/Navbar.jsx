import { useTheme } from "../hooks/useTheme";

export default function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav className="navbar">
      <div className="container" style={{ maxWidth: 960 }}>
        <div className="navbar__inner">

          {/* Logo */}
          <a href="/" className="navbar__logo">
            <div className="navbar__logo-icon" aria-hidden="true">
              {/* Mail icon SVG matching the reference */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={theme === 'dark' ? '#93C5FD' : '#FFFFFF'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <polyline points="2,4 12,13 22,4"/>
              </svg>
            </div>
            <div className="navbar__logo-text">
              <span className="navbar__logo-name">Temp<span style={{ fontWeight: 400 }}>Mail</span></span>
              <span className="navbar__logo-sub">Disposable Email Address</span>
            </div>
          </a>

          {/* Right actions */}
          <div className="navbar__actions">
            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggle}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
