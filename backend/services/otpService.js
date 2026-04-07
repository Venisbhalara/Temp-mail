/**
 * OTP Detection Service
 * Scans email body/subject for common one-time password patterns
 */

// Patterns ordered from most-specific to least-specific
const OTP_PATTERNS = [
  // "OTP: 123456" / "Code: 1234" / "PIN: 567890"
  /(?:otp|code|pin|passcode|verification\s+code|security\s+code|one.?time)[:\s]+([0-9]{4,8})/gi,
  // "Your code is 123456"
  /your\s+(?:otp|code|pin|verification)\s+(?:is|:)\s*([0-9]{4,8})/gi,
  // "Use 123456 to verify"
  /use\s+([0-9]{4,8})\s+to\s+(?:verify|login|sign\s*in|authenticate)/gi,
  // Standalone 6-digit (most common OTP length)
  /\b([0-9]{6})\b/g,
  // 4-digit PIN
  /\b([0-9]{4})\b/g,
  // 8-digit code
  /\b([0-9]{8})\b/g,
];

const AUTH_KEYWORDS = [
  "verify",
  "otp",
  "code",
  "pin",
  "password",
  "auth",
  "login",
  "sign",
  "confirm",
  "access",
  "secure",
];

const SPAM_KEYWORDS = [
  "unsubscribe",
  "newsletter",
  "promotion",
  "offer",
  "discount",
  "sale",
  "deal",
  "coupon",
  "promo",
];

/**
 * Extract an OTP code from the email content.
 * Returns the code string or null if not found / not an auth email.
 */
const extractOTP = (bodyText = "", bodyHtml = "", subject = "") => {
  const searchText = `${subject} ${bodyText}`.toLowerCase();

  // Skip obvious marketing emails
  if (SPAM_KEYWORDS.some((kw) => searchText.includes(kw))) return null;

  // Only process emails that look auth-related
  if (!AUTH_KEYWORDS.some((kw) => searchText.includes(kw))) return null;

  for (const pattern of OTP_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(bodyText);
    if (match && match[1] && match[1].length >= 4 && match[1].length <= 8) {
      return match[1];
    }
  }

  return null;
};

module.exports = { extractOTP };
