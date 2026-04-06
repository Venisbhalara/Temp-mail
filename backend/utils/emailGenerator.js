const { v4: uuidv4 } = require('uuid');

const adjectives = [
  'swift', 'bright', 'calm', 'cool', 'dark', 'deep', 'epic', 'fast',
  'fresh', 'gold', 'grand', 'keen', 'kind', 'light', 'lucky', 'magic',
  'neat', 'noble', 'prime', 'pure', 'quick', 'rare', 'safe', 'sharp',
  'sleek', 'smart', 'solid', 'sonic', 'true', 'ultra', 'wild', 'wise', 'zen',
];

const nouns = [
  'atom', 'beam', 'bolt', 'byte', 'chip', 'code', 'core', 'data', 'dawn',
  'disk', 'echo', 'edge', 'flux', 'gate', 'grid', 'hawk', 'hex', 'ion',
  'jade', 'lens', 'link', 'loop', 'mesh', 'mode', 'node', 'nova', 'orb',
  'path', 'peak', 'ping', 'port', 'pulse', 'ray', 'seed', 'sync', 'tide',
  'volt', 'wave', 'wire', 'zero', 'zone',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Returns the array of configured domains from .env */
const getDomains = () =>
  (process.env.EMAIL_DOMAINS || 'tempvault.dev,quickdrop.io,inboxzap.net')
    .split(',')
    .map((d) => d.trim());

/**
 * Generate a human-readable username like "swiftbolt42"
 * Looks natural, avoids pure random strings
 */
const generateUsername = () => `${pick(adjectives)}${pick(nouns)}${rand(10, 99)}`;

/**
 * Build a full email generation result object
 * @param {string|null} customUsername - optional user-supplied name
 */
const generateEmail = (customUsername = null) => {
  const domains = getDomains();
  const username = customUsername
    ? customUsername.toLowerCase().replace(/[^a-z0-9._-]/g, '')
    : generateUsername();
  const domain = pick(domains);

  return {
    inboxId: uuidv4(),
    username,
    domain,
    address: `${username}@${domain}`,
    isCustom: !!customUsername,
  };
};

/**
 * Validate a user-supplied custom username
 */
const validateUsername = (username) => {
  const cleaned = username.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (cleaned.length < 3)  return { valid: false, message: 'Username must be at least 3 characters' };
  if (cleaned.length > 30) return { valid: false, message: 'Username must be 30 characters or less' };
  return { valid: true, username: cleaned };
};

module.exports = { generateEmail, generateUsername, getDomains, validateUsername };
