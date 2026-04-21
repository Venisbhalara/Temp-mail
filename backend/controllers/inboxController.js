const {
  getDomains,
  generatePassword,
  generateUsername,
  createAccount,
  getToken,
  deleteAccount,
} = require("../services/mailTmService");

// In-memory store: inboxId → { inboxId, address, accountId, token, password, expiresAt, createdAt }
// We still keep a lightweight map so your Socket.io rooms & expiry logic keep working
const inboxStore = new Map();

const EXPIRY_MINUTES = parseInt(process.env.INBOX_EXPIRY_MINUTES || "60", 10);

// Cache first domain on startup
let cachedDomain = null;
let lastDomainFetch = 0;
const DOMAIN_FETCH_INTERVAL = 3600000; // Refresh domain every hour

const ensureDomainCached = async () => {
  const now = Date.now();
  
  // Return cached if still valid
  if (cachedDomain && (now - lastDomainFetch) < DOMAIN_FETCH_INTERVAL) {
    return cachedDomain;
  }

  try {
    const domains = await getDomains();
    if (domains && domains.length > 0) {
      cachedDomain = domains[0].domain;
      lastDomainFetch = now;
      return cachedDomain;
    }
  } catch (err) {
    console.error("Failed to fetch domains:", err.message);
  }

  // If cache failed and we have a cached domain, return it
  if (cachedDomain) {
    return cachedDomain;
  }

  throw new Error("No domains available");
};

// ── POST /api/generate-email ─────────────────────────────────────────────────
const generateInbox = async (req, res) => {
  try {
    const { customUsername } = req.body;

    // 1. Get cached domain (or fetch if needed)
    const domain = await ensureDomainCached();

    const username = customUsername
      ? customUsername.toLowerCase().replace(/[^a-z0-9._-]/g, "")
      : generateUsername();
    const address = `${username}@${domain}`;
    const password = generatePassword();

    // 2. Create account and get token in PARALLEL (not sequential)
    const [account, token] = await Promise.all([
      createAccount(address, password),
      getToken(address, password),
    ]);

    // 3. Store in memory (for socket rooms & expiry)
    const inboxId = account.id;
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    inboxStore.set(inboxId, {
      inboxId,
      accountId: account.id,
      address: account.address,
      username: username,
      domain: domain,
      token,
      password,
      expiresAt,
      createdAt: new Date(),
    });

    res.status(201).json({
      inboxId,
      address: account.address,
      username,
      domain,
      expiresAt,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("generateInbox error:", err?.response?.data || err.message);
    // Mail.tm returns 422 if address already taken
    if (err?.response?.status === 422) {
      return res
        .status(409)
        .json({ error: "Username already taken. Try another." });
    }
    res.status(500).json({ error: "Failed to generate email address" });
  }
};

// ── GET /api/inbox/:inboxId ──────────────────────────────────────────────────
const getInbox = async (req, res) => {
  try {
    const inbox = inboxStore.get(req.params.inboxId);
    if (!inbox)
      return res.status(404).json({ error: "Inbox not found or expired" });

    if (new Date(inbox.expiresAt) < new Date()) {
      inboxStore.delete(inbox.inboxId);
      return res.status(404).json({ error: "Inbox has expired" });
    }

    res.json({
      inboxId: inbox.inboxId,
      address: inbox.address,
      username: inbox.username,
      domain: inbox.domain,
      expiresAt: inbox.expiresAt,
      createdAt: inbox.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get inbox" });
  }
};

// ── GET /api/domains ─────────────────────────────────────────────────────────
const getDomainList = async (_req, res) => {
  try {
    const domains = await getDomains();
    res.json({ domains: domains.map((d) => d.domain) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch domains" });
  }
};

// ── DELETE /api/inbox/:inboxId ───────────────────────────────────────────────
const deleteInbox = async (req, res) => {
  try {
    const inbox = inboxStore.get(req.params.inboxId);
    if (!inbox) return res.status(404).json({ error: "Inbox not found" });

    // Delete account on Mail.tm (also deletes all messages)
    try {
      await deleteAccount(inbox.token, inbox.accountId);
    } catch (e) {
      console.warn(
        "Mail.tm deleteAccount failed (may already be gone):",
        e.message,
      );
    }

    inboxStore.delete(inbox.inboxId);
    req.app
      .get("io")
      .to(inbox.inboxId)
      .emit("inbox_deleted", { inboxId: inbox.inboxId });

    res.json({ message: "Inbox deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete inbox" });
  }
};

// Export the store so emailController can access tokens
module.exports = {
  generateInbox,
  getInbox,
  getDomainList,
  deleteInbox,
  inboxStore,
  ensureDomainCached,
};
