import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { OTPBanner } from './OTPBadge';
import { SkeletonEmailViewer } from './SkeletonLoader';
import EmptyState from './EmptyState';
import { useClipboard } from '../hooks/useClipboard';


const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);



export default function EmailViewer() {
  const { selectedEmail, emailLoading, deleteEmail, closeEmail } = useApp();

  // No email selected
  if (!selectedEmail && !emailLoading) {
    return (
      <motion.div
        className="email-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ minHeight: 300 }}
      >
        <EmptyState
          icon="✉️"
          title="Select an email to read"
          subtitle="Click any message in your inbox to preview it here."
        />
      </motion.div>
    );
  }

  // Loading email content
  if (emailLoading) {
    return (
      <div className="email-viewer">
        <SkeletonEmailViewer />
      </div>
    );
  }

  const email = selectedEmail;
  const receivedAt = email.receivedAt
    ? format(new Date(email.receivedAt), 'MMM d, yyyy · h:mm a')
    : '—';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={email.id}
        className="email-viewer"
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
              onClick={closeEmail}
              title="Back to inbox"
            >
              <BackIcon />
            </button>
            <h2 className="email-viewer__subject">{email.subject}</h2>
            <div className="email-viewer__actions" style={{ padding: 0, border: 'none', marginLeft: 'auto' }}>
              <button
                className="btn btn--danger-ghost"
                style={{ fontSize: 13, gap: 6, padding: '6px 14px' }}
                onClick={() => {
                  deleteEmail(email.id);
                  closeEmail();
                }}
                id="viewer-delete-btn"
              >
                <TrashIcon /> Delete
              </button>
            </div>
          </div>

          <div className="email-viewer__meta">
            <div className="email-viewer__meta-grid">
              <div className="email-viewer__meta-row">
                <span className="email-viewer__meta-label">From</span>
                <span className="email-viewer__meta-value">
                  {email.fromName
                    ? `${email.fromName} <${email.from}>`
                    : email.from}
                </span>
              </div>
              <div className="email-viewer__meta-row">
                <span className="email-viewer__meta-label">Date</span>
                <span className="email-viewer__meta-value">{receivedAt}</span>
              </div>
            </div>
            <div className="email-viewer__meta-row">
              <span className="email-viewer__meta-label">To</span>
              <span className="email-viewer__meta-value">{email.to}</span>
            </div>
          </div>
        </div>

        {/* OTP Banner — shown when OTP detected */}
        {email.otpCode && <OTPBanner code={email.otpCode} />}

        {/* Email Body */}
        <div className="email-viewer__body">
          {email.bodyHtml ? (
            <div
              className="email-viewer__body-html"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          ) : (
            <pre className="email-viewer__body-text">
              {email.bodyText || '(Empty email)'}
            </pre>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
