import { useTheme } from "../hooks/useTheme";

export default function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__inner">
          {/* Logo */}
          <a href="/" className="navbar__logo">
            <div className="navbar__logo-icon">⚡</div>
            <span className="navbar__logo-text">
              Temp<span>Vault</span>
            </span>
          </a>

          {/* Right actions */}
          <div className="navbar__actions">
            {/* <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              GitHub ↗
            </a> */}

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
