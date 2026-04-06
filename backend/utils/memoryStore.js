class MemoryStore {
  constructor() {
    this.inboxes = new Map(); // key: inboxId
    this.emails = new Map();  // key: emailId
  }

  // --- Inbox Methods ---
  createInbox(inbox) {
    this.inboxes.set(inbox.inboxId, inbox);
    return inbox;
  }

  getInbox(inboxId) {
    return this.inboxes.get(inboxId);
  }

  getInboxByAddress(address) {
    for (const inbox of this.inboxes.values()) {
      if (inbox.address.toLowerCase() === address.toLowerCase()) {
        return inbox;
      }
    }
    return null;
  }

  getInboxByUsername(username) {
    for (const inbox of this.inboxes.values()) {
      if (inbox.username.toLowerCase() === username.toLowerCase()) {
        return inbox;
      }
    }
    return null;
  }

  deleteInbox(inboxId) {
    // Also delete associated emails
    for (const [emailId, email] of this.emails.entries()) {
      if (email.inboxId === inboxId) {
        this.emails.delete(emailId);
      }
    }
    return this.inboxes.delete(inboxId);
  }

  incrementEmailCount(inboxId) {
    const inbox = this.inboxes.get(inboxId);
    if (inbox) {
      inbox.emailCount = (inbox.emailCount || 0) + 1;
    }
  }

  decrementEmailCount(inboxId) {
    const inbox = this.inboxes.get(inboxId);
    if (inbox && inbox.emailCount > 0) {
      inbox.emailCount--;
    }
  }

  // --- Email Methods ---
  createEmail(email) {
    this.emails.set(email.id, email);
    return email;
  }

  getEmail(emailId) {
    return this.emails.get(emailId);
  }

  getEmailsByInboxId(inboxId, limit = 50) {
    const results = [];
    for (const email of this.emails.values()) {
      if (email.inboxId === inboxId) {
        results.push(email);
      }
    }
    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt - a.createdAt);
    return results.slice(0, limit);
  }

  deleteEmail(emailId) {
    const email = this.emails.get(emailId);
    if (email) {
      this.emails.delete(emailId);
      return email;
    }
    return null;
  }

  countEmailsByInboxId(inboxId) {
    let count = 0;
    for (const email of this.emails.values()) {
      if (email.inboxId === inboxId) count++;
    }
    return count;
  }

  markEmailAsRead(emailId) {
    const email = this.emails.get(emailId);
    if (email) {
      email.isRead = true;
      return true;
    }
    return false;
  }

  // --- Utility Methods for Cron ---
  getExpiredInboxes() {
    const now = new Date();
    const expired = [];
    for (const inbox of this.inboxes.values()) {
      if (inbox.expiresAt < now) {
        expired.push(inbox);
      }
    }
    return expired;
  }

  getExpiringInboxes(min1, soon) {
    const expiring = [];
    for (const inbox of this.inboxes.values()) {
      if (inbox.expiresAt >= min1 && inbox.expiresAt <= soon) {
        expiring.push(inbox);
      }
    }
    return expiring;
  }
}

// Export a singleton instance
module.exports = new MemoryStore();
