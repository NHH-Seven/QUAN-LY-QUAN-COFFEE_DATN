import * as dotenv from 'dotenv'

dotenv.config()

/**
 * Parse allowed origins from environment variable
 * Supports comma-separated list of origins
 */
function parseAllowedOrigins(): string[] {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'
  const additionalOrigins = process.env.ALLOWED_ORIGINS || ''
  
  const origins = [clientUrl]
  
  if (additionalOrigins) {
    const additional = additionalOrigins.split(',').map(o => o.trim()).filter(Boolean)
    origins.push(...additional)
  }
  
  return origins
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce',
  },
  
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  /**
   * CORS Configuration
   * Requirements: 6.4 - Configure CORS properly
   */
  cors: {
    // Allowed origins - supports multiple origins
    origin: parseAllowedOrigins(),
    // Allow credentials (cookies, authorization headers)
    credentials: true,
    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Allowed headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-Idempotency-Key',
    ],
    // Headers exposed to the client
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
    // Preflight cache duration (24 hours)
    maxAge: 86400,
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'NHH-Coffee <noreply@nhh-coffee.com>',
  },

  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:noreply@nhh-coffee.com',
  },

  redis: {
    url: process.env.REDIS_URL || '',
  },
}
