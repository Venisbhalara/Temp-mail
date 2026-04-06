const express = require('express');
const router = express.Router();
const { generateInbox, getInbox, getDomainList, deleteInbox } = require('../controllers/inboxController');

router.post('/generate-email',    generateInbox);
router.get('/inbox/:inboxId',     getInbox);
router.get('/domains',            getDomainList);
router.delete('/inbox/:inboxId',  deleteInbox);

module.exports = router;
