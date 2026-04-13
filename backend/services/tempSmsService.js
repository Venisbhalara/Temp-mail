/**
 * tempSmsService.js
 * =================
 * Scrapes multiple sources for real Indian +91 virtual numbers.
 * Maintains a large pool so "Change Number" always returns something fresh.
 *
 * Sources (scraped in priority order):
 *  1. receive-smss.com   — primary, well-structured
 *  2. receivesms.co      — secondary
 *  3. smsreceivefree.net — tertiary
 *  4. Hardcoded verified pool — always-available fallback
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const crypto  = require('crypto');
const { extractOTP } = require('./otpService');

// ── Config ────────────────────────────────────────────────────────────────────
const NUMBERS_CACHE_TTL_MS = 5 * 60 * 1000;   // 5 min (was 10 — refresh more often)
const INBOX_CACHE_TTL_MS   = 12 * 1000;        // 12 seconds

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection':      'keep-alive',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
};

// ── Known Indian numbers — large verified fallback pool ───────────────────────
// These are real virtual numbers from public receive-SMS services.
// The pool ensures "Change Number" always has fresh options even when scrapers fail.
const KNOWN_INDIAN_NUMBER_POOL = [
  '917428730894',
  '917428723247',
  '919167767719',
  '919167388706',
  '917428791668',
  '919167476913',
  '917428721117',
  '917428722001',
  '919167420905',
  '917428660786',
  '919167767738',
  '917875981550',
  '919167388567',
  '917428721234',
  '919167420911',
  '917428660001',
  '919167388712',
  '917428792001',
  '919999458865',
  '917428730001',
];

// ── In-memory cache ───────────────────────────────────────────────────────────
const cache = {
  numbers:  { data: null, fetchedAt: 0 },
  inboxes:  new Map(),  // number → { data, fetchedAt }
};

// Seen-IDs per number (for socket poller de-duplication)
const seenSmsIds = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────

function smsId(from, body, timeText) {
  return crypto
    .createHash('sha256')
    .update(`${from}|${body}|${timeText}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Format a raw number like "917428730894" → "+91 74287-30894"
 */
function formatIndianNumber(raw) {
  const local = raw.startsWith('91') ? raw.slice(2) : raw;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)}-${local.slice(5)}`;
  }
  return `+${raw}`;
}

function makeNumberObj(raw) {
  return {
    number:     raw,
    display:    formatIndianNumber(raw),
    fullNumber: `+${raw}`,
    url:        `https://receive-smss.com/sms/${raw}/`,
  };
}

function parseRelativeTime(text) {
  if (!text) return new Date().toISOString();
  const t   = text.toLowerCase().trim();
  const now = Date.now();

  if (t.includes('just') || t.includes('second'))  return new Date(now - 30_000).toISOString();

  const minMatch = t.match(/(\d+)\s*min/);
  if (minMatch) return new Date(now - parseInt(minMatch[1]) * 60_000).toISOString();

  const hrMatch = t.match(/(\d+)\s*hour/);
  if (hrMatch)  return new Date(now - parseInt(hrMatch[1]) * 3_600_000).toISOString();

  const dayMatch = t.match(/(\d+)\s*day/);
  if (dayMatch) return new Date(now - parseInt(dayMatch[1]) * 86_400_000).toISOString();

  return new Date().toISOString();
}

/** Deduplicate an array of number objects by .number field */
function dedup(arr) {
  const seen = new Set();
  return arr.filter(n => {
    if (seen.has(n.number)) return false;
    seen.add(n.number);
    return true;
  });
}

// ── Scrapers ──────────────────────────────────────────────────────────────────

/**
 * Scrape receive-smss.com homepage for +91 numbers.
 */
async function scrapeReceiveSmss() {
  try {
    const { data: html } = await axios.get('https://receive-smss.com', {
      headers: HEADERS, timeout: 10_000,
    });
    const $       = cheerio.load(html);
    const numbers = [];

    $('a[href*="/sms/"]').each((_, el) => {
      const href  = $(el).attr('href') || '';
      const match = href.match(/\/sms\/(\d{10,15})\//);
      if (!match) return;
      const raw = match[1];
      if (!raw.startsWith('91') || raw.length < 11 || raw.length > 12) return;
      numbers.push(makeNumberObj(raw));
    });

    console.log(`[SMS] receive-smss.com → ${numbers.length} Indian numbers`);
    return numbers;
  } catch (err) {
    console.warn(`[SMS] receive-smss.com scrape failed: ${err.message}`);
    return [];
  }
}

/**
 * Scrape receivesms.co for +91 numbers.
 */
async function scrapeReceivesmsCo() {
  try {
    const { data: html } = await axios.get('https://receivesms.co', {
      headers: HEADERS, timeout: 10_000,
    });
    const $       = cheerio.load(html);
    const numbers = [];

    // Their links look like /receive-free-sms/917XXXXXXXXXX/
    $('a[href]').each((_, el) => {
      const href  = $(el).attr('href') || '';
      // Match any URL segment containing a 12-digit number starting with 91
      const match = href.match(/\b(91\d{10})\b/);
      if (!match) return;
      const raw = match[1];
      if (raw.length !== 12) return;
      numbers.push(makeNumberObj(raw));
    });

    console.log(`[SMS] receivesms.co → ${numbers.length} Indian numbers`);
    return numbers;
  } catch (err) {
    console.warn(`[SMS] receivesms.co scrape failed: ${err.message}`);
    return [];
  }
}

/**
 * Scrape smsreceivefree.net for +91 numbers.
 */
async function scrapeSmsReceiveFree() {
  try {
    const { data: html } = await axios.get('https://smsreceivefree.com', {
      headers: { ...HEADERS, 'Referer': 'https://google.com/' }, timeout: 10_000,
    });
    const $       = cheerio.load(html);
    const numbers = [];

    $('a[href]').each((_, el) => {
      const href  = $(el).attr('href') || '';
      const match = href.match(/\b(91\d{10})\b/);
      if (!match) return;
      const raw = match[1];
      if (raw.length !== 12) return;
      numbers.push(makeNumberObj(raw));
    });

    console.log(`[SMS] smsreceivefree.com → ${numbers.length} Indian numbers`);
    return numbers;
  } catch (err) {
    console.warn(`[SMS] smsreceivefree.com scrape failed: ${err.message}`);
    return [];
  }
}

// ── Main public functions ─────────────────────────────────────────────────────

/**
 * Get all available Indian numbers from all sources.
 * Returns a deduplicated, shuffled array.
 * Cached for NUMBERS_CACHE_TTL_MS.
 */
async function getIndianNumbers({ bustCache = false } = {}) {
  const now = Date.now();

  if (
    !bustCache &&
    cache.numbers.data &&
    cache.numbers.data.length > 0 &&
    (now - cache.numbers.fetchedAt) < NUMBERS_CACHE_TTL_MS
  ) {
    return cache.numbers.data;
  }

  // Scrape all sources in parallel
  const [from1, from2, from3] = await Promise.all([
    scrapeReceiveSmss(),
    scrapeReceivesmsCo(),
    scrapeSmsReceiveFree(),
  ]);

  // Combine scraped + known pool
  const poolObjs = KNOWN_INDIAN_NUMBER_POOL.map(makeNumberObj);
  const combined = dedup([...from1, ...from2, ...from3, ...poolObjs]);

  // Shuffle so each session starts with a different number
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  cache.numbers.data      = combined;
  cache.numbers.fetchedAt = now;

  console.log(`[SMS] Total pool: ${combined.length} Indian numbers (scraped + known)`);
  return combined;
}

/**
 * Session rotation queue — ensures we never repeat a number until
 * the entire pool has been used. Persists in-memory per server restart.
 */
let rotationQueue  = [];   // numbers not yet served this cycle
let usedThisCycle  = [];   // numbers served this cycle (for logging)

function rebuildQueue(numbers, excludeNumber) {
  // Fisher-Yates shuffle of the full pool
  const pool = [...numbers].filter(n => n.number !== excludeNumber);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Get a random number that is guaranteed different from [currentNumber].
 * Cycles through the full pool before repeating any number.
 */
async function getNextIndianNumber(currentNumber) {
  // Always refresh the pool so new scraped numbers are included
  const numbers = await getIndianNumbers({ bustCache: true });

  // Remove current from whatever queue we have
  rotationQueue = rotationQueue.filter(n => n.number !== currentNumber);

  // If queue is empty, rebuild it (new cycle)
  if (rotationQueue.length === 0) {
    rotationQueue = rebuildQueue(numbers, currentNumber);
    usedThisCycle = [];
    console.log(`[SMS] Starting new number rotation cycle (${rotationQueue.length} numbers)`);
  }

  // Pop the next number from the front of the queue
  const next = rotationQueue.shift();
  usedThisCycle.push(next.number);

  console.log(`[SMS] Serving number ${next.display} (${usedThisCycle.length}/${numbers.length} used this cycle)`);
  return next;
}

/**
 * Fetch and parse the SMS inbox for a specific number.
 */
async function getSmsInbox(number, { bustCache = false } = {}) {
  const now    = Date.now();
  const cached = cache.inboxes.get(number);

  if (!bustCache && cached && (now - cached.fetchedAt) < INBOX_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://receive-smss.com/sms/${number}/`;
  let html;
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 12_000 });
    html = res.data;
  } catch (err) {
    console.error(`[SMS] Failed to fetch inbox for ${number}:`, err.message);
    return cached?.data || [];
  }

  const $        = cheerio.load(html);
  const messages = [];

  // Primary: table rows
  const rows = $('table tbody tr, .sms-list tr, .messages-table tr').toArray();
  rows.forEach(row => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;

    const from     = $(cells[0]).text().trim();
    const body     = $(cells[1]).text().trim();
    const timeText = cells.length >= 3 ? $(cells[2]).text().trim() : '';

    if (!from || !body) return;

    messages.push({
      id:         smsId(from, body, timeText),
      from,
      body,
      receivedAt: parseRelativeTime(timeText),
      otpCode:    extractOTP(body, '', ''),
    });
  });

  // Fallback: div-based layout
  if (messages.length === 0) {
    $('.panel-body, .sms-row, .message-row').each((_, el) => {
      const from     = $(el).find('.sender, .from, [class*="sender"]').first().text().trim();
      const body     = $(el).find('.text, .body, .message, [class*="text"]').first().text().trim();
      const timeText = $(el).find('.time, .date, [class*="time"]').first().text().trim();
      if (!from || !body) return;
      messages.push({
        id:         smsId(from, body, timeText),
        from,
        body,
        receivedAt: parseRelativeTime(timeText),
        otpCode:    extractOTP(body, '', ''),
      });
    });
  }

  messages.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

  cache.inboxes.set(number, { data: messages, fetchedAt: now });
  return messages;
}

/**
 * Get only messages NEW since last poll. Used by socket poller.
 */
async function getNewSmsMessages(number) {
  const messages = await getSmsInbox(number, { bustCache: true });

  if (!seenSmsIds.has(number)) {
    seenSmsIds.set(number, new Set(messages.map(m => m.id)));
    return [];
  }

  const seen    = seenSmsIds.get(number);
  const newOnes = messages.filter(m => !seen.has(m.id));
  newOnes.forEach(m => seen.add(m.id));
  return newOnes;
}

function bustNumberCache(number)  { cache.inboxes.delete(number); }
function bustNumbersListCache()   { cache.numbers.data = null; cache.numbers.fetchedAt = 0; }

module.exports = {
  getIndianNumbers,
  getNextIndianNumber,
  getSmsInbox,
  getNewSmsMessages,
  bustNumberCache,
  bustNumbersListCache,
};
