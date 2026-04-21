const axios = require("axios");
const http = require("http");
const https = require("https");

const MAILTM_BASE = "https://api.mail.tm";

// Create HTTP agent with Keep-Alive for connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

const api = axios.create({
  baseURL: MAILTM_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
  httpAgent,
  httpsAgent,
});

// Domain caching
let cachedDomains = null;
let domainsCacheTime = 0;
const DOMAINS_CACHE_TTL = 3600000; // 1 hour

// ── Get available domains from Mail.tm (with caching) ───────────────────────────────────
const getDomains = async () => {
  const now = Date.now();
  
  // Return cached domains if valid
  if (cachedDomains && (now - domainsCacheTime) < DOMAINS_CACHE_TTL) {
    return cachedDomains;
  }

  try {
    const res = await api.get("/domains");
    cachedDomains = res.data["hydra:member"] || res.data;
    domainsCacheTime = now;
    return cachedDomains;
  } catch (err) {
    // If fresh fetch fails, return cached domains even if expired
    if (cachedDomains) {
      console.warn("Fresh domain fetch failed, using expired cache");
      return cachedDomains;
    }
    throw err;
  }
};

// Force refresh domains cache
const refreshDomains = async () => {
  domainsCacheTime = 0;
  cachedDomains = null;
  return getDomains();
};

// ── Generate a random password ───────────────────────────────────────────────
const generatePassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 16 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

// ── Generate a random username ───────────────────────────────────────────────
const generateUsername = () => {
  const adjectives = [
    "quick",
    "lazy",
    "bright",
    "dark",
    "cool",
    "swift",
    "bold",
    "calm",
  ];
  const nouns = ["fox", "wolf", "bear", "hawk", "deer", "lion", "crow", "seal"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
};

// ── Create a new Mail.tm account ─────────────────────────────────────────────
const createAccount = async (address, password) => {
  const res = await api.post("/accounts", { address, password });
  return res.data;
};

// ── Get JWT token for an account ─────────────────────────────────────────────
const getToken = async (address, password) => {
  const res = await api.post("/token", { address, password });
  return res.data.token;
};

// ── Fetch all messages for an account ───────────────────────────────────────
const getMessages = async (token) => {
  const res = await api.get("/messages", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data["hydra:member"] || res.data;
};

// ── Fetch a single full message ──────────────────────────────────────────────
const getMessage = async (token, messageId) => {
  const res = await api.get(`/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ── Delete a message ─────────────────────────────────────────────────────────
const deleteMessage = async (token, messageId) => {
  await api.delete(`/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Delete an account ────────────────────────────────────────────────────────
const deleteAccount = async (token, accountId) => {
  await api.delete(`/accounts/${accountId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Mark message as read ─────────────────────────────────────────────────────
const markAsRead = async (token, messageId) => {
  await api.patch(
    `/messages/${messageId}`,
    { seen: true },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

module.exports = {
  getDomains,
  refreshDomains,
  generatePassword,
  generateUsername,
  createAccount,
  getToken,
  getMessages,
  getMessage,
  deleteMessage,
  deleteAccount,
  markAsRead,
};
