/**
 * SmsViewer.jsx
 * =============
 * Full-screen detail view for a selected SMS message.
 * Mirrors EmailViewer.jsx with SMS-specific layout.
 *
 * SECURITY: OTP is blurred by default — user must click "Reveal OTP"
 * to see the code. Copy is only available after revealing.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useSms } from '../context/SmsContext';
import { useClipboard } from '../hooks/useClipboard';

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

// ── Secure OTP Banner (blur-by-default) ───────────────────────────────────────
function SecureOtpBanner({ code }) {
  const [revealed, setRevealed] = useState(false);
  const { copied, copy } = useClipboard();

  return (
    <motion.div
      className="otp-banner sms-otp-banner"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div>
        <div className="otp-banner__label">
          🔐 OTP Detected — Hidden for your security
        </div>
        <div className={`otp-banner__code sms-otp-banner__code ${revealed ? '' : 'sms-otp-blurred'}`}>
          {code}
        </div>
        {!revealed && (
          <p className="sms-otp-banner__hint">
            Click "Reveal OTP" to view it. OTPs are hidden to prevent shoulder-surfing.
          </p>
        )}
      </div>

      <div className="sms-otp-banner__actions">
        <motion.button
          className={`btn ${revealed ? 'btn--ghost' : 'btn--primary'} sms-otp-banner__reveal-btn`}
          onClick={() => setRevealed(r => !r)}
          whileTap={{ scale: 0.92 }}
          id="sms-reveal-otp-btn"
        >
          {revealed ? <><EyeOffIcon /> Hide OTP</> : <><EyeIcon /> Reveal OTP</>}
        </motion.button>

        {revealed && (
          <motion.button
            className="btn btn--primary otp-banner__copy"
            onClick={() => copy(code)}
            whileTap={{ scale: 0.92 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            id="sms-copy-otp-btn"
          >
            <CopyIcon />
            {copied ? '✓ Copied!' : '⎘ Copy OTP'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Viewer ───────────────────────────────────────────────────────────────
export default function SmsViewer() {
  const { selectedSms, closeSms } = useSms();
  const { copied, copy } = useClipboard();

  if (!selectedSms) return null;

  const sms = selectedSms;
  const receivedAt = sms.receivedAt
    ? format(new Date(sms.receivedAt), 'MMM d, yyyy · h:mm a')
    : '—';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sms.id}
        className="email-viewer sms-viewer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="email-viewer__header">
          <div className="email-viewer__top-row">
            <button
              className="email-viewer__back-btn"
              onClick={closeSms}
              title="Back to inbox"
              id="sms-viewer-back-btn"
            >
              <BackIcon />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <h2 className="email-viewer__subject sms-viewer__from">
                SMS from {sms.from}
              </h2>
            </div>
          </div>

          <div className="email-viewer__meta">
            <div className="email-viewer__meta-grid">
              <div className="email-viewer__meta-row">
                <span className="email-viewer__meta-label">Sender</span>
                <span className="email-viewer__meta-value">{sms.from}</span>
              </div>
              <div className="email-viewer__meta-row">
                <span className="email-viewer__meta-label">Received</span>
                <span className="email-viewer__meta-value">{receivedAt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* OTP Banner (secured) */}
        {sms.otpCode && <SecureOtpBanner code={sms.otpCode} />}

        {/* SMS Body */}
        <div className="email-viewer__body sms-viewer__body">
          <div className="sms-viewer__message-bubble">
            <p className="sms-viewer__body-text">{sms.body}</p>
            <button
              className="sms-viewer__copy-msg-btn"
              onClick={() => copy(sms.body)}
              title="Copy message text"
              id="sms-copy-body-btn"
            >
              <CopyIcon /> {copied ? 'Copied!' : 'Copy message'}
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="sms-viewer__security-notice">
          <span>🔒</span>
          <span>
            This number is <strong>publicly shared</strong>. Never use it for banking,
            Aadhaar, or sensitive accounts. OTPs displayed here are visible only after you reveal them.
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
