/**
 * smsRoutes.js
 * ============
 * Routes for the Temporary Indian SMS feature.
 * Mounted at /api/sms in server.js
 */

const express = require('express');
const router  = express.Router();
const {
  getNumbers,
  getInbox,
  refreshInbox,
  refreshNumbers,
} = require('../controllers/smsController');

// List available Indian numbers
router.get('/numbers', getNumbers);

// Get SMS inbox for a specific number
router.get('/inbox/:number', getInbox);

// Force-refresh inbox (bust cache + re-fetch)
router.post('/refresh/:number', refreshInbox);

// Force-refresh the numbers list
router.post('/refresh-numbers', refreshNumbers);

module.exports = router;
