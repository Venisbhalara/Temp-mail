import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '../context/AppContext';
import { SkeletonList } from './SkeletonLoader';
import EmptyState from './EmptyState';
import { OTPBadge } from './OTPBadge';

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
  if (diffMs < 60_000)  return 'just now';
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
      {/* Avatar */}
      <div className="email-card__avatar">
        {getAvatar(email.fromName || email.from)}
      </div>

      {/* Content */}
      <div className="email-card__content">
        <div className="email-card__top">
          <span className="email-card__from">{email.fromName || email.from}</span>
          <span className="email-card__time">{formatTime(email.receivedAt)}</span>
        </div>
        <div className="email-card__subject">{email.subject}</div>
        <div className="email-card__preview">{email.preview}</div>
        {email.otpCode && (
          <div className="email-card__badges">
            <OTPBadge code={email.otpCode} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function InboxPanel() {
  const { emails, emailsLoading, selectedEmail, selectEmail, simulateEmail, connected, fetchEmails } = useApp();

  return (
    <div className="inbox-panel">
      {/* Header */}
      <div className="inbox-panel__header">
        <div className="inbox-panel__title">
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--success)' : 'var(--text-muted)',
              display: 'inline-block',
              boxShadow: connected ? '0 0 6px var(--success)' : 'none',
              transition: 'all 0.3s',
            }}
          />
          Inbox
          {emails.length > 0 && (
            <span className="inbox-panel__count">{emails.length}</span>
          )}
        </div>

        <button
          className="btn btn--ghost btn--icon"
          onClick={fetchEmails}
          title="Refresh inbox"
          style={{ fontSize: 15 }}
        >
          ↻
        </button>
      </div>

      {/* Email List */}
      <div className="inbox-panel__body">
        {emailsLoading ? (
          <SkeletonList count={4} />
        ) : emails.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Inbox is empty"
            subtitle="Emails sent to your address will appear here instantly."
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


    </div>
  );
}
