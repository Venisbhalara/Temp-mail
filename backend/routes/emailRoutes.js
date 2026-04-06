const express = require('express');
const router  = express.Router();
const { getEmails, getEmail, deleteEmail, pollEmails } = require('../controllers/emailController');

// GET all emails for an inbox
router.get('/emails/:inboxId',      getEmails);

// GET single full email  (?inboxId=xxx)
router.get('/email/:id',            getEmail);

// DELETE single email    (?inboxId=xxx)
router.delete('/email/:id',         deleteEmail);

// POST poll — frontend calls this every 5s to check for new emails
router.post('/poll/:inboxId',       pollEmails);

module.exports = router;
