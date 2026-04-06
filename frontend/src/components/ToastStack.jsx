import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
const COLORS = {
  success: 'var(--success)',
  error:   'var(--danger)',
  info:    'var(--accent-dim)',
  warning: 'var(--warning)',
};

export default function ToastStack() {
  const { toasts } = useApp();

  return (
    <div className="toast-stack">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`toast toast--${t.type || 'success'}`}
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 10,  scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <span style={{ color: COLORS[t.type] || COLORS.success, fontSize: 15, flexShrink: 0 }}>
              {ICONS[t.type] || ICONS.success}
            </span>
            <span style={{ flex: 1, fontSize: 14 }}>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
