const cron = require('node-cron');
const { Op } = require('sequelize');
const Inbox = require('../models/Inbox');
const Email = require('../models/Email');

/**
 * Initialize all scheduled background jobs.
 * 
 * @param {import('socket.io').Server} io
 */
const setupCronJobs = (io) => {
  // ── Job 1: Clean expired inboxes and orphaned emails every 10 minutes ──────
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('🧹 Running expired inbox cleanup...');
      const now = new Date();
      
      // Find all expired inboxes
      const expiredInboxes = await Inbox.findAll({
        where: { expiresAt: { [Op.lt]: now } },
        attributes: ['inboxId']
      });

      if (expiredInboxes.length > 0) {
        const expiredIds = expiredInboxes.map(i => i.inboxId);
        
        // Delete all emails for expired inboxes
        const deletedEmails = await Email.destroy({
          where: { inboxId: { [Op.in]: expiredIds } }
        });
        
        // Delete expired inboxes
        const deletedInboxes = await Inbox.destroy({
          where: { inboxId: { [Op.in]: expiredIds } }
        });

        console.log(`   ✅ Removed ${deletedInboxes} expired inboxes and ${deletedEmails} emails`);
      }
    } catch (err) {
      console.error('❌ Cleanup job failed:', err.message);
    }
  });

  // ── Job 2: Warn clients 5 min before their inbox expires ───────────────────
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const soon = new Date(now.getTime() + 5 * 60 * 1000);
      const min1 = new Date(now.getTime() + 60 * 1000);

      const expiring = await Inbox.findAll({
        where: {
          expiresAt: {
            [Op.gte]: min1,
            [Op.lte]: soon
          }
        }
      });
      
      expiring.forEach((inbox) => {
        const minutesLeft = Math.ceil((new Date(inbox.expiresAt) - now) / 60000);
        io.to(inbox.inboxId).emit('inbox_expiring', {
          inboxId: inbox.inboxId,
          minutesLeft,
          expiresAt: inbox.expiresAt,
        });
      });
    } catch (err) {
      console.error('❌ Expiry-notification job failed:', err.message);
    }
  });

  console.log('⏰ Cron jobs initialized (MySQL version)');
};

module.exports = { setupCronJobs };
