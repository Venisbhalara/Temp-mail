import { useState } from 'react';
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

export default function EmailBox() {
  const { inbox, loading, generateInbox, deleteInbox, domains, minutesLeft } = useApp();
  const { copied, copy } = useClipboard();
  const [showCustom, setShowCustom]         = useState(false);
  const [customName, setCustomName]         = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  const handleCopy = () => inbox && copy(inbox.address);

  const handleRegenerate = () => {
    setCustomName('');
    setShowCustom(false);
    generateInbox();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    generateInbox(customName + (selectedDomain ? `@${selectedDomain}` : ''));
    setShowCustom(false);
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
        {loading ? (
          <div className="skeleton skeleton-line" style={{ flex: 1, height: 20 }} />
        ) : (
          <span className="email-box__address" id="email-address">
            {inbox?.address || '—'}
          </span>
        )}

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
          <span className="action-btn__icon"><RefreshIcon /></span>
          {loading ? 'Generating…' : 'Refresh'}
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

        {/* Custom username toggle */}
        <button
          className="action-btn"
          onClick={() => setShowCustom(v => !v)}
          disabled={loading}
          id="action-custom-btn"
        >
          ✎ Custom
        </button>

        {/* Expiry timer */}
        {expiresIn && (
          <span className={`email-box__timer ${isExpiringSoon ? 'email-box__timer--warn' : ''}`}>
            {isExpiringSoon ? '⚠️' : '⏱'} expires {expiresIn}
          </span>
        )}
      </div>

      {/* ── Custom Username Panel ── */}
      <AnimatePresence>
        {showCustom && (
          <motion.form
            className="custom-username"
            onSubmit={handleCustomSubmit}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
          >
            <input
              className="custom-username__input"
              placeholder="yourname"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            {domains.length > 0 && (
              <select
                className="custom-username__select"
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
              >
                <option value="">Random domain</option>
                {domains.map(d => (
                  <option key={d} value={d}>@{d}</option>
                ))}
              </select>
            )}
            <button type="submit" className="btn btn--primary" disabled={!customName.trim()}>
              Create
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setShowCustom(false)}>
              Cancel
            </button>
          </motion.form>
        )}
      </AnimatePresence>

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
