const memoryStore = require('../utils/memoryStore');
const mailService = require('../utils/mailService');
const { v4: uuidv4 } = require('uuid');

const EXPIRY_MINUTES = parseInt(process.env.INBOX_EXPIRY_MINUTES || '60', 10);

// Helper to generate random string for password
const generateRandomPassword = () => Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

// --- POST /api/generate-email ---
const generateInbox = async (req, res) => {
  try {
    const { customUsername } = req.body;
    
    // 1. Get available domains from Mail.tm
    const domains = await mailService.getDomains();
    if (!domains.length) {
      return res.status(503).json({ error: 'No email domains available at the moment' });
    }

    const domain = domains[0].domain; // Use the first available domain
    
    // 2. Generate username and password
    let username = customUsername;
    if (!username) {
      username = Math.random().toString(36).substring(2, 10);
    }
    
    const address = `${username}@${domain}`;
    const password = generateRandomPassword();

    // 3. Create account on Mail.tm
    try {
      await mailService.createAccount(address, password);
    } catch (err) {
      if (err.response?.status === 422) {
        return res.status(409).json({ error: 'Email address already taken. Try another username.' });
      }
      throw err;
    }

    // 4. Get authentication token
    const token = await mailService.getToken(address, password);

    // 5. Store in local memory store
    const inboxId = uuidv4();
    const inbox = memoryStore.createInbox({
      inboxId,
      address,
      username,
      domain,
      password,
      token,
      emailCount: 0,
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
      createdAt: new Date()
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
    console.error('generateInbox Error:', err.message);
    res.status(500).json({ error: 'Failed to generate real email address via Mail.tm' });
  }
};

// --- GET /api/inbox/:inboxId ---
const getInbox = async (req, res) => {
  try {
    const inbox = memoryStore.getInbox(req.params.inboxId);
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

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

// --- GET /api/domains ---
const getDomainList = async (_req, res) => {
  try {
    const domains = await mailService.getDomains();
    res.json({ domains: domains.map(d => d.domain) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
};

// --- DELETE /api/inbox/:inboxId ---
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
