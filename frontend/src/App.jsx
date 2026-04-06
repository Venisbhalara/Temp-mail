import { AppProvider } from './context/AppContext';
import Navbar      from './components/Navbar';
import EmailBox    from './components/EmailBox';
import InboxPanel  from './components/InboxPanel';
import EmailViewer from './components/EmailViewer';
import ToastStack  from './components/ToastStack';

function Layout() {
  return (
    <div className="app">
      <Navbar />

      <main className="main-layout">
        <div className="container">

          {/* ── Hero ── */}
          <section className="hero">
            <div className="hero__badge">
              <span className="hero__badge-dot" />
              Real-time inbox · Auto-expiry · OTP detection
            </div>
            <h1 className="hero__title">
              <span className="hero__title-gradient">Disposable email.</span>
              <br />Done right.
            </h1>
            <p className="hero__sub">
              Instant temporary inboxes that protect your real address.
              No signup, no storage, no bullshit.
            </p>
          </section>

          {/* ── Email Generator ── */}
          <EmailBox />

          {/* ── Two-column inbox layout ── */}
          <div className="two-col">
            <InboxPanel />
            <EmailViewer />
          </div>

        </div>
      </main>

      {/* ── Global Toast Stack ── */}
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
