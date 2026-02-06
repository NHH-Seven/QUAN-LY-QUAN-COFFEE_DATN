import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'
import { config } from '../config/index.js'

/**
 * Security Headers Middleware using Helmet
 * 
 * Requirements: 6.1 - Security headers for XSS prevention
 * 
 * Helmet helps secure Express apps by setting various HTTP headers:
 * - Content-Security-Policy: Prevents XSS attacks
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - Strict-Transport-Security: Enforces HTTPS
 * - X-XSS-Protection: Legacy XSS protection
 * - Referrer-Policy: Controls referrer information
 */

/**
 * Get allowed origins for CSP
 */
function getAllowedOrigins(): string[] {
  const origins = ['\'self\'']
  
  // Add client URL
  const clientUrl = config.clientUrl
  if (clientUrl && clientUrl !== 'http://localhost:3000') {
    origins.push(clientUrl)
  }
  
  // In development, allow localhost
  if (config.nodeEnv === 'development') {
    origins.push('http://localhost:*')
    origins.push('ws://localhost:*')
  }
  
  return origins
}

/**
 * Configure Helmet with appropriate settings
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: [
        '\'self\'',
        '\'unsafe-inline\'', // Required for some inline scripts
        '\'unsafe-eval\'', // Required for some libraries (remove in production if possible)
      ],
      styleSrc: [
        '\'self\'',
        '\'unsafe-inline\'', // Required for inline styles
        'https://fonts.googleapis.com',
      ],
      imgSrc: [
        '\'self\'',
        'data:',
        'blob:',
        'https:',
        'http://localhost:*', // Development
      ],
      fontSrc: [
        '\'self\'',
        'https://fonts.gstatic.com',
        'data:',
      ],
      connectSrc: [
        '\'self\'',
        ...getAllowedOrigins(),
        'ws://localhost:*', // WebSocket in development
        'wss://*', // WebSocket in production
      ],
      frameSrc: ['\'none\''],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      workerSrc: ['\'self\'', 'blob:'],
      childSrc: ['\'self\'', 'blob:'],
      formAction: ['\'self\''],
      frameAncestors: ['\'none\''],
      baseUri: ['\'self\''],
      upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null,
    },
    reportOnly: config.nodeEnv === 'development', // Report-only in development
  },
  
  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny',
  },
  
  // X-Content-Type-Options: Prevent MIME type sniffing
  noSniff: true,
  
  // Strict-Transport-Security: Enforce HTTPS
  hsts: config.nodeEnv === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  
  // X-XSS-Protection: Legacy XSS protection (deprecated but still useful for older browsers)
  xssFilter: true,
  
  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // X-DNS-Prefetch-Control: Control DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },
  
  // X-Download-Options: Prevent IE from executing downloads
  ieNoOpen: true,
  
  // X-Permitted-Cross-Domain-Policies: Restrict Adobe Flash and PDF
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false, // Disabled to allow loading external resources
  
  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },
  
  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin', // Allow cross-origin requests for API
  },
  
  // Origin-Agent-Cluster
  originAgentCluster: true,
})

/**
 * Additional security headers not covered by Helmet
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Permissions-Policy: Control browser features
  res.setHeader('Permissions-Policy', [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '))
  
  // Cache-Control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  
  next()
}

/**
 * Combined security middleware
 */
export function applySecurityMiddleware(app: {
  use: (middleware: (req: Request, res: Response, next: NextFunction) => void) => void
}) {
  app.use(securityHeaders)
  app.use(additionalSecurityHeaders)
}
