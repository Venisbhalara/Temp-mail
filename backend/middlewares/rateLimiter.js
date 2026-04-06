const rateLimit = require('express-rate-limit');

/** 100 req / 15 min — applied globally */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.', retryAfter: '15 minutes' },
});

/** 10 req / 5 min — for email generation endpoint */
const generateRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Too many email generation requests. Try again in 5 minutes.' },
});

/** 60 req / min — for Mailgun webhook ingestion */
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many webhook calls.' },
});

module.exports = { globalRateLimiter, generateRateLimiter, webhookRateLimiter };
