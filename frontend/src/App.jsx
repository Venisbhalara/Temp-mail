import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import EmailBox from "./components/EmailBox";
import InboxPanel from "./components/InboxPanel";
import EmailViewer from "./components/EmailViewer";
import ToastStack from "./components/ToastStack";
import { useApp } from "./context/AppContext";

// SVG icons for tab bar
const MailIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="2,4 12,13 22,4" />
  </svg>
);
const SmsIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

function Layout() {
  const [activeTab, setActiveTab] = useState("email");
  const { selectedEmail } = useApp();

  return (
    <div className="app">
      <Navbar />

      <main className="main-layout">
        <div className="container" style={{ maxWidth: selectedEmail ? 1040 : 900, transition: 'max-width 0.4s ease' }}>
          {/* ── Tab bar ── */}
          <div className="tab-bar" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "email"}
              className={`tab-bar__tab ${activeTab === "email" ? "tab-bar__tab--active" : ""}`}
              onClick={() => setActiveTab("email")}
              id="tab-email"
            >
              <span className="tab-bar__tab-icon">
                <MailIcon />
              </span>
              Temporary E-mail
            </button>

            <div className="tab-bar__separator" aria-hidden="true" />

            <button
              role="tab"
              aria-selected={activeTab === "sms"}
              className={`tab-bar__tab ${activeTab === "sms" ? "tab-bar__tab--active" : ""}`}
              onClick={() => setActiveTab("sms")}
              id="tab-sms"
            >
              <span className="tab-bar__tab-icon">
                <SmsIcon />
              </span>
              Temporary SMS
            </button>
          </div>

          {/* ── Tab panel content ── */}
          {activeTab === "email" ? (
            <>
              {selectedEmail ? (
                /* Focus Mode Viewer */
                <div style={{ marginTop: 'var(--sp-6)' }}>
                  <EmailViewer />
                </div>
              ) : (
                <>
                  {/* Hero */}
                  <section className="hero" aria-labelledby="hero-heading">
                    <span className="hero__handwrite" aria-hidden="true">
                      Temporary
                    </span>
                    <h1 className="hero__title" id="hero-heading">
                      Email Address
                    </h1>
                  </section>

                  {/* Email Box */}
                  <EmailBox />

                  {/* Inbox list */}
                  <div className="two-col">
                    <InboxPanel />
                  </div>
                </>
              )}
            </>
          ) : (
            /* SMS placeholder */
            <div
              style={{
                textAlign: "center",
                padding: "80px 24px",
                color: "var(--text-muted)",
                fontSize: 15,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
              <p
                style={{
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                }}
              >
                Temporary SMS coming soon
              </p>
              <p>This feature is not yet available.</p>
            </div>
          )}
        </div>
      </main>

      {/* Global Toast Stack */}
      <ToastStack />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
