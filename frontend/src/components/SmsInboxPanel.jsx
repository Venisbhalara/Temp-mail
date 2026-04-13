/**
 * SmsInboxPanel.jsx
 * =================
 * Displays the list of SMS messages for the active Indian number.
 * Mirrors InboxPanel.jsx with OTP-blur security and SMS-specific design.
 *
 * SECURITY FEATURE: OTP codes are blurred by default — the user must
 * click "Reveal" to see them. This prevents shoulder-surfing and stops
 * screenshots from leaking OTPs.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSms } from '../context/SmsContext';
import { SkeletonList } from './SkeletonLoader';
import EmptyState from './EmptyState';
import { useClipboard } from '../hooks/useClipboard';

// ── Icons ─────────────────────────────────────────────────────────────────────
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const ViewIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const SenderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/>
    <path d="M14.05 2.25A10 10 0 0 1 22 10.26"/>
    <path d="M2 2l20 20"/>
    <path d="M10.57 10.57A2 2 0 0 0 8.87 13"/>
  </svg>
);

const MsgIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const diffMs = Date.now() - d;
  if (diffMs < 60_000)    return 'just now';
  if (diffMs < 3600_000)  return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
  return d.toLocaleDateString();
};

const getAvatar = (sender = '') => {
  const clean = sender.replace(/^[A-Z]{2,3}-/, ''); // strip "TA-" prefix
  return (clean[0] || '?').toUpperCase();
};

// ── OTP Secure Badge (blurred by default) ─────────────────────────────────────
function SecureOtpBadge({ code }) {
  const [revealed, setRevealed] = useState(false);
  const { copied, copy } = useClipboard();

  if (!code) return null;

  return (
    <div className="sms-otp-badge" onClick={e => e.stopPropagation()}>
      <span className="sms-otp-badge__label">🔐 OTP</span>
      <span className={`sms-otp-badge__code ${revealed ? '' : 'sms-otp-badge__code--blur'}`}>
        {code}
      </span>
      <button
        className="sms-otp-badge__btn"
        onClick={() => setRevealed(r => !r)}
        title={revealed ? 'Hide OTP' : 'Reveal OTP'}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
      {revealed && (
        <button
          className="sms-otp-badge__copy"
          onClick={() => copy(code)}
          title="Copy OTP"
        >
          {copied ? '✓' : <CopyIcon />}
        </button>
      )}
    </div>
  );
}

// ── SMS Card ──────────────────────────────────────────────────────────────────
function SmsCard({ sms, isActive, onClick }) {
  return (
    <motion.div
      className={`sms-card ${isActive ? 'sms-card--active' : ''} ${sms.otpCode ? 'sms-card--has-otp' : ''}`}
      onClick={onClick}
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22 }}
    >
      {/* Sender column */}
      <div className="sms-card__sender-col">
        <div className="sms-card__avatar">{getAvatar(sms.from)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sms-card__from">{sms.from}</div>
          <div className="sms-card__time">{formatTime(sms.receivedAt)}</div>
        </div>
      </div>

      {/* Message column */}
      <div className="sms-card__msg-col">
        <div className="sms-card__preview">{sms.body}</div>
        {sms.otpCode && <SecureOtpBadge code={sms.otpCode} />}
      </div>

      {/* View column */}
      <div className="sms-card__view-col">
        <span className="email-card__view-btn" title="View message">
          <ViewIcon />
        </span>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SmsInboxPanel() {
  const {
    smsMessages, messagesLoading, activeNumber,
    refreshInbox, smsConnected, selectedSms, selectSms,
  } = useSms();

  return (
    <div className="inbox-panel">
      <div className="inbox-card">

        {/* Toolbar */}
        <div className="inbox-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <button
              className="inbox-toolbar__btn"
              onClick={refreshInbox}
              title="Refresh inbox"
              id="sms-refresh-btn"
            >
              <RefreshIcon />
            </button>
          </div>

          {/* Connection indicator */}
          <span
            style={{
              marginLeft: 'auto',
              width: 8, height: 8, borderRadius: '50%',
              background: smsConnected ? 'var(--success)' : 'var(--text-muted)',
              boxShadow: smsConnected ? '0 0 6px var(--success)' : 'none',
              display: 'inline-block',
              transition: 'all 0.3s',
            }}
            title={smsConnected ? 'Polling live' : 'Disconnected'}
          />
        </div>

        {/* Title row */}
        <div className="inbox-panel__title-row">
          <h2 className="inbox-panel__title">
            SMS Inbox
            {smsMessages.length > 0 && (
              <span className="inbox-panel__count" style={{
                marginLeft: 10,
                background: 'var(--accent-surface)',
                color: 'var(--accent)',
                fontSize: 12, fontWeight: 600,
                padding: '2px 10px',
                borderRadius: 'var(--r-full)',
                verticalAlign: 'middle',
              }}>
                {smsMessages.length}
              </span>
            )}
          </h2>
          <div className="sms-inbox-number-tag">
            🇮🇳 {activeNumber?.display || '...'}
          </div>
        </div>

        {/* Column headers */}
        <div className="inbox-columns sms-inbox-columns">
          <div className="inbox-col-header"><SenderIcon /> Sender</div>
          <div className="inbox-col-header"><MsgIcon /> Message</div>
          <div className="inbox-col-header" style={{ justifyContent: 'center' }}>
            <ViewIcon /> View
          </div>
        </div>

        {/* Message list */}
        <div className="inbox-panel__body">
          {messagesLoading ? (
            <SkeletonList count={4} />
          ) : smsMessages.length === 0 ? (
            <EmptyState
              icon="📱"
              title="No messages yet"
              subtitle={`Waiting for SMS on ${activeNumber?.display || 'this number'}. Messages appear here in real time.`}
            />
          ) : (
            <AnimatePresence initial={false}>
              {smsMessages.map(sms => (
                <SmsCard
                  key={sms.id}
                  sms={sms}
                  isActive={selectedSms?.id === sms.id}
                  onClick={() => selectSms(sms)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="inbox-action-bar">
          <button
            className="action-btn action-btn--refresh"
            onClick={refreshInbox}
            disabled={messagesLoading}
            id="sms-refresh-btn-2"
          >
            <RefreshIcon />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Refresh</span>
          </button>
        </div>

      </div>
    </div>
  );
}
