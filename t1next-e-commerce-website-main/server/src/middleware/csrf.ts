import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'
import { config } from '../config/index.js'

/**
 * CSRF Protection Middleware
 * 
 * Requirements: 6.6 - Implement CSRF protection for form submissions
 * 
 * This implementation uses the Double Submit Cookie pattern:
 * 1. Server generates a CSRF token and sends it in a cookie
 * 2. Client includes the token in a header (X-CSRF-Token) for state-changing requests
 * 3. Server validates that the header token matches the cookie token
 * 
 * This approach works well with SPAs and doesn't require server-side session storage.
 * 
 * Note: For JWT-authenticated APIs, CSRF protection is less critical since:
 * - JWT tokens are sent in Authorization header, not cookies
 * - Attackers cannot read the JWT from another domain
 * - The API already validates the JWT for each request
 */

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

/**
 * Generates a cryptographically secure random token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

/**
 * Parse cookies from request header
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  if (!cookieHeader) {
    return cookies
  }
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=')
    if (name) {
      const value = rest.join('=').trim()
      cookies[name.trim()] = decodeURIComponent(value)
    }
  })
  
  return cookies
}

/**
 * CSRF token generation endpoint handler
 * GET /api/csrf-token
 * 
 * Returns a new CSRF token and sets it in a cookie
 */
export function csrfTokenHandler(req: Request, res: Response) {
  const token = generateCsrfToken()
  
  // Set the token in a cookie
  const cookieOptions = [
    `${CSRF_COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${24 * 60 * 60}`, // 24 hours
    'SameSite=Strict',
  ]
  
  if (config.nodeEnv === 'production') {
    cookieOptions.push('Secure')
  }
  
  res.setHeader('Set-Cookie', cookieOptions.join('; '))
  
  res.json({
    success: true,
    data: { token },
  })
}

/**
 * CSRF validation middleware
 * 
 * Validates that the CSRF token in the header matches the one in the cookie.
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE).
 * 
 * Skip validation for:
 * - Safe methods (GET, HEAD, OPTIONS)
 * - API endpoints that use JWT authentication (already protected)
 * - Webhook endpoints
 */
export function csrfProtection(options: {
  skipPaths?: string[]
  skipMethods?: string[]
} = {}) {
  const skipPaths = options.skipPaths || []
  const skipMethods = options.skipMethods || ['GET', 'HEAD', 'OPTIONS']
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip safe methods
    if (skipMethods.includes(req.method)) {
      return next()
    }
    
    // Skip specified paths
    const path = req.path.toLowerCase()
    if (skipPaths.some(p => path.startsWith(p.toLowerCase()))) {
      return next()
    }
    
    // Skip if request has valid JWT (API calls are already authenticated)
    // JWT-based authentication is inherently CSRF-safe because:
    // 1. The token is stored in localStorage/memory, not cookies
    // 2. Attackers cannot read the token from another domain
    // 3. The token must be explicitly added to the Authorization header
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next()
    }
    
    // Parse cookies from header
    const cookies = parseCookies(req.headers.cookie)
    const cookieToken = cookies[CSRF_COOKIE_NAME]
    
    // Get token from header
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined
    
    // Validate tokens
    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token missing',
      })
    }
    
    // Use timing-safe comparison to prevent timing attacks
    if (!timingSafeEqual(cookieToken, headerToken)) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token invalid',
      })
    }
    
    next()
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Express router for CSRF endpoints
 */
import { Router } from 'express'

const csrfRouter = Router()

// GET /api/csrf-token - Get a new CSRF token
csrfRouter.get('/csrf-token', csrfTokenHandler)

export { csrfRouter }
