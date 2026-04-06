const memoryStore = require('../utils/memoryStore');
const { generateEmail, getDomains, validateUsername } = require('../utils/emailGenerator');

const EXPIRY_MINUTES = parseInt(process.env.INBOX_EXPIRY_MINUTES || '60', 10);

// ── Helpers ──────────────────────────────────────────────────────────────────
const getTakenDomains = (username) => {
  const domains = [];
  for (const inbox of memoryStore.inboxes.values()) {
    if (inbox.username === username) domains.push(inbox.domain);
  }
  return domains;
};

// ── POST /api/generate-email ─────────────────────────────────────────────────
const generateInbox = async (req, res) => {
  try {
    const { customUsername } = req.body;
    let emailData;

    if (customUsername) {
      const validation = validateUsername(customUsername);
      if (!validation.valid) return res.status(400).json({ error: validation.message });

      // Find domains where this username is free
      const domains = getDomains();
      const takenDomains = getTakenDomains(validation.username);
      const free = domains.filter(d => !takenDomains.includes(d));
      
      if (!free.length) {
        return res.status(409).json({ error: 'Username taken on all domains. Try another.' });
      }

      const { v4: uuidv4 } = require('uuid');
      emailData = {
        inboxId:  uuidv4(),
        username: validation.username,
        domain:   free[0],
        address:  `${validation.username}@${free[0]}`,
        isCustom: true,
      };
    } else {
      // Random address — retry up to 5 times to avoid collision
      let attempts = 0;
      do {
        emailData = generateEmail();
        const exists = memoryStore.getInboxByAddress(emailData.address);
        if (!exists) break;
      } while (++attempts < 5);
    }

    const inbox = memoryStore.createInbox({
      inboxId:    emailData.inboxId,
      address:    emailData.address,
      username:   emailData.username,
      domain:     emailData.domain,
      isCustom:   emailData.isCustom || false,
      emailCount: 0,
      expiresAt:  new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
      createdAt:  new Date()
    });

    res.status(201).json({
      inboxId:   inbox.inboxId,
      address:   inbox.address,
      username:  inbox.username,
      domain:    inbox.domain,
      expiresAt: inbox.expiresAt,
      createdAt: inbox.createdAt,
    });
  } catch (err) {
    console.error('generateInbox:', err.message);
    res.status(500).json({ error: 'Failed to generate email address' });
  }
};

// ── GET /api/inbox/:inboxId ──────────────────────────────────────────────────
const getInbox = async (req, res) => {
  try {
    const inbox = memoryStore.getInbox(req.params.inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

    // Check if expired
    if (new Date(inbox.expiresAt) < new Date()) {
      memoryStore.deleteInbox(inbox.inboxId);
      return res.status(404).json({ error: 'Inbox has expired' });
    }

    res.json({
      inboxId:    inbox.inboxId,
      address:    inbox.address,
      username:   inbox.username,
      domain:     inbox.domain,
      expiresAt:  inbox.expiresAt,
      emailCount: inbox.emailCount,
      createdAt:  inbox.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get inbox' });
  }
};

// ── GET /api/domains ─────────────────────────────────────────────────────────
const getDomainList = (_req, res) => res.json({ domains: getDomains() });

// ── DELETE /api/inbox/:inboxId ───────────────────────────────────────────────
const deleteInbox = async (req, res) => {
  try {
    const { inboxId } = req.params;
    const deleted = memoryStore.deleteInbox(inboxId);
    if (!deleted) return res.status(404).json({ error: 'Inbox not found' });

    req.app.get('io').to(inboxId).emit('inbox_deleted', { inboxId });
    res.json({ message: 'Inbox deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete inbox' });
  }
};

module.exports = { generateInbox, getInbox, getDomainList, deleteInbox };
