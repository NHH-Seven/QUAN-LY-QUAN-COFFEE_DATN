import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import {
  getCacheService,
  CACHE_KEYS,
  CACHE_TTL,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateFlashSaleCache,
  type CacheService,
} from './cache.service.js'

/**
 * Property-Based Tests for Cache Invalidation Consistency
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: platform-completion**
 * 
 * **Property 4: Cache Invalidation Consistency**
 * *For any* data update operation, the corresponding cache entries SHALL be 
 * invalidated before the operation completes.
 * 
 * **Validates: Requirements 5.2**
 */

// Test data types
interface ProductData {
  id: string
  name: string
  price: number
  slug: string
}

interface CategoryData {
  id: string
  name: string
  slug: string
}

// Arbitraries for generating test data
const slugArb = fc.stringMatching(/^[a-z0-9-]{3,30}$/)
const productArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc.integer({ min: 1000, max: 100000000 }),
  slug: slugArb,
})
const categoryArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  slug: slugArb,
})

describe('Property 4: Cache Invalidation Consistency', () => {
  let cache: CacheService

  beforeEach(async () => {
    cache = getCacheService()
    // Flush cache before each test to ensure clean state
    await cache.flush()
  })

  afterEach(async () => {
    // Clean up after each test
    await cache.flush()
  })

  /**
   * **Feature: platform-completion, Property 4: Cache Invalidation Consistency**
   * 
   * *For any* product data, after setting and then invalidating the cache,
   * the cache SHALL return null for that key.
   * 
   * **Validates: Requirements 5.2**
   */
  describe('Product cache invalidation', () => {
    it('should return null after invalidating product detail cache', async () => {
      await fc.assert(
        fc.asyncProperty(productArb, async (product) => {
          const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(product.slug)
          
          // Set cache value
          await cache.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL)
          
          // Verify cache was set
          const cachedBefore = await cache.get<ProductData>(cacheKey)
          expect(cachedBefore).not.toBeNull()
          expect(cachedBefore?.slug).toBe(product.slug)
          
          // Invalidate cache
          await invalidateProductCache(product.slug)
          
          // Verify cache was invalidated
          const cachedAfter = await cache.get<ProductData>(cacheKey)
          expect(cachedAfter).toBeNull()
        }),
        { numRuns: 100 }
      )
    })

    it('should invalidate products list cache when any product is invalidated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(productArb, { minLength: 1, maxLength: 5 }),
          async (products) => {
            // Set products list cache
            await cache.set(CACHE_KEYS.PRODUCTS_LIST, products, CACHE_TTL.PRODUCTS_LIST)
            
            // Verify cache was set
            const cachedBefore = await cache.get<ProductData[]>(CACHE_KEYS.PRODUCTS_LIST)
            expect(cachedBefore).not.toBeNull()
            expect(cachedBefore?.length).toBe(products.length)
            
            // Invalidate product cache (should also invalidate products list)
            await invalidateProductCache()
            
            // Verify products list cache was invalidated
            const cachedAfter = await cache.get<ProductData[]>(CACHE_KEYS.PRODUCTS_LIST)
            expect(cachedAfter).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * *For any* category data, after setting and then invalidating the cache,
   * the cache SHALL return null for that key.
   */
  describe('Category cache invalidation', () => {
    it('should return null after invalidating category cache', async () => {
      await fc.assert(
        fc.asyncProperty(categoryArb, async (category) => {
          const cacheKey = CACHE_KEYS.CATEGORY_PRODUCTS(category.slug)
          
          // Set cache value
          await cache.set(cacheKey, [category], CACHE_TTL.CATEGORIES)
          
          // Verify cache was set
          const cachedBefore = await cache.get<CategoryData[]>(cacheKey)
          expect(cachedBefore).not.toBeNull()
          
          // Invalidate cache
          await invalidateCategoryCache(category.slug)
          
          // Verify cache was invalidated
          const cachedAfter = await cache.get<CategoryData[]>(cacheKey)
          expect(cachedAfter).toBeNull()
        }),
        { numRuns: 100 }
      )
    })

    it('should invalidate categories list cache when any category is invalidated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(categoryArb, { minLength: 1, maxLength: 5 }),
          async (categories) => {
            // Set categories list cache
            await cache.set(CACHE_KEYS.CATEGORIES, categories, CACHE_TTL.CATEGORIES)
            
            // Verify cache was set
            const cachedBefore = await cache.get<CategoryData[]>(CACHE_KEYS.CATEGORIES)
            expect(cachedBefore).not.toBeNull()
            
            // Invalidate category cache
            await invalidateCategoryCache()
            
            // Verify categories list cache was invalidated
            const cachedAfter = await cache.get<CategoryData[]>(CACHE_KEYS.CATEGORIES)
            expect(cachedAfter).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * *For any* flash sale data, after setting and then invalidating the cache,
   * the cache SHALL return null for that key.
   */
  describe('Flash sale cache invalidation', () => {
    it('should return null after invalidating flash sale cache', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(productArb, { minLength: 1, maxLength: 10 }),
          async (flashSaleProducts) => {
            // Set flash sale cache
            await cache.set(CACHE_KEYS.FLASH_SALES, flashSaleProducts, CACHE_TTL.FLASH_SALES)
            
            // Verify cache was set
            const cachedBefore = await cache.get<ProductData[]>(CACHE_KEYS.FLASH_SALES)
            expect(cachedBefore).not.toBeNull()
            expect(cachedBefore?.length).toBe(flashSaleProducts.length)
            
            // Invalidate flash sale cache
            await invalidateFlashSaleCache()
            
            // Verify cache was invalidated
            const cachedAfter = await cache.get<ProductData[]>(CACHE_KEYS.FLASH_SALES)
            expect(cachedAfter).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Round-trip property: Set → Get → Delete → Get should return null
   */
  describe('Cache operation round-trip', () => {
    it('should maintain consistency through set-get-delete-get cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.jsonValue(),
          fc.integer({ min: 60, max: 3600 }),
          async (key, value, ttl) => {
            const cacheKey = `test:${key}`
            
            // Set value
            await cache.set(cacheKey, value, ttl)
            
            // Get should return the value
            const retrieved = await cache.get(cacheKey)
            expect(retrieved).toEqual(value)
            
            // Delete the key
            await cache.del(cacheKey)
            
            // Get should return null after deletion
            const afterDelete = await cache.get(cacheKey)
            expect(afterDelete).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Idempotence property: Multiple invalidations should have the same effect as one
   */
  describe('Invalidation idempotence', () => {
    it('multiple invalidations should be idempotent', async () => {
      await fc.assert(
        fc.asyncProperty(
          productArb,
          fc.integer({ min: 2, max: 5 }),
          async (product, invalidationCount) => {
            const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(product.slug)
            
            // Set cache value
            await cache.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL)
            
            // Invalidate multiple times
            for (let i = 0; i < invalidationCount; i++) {
              await invalidateProductCache(product.slug)
            }
            
            // Cache should still be null (idempotent)
            const cached = await cache.get<ProductData>(cacheKey)
            expect(cached).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Pattern deletion property: delPattern should remove all matching keys
   */
  describe('Pattern deletion consistency', () => {
    it('should delete all keys matching the pattern', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(slugArb, { minLength: 2, maxLength: 5 }),
          async (slugs) => {
            // Ensure unique slugs
            const uniqueSlugs = [...new Set(slugs)]
            if (uniqueSlugs.length < 2) return // Skip if not enough unique slugs
            
            // Set multiple category product caches
            for (const slug of uniqueSlugs) {
              const cacheKey = CACHE_KEYS.CATEGORY_PRODUCTS(slug)
              await cache.set(cacheKey, [{ slug }], CACHE_TTL.CATEGORIES)
            }
            
            // Verify all were set
            for (const slug of uniqueSlugs) {
              const cached = await cache.get(CACHE_KEYS.CATEGORY_PRODUCTS(slug))
              expect(cached).not.toBeNull()
            }
            
            // Delete all category product caches using pattern
            await cache.delPattern('category:*:products')
            
            // Verify all were deleted
            for (const slug of uniqueSlugs) {
              const cached = await cache.get(CACHE_KEYS.CATEGORY_PRODUCTS(slug))
              expect(cached).toBeNull()
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
