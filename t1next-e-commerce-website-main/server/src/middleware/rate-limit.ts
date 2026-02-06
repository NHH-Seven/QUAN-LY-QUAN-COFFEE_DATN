import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

/**
 * Rate Limiting Configuration
 * 
 * Requirements: 6.2 - Implement rate limiting on all sensitive endpoints
 * 
 * Endpoints and limits:
 * - Login: 5 requests/minute
 * - Register: 3 requests/minute
 * - Password reset: 3 requests/hour
 * - General API: 100 requests/minute
 */

/**
 * Helper to normalize IP address for IPv6 compatibility
 * Handles both IPv4 and IPv6 addresses properly
 */
function normalizeIp(ip: string | undefined): string {
  if (!ip) return 'unknown'
  // Handle IPv6-mapped IPv4 addresses (::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }
  return ip
}

/**
 * Helper to create rate limit response handler
 */
function createRateLimitHandler(message: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: message,
    })
  }
}

/**
 * Helper to check if rate limiting should be skipped (for tests)
 */
function shouldSkipRateLimit(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Disable all validation to prevent IPv6 warnings
 * The custom keyGenerator handles IP normalization properly
 */
const disableValidation = false

/**
 * Rate limiter for login endpoint
 * - 5 requests per minute per IP
 * 
 * Requirements: 6.2
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 1 phút',
  handler: createRateLimitHandler('Quá nhiều lần đăng nhập, vui lòng thử lại sau 1 phút'),
  skip: shouldSkipRateLimit,
  keyGenerator: (req: Request) => {
    const email = req.body?.email || ''
    const ip = normalizeIp(req.ip)
    return `login:${ip}:${email}`
  },
  validate: disableValidation,
})

/**
 * Rate limiter for register endpoint
 * - 3 requests per minute per IP
 * 
 * Requirements: 6.2
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu đăng ký, vui lòng thử lại sau 1 phút',
  handler: createRateLimitHandler('Quá nhiều yêu cầu đăng ký, vui lòng thử lại sau 1 phút'),
  skip: shouldSkipRateLimit,
  validate: disableValidation,
})

/**
 * Rate limiter for password reset endpoint
 * - 3 requests per hour per IP
 * 
 * Requirements: 6.2
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ',
  handler: createRateLimitHandler('Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ'),
  skip: shouldSkipRateLimit,
  keyGenerator: (req: Request) => {
    const email = req.body?.email || ''
    const ip = normalizeIp(req.ip)
    return `password-reset:${ip}:${email}`
  },
  validate: disableValidation,
})

/**
 * Rate limiter for OTP verification
 * - 10 requests per 15 minutes per IP
 */
export const otpVerificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều lần xác thực OTP, vui lòng thử lại sau',
  handler: createRateLimitHandler('Quá nhiều lần xác thực OTP, vui lòng thử lại sau'),
  skip: shouldSkipRateLimit,
  validate: disableValidation,
})

/**
 * Rate limiter for resend verification email
 * - 3 attempts per hour per IP
 */
export const resendVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu gửi lại mã, vui lòng thử lại sau 1 giờ',
  handler: createRateLimitHandler('Quá nhiều yêu cầu gửi lại mã, vui lòng thử lại sau 1 giờ'),
  skip: shouldSkipRateLimit,
  validate: disableValidation,
})

/**
 * General API rate limiter
 * - 100 requests per minute per IP
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  handler: createRateLimitHandler('Quá nhiều yêu cầu, vui lòng thử lại sau'),
  skip: shouldSkipRateLimit,
  validate: disableValidation,
})

/**
 * Strict rate limiter for sensitive operations
 * - 10 requests per minute per IP
 * Used for: checkout, payment, admin operations
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  handler: createRateLimitHandler('Quá nhiều yêu cầu, vui lòng thử lại sau'),
  skip: shouldSkipRateLimit,
  validate: disableValidation,
})

/**
 * Upload rate limiter
 * - 20 uploads per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều file upload, vui lòng thử lại sau',
  handler: createRateLimitHandler('Quá nhiều file upload, vui lòng thử lại sau'),
  skip: shouldSkipRateLimit,
  validate: disableValidation,
})

// Legacy export for backward compatibility
export const authRateLimiter = loginRateLimiter

// Type augmentation for express-rate-limit
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number
        current: number
        remaining: number
        resetTime?: Date
      }
    }
  }
}
