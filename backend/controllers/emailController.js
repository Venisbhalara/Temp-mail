const memoryStore = require('../utils/memoryStore');
const mailService = require('../utils/mailService');
const { extractOTP } = require('../services/otpService');

const parseSenderName = (from = '') => {
  const match = from.match(/^"?([^"<]+)"?\s*<.+>/);
  return match ? match[1].trim() : from.split('@')[0] || 'Unknown';
};

/**
 * Format Mail.tm message to our app's summary format
 */
const toSummary = (msg) => ({
  id:         msg.id,
  from:       msg.from.address,
  fromName:   msg.from.name || parseSenderName(msg.from.address),
  subject:    msg.subject || '(No Subject)',
  preview:    msg.intro || 'No preview available',
  otpCode:    extractOTP(msg.intro, '', msg.subject),
  isRead:     msg.seen,
  size:       msg.size,
  receivedAt: msg.createdAt,
});

/**
 * Format Mail.tm message to our app's full detail format
 */
const toFull = (msg) => ({
  id:         msg.id,
  from:       msg.from.address,
  fromName:   msg.from.name || parseSenderName(msg.from.address),
  to:         msg.to[0]?.address,
  subject:    msg.subject || '(No Subject)',
  bodyText:   msg.text || '',
  bodyHtml:   msg.html?.join('') || '',
  otpCode:    extractOTP(msg.text || '', msg.html?.join('') || '', msg.subject),
  isRead:     msg.seen,
  receivedAt: msg.createdAt,
});

// --- GET /api/emails/:inboxId ---
const getEmails = async (req, res) => {
  try {
    const inbox = memoryStore.getInbox(req.params.inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

    // Fetch live from Mail.tm
    const messages = await mailService.getMessages(inbox.token);
    res.json({ emails: messages.map(toSummary), total: messages.length });
  } catch (err) {
    console.error('getEmails:', err.message);
    res.status(500).json({ error: 'Failed to fetch emails from Mail.tm' });
  }
};

// --- GET /api/email/:id (Full detail) ---
const getEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { inboxId } = req.query; 

    const inbox = memoryStore.getInbox(inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox session not found' });

    const message = await mailService.getMessage(inbox.token, id);
    res.json(toFull(message));
  } catch (err) {
    console.error('getEmail detail:', err.message);
    res.status(500).json({ error: 'Failed to fetch email detail from Mail.tm' });
  }
};

// --- DELETE /api/email/:id ---
const deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { inboxId } = req.query;

    const inbox = memoryStore.getInbox(inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found' });

    await mailService.deleteMessage(inbox.token, id);
    res.json({ message: 'Email deleted from Mail.tm' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete email' });
  }
};

module.exports = { getEmails, getEmail, deleteEmail };
