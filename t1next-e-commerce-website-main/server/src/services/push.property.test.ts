import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fc from 'fast-check'
import { query, queryOne } from '../db/index.js'

/**
 * Property-Based Tests for Push Subscription Uniqueness
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: platform-completion**
 * 
 * **Property 2: Push Subscription Uniqueness**
 * *For any* user and endpoint combination, there SHALL exist at most one 
 * push subscription record in the database.
 * 
 * **Validates: Requirements 2.1**
 */

// Test data tracking for cleanup
let testUserId: string | null = null
const testEndpoints: string[] = []

// Arbitraries for generating test data
const p256dhArb = fc.base64String({ minLength: 20, maxLength: 100 })
const authArb = fc.base64String({ minLength: 10, maxLength: 50 })

// Generate unique endpoint for each test
function generateUniqueEndpoint(): string {
  const endpoint = `https://push.test.com/test-${Date.now()}-${Math.random().toString(36).substring(7)}`
  testEndpoints.push(endpoint)
  return endpoint
}

// Subscribe a user to push notifications (mimics the actual route logic)
async function subscribeUser(
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string
): Promise<void> {
  // Check if subscription already exists for this endpoint
  const existing = await queryOne<{ id: string; user_id: string }>(
    'SELECT id, user_id FROM push_subscriptions WHERE endpoint = $1',
    [endpoint]
  )

  if (existing) {
    // Update existing subscription (may be from different user or same user re-subscribing)
    await query(
      `UPDATE push_subscriptions 
       SET user_id = $1, p256dh = $2, auth = $3, created_at = NOW()
       WHERE endpoint = $4`,
      [userId, p256dh, auth, endpoint]
    )
  } else {
    // Create new subscription
    await query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [userId, endpoint, p256dh, auth]
    )
  }
}

// Count subscriptions for a given endpoint
async function countSubscriptionsForEndpoint(endpoint: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM push_subscriptions WHERE endpoint = $1',
    [endpoint]
  )
  return parseInt(result?.count || '0', 10)
}

describe('Property 2: Push Subscription Uniqueness', () => {
  beforeAll(async () => {
    // Create a dedicated test user for all tests
    const testEmail = `push-property-test-${Date.now()}@test.com`
    const result = await queryOne<{ id: string }>(
      `INSERT INTO users (id, email, password, name, role)
       VALUES (gen_random_uuid(), $1, 'test-hash', 'Push Test User', 'user')
       RETURNING id`,
      [testEmail]
    )
    if (result) {
      testUserId = result.id
    }
  })

  afterAll(async () => {
    // Clean up test subscriptions
    if (testEndpoints.length > 0) {
      await query(
        'DELETE FROM push_subscriptions WHERE endpoint = ANY($1)',
        [testEndpoints]
      )
    }
    
    // Clean up test user
    if (testUserId) {
      await query('DELETE FROM users WHERE id = $1', [testUserId])
    }
  })

  /**
   * **Feature: platform-completion, Property 2: Push Subscription Uniqueness**
   * 
   * *For any* endpoint, there SHALL exist at most one push subscription record
   * 
   * **Validates: Requirements 2.1**
   */
  describe('Endpoint uniqueness', () => {
    it('should have at most one subscription per endpoint after multiple subscribe attempts', async () => {
      if (!testUserId) {
        throw new Error('Test user not created')
      }
      
      const userId = testUserId
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }), // Number of subscribe attempts
          p256dhArb,
          authArb,
          async (attempts, p256dh, auth) => {
            // Create a unique endpoint for this test run
            const endpoint = generateUniqueEndpoint()
            
            // Subscribe multiple times with the same endpoint
            for (let i = 0; i < attempts; i++) {
              await subscribeUser(userId, endpoint, `${p256dh}-${i}`, `${auth}-${i}`)
            }
            
            // Verify uniqueness: should have exactly 1 subscription for this endpoint
            const count = await countSubscriptionsForEndpoint(endpoint)
            expect(count).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Invariant: Total subscriptions for an endpoint should never exceed 1
   */
  describe('Subscription count invariant', () => {
    it('subscription count for any endpoint should be 0 or 1', async () => {
      if (!testUserId) {
        throw new Error('Test user not created')
      }
      
      const userId = testUserId
      
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // Whether to subscribe or not
          p256dhArb,
          authArb,
          async (shouldSubscribe, p256dh, auth) => {
            // Create a unique endpoint for this test run
            const endpoint = generateUniqueEndpoint()
            
            if (shouldSubscribe) {
              await subscribeUser(userId, endpoint, p256dh, auth)
            }
            
            // Verify invariant: count should be 0 or 1
            const count = await countSubscriptionsForEndpoint(endpoint)
            expect(count).toBeGreaterThanOrEqual(0)
            expect(count).toBeLessThanOrEqual(1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Database constraint verification: UNIQUE constraint on endpoint
   */
  describe('Database constraint enforcement', () => {
    it('should enforce unique endpoint constraint at database level', async () => {
      if (!testUserId) {
        throw new Error('Test user not created')
      }
      
      const userId = testUserId
      
      await fc.assert(
        fc.asyncProperty(
          p256dhArb,
          authArb,
          async (p256dh, auth) => {
            const endpoint = generateUniqueEndpoint()
            
            // First insert should succeed
            await query(
              `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
               VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
              [userId, endpoint, p256dh, auth]
            )
            
            // Second insert with same endpoint should fail due to UNIQUE constraint
            let duplicateInsertFailed = false
            try {
              await query(
                `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
                [userId, endpoint, `${p256dh}-2`, `${auth}-2`]
              )
            } catch (error: unknown) {
              const pgError = error as { code?: string }
              // PostgreSQL error code 23505 = unique_violation
              if (pgError.code === '23505') {
                duplicateInsertFailed = true
              }
            }
            
            expect(duplicateInsertFailed).toBe(true)
            
            // Verify only one subscription exists
            const count = await countSubscriptionsForEndpoint(endpoint)
            expect(count).toBe(1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
