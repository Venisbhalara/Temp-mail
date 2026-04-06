const { Op } = require('sequelize');
const Inbox = require('../models/Inbox');
const Email = require('../models/Email');
const { generateEmail, getDomains, validateUsername } = require('../utils/emailGenerator');

const EXPIRY_MINUTES = parseInt(process.env.INBOX_EXPIRY_MINUTES || '60', 10);

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
      const taken = await Inbox.findAll({
        where: { username: validation.username },
        attributes: ['domain'],
      });
      const takenDomains = taken.map(i => i.domain);
      const free = domains.filter(d => !takenDomains.includes(d));
      if (!free.length)
        return res.status(409).json({ error: 'Username taken on all domains. Try another.' });

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
        const exists = await Inbox.findOne({ where: { address: emailData.address } });
        if (!exists) break;
      } while (++attempts < 5);
    }

    const inbox = await Inbox.create({
      inboxId:    emailData.inboxId,
      address:    emailData.address,
      username:   emailData.username,
      domain:     emailData.domain,
      isCustom:   emailData.isCustom || false,
      emailCount: 0,
      expiresAt:  new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
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
    const inbox = await Inbox.findOne({ where: { inboxId: req.params.inboxId } });
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

    // Check if expired (MySQL has no auto-delete)
    if (new Date(inbox.expiresAt) < new Date()) {
      await Email.destroy({ where: { inboxId: inbox.inboxId } });
      await inbox.destroy();
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
    await Email.destroy({ where: { inboxId } });
    const deleted = await Inbox.destroy({ where: { inboxId } });
    if (!deleted) return res.status(404).json({ error: 'Inbox not found' });

    req.app.get('io').to(inboxId).emit('inbox_deleted', { inboxId });
    res.json({ message: 'Inbox deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete inbox' });
  }
};

module.exports = { generateInbox, getInbox, getDomainList, deleteInbox };
