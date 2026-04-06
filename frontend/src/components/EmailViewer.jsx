import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { OTPBanner } from './OTPBadge';
import { SkeletonEmailViewer } from './SkeletonLoader';
import EmptyState from './EmptyState';
import { useClipboard } from '../hooks/useClipboard';

// SVG icons
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// Download email as a file
const downloadEmail = (email, fmt) => {
  const content = fmt === 'html'
    ? email.bodyHtml || email.bodyText
    : email.bodyText || '';
  const mime = fmt === 'html' ? 'text/html' : 'text/plain';
  const ext  = fmt === 'html' ? 'html' : 'txt';
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
              style={{ fontSize: 13, gap: 6 }}
              onClick={() => downloadEmail(email, 'html')}
              id="viewer-download-html"
            >
              <DownloadIcon /> HTML
            </button>
          )}
          <button
            className="btn btn--ghost"
            style={{ fontSize: 13, gap: 6 }}
            onClick={() => downloadEmail(email, 'txt')}
            id="viewer-download-txt"
          >
            <DownloadIcon /> Text
          </button>
          <button
            className="btn btn--danger-ghost"
            style={{ fontSize: 13, gap: 6 }}
            onClick={() => deleteEmail(email.id)}
            id="viewer-delete-btn"
          >
            <TrashIcon /> Delete
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
