import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property-Based Tests for ProductCard Logic
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: customer-features**
 */

/**
 * Pure function to determine stock status text
 * Extracted from ProductCard component logic
 */
export function getStockStatus(stock: number): { text: string; severity: 'error' | 'warning' | 'info' | 'success' } {
  if (stock === 0) {
    return { text: 'Hết hàng', severity: 'error' }
  }
  if (stock <= 5) {
    return { text: `Chỉ còn ${stock} sản phẩm`, severity: 'warning' }
  }
  if (stock <= 10) {
    return { text: `Chỉ còn ${stock} sản phẩm`, severity: 'info' }
  }
  return { text: 'Còn hàng', severity: 'success' }
}

/**
 * Pure function to calculate discounted price
 */
export function calculateDiscountedPrice(originalPrice: number, discountPercent: number): number {
  if (discountPercent <= 0 || discountPercent > 100) return originalPrice
  return Math.round(originalPrice * (1 - discountPercent / 100))
}

/**
 * Pure function to determine if add to cart should be disabled
 */
export function isAddToCartDisabled(stock: number, isInCart: boolean): boolean {
  return stock === 0 || isInCart
}

/**
 * Pure function to format rating stars (returns count of filled stars)
 */
export function getFilledStarsCount(rating: number): number {
  return Math.floor(Math.max(0, Math.min(5, rating)))
}

describe('ProductCard Property Tests', () => {
  /**
   * **Feature: customer-features, Property: Stock Status Display**
   * 
   * *For any* stock value, the stock status SHALL correctly categorize
   * the product availability.
   */
  describe('Property: Stock Status Display', () => {
    it('should return error severity for zero stock', () => {
      const status = getStockStatus(0)
      expect(status.severity).toBe('error')
      expect(status.text).toBe('Hết hàng')
    })

    it('should return warning severity for stock 1-5', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (stock) => {
            const status = getStockStatus(stock)
            return status.severity === 'warning' && status.text.includes(String(stock))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return info severity for stock 6-10', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 6, max: 10 }),
          (stock) => {
            const status = getStockStatus(stock)
            return status.severity === 'info' && status.text.includes(String(stock))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return success severity for stock > 10', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 11, max: 10000 }),
          (stock) => {
            const status = getStockStatus(stock)
            return status.severity === 'success' && status.text === 'Còn hàng'
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property: Discount Price Calculation**
   * 
   * *For any* original price and discount percentage, the discounted price
   * SHALL be correctly calculated and never exceed the original price.
   */
  describe('Property: Discount Price Calculation', () => {
    it('should calculate correct discounted price', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000000 }),
          fc.integer({ min: 1, max: 99 }),
          (originalPrice, discountPercent) => {
            const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercent)
            const expectedPrice = Math.round(originalPrice * (1 - discountPercent / 100))
            return discountedPrice === expectedPrice
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should never exceed original price', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000000 }),
          fc.integer({ min: 0, max: 100 }),
          (originalPrice, discountPercent) => {
            const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercent)
            return discountedPrice <= originalPrice
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return original price for invalid discount', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000000 }),
          fc.oneof(
            fc.integer({ min: -100, max: 0 }),
            fc.integer({ min: 101, max: 200 })
          ),
          (originalPrice, invalidDiscount) => {
            const discountedPrice = calculateDiscountedPrice(originalPrice, invalidDiscount)
            return discountedPrice === originalPrice
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 0 for 100% discount', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 100000000 }),
          (originalPrice) => {
            const discountedPrice = calculateDiscountedPrice(originalPrice, 100)
            return discountedPrice === 0
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property: Add to Cart Button State**
   * 
   * *For any* stock and cart state, the add to cart button SHALL be
   * disabled when stock is 0 or product is already in cart.
   */
  describe('Property: Add to Cart Button State', () => {
    it('should be disabled when stock is 0', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isInCart) => {
            return isAddToCartDisabled(0, isInCart) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be disabled when product is in cart', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (stock) => {
            return isAddToCartDisabled(stock, true) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should be enabled when stock > 0 and not in cart', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (stock) => {
            return isAddToCartDisabled(stock, false) === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property: Rating Stars Display**
   * 
   * *For any* rating value, the filled stars count SHALL be between 0 and 5.
   */
  describe('Property: Rating Stars Display', () => {
    it('should return filled stars count between 0 and 5', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10, max: 10 }),
          (rating) => {
            const filledStars = getFilledStarsCount(rating)
            return filledStars >= 0 && filledStars <= 5
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should floor the rating value', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 5 }),
          (rating) => {
            const filledStars = getFilledStarsCount(rating)
            return filledStars === Math.floor(rating)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clamp negative ratings to 0', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -100, max: -0.01 }),
          (rating) => {
            const filledStars = getFilledStarsCount(rating)
            return filledStars === 0
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clamp ratings above 5 to 5', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 5.01, max: 100 }),
          (rating) => {
            const filledStars = getFilledStarsCount(rating)
            return filledStars === 5
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
