const cron = require('node-cron');
const memoryStore = require('./memoryStore');

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
      
      const expiredInboxes = memoryStore.getExpiredInboxes();

      if (expiredInboxes.length > 0) {
        let deletedInboxes = 0;
        let deletedEmails = 0;

        for (const inbox of expiredInboxes) {
          const emailCount = memoryStore.countEmailsByInboxId(inbox.inboxId);
          if (memoryStore.deleteInbox(inbox.inboxId)) {
            deletedInboxes++;
            deletedEmails += emailCount;
          }
        }

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

      const expiring = memoryStore.getExpiringInboxes(min1, soon);
      
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

  console.log('⏰ Cron jobs initialized (In-Memory version)');
};

module.exports = { setupCronJobs };
