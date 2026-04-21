// smsRoutes.js
// Routes for Temp SMS feature (Indian version)

const express = require('express');
const router = express.Router();
const tempSmsService = require('../services/tempSmsService');

// Get a new temp SMS number (Indian)
router.get('/number', async (req, res) => {
  try {
    const numberData = await tempSmsService.requestTempNumber();
    res.json(numberData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get temp number', details: err.message });
  }
});

// Get SMS inbox for a number
router.get('/inbox/:number', async (req, res) => {
  try {
    const messages = await tempSmsService.fetchSmsInbox(req.params.number);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SMS inbox', details: err.message });
  }
});

// Release a temp number
router.post('/release/:number', async (req, res) => {
  try {
    const result = await tempSmsService.releaseTempNumber(req.params.number);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to release number', details: err.message });
  }
});

module.exports = router;
