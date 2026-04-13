/**
 * smsController.js
 * ================
 * REST API handlers for the Temporary Indian SMS feature.
 */

const tempSmsService = require('../services/tempSmsService');

// ── GET /api/sms/numbers ──────────────────────────────────────────────────────
const getNumbers = async (req, res) => {
  try {
    const numbers = await tempSmsService.getIndianNumbers();
    res.json({ numbers });
  } catch (err) {
    console.error('[SMS] getNumbers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch Indian numbers', details: err.message });
  }
};

// ── GET /api/sms/inbox/:number ────────────────────────────────────────────────
const getInbox = async (req, res) => {
  const { number } = req.params;
  if (!number || !number.startsWith('91') || number.length < 11) {
    return res.status(400).json({ error: 'Invalid Indian number format' });
  }

  try {
    const messages = await tempSmsService.getSmsInbox(number);
    res.json({ number, fullNumber: `+${number}`, messages });
  } catch (err) {
    console.error('[SMS] getInbox error:', err.message);
    res.status(500).json({ error: 'Failed to fetch SMS inbox', details: err.message });
  }
};

// ── POST /api/sms/refresh/:number ─────────────────────────────────────────────
const refreshInbox = async (req, res) => {
  const { number } = req.params;
  if (!number || !number.startsWith('91')) {
    return res.status(400).json({ error: 'Invalid number' });
  }

  try {
    tempSmsService.bustNumberCache(number);
    const messages = await tempSmsService.getSmsInbox(number, { bustCache: true });
    res.json({ success: true, number, messages });
  } catch (err) {
    console.error('[SMS] refreshInbox error:', err.message);
    res.status(500).json({ error: 'Failed to refresh inbox', details: err.message });
  }
};

// ── POST /api/sms/refresh-numbers ─────────────────────────────────────────────
const refreshNumbers = async (req, res) => {
  try {
    tempSmsService.bustNumbersListCache();
    const numbers = await tempSmsService.getIndianNumbers({ bustCache: true });
    res.json({ success: true, numbers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh number list', details: err.message });
  }
};

module.exports = {
  getNumbers,
  getInbox,
  refreshInbox,
  refreshNumbers,
};
