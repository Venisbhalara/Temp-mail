import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useClipboard } from '../hooks/useClipboard';
import { formatDistanceToNow } from 'date-fns';

// SVG icons
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const LOADING_MESSAGES = [
  "Generating your secure address...",
  "Crafting a unique mailbox...",
  "Securing your temporary identity...",
  "Allocating private storage...",
  "Finalizing your secure link..."
];

function PremiumLoadingText() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="premium-loader">
      <div className="loading-indicator" />
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="premium-loader-text"
          initial={{ opacity: 0, x: 10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -10, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {LOADING_MESSAGES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function EmailBox() {
  const { inbox, loading, generateInbox, deleteInbox, minutesLeft } = useApp();
  const { copied, copy } = useClipboard();

  const handleCopy = () => inbox && copy(inbox.address);

  const handleRegenerate = () => {
    generateInbox();
  };

  const expiresIn = inbox
    ? formatDistanceToNow(new Date(inbox.expiresAt), { addSuffix: true })
    : null;

  const isExpiringSoon = minutesLeft !== null && minutesLeft <= 5;

  return (
    <motion.div
      className="email-box"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Dark pill email field ── */}
      <div className="email-box__field">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1, display: 'flex', alignItems: 'center' }}
            >
              <PremiumLoadingText />
            </motion.div>
          ) : (
            <motion.span
              key="address"
              className="email-box__address"
              id="email-address"
              initial={{ opacity: 0, filter: 'blur(10px)', y: 5 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {inbox?.address || '—'}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Blue Copy button inside pill */}
        <button
          className="email-box__copy-btn"
          onClick={handleCopy}
          disabled={!inbox || loading}
          title="Copy email address"
          id="copy-email-btn"
        >
          <span className="email-box__copy-btn-icon">
            <CopyIcon />
          </span>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* ── Action buttons row ── */}
      <div className="email-box__actions">
        {/* Copy */}
        <button
          className="action-btn"
          onClick={handleCopy}
          disabled={!inbox || loading}
          id="action-copy-btn"
        >
          <span className="action-btn__icon"><CopyIcon /></span>
          Copy
        </button>

        {/* Refresh / New Address */}
        <button
          className="action-btn action-btn--refresh"
          onClick={handleRegenerate}
          disabled={loading}
          id="action-refresh-btn"
        >
          <span className={`action-btn__icon ${loading ? 'animate-spin' : ''}`}>
            <RefreshIcon />
          </span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>

        {/* Delete */}
        <button
          className="action-btn action-btn--delete"
          onClick={deleteInbox}
          disabled={!inbox || loading}
          id="action-delete-btn"
        >
          <span className="action-btn__icon"><TrashIcon /></span>
          Delete
        </button>

        {/* Expiry timer */}
        {expiresIn && (
          <span className={`email-box__timer ${isExpiringSoon ? 'email-box__timer--warn' : ''}`}>
            {isExpiringSoon ? '⚠️' : '⏱'} expires {expiresIn}
          </span>
        )}
      </div>
      {/* ── Copied feedback toast ── */}
      <AnimatePresence>
        {copied && (
          <motion.div
            style={{
              position: 'absolute', top: 12, right: 16,
              background: 'var(--success-surface)', color: 'var(--success)',
              border: '1px solid rgba(16,185,129,.3)',
              padding: '4px 14px', borderRadius: 'var(--r-full)',
              fontSize: 13, fontWeight: 600,
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            ✓ Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
