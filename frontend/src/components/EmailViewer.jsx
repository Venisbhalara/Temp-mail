import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { OTPBanner } from './OTPBadge';
import { SkeletonEmailViewer } from './SkeletonLoader';
import EmptyState from './EmptyState';
import { useClipboard } from '../hooks/useClipboard';

// Download email as a file
const downloadEmail = (email, format) => {
  const content = format === 'html'
    ? email.bodyHtml || email.bodyText
    : email.bodyText || '';
  const mime = format === 'html' ? 'text/html' : 'text/plain';
  const ext  = format === 'html' ? 'html' : 'txt';
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `email-${email.id}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function EmailViewer() {
  const { selectedEmail, emailLoading, deleteEmail } = useApp();

  // No email selected
  if (!selectedEmail && !emailLoading) {
    return (
      <motion.div
        className="email-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
          <h2 className="email-viewer__subject">{email.subject}</h2>
          <div className="email-viewer__meta">
            <div className="email-viewer__meta-row">
              <span className="email-viewer__meta-label">From</span>
              <span className="email-viewer__meta-value">
                {email.fromName
                  ? `${email.fromName} <${email.from}>`
                  : email.from}
              </span>
            </div>
            <div className="email-viewer__meta-row">
              <span className="email-viewer__meta-label">To</span>
              <span className="email-viewer__meta-value">{email.to}</span>
            </div>
            <div className="email-viewer__meta-row">
              <span className="email-viewer__meta-label">Date</span>
              <span className="email-viewer__meta-value">{receivedAt}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="email-viewer__actions">
          {email.bodyHtml && (
            <button
              className="btn btn--ghost"
              style={{ fontSize: 13 }}
              onClick={() => downloadEmail(email, 'html')}
            >
              ↓ HTML
            </button>
          )}
          <button
            className="btn btn--ghost"
            style={{ fontSize: 13 }}
            onClick={() => downloadEmail(email, 'txt')}
          >
            ↓ Text
          </button>
          <button
            className="btn btn--danger-ghost"
            style={{ fontSize: 13 }}
            onClick={() => deleteEmail(email.id)}
          >
            🗑 Delete
          </button>
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
