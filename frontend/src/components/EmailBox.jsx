import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useClipboard } from '../hooks/useClipboard';
import { formatDistanceToNow } from 'date-fns';

export default function EmailBox() {
  const { inbox, loading, generateInbox, deleteInbox, domains, minutesLeft } = useApp();
  const { copied, copy } = useClipboard();
  const [showCustom, setShowCustom]   = useState(false);
  const [customName, setCustomName]   = useState('');
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
      {/* Label */}
      <p className="email-box__label">Your disposable address</p>

      {/* Address Field */}
      <div className="email-box__field">
        {loading ? (
          <div className="skeleton skeleton-line" style={{ flex: 1, height: 22 }} />
        ) : (
          <span className="email-box__address" id="email-address">
            {inbox?.address || '—'}
          </span>
        )}

        <motion.button
          className="btn btn--ghost btn--icon"
          onClick={handleCopy}
          disabled={!inbox || loading}
          title="Copy email address"
          whileTap={{ scale: 0.88 }}
        >
          {copied ? '✓' : '⎘'}
        </motion.button>
      </div>

      {/* Action Row */}
      <div className="email-box__actions">
        <motion.button
          className="btn btn--primary"
          onClick={handleRegenerate}
          disabled={loading}
          whileTap={{ scale: 0.96 }}
        >
          {loading ? 'Generating…' : '↺ New Address'}
        </motion.button>

        <button
          className="btn btn--ghost"
          onClick={() => setShowCustom(v => !v)}
          disabled={loading}
        >
          ✎ Custom
        </button>

        <button
          className="btn btn--danger-ghost btn--icon"
          onClick={deleteInbox}
          disabled={!inbox || loading}
          title="Delete inbox"
        >
          🗑
        </button>

        {/* Expiry timer */}
        {expiresIn && (
          <span className={`email-box__timer ${isExpiringSoon ? 'email-box__timer--warn' : ''}`}>
            {isExpiringSoon ? '⚠️' : '⏱'} expires {expiresIn}
          </span>
        )}
      </div>

      {/* Custom Username Panel */}
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

      {/* Copied feedback */}
      <AnimatePresence>
        {copied && (
          <motion.div
            style={{
              position: 'absolute', top: 12, right: 16,
              background: 'var(--success-surface)', color: 'var(--success)',
              border: '1px solid rgba(16,185,129,.3)',
              padding: '4px 12px', borderRadius: 'var(--r-full)',
              fontSize: 13, fontWeight: 600,
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
