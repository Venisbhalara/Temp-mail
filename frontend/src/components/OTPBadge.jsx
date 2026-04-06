import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useClipboard } from '../hooks/useClipboard';

// Renders the golden OTP banner inside the email viewer
export function OTPBanner({ code }) {
  const { copied, copy } = useClipboard();

  return (
    <motion.div
      className="otp-banner"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div>
        <div className="otp-banner__label">🔐 One-Time Password detected</div>
        <div className="otp-banner__code">{code}</div>
      </div>
      <motion.button
        className="btn btn--primary otp-banner__copy"
        onClick={() => copy(code)}
        whileTap={{ scale: 0.92 }}
      >
        {copied ? '✓ Copied!' : '⎘ Copy OTP'}
      </motion.button>
    </motion.div>
  );
}

// Small pill badge shown in email card list
export function OTPBadge({ code }) {
  const { copy } = useClipboard();
  return (
    <span
      className="otp-badge"
      onClick={e => { e.stopPropagation(); copy(code); }}
      title="Click to copy OTP"
    >
      🔑 {code}
    </span>
  );
}
