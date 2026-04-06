const { Op } = require('sequelize');
const Email = require('../models/Email');
const Inbox = require('../models/Inbox');
const { extractOTP } = require('../services/otpService');

const MAX_EMAILS = parseInt(process.env.MAX_EMAILS_PER_INBOX || '50', 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseSenderName = (from = '') => {
  const match = from.match(/^"?([^"<]+)"?\s*<.+>/);
  return match ? match[1].trim() : from.split('@')[0] || 'Unknown';
};

const sanitizeHtml = (html = '') =>
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

const toSummary = (email) => ({
  id:         email.id,
  from:       email.from,
  fromName:   email.fromName || parseSenderName(email.from),
  subject:    email.subject,
  preview:    (email.bodyText || '').substring(0, 120).trim() || 'No preview available',
  otpCode:    email.otpCode,
  isRead:     email.isRead,
  size:       email.size,
  receivedAt: email.createdAt,
});

const toFull = (email) => ({
  id:         email.id,
  from:       email.from,
  fromName:   email.fromName || parseSenderName(email.from),
  to:         email.to,
  subject:    email.subject,
  bodyText:   email.bodyText,
  bodyHtml:   email.bodyHtml,
  otpCode:    email.otpCode,
  isRead:     email.isRead,
  receivedAt: email.createdAt,
});

// Demo email templates
const getTemplate = (address, type) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const map = {
    otp: {
      from: 'noreply@accounts.google.com', fromName: 'Google',
      subject: 'Your Google verification code', otpCode: otp,
      bodyText: `Your verification code is: ${otp}\n\nExpires in 10 minutes. Never share it.\n\n— The Google Account team`,
      bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h2 style="color:#1a73e8">Verify your identity</h2>
        <p>Use the code below to complete sign-in:</p>
        <div style="background:#f0f4ff;border:2px solid #1a73e8;border-radius:12px;padding:28px;text-align:center;margin:24px 0">
          <span style="font-size:40px;font-weight:700;letter-spacing:14px;color:#1a1a1a">${otp}</span>
        </div>
        <p style="color:#666;font-size:14px">Expires in <strong>10 minutes</strong>. Never share this code.</p>
        <p style="color:#999;font-size:12px;margin-top:24px">Sent to: ${address}</p></div>`,
    },
    welcome: {
      from: 'hello@notion.so', fromName: 'Notion',
      subject: 'Welcome to Notion — get started in minutes', otpCode: null,
      bodyText: `Hi!\n\nWelcome to Notion. Your workspace is ready.\n\nGet started: https://notion.so\n\n— The Notion Team`,
      bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h1 style="font-size:26px">Welcome to Notion 👋</h1>
        <p style="color:#555;line-height:1.7">Your all-in-one workspace is ready.</p>
        <a href="#" style="display:inline-block;margin-top:20px;background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Open Notion →</a></div>`,
    },
    newsletter: {
      from: 'digest@producthunt.com', fromName: 'Product Hunt',
      subject: "Today's top products 🚀", otpCode: null,
      bodyText: `Good morning!\n\nTop picks:\n1. TempVault — Disposable email, premium experience\n2. CodeFlow AI — Ship code 10× faster`,
      bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h2>🏆 Today's Top Products</h2>
        <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin:10px 0"><strong>#1 TempVault</strong> — Disposable email, premium experience</div>
        <div style="border:1px solid #eee;border-radius:8px;padding:16px;margin:10px 0"><strong>#2 CodeFlow AI</strong> — Ship code 10× faster</div></div>`,
    },
  };
  return map[type] || map.otp;
};

// ── GET /api/emails/:inboxId ──────────────────────────────────────────────────
const getEmails = async (req, res) => {
  try {
    const inbox = await Inbox.findOne({ where: { inboxId: req.params.inboxId } });
    if (!inbox) return res.status(404).json({ error: 'Inbox not found or expired' });

    const emails = await Email.findAll({
      where: { inboxId: req.params.inboxId },
      attributes: { exclude: ['bodyHtml', 'bodyText'] }, // lean list
      order: [['createdAt', 'DESC']],
      limit: MAX_EMAILS,
    });

    res.json({ emails: emails.map(toSummary), total: emails.length });
  } catch (err) {
    console.error('getEmails:', err.message);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

// ── GET /api/email/:id ────────────────────────────────────────────────────────
const getEmail = async (req, res) => {
  try {
    const email = await Email.findByPk(req.params.id);
    if (!email) return res.status(404).json({ error: 'Email not found' });

    if (!email.isRead) {
      await email.update({ isRead: true });
    }
    res.json(toFull(email));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch email' });
  }
};

// ── POST /api/webhook/receive  (Mailgun webhook) ─────────────────────────────
const receiveEmail = async (req, res) => {
  try {
    const {
      recipient,
      sender, from,
      subject,
      'body-plain': bodyText,
      'body-html':  bodyHtml,
      'Message-Id': messageId,
    } = req.body;

    const address = (recipient || '').toLowerCase();
    const inbox   = await Inbox.findOne({ where: { address } });
    if (!inbox) return res.status(404).json({ error: 'Inbox not found' });

    // Check inbox not expired
    if (new Date(inbox.expiresAt) < new Date())
      return res.status(410).json({ error: 'Inbox has expired' });

    // Check email count limit
    const count = await Email.count({ where: { inboxId: inbox.inboxId } });
    if (count >= MAX_EMAILS) return res.status(429).json({ error: 'Inbox full' });

    const fromName  = parseSenderName(from || sender || '');
    const cleanHtml = sanitizeHtml(bodyHtml || '');
    const otpCode   = extractOTP(bodyText, cleanHtml, subject);

    const email = await Email.create({
      inboxId:   inbox.inboxId,
      messageId: messageId || null,
      from:      sender || from,
      fromName,
      to:        inbox.address,
      subject:   subject || '(No Subject)',
      bodyText:  bodyText || '',
      bodyHtml:  cleanHtml,
      otpCode,
      size:      (bodyText || '').length + cleanHtml.length,
    });

    await inbox.increment('emailCount');

    req.app.get('io').to(inbox.inboxId).emit('new_email', {
      ...toSummary(email),
      inboxId: inbox.inboxId,
    });

    res.json({ message: 'Email received' });
  } catch (err) {
    console.error('receiveEmail:', err.message);
    res.status(500).json({ error: 'Failed to process incoming email' });
  }
};

// ── POST /api/simulate-email/:inboxId  (demo / testing) ──────────────────────
const simulateEmail = async (req, res) => {
  try {
    const { inboxId } = req.params;
    const { type = 'otp' } = req.body;

    const inbox = await Inbox.findOne({ where: { inboxId } });
    if (!inbox) return res.status(404).json({ error: 'Inbox not found' });

    const tpl = getTemplate(inbox.address, type);

    const email = await Email.create({
      inboxId:  inbox.inboxId,
      from:     tpl.from,
      fromName: tpl.fromName,
      to:       inbox.address,
      subject:  tpl.subject,
      bodyText: tpl.bodyText,
      bodyHtml: tpl.bodyHtml,
      otpCode:  tpl.otpCode,
      size:     tpl.bodyText.length,
    });

    await inbox.increment('emailCount');

    req.app.get('io').to(inboxId).emit('new_email', {
      ...toSummary(email),
      inboxId,
    });

    res.status(201).json({ message: 'Email simulated', email: toSummary(email) });
  } catch (err) {
    console.error('simulateEmail:', err.message);
    res.status(500).json({ error: 'Failed to simulate email' });
  }
};

// ── DELETE /api/email/:id ─────────────────────────────────────────────────────
const deleteEmail = async (req, res) => {
  try {
    const email = await Email.findByPk(req.params.id);
    if (!email) return res.status(404).json({ error: 'Email not found' });

    const { inboxId } = email;
    await email.destroy();
    await Inbox.decrement('emailCount', { where: { inboxId } });

    res.json({ message: 'Email deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete email' });
  }
};

module.exports = { getEmails, getEmail, receiveEmail, simulateEmail, deleteEmail };
