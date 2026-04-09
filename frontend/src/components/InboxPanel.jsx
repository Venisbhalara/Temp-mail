import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { SkeletonList } from './SkeletonLoader';
import EmptyState from './EmptyState';
import { OTPBadge } from './OTPBadge';
import { useClipboard } from '../hooks/useClipboard';

// SVG icons
const SenderIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const SubjectIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const ViewIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5"  r="1.5"/>
    <circle cx="12" cy="12" r="1.5"/>
    <circle cx="12" cy="19" r="1.5"/>
  </svg>
);

// Derive initials / avatar letter from sender name
const getAvatar = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (name[0] || '?').toUpperCase();
};

// Format timestamp compactly
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const diffMs = Date.now() - d;
  if (diffMs < 60_000)   return 'just now';
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m`;
  if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h`;
  return d.toLocaleDateString();
};

function EmailCard({ email, isActive, onClick }) {
  return (
    <motion.div
      className={`email-card ${!email.isRead ? 'email-card--unread' : ''} ${isActive ? 'email-card--active' : ''}`}
      onClick={onClick}
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22 }}
    >
      {/* Sender column */}
      <div className="email-card__from-wrap">
        <div className="email-card__avatar">
          {getAvatar(email.fromName || email.from)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="email-card__from">{email.fromName || email.from}</div>
          <div className="email-card__time text-muted">{formatTime(email.receivedAt)}</div>
        </div>
      </div>

      {/* Subject column */}
      <div className="email-card__subject-wrap">
        <div className="email-card__subject">{email.subject}</div>
        <div className="email-card__preview">{email.preview}</div>
        {email.otpCode && (
          <div className="email-card__badges">
            <OTPBadge code={email.otpCode} />
          </div>
        )}
      </div>

      {/* View column */}
      <div className="email-card__view-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
        <span className="email-card__view-btn" title="View email">
          <ViewIcon />
        </span>
      </div>
    </motion.div>
  );
}

export default function InboxPanel() {
  const { emails, emailsLoading, selectedEmail, selectEmail, connected, fetchEmails, inbox, deleteInbox } = useApp();
  const { copy } = useClipboard();

  const handleCopy = () => inbox && copy(inbox.address);

  return (
    <div className="inbox-panel">

      {/* ── Inbox Card wrapper ── */}
      <div className="inbox-card">

        {/* Toolbar: checkbox / refresh / dots */}
        <div className="inbox-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <input type="checkbox" className="inbox-toolbar__checkbox" aria-label="Select all" />
            <button
              className="inbox-toolbar__btn"
              onClick={fetchEmails}
              title="Refresh inbox"
              id="inbox-refresh-btn"
            >
              <RefreshIcon />
            </button>
            <button className="inbox-toolbar__btn" title="More options" id="inbox-dots-btn">
              <DotsIcon />
            </button>
          </div>

          {/* Connection dot */}
          <span
            style={{
              marginLeft: 'auto',
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--success)' : 'var(--text-muted)',
              boxShadow: connected ? '0 0 6px var(--success)' : 'none',
              display: 'inline-block',
              transition: 'all 0.3s',
            }}
            title={connected ? 'Connected' : 'Disconnected'}
          />
        </div>

        {/* "Your Inbox" title row */}
        <div className="inbox-panel__title-row">
          <h2 className="inbox-panel__title">
            Your Inbox
            {emails.length > 0 && (
              <span className="inbox-panel__count" style={{
                marginLeft: 10,
                background: 'var(--accent-surface)',
                color: 'var(--accent)',
                fontSize: 12, fontWeight: 600,
                padding: '2px 10px',
                borderRadius: 'var(--r-full)',
                verticalAlign: 'middle',
              }}>
                {emails.length}
              </span>
            )}
          </h2>
        </div>

        {/* Column headers */}
        <div className="inbox-columns">
          <div className="inbox-col-header">
            <SenderIcon /> Sender
          </div>
          <div className="inbox-col-header">
            <SubjectIcon /> Subject
          </div>
          <div className="inbox-col-header" style={{ justifyContent: 'center' }}>
            <ViewIcon /> View
          </div>
        </div>

        {/* Email List */}
        <div className="inbox-panel__body">
          {emailsLoading ? (
            <SkeletonList count={4} />
          ) : emails.length === 0 ? (
            <EmptyState
              icon="bubble"
              title="Your inbox is empty"
              subtitle="Awaiting for incoming emails"
            />
          ) : (
            <AnimatePresence initial={false}>
              {emails.map(email => (
                <EmailCard
                  key={email.id}
                  email={email}
                  isActive={selectedEmail?.id === email.id}
                  onClick={() => selectEmail(email)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="inbox-action-bar">
          <button
            className="action-btn"
            onClick={handleCopy}
            disabled={!inbox}
            id="inbox-copy-btn"
          >
            <CopyIcon /> Copy
          </button>
          <button
            className="action-btn action-btn--refresh"
            onClick={fetchEmails}
            id="inbox-refresh-btn-2"
          >
            <RefreshIcon />
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Refresh</span>
          </button>
          <button
            className="action-btn action-btn--delete"
            onClick={deleteInbox}
            disabled={!inbox}
            id="inbox-delete-btn"
          >
            <TrashIcon /> Delete
          </button>
        </div>

      </div>
    </div>
  );
}
