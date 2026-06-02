import EmailBox from "../components/EmailBox";
import InboxPanel from "../components/InboxPanel";
import EmailViewer from "../components/EmailViewer";
import { useApp } from "../context/AppContext";

export default function Home() {
  const { selectedEmail } = useApp();

  return (
    <div
      className="container"
      style={{
        maxWidth: selectedEmail ? 1040 : 900,
        transition: "max-width 0.4s ease",
      }}
    >
      {selectedEmail ? (
        /* Focus Mode Viewer */
        <div style={{ marginTop: "var(--sp-6)" }}>
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
    </div>
  );
}
