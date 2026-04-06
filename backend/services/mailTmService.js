const axios = require('axios');

const MAILTM_BASE = 'https://api.mail.tm';

const api = axios.create({
  baseURL: MAILTM_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ── Get available domains from Mail.tm ───────────────────────────────────────
const getDomains = async () => {
  const res = await api.get('/domains');
  // Hydra format: res.data['hydra:member']
  return res.data['hydra:member'] || res.data;
};

// ── Generate a random password ───────────────────────────────────────────────
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ── Generate a random username ───────────────────────────────────────────────
const generateUsername = () => {
  const adjectives = ['quick', 'lazy', 'bright', 'dark', 'cool', 'swift', 'bold', 'calm'];
  const nouns      = ['fox', 'wolf', 'bear', 'hawk', 'deer', 'lion', 'crow', 'seal'];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
};

// ── Create a new Mail.tm account ─────────────────────────────────────────────
const createAccount = async (address, password) => {
  const res = await api.post('/accounts', { address, password });
  return res.data;
};

// ── Get JWT token for an account ─────────────────────────────────────────────
const getToken = async (address, password) => {
  const res = await api.post('/token', { address, password });
  return res.data.token;
};

// ── Fetch all messages for an account ───────────────────────────────────────
const getMessages = async (token) => {
  const res = await api.get('/messages', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data['hydra:member'] || res.data;
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
  await api.patch(`/messages/${messageId}`, { seen: true }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

module.exports = {
  getDomains,
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
