import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isProductOnSale, calculateSalePrice } from './wishlist-sale.service.js'

/**
 * Property-Based Tests for Wishlist Sale Detection
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: customer-features**
 * 
 * **Property 8: Wishlist Sale Detection**
 * *For any* product in user's wishlist that has discount > 0, 
 * the notification system SHALL identify it as "on sale".
 * 
 * **Validates: Requirements 3.3**
 */

// Types for testing
interface Product {
  id: string
  name: string
  price: number
  originalPrice: number | null
  discount: number
}

interface WishlistItem {
  userId: string
  product: Product
}

// Test implementation of sale detection logic
function detectSaleItems(wishlistItems: WishlistItem[]): WishlistItem[] {
  return wishlistItems.filter(item => isProductOnSale(item.product.discount))
}

// Arbitraries for generating test data
const productIdArb = fc.uuid()
const userIdArb = fc.uuid()
const productNameArb = fc.string({ minLength: 1, maxLength: 100 })
const priceArb = fc.float({ min: 1, max: 100000000, noNaN: true })

// Discount values
const validDiscountArb = fc.integer({ min: 1, max: 99 }) // On sale
const zeroDiscountArb = fc.constant(0) // Not on sale
const invalidDiscountArb = fc.integer({ min: 100, max: 200 }) // Invalid discount

const productOnSaleArb = fc.record({
  id: productIdArb,
  name: productNameArb,
  price: priceArb,
  originalPrice: fc.option(priceArb, { nil: null }),
  discount: validDiscountArb
})

const productNotOnSaleArb = fc.record({
  id: productIdArb,
  name: productNameArb,
  price: priceArb,
  originalPrice: fc.option(priceArb, { nil: null }),
  discount: zeroDiscountArb
})

const wishlistItemOnSaleArb = fc.record({
  userId: userIdArb,
  product: productOnSaleArb
})

const wishlistItemNotOnSaleArb = fc.record({
  userId: userIdArb,
  product: productNotOnSaleArb
})

describe('Property 8: Wishlist Sale Detection', () => {
  /**
   * **Feature: customer-features, Property 8: Wishlist Sale Detection**
   * 
   * *For any* product with discount > 0, isProductOnSale SHALL return true
   * 
   * **Validates: Requirements 3.3**
   */
  describe('Sale detection', () => {
    it('should identify products with discount > 0 as on sale', async () => {
      await fc.assert(
        fc.property(
          validDiscountArb,
          (discount) => {
            const result = isProductOnSale(discount)
            expect(result).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should identify products with discount = 0 as not on sale', async () => {
      await fc.assert(
        fc.property(
          zeroDiscountArb,
          (discount) => {
            const result = isProductOnSale(discount)
            expect(result).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should identify products with negative discount as not on sale', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: -100, max: -1 }),
          (discount) => {
            const result = isProductOnSale(discount)
            expect(result).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Wishlist filtering - only items on sale should be detected
   */
  describe('Wishlist filtering', () => {
    it('should return all items when all are on sale', async () => {
      await fc.assert(
        fc.property(
          fc.array(wishlistItemOnSaleArb, { minLength: 1, maxLength: 10 }),
          (items) => {
            const saleItems = detectSaleItems(items)
            expect(saleItems.length).toBe(items.length)
            
            // All returned items should have discount > 0
            saleItems.forEach(item => {
              expect(item.product.discount).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty when no items are on sale', async () => {
      await fc.assert(
        fc.property(
          fc.array(wishlistItemNotOnSaleArb, { minLength: 1, maxLength: 10 }),
          (items) => {
            const saleItems = detectSaleItems(items)
            expect(saleItems.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly filter mixed sale and non-sale items', async () => {
      await fc.assert(
        fc.property(
          fc.tuple(
            fc.array(wishlistItemOnSaleArb, { minLength: 1, maxLength: 5 }),
            fc.array(wishlistItemNotOnSaleArb, { minLength: 1, maxLength: 5 })
          ),
          ([onSaleItems, notOnSaleItems]) => {
            const allItems = [...onSaleItems, ...notOnSaleItems]
            const saleItems = detectSaleItems(allItems)
            
            // Should only return items that are on sale
            expect(saleItems.length).toBe(onSaleItems.length)
            
            // All returned items should have discount > 0
            saleItems.forEach(item => {
              expect(item.product.discount).toBeGreaterThan(0)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Sale price calculation
   */
  describe('Sale price calculation', () => {
    it('should calculate correct sale price', async () => {
      await fc.assert(
        fc.property(
          fc.float({ min: 100, max: 100000, noNaN: true }),
          fc.integer({ min: 1, max: 99 }),
          (originalPrice, discount) => {
            const salePrice = calculateSalePrice(originalPrice, discount)
            const expectedPrice = originalPrice * (1 - discount / 100)
            
            // Allow small floating point tolerance
            expect(Math.abs(salePrice - expectedPrice)).toBeLessThan(0.01)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return original price when discount is 0', async () => {
      await fc.assert(
        fc.property(
          fc.float({ min: 100, max: 100000, noNaN: true }),
          (originalPrice) => {
            const salePrice = calculateSalePrice(originalPrice, 0)
            expect(salePrice).toBe(originalPrice)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return original price when discount is invalid (> 100)', async () => {
      await fc.assert(
        fc.property(
          fc.float({ min: 100, max: 100000, noNaN: true }),
          fc.integer({ min: 101, max: 200 }),
          (originalPrice, discount) => {
            const salePrice = calculateSalePrice(originalPrice, discount)
            expect(salePrice).toBe(originalPrice)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return original price when discount is negative', async () => {
      await fc.assert(
        fc.property(
          fc.float({ min: 100, max: 100000, noNaN: true }),
          fc.integer({ min: -100, max: -1 }),
          (originalPrice, discount) => {
            const salePrice = calculateSalePrice(originalPrice, discount)
            expect(salePrice).toBe(originalPrice)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Invariant: Sale price should always be less than or equal to original price
   */
  describe('Price invariants', () => {
    it('sale price should never exceed original price', async () => {
      await fc.assert(
        fc.property(
          fc.float({ min: 100, max: 100000, noNaN: true }),
          fc.integer({ min: 0, max: 100 }),
          (originalPrice, discount) => {
            const salePrice = calculateSalePrice(originalPrice, discount)
            expect(salePrice).toBeLessThanOrEqual(originalPrice)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('sale price should be positive when original price is positive', async () => {
      await fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100000, noNaN: true }),
          fc.integer({ min: 0, max: 99 }),
          (originalPrice, discount) => {
            const salePrice = calculateSalePrice(originalPrice, discount)
            expect(salePrice).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
