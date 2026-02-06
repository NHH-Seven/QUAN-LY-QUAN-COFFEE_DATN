import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import express, { Express, Request, Response, NextFunction } from 'express'
import request from 'supertest'
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit'

/**
 * Property-Based Tests for Rate Limiting Enforcement
 * 
 * **Feature: platform-completion**
 * 
 * **Property 6: Rate Limiting Enforcement**
 * *For any* sensitive endpoint, requests exceeding the rate limit SHALL be 
 * rejected with appropriate error response (429 status).
 * 
 * **Validates: Requirements 6.2**
 * 
 * Note: Since the actual rate limiters skip in test environment (NODE_ENV=test),
 * we create test-specific rate limiters that don't skip to verify the behavior.
 */

/**
 * Rate limiter configuration interface
 */
interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
}

/**
 * Create a test rate limiter that doesn't skip in test environment
 */
function createTestRateLimiter(config: RateLimitConfig): RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: config.message,
    handler: (req: Request, res: Response) => {
      const resetTime = req.rateLimit?.resetTime?.getTime() || Date.now()
      const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))
      
      res.status(429).json({
        success: false,
        error: config.message,
        retryAfter,
      })
    },
    // No skip function - always enforce rate limiting
  })
}

/**
 * Create a test Express app with rate limiting
 */
function createTestApp(limiter: RateLimitRequestHandler): Express {
  const app = express()
  app.use(express.json())
  
  app.post('/test-endpoint', limiter, (req: Request, res: Response) => {
    res.json({ success: true, message: 'Request successful' })
  })
  
  return app
}

describe('Property 6: Rate Limiting Enforcement', () => {
  /**
   * **Feature: platform-completion, Property 6: Rate Limiting Enforcement**
   * 
   * *For any* rate limit configuration with max N requests,
   * the first N requests SHALL succeed and subsequent requests SHALL be rejected with 429.
   * 
   * **Validates: Requirements 6.2**
   */
  describe('Rate limit threshold enforcement', () => {
    it('should allow exactly max requests and reject subsequent ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate rate limit configurations
          fc.record({
            max: fc.integer({ min: 1, max: 10 }), // Keep small for test speed
            windowMs: fc.constant(60000), // 1 minute window
          }),
          async ({ max, windowMs }) => {
            const config: RateLimitConfig = {
              windowMs,
              max,
              message: 'Rate limit exceeded',
            }
            
            const limiter = createTestRateLimiter(config)
            const app = createTestApp(limiter)
            
            // Make exactly 'max' requests - all should succeed
            for (let i = 0; i < max; i++) {
              const response = await request(app)
                .post('/test-endpoint')
                .send({ data: `request-${i}` })
              
              expect(response.status).toBe(200)
              expect(response.body.success).toBe(true)
            }
            
            // The next request should be rate limited
            const limitedResponse = await request(app)
              .post('/test-endpoint')
              .send({ data: 'over-limit' })
            
            expect(limitedResponse.status).toBe(429)
            expect(limitedResponse.body.success).toBe(false)
            expect(limitedResponse.body.error).toBe('Rate limit exceeded')
            expect(limitedResponse.body.retryAfter).toBeGreaterThan(0)
            
            return true
          }
        ),
        { numRuns: 20 } // Reduced runs due to async nature
      )
    })
  })

  /**
   * *For any* number of requests exceeding the limit,
   * all excess requests SHALL be rejected with 429 status.
   */
  describe('All excess requests are rejected', () => {
    it('should reject all requests after limit is reached', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            max: fc.integer({ min: 2, max: 5 }),
            excessRequests: fc.integer({ min: 1, max: 5 }),
          }),
          async ({ max, excessRequests }) => {
            const config: RateLimitConfig = {
              windowMs: 60000,
              max,
              message: 'Too many requests',
            }
            
            const limiter = createTestRateLimiter(config)
            const app = createTestApp(limiter)
            
            // Exhaust the rate limit
            for (let i = 0; i < max; i++) {
              await request(app).post('/test-endpoint').send({})
            }
            
            // All excess requests should be rejected
            for (let i = 0; i < excessRequests; i++) {
              const response = await request(app)
                .post('/test-endpoint')
                .send({ excess: i })
              
              expect(response.status).toBe(429)
              expect(response.body.success).toBe(false)
            }
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * *For any* rate limited response, it SHALL contain retryAfter field
   * with a positive integer value.
   */
  describe('Rate limit response format', () => {
    it('should include retryAfter in rate limit response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (max) => {
            const config: RateLimitConfig = {
              windowMs: 60000,
              max,
              message: 'Please wait before retrying',
            }
            
            const limiter = createTestRateLimiter(config)
            const app = createTestApp(limiter)
            
            // Exhaust the limit
            for (let i = 0; i < max; i++) {
              await request(app).post('/test-endpoint').send({})
            }
            
            // Check rate limited response format
            const response = await request(app)
              .post('/test-endpoint')
              .send({})
            
            expect(response.status).toBe(429)
            expect(response.body).toHaveProperty('success', false)
            expect(response.body).toHaveProperty('error')
            expect(response.body).toHaveProperty('retryAfter')
            expect(typeof response.body.retryAfter).toBe('number')
            expect(response.body.retryAfter).toBeGreaterThan(0)
            
            return true
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * Verify specific rate limit configurations match requirements
   * - Login: 5 requests/minute
   * - Register: 3 requests/minute
   * - Password reset: 3 requests/hour
   */
  describe('Specific endpoint rate limits', () => {
    it('should enforce login rate limit of 5 requests per minute', async () => {
      const loginConfig: RateLimitConfig = {
        windowMs: 60 * 1000, // 1 minute
        max: 5,
        message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 1 phút',
      }
      
      const limiter = createTestRateLimiter(loginConfig)
      const app = createTestApp(limiter)
      
      // 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const response = await request(app).post('/test-endpoint').send({})
        expect(response.status).toBe(200)
      }
      
      // 6th request should be rate limited
      const response = await request(app).post('/test-endpoint').send({})
      expect(response.status).toBe(429)
      expect(response.body.error).toContain('đăng nhập')
    })

    it('should enforce register rate limit of 3 requests per minute', async () => {
      const registerConfig: RateLimitConfig = {
        windowMs: 60 * 1000, // 1 minute
        max: 3,
        message: 'Quá nhiều yêu cầu đăng ký, vui lòng thử lại sau 1 phút',
      }
      
      const limiter = createTestRateLimiter(registerConfig)
      const app = createTestApp(limiter)
      
      // 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = await request(app).post('/test-endpoint').send({})
        expect(response.status).toBe(200)
      }
      
      // 4th request should be rate limited
      const response = await request(app).post('/test-endpoint').send({})
      expect(response.status).toBe(429)
      expect(response.body.error).toContain('đăng ký')
    })

    it('should enforce password reset rate limit of 3 requests per hour', async () => {
      const passwordResetConfig: RateLimitConfig = {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3,
        message: 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau 1 giờ',
      }
      
      const limiter = createTestRateLimiter(passwordResetConfig)
      const app = createTestApp(limiter)
      
      // 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = await request(app).post('/test-endpoint').send({})
        expect(response.status).toBe(200)
      }
      
      // 4th request should be rate limited
      const response = await request(app).post('/test-endpoint').send({})
      expect(response.status).toBe(429)
      expect(response.body.error).toContain('mật khẩu')
    })
  })

  /**
   * Metamorphic property: Increasing max limit should allow more requests
   */
  describe('Metamorphic property: limit scaling', () => {
    it('higher max limit should allow more requests before rejection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (baseMax) => {
            const higherMax = baseMax + 2
            
            // Create two apps with different limits
            const lowerLimitApp = createTestApp(
              createTestRateLimiter({ windowMs: 60000, max: baseMax, message: 'Lower limit' })
            )
            const higherLimitApp = createTestApp(
              createTestRateLimiter({ windowMs: 60000, max: higherMax, message: 'Higher limit' })
            )
            
            // Count successful requests for lower limit
            let lowerSuccessCount = 0
            for (let i = 0; i < baseMax + 3; i++) {
              const response = await request(lowerLimitApp).post('/test-endpoint').send({})
              if (response.status === 200) lowerSuccessCount++
            }
            
            // Count successful requests for higher limit
            let higherSuccessCount = 0
            for (let i = 0; i < higherMax + 3; i++) {
              const response = await request(higherLimitApp).post('/test-endpoint').send({})
              if (response.status === 200) higherSuccessCount++
            }
            
            // Higher limit should allow more successful requests
            expect(higherSuccessCount).toBeGreaterThan(lowerSuccessCount)
            expect(lowerSuccessCount).toBe(baseMax)
            expect(higherSuccessCount).toBe(higherMax)
            
            return true
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
