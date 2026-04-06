const cron = require("node-cron");
const { inboxStore } = require("../controllers/inboxController");
const { deleteAccount } = require("../services/mailTmService");

const setupCronJobs = (io) => {
  // ── Clean expired inboxes every 10 minutes ───────────────────────────────
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("🧹 Running expired inbox cleanup...");
      const now = new Date();
      let deleted = 0;

      for (const [inboxId, inbox] of inboxStore.entries()) {
        if (new Date(inbox.expiresAt) < now) {
          // Delete from Mail.tm too
          try {
            await deleteAccount(inbox.token, inbox.accountId);
          } catch (_) {}
          inboxStore.delete(inboxId);
          deleted++;
        }
      }

      if (deleted > 0) console.log(`   ✅ Removed ${deleted} expired inboxes`);
    } catch (err) {
      console.error("❌ Cleanup job failed:", err.message);
    }
  });

  // ── Warn clients 5 min before expiry (every minute) ──────────────────────
  cron.schedule("* * * * *", () => {
    try {
      const now = new Date();
      const soon = new Date(now.getTime() + 5 * 60 * 1000);
      const min1 = new Date(now.getTime() + 60 * 1000);

      for (const inbox of inboxStore.values()) {
        const exp = new Date(inbox.expiresAt);
        if (exp > min1 && exp <= soon) {
          const minutesLeft = Math.ceil((exp - now) / 60000);
          io.to(inbox.inboxId).emit("inbox_expiring", {
            inboxId: inbox.inboxId,
            minutesLeft,
            expiresAt: inbox.expiresAt,
          });
        }
      }
    } catch (err) {
      console.error("❌ Expiry-notification job failed:", err.message);
    }
  });

  console.log("⏰ Cron jobs initialized");
};

module.exports = { setupCronJobs };
