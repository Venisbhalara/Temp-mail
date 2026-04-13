/**
 * SmsBox.jsx
 * ==========
 * Displays the active Indian temporary phone number.
 * Mirrors EmailBox.jsx aesthetics with an SMS/mobile theme.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSms } from '../context/SmsContext';
import { useClipboard } from '../hooks/useClipboard';

// Icons
const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const ShuffleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/>
    <line x1="4" y1="20" x2="21" y2="3"/>
    <polyline points="21 16 21 21 16 21"/>
    <line x1="15" y1="15" x2="21" y2="21"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);

const LOADING_MSGS = [
  'Fetching Indian virtual numbers...',
  'Connecting to +91 network...',
  'Securing your temp number...',
  'Allocating private line...',
];

function PhoneLoadingText() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % LOADING_MSGS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="premium-loader">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          className="premium-loader-text"
          initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {LOADING_MSGS[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function SmsBox() {
  const { activeNumber, numbersLoading, numberChanging, changeNumber, refreshInbox, messagesLoading } = useSms();
  const { copied, copy } = useClipboard();

  const handleCopy = () => activeNumber && copy(activeNumber.fullNumber);
  const isLoading  = numbersLoading || (!activeNumber && !numberChanging);

  return (
    <motion.div
      className="email-box sms-box"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Number pill */}
      <div className="email-box__field sms-box__field">
        {isLoading ? (
          <PhoneLoadingText />
        ) : (
          <span className="email-box__address sms-box__number" id="sms-number-display">
            <span className="sms-box__flag" aria-label="India">🇮🇳</span>
            {activeNumber?.display || '—'}
          </span>
        )}

        <button
          className="email-box__copy-btn"
          onClick={handleCopy}
          disabled={!activeNumber || isLoading}
          title="Copy phone number"
          id="copy-sms-number-btn"
        >
          <span className="email-box__copy-btn-icon"><CopyIcon /></span>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Action row */}
      <div className="email-box__actions">
        <button
          className="action-btn"
          onClick={handleCopy}
          disabled={!activeNumber || isLoading}
          id="sms-action-copy-btn"
        >
          <span className="action-btn__icon"><CopyIcon /></span>
          Copy
        </button>

        <button
          className="action-btn action-btn--refresh"
          onClick={refreshInbox}
          disabled={isLoading || messagesLoading}
          id="sms-action-refresh-btn"
        >
          <span className={`action-btn__icon ${messagesLoading ? 'animate-spin' : ''}`}>
            <RefreshIcon />
          </span>
          {messagesLoading ? 'Refreshing...' : 'Refresh'}
        </button>

        <button
          className={`action-btn sms-action-btn--change ${numberChanging ? 'sms-action-btn--changing' : ''}`}
          onClick={changeNumber}
          disabled={numberChanging || numbersLoading}
          id="sms-action-change-btn"
        >
          <span className={`action-btn__icon ${numberChanging ? 'animate-spin' : ''}`}>
            <ShuffleIcon />
          </span>
          {numberChanging ? 'Switching...' : 'Change Number'}
        </button>
      </div>

      {/* Public disclaimer */}
      <div className="sms-disclaimer">
        <span className="sms-disclaimer__icon">⚠️</span>
        <span>
          This is a <strong>shared public number</strong>. Anyone can use it.
          Don't use it for banking, Aadhaar, or any sensitive verification.
          OTPs are hidden by default for your privacy on this app.
        </span>
      </div>

      {/* Copied toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            style={{
              position: 'absolute', top: 12, right: 16,
              background: 'var(--success-surface)', color: 'var(--success)',
              border: '1px solid rgba(16,185,129,.3)',
              padding: '4px 14px', borderRadius: 'var(--r-full)',
              fontSize: 13, fontWeight: 600, pointerEvents: 'none',
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
