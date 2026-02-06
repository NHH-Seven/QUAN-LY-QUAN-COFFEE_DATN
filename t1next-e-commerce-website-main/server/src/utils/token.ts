import crypto from 'crypto'

/**
 * Generate a cryptographically secure verification token
 * Returns a 32-byte hex string (64 characters)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Hash a token using SHA-256
 * Used to store tokens securely in database
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Get OTP expiry date (10 minutes from now)
 */
export function getOTPExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 10)
  return expiry
}

/**
 * Get token expiry date (24 hours from now)
 */
export function getTokenExpiry(): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  return expiry
}
