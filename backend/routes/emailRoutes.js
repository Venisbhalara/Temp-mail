const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { getEmails, getEmail, receiveEmail, simulateEmail, deleteEmail } = require('../controllers/emailController');
const { webhookRateLimiter } = require('../middlewares/rateLimiter');

router.get('/emails/:inboxId',              getEmails);
router.get('/email/:id',                    getEmail);
router.post('/webhook/receive',             webhookRateLimiter, upload.any(), receiveEmail);
router.post('/simulate-email/:inboxId',     simulateEmail);
router.delete('/email/:id',                 deleteEmail);

module.exports = router;
