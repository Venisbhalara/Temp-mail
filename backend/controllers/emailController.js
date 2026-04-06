const { inboxStore } = require('./inboxController');
const {
  getMessages,
  getMessage,
  deleteMessage,
  markAsRead,
} = require('../services/mailTmService');
const { extractOTP } = require('../services/otpService');

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseSenderName = (from = '') => {
  // Mail.tm returns from as: { address, name }
  if (typeof from === 'object') return from.name || from.address?.split('@')[0] || 'Unknown';
  const match = from.match(/^"?([^"<]+)"?\s*<.+>/);
  return match ? match[1].trim() : from.split('@')[0] || 'Unknown';
};

const toSummary = (msg) => ({
  id:         msg.id,
  from:       typeof msg.from === 'object' ? msg.from.address : msg.from,
  fromName:   parseSenderName(msg.from),
  subject:    msg.subject || '(No Subject)',
  preview:    msg.intro || msg.text?.substring(0, 120).trim() || 'No preview available',
  isRead:     msg.seen,
  size:       msg.size || 0,
  receivedAt: msg.createdAt,
});

const toFull = (msg) => ({
  id:         msg.id,
  from:       typeof msg.from === 'object' ? msg.from.address : msg.from,
  fromName:   parseSenderName(msg.from),
  to:         Array.isArray(msg.to) ? msg.to.map(t => t.address).join(', ') : msg.to,
  subject:    msg.subject || '(No Subject)',
  bodyText:   msg.text  || '',
  bodyHtml:   msg.html?.join('') || msg.text || '',
  otpCode:    extractOTP(msg.text || '', msg.html?.join('') || '', msg.subject || ''),
  isRead:     msg.seen,
  receivedAt: msg.createdAt,
});

// ── GET /api/emails/:inboxId ──────────────────────────────────────────────────
const getEmails = async (req, res) => {
  try {
    const inbox = inboxStore.get(req.params.inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

    const messages = await getMessages(inbox.token);
    res.json({ emails: messages.map(toSummary), total: messages.length });
  } catch (err) {
    console.error('getEmails error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

// ── GET /api/email/:id?inboxId=xxx ───────────────────────────────────────────
const getEmail = async (req, res) => {
  try {
    const { inboxId } = req.query;
    if (!inboxId) return res.status(400).json({ error: 'inboxId query param required' });

    const inbox = inboxStore.get(inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

    const msg = await getMessage(inbox.token, req.params.id);

    // Mark as read on Mail.tm
    if (!msg.seen) {
      try { await markAsRead(inbox.token, msg.id); } catch (_) {}
    }

    res.json(toFull(msg));
  } catch (err) {
    console.error('getEmail error:', err?.response?.data || err.message);
    if (err?.response?.status === 404) return res.status(404).json({ error: 'Email not found' });
    res.status(500).json({ error: 'Failed to fetch email' });
  }
};

// ── DELETE /api/email/:id?inboxId=xxx ────────────────────────────────────────
const deleteEmail = async (req, res) => {
  try {
    const { inboxId } = req.query;
    if (!inboxId) return res.status(400).json({ error: 'inboxId query param required' });

    const inbox = inboxStore.get(inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found' });

    await deleteMessage(inbox.token, req.params.id);
    res.json({ message: 'Email deleted' });
  } catch (err) {
    console.error('deleteEmail error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to delete email' });
  }
};

// ── POST /api/poll/:inboxId  ──────────────────────────────────────────────────
// Called by frontend polling — fetches latest emails and emits via Socket.io
const pollEmails = async (req, res) => {
  try {
    const inbox = inboxStore.get(req.params.inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

    const messages = await getMessages(inbox.token);
    const emails   = messages.map(toSummary);

    // Emit to socket room so real-time updates work too
    req.app.get('io').to(inbox.inboxId).emit('inbox_update', { emails, total: emails.length });

    res.json({ emails, total: emails.length });
  } catch (err) {
    console.error('pollEmails error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to poll emails' });
  }
};

module.exports = { getEmails, getEmail, deleteEmail, pollEmails };
