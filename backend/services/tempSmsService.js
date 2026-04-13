/**
 * tempSmsService.js
 * =================
 * Scrapes receive-smss.com for real Indian +91 virtual numbers and their SMS inbox.
 * Uses in-memory TTL caching to be a polite scraper and reduce latency.
 *
 * Strategy:
 *  - GET https://receive-smss.com/          → parse all number cards → filter India (+91 / 917...)
 *  - GET https://receive-smss.com/sms/{n}/  → parse SMS table rows → extract {from, body, receivedAt, id}
 *  - OTP auto-detected from body using the shared otpService
 */

const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { extractOTP } = require('./otpService');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://receive-smss.com';
const NUMBERS_CACHE_TTL_MS = 10 * 60 * 1000;    // 10 minutes
const INBOX_CACHE_TTL_MS   = 12 * 1000;           // 12 seconds (fast refresh)

// Humanise the scraper so we don't get blocked
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = {
  numbers: { data: null, fetchedAt: 0 },
  inboxes: new Map(),  // number → { data, fetchedAt }
};

// ── Seen-IDs per number (for socket poller de-duplication) ───────────────────
// number → Set<id>
const seenSmsIds = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Stable unique ID for an SMS row (derived from content, not position)
 */
function smsId(from, body, timeText) {
  return crypto
    .createHash('sha256')
    .update(`${from}|${body}|${timeText}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Format a raw number like "917428730894" → "+91 7428-730894"
 */
function formatIndianNumber(raw) {
  // raw is "917XXXXXXXXXX" — strip the leading 91
  const local = raw.startsWith('91') ? raw.slice(2) : raw;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)}-${local.slice(5)}`;
  }
  return `+${raw}`;
}

/**
 * Convert relative time strings like "2 minutes ago", "just now", "3 hours ago"
 * into an ISO timestamp (approximate).
 */
function parseRelativeTime(text) {
  if (!text) return new Date().toISOString();
  const t = text.toLowerCase().trim();
  const now = Date.now();

  if (t.includes('just') || t.includes('second')) return new Date(now - 30_000).toISOString();

  const minMatch = t.match(/(\d+)\s*min/);
  if (minMatch) return new Date(now - parseInt(minMatch[1]) * 60_000).toISOString();

  const hrMatch = t.match(/(\d+)\s*hour/);
  if (hrMatch) return new Date(now - parseInt(hrMatch[1]) * 3600_000).toISOString();

  const dayMatch = t.match(/(\d+)\s*day/);
  if (dayMatch) return new Date(now - parseInt(dayMatch[1]) * 86400_000).toISOString();

  return new Date().toISOString();
}

// ── Core scraping functions ───────────────────────────────────────────────────

/**
 * Fetch the homepage and extract all Indian (+91) numbers.
 * Cached for NUMBERS_CACHE_TTL_MS.
 */
async function getIndianNumbers({ bustCache = false } = {}) {
  const now = Date.now();
  if (!bustCache && cache.numbers.data && (now - cache.numbers.fetchedAt) < NUMBERS_CACHE_TTL_MS) {
    return cache.numbers.data;
  }

  const { data: html } = await axios.get(BASE_URL, { headers: HEADERS, timeout: 10_000 });
  const $ = cheerio.load(html);
  const numbers = [];

  // receive-smss.com lists numbers as <div> or <a> blocks with the number and country
  // Primary pattern: links like /sms/917428730894/ with country text inside
  $('a[href*="/sms/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(/\/sms\/(\d{10,15})\//);
    if (!match) return;

    const raw = match[1];
    // India numbers start with "91" and are 12 digits total
    if (!raw.startsWith('91') || raw.length < 11 || raw.length > 12) return;

    // Avoid duplicates
    if (numbers.find(n => n.number === raw)) return;

    // Verify it says "India" in surrounding text (graceful — not always needed)
    const parentText = $(el).text() + $(el).parent().text();
    // Accept if href starts with 91 (India code) regardless of label
    numbers.push({
      number: raw,
      display: formatIndianNumber(raw),
      fullNumber: `+${raw}`,
      url: `${BASE_URL}/sms/${raw}/`,
    });
  });

  // Fallback: use known hardcoded Indian numbers if scraping yields nothing
  if (numbers.length === 0) {
    const KNOWN_INDIAN_NUMBERS = [
      '917428730894',
      '917428723247',
    ];
    KNOWN_INDIAN_NUMBERS.forEach(raw => {
      numbers.push({
        number: raw,
        display: formatIndianNumber(raw),
        fullNumber: `+${raw}`,
        url: `${BASE_URL}/sms/${raw}/`,
      });
    });
  }

  cache.numbers.data = numbers;
  cache.numbers.fetchedAt = now;
  console.log(`[SMS] Scraped ${numbers.length} Indian number(s) from receive-smss.com`);
  return numbers;
}

/**
 * Fetch and parse the SMS inbox for a specific number.
 * Cached for INBOX_CACHE_TTL_MS.
 */
async function getSmsInbox(number, { bustCache = false } = {}) {
  const now = Date.now();
  const cached = cache.inboxes.get(number);
  if (!bustCache && cached && (now - cached.fetchedAt) < INBOX_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${BASE_URL}/sms/${number}/`;
  let html;
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 12_000 });
    html = res.data;
  } catch (err) {
    console.error(`[SMS] Failed to fetch inbox for ${number}:`, err.message);
    return cached?.data || [];
  }

  const $ = cheerio.load(html);
  const messages = [];

  // receive-smss.com renders SMS in a <table class="table"> with <tbody> rows
  // Each row: <td>FROM</td><td>MESSAGE</td><td>TIME</td>
  // We try multiple selectors for robustness
  const rows = $('table tbody tr, .sms-list tr, .messages-table tr').toArray();

  rows.forEach(row => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;

    const from      = $(cells[0]).text().trim();
    const body      = $(cells[1]).text().trim();
    const timeText  = cells.length >= 3 ? $(cells[2]).text().trim() : '';

    if (!from || !body) return;

    const id          = smsId(from, body, timeText);
    const receivedAt  = parseRelativeTime(timeText);
    const otpCode     = extractOTP(body, '', '');

    messages.push({ id, from, body, receivedAt, otpCode });
  });

  // Secondary selector: some pages use div-based layout
  if (messages.length === 0) {
    $('.panel-body, .sms-row, .message-row').each((_, el) => {
      const from     = $(el).find('.sender, .from, [class*="sender"]').first().text().trim();
      const body     = $(el).find('.text, .body, .message, [class*="text"]').first().text().trim();
      const timeText = $(el).find('.time, .date, [class*="time"]').first().text().trim();
      if (!from || !body) return;
      const id = smsId(from, body, timeText);
      messages.push({ id, from, body, receivedAt: parseRelativeTime(timeText), otpCode: extractOTP(body, '', '') });
    });
  }

  // Sort newest-first
  messages.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

  cache.inboxes.set(number, { data: messages, fetchedAt: now });
  return messages;
}

/**
 * Get only messages that are NEW compared to the seenIds set for this number.
 * Used by the socket poller to emit real-time events.
 */
async function getNewSmsMessages(number) {
  const messages = await getSmsInbox(number, { bustCache: true });

  if (!seenSmsIds.has(number)) {
    // First time — seed the seen set, don't emit anything
    seenSmsIds.set(number, new Set(messages.map(m => m.id)));
    return [];
  }

  const seen = seenSmsIds.get(number);
  const newOnes = messages.filter(m => !seen.has(m.id));
  newOnes.forEach(m => seen.add(m.id));
  return newOnes;
}

/**
 * Bust cache for a specific number (force fresh fetch next time).
 */
function bustNumberCache(number) {
  cache.inboxes.delete(number);
}

/**
 * Bust the numbers list cache.
 */
function bustNumbersListCache() {
  cache.numbers.data = null;
  cache.numbers.fetchedAt = 0;
}

module.exports = {
  getIndianNumbers,
  getSmsInbox,
  getNewSmsMessages,
  bustNumberCache,
  bustNumbersListCache,
};
