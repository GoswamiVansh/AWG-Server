/**
 * In-memory OTP store with auto-expiry.
 * Each OTP is valid for 10 minutes and limited to 5 send attempts per email per hour.
 */

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number; // how many times user tried to verify (max 5)
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const otpMap = new Map<string, OtpEntry>();
const rateLimitMap = new Map<string, RateLimitEntry>();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SENDS_PER_WINDOW = 5;

/**
 * Generate a random 6-digit OTP code
 */
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Check if the email has exceeded the send rate limit
 */
export const isRateLimited = (email: string): boolean => {
  const key = email.toLowerCase();
  const entry = rateLimitMap.get(key);

  if (!entry || Date.now() > entry.resetAt) {
    return false;
  }

  return entry.count >= MAX_SENDS_PER_WINDOW;
};

/**
 * Create and store a new OTP for the given email.
 * Returns the generated code.
 */
export const createOtp = (email: string): string => {
  const key = email.toLowerCase();
  const code = generateCode();

  // Store OTP
  otpMap.set(key, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  // Update rate limit counter
  const rateEntry = rateLimitMap.get(key);
  if (!rateEntry || Date.now() > rateEntry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: Date.now() + RATE_LIMIT_WINDOW_MS });
  } else {
    rateEntry.count++;
  }

  // Schedule cleanup
  setTimeout(() => {
    const current = otpMap.get(key);
    if (current && current.code === code) {
      otpMap.delete(key);
    }
  }, OTP_EXPIRY_MS + 1000);

  return code;
};

/**
 * Verify an OTP for the given email.
 * Returns: { valid: boolean; message: string }
 */
export const verifyOtp = (
  email: string,
  code: string
): { valid: boolean; message: string } => {
  const key = email.toLowerCase();
  const entry = otpMap.get(key);

  if (!entry) {
    return { valid: false, message: "No verification code found. Please request a new one." };
  }

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(key);
    return { valid: false, message: "Verification code has expired. Please request a new one." };
  }

  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpMap.delete(key);
    return { valid: false, message: "Too many failed attempts. Please request a new code." };
  }

  if (entry.code !== code) {
    entry.attempts++;
    return {
      valid: false,
      message: `Incorrect code. ${MAX_VERIFY_ATTEMPTS - entry.attempts} attempts remaining.`,
    };
  }

  // Success — remove OTP (single-use)
  otpMap.delete(key);
  return { valid: true, message: "Email verified successfully!" };
};

/**
 * Check if an email was recently verified (within the last 15 minutes).
 * We store verified emails separately to allow registration after verification.
 */
const verifiedEmails = new Map<string, number>();
const VERIFIED_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export const markEmailVerified = (email: string): void => {
  const key = email.toLowerCase();
  verifiedEmails.set(key, Date.now() + VERIFIED_EXPIRY_MS);

  setTimeout(() => {
    verifiedEmails.delete(key);
  }, VERIFIED_EXPIRY_MS + 1000);
};

export const isEmailVerified = (email: string): boolean => {
  const key = email.toLowerCase();
  const expiry = verifiedEmails.get(key);

  if (!expiry) return false;

  if (Date.now() > expiry) {
    verifiedEmails.delete(key);
    return false;
  }

  return true;
};

export const clearEmailVerified = (email: string): void => {
  verifiedEmails.delete(email.toLowerCase());
};
