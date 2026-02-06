import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { detectSpecDifferences } from './specs-diff'

/**
 * Property-Based Tests for Specs Diff Detection
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: customer-features**
 */

// Arbitrary for spec key (alphanumeric string)
const specKeyArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{0,20}$/)

// Arbitrary for spec value (non-empty string)
const specValueArb = fc.string({ minLength: 1, maxLength: 50 })

// Arbitrary for a specs object
const specsArb = fc.dictionary(specKeyArb, specValueArb, { minKeys: 0, maxKeys: 10 })

// Arbitrary for a product-like object with specs
const productWithSpecsArb = fc.record({
  specs: fc.option(specsArb, { nil: undefined })
})

describe('Specs Diff Property Tests', () => {
  /**
   * **Feature: customer-features, Property 5: Compare Specs Diff Detection**
   * 
   * *For any* two products with different spec values for the same key, 
   * the comparison system SHALL identify and return those differences.
   * 
   * **Validates: Requirements 2.4**
   */
  describe('Property 5: Compare Specs Diff Detection', () => {
    it('should detect differences when same key has different values', () => {
      fc.assert(
        fc.property(
          specKeyArb,
          specValueArb,
          specValueArb,
          (key, value1, value2) => {
            // Skip if values are the same
            if (value1 === value2) return true

            const products = [
              { specs: { [key]: value1 } },
              { specs: { [key]: value2 } }
            ]

            const differences = detectSpecDifferences(products)

            // The key should be marked as different
            return differences[key] === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not detect differences when same key has same values', () => {
      fc.assert(
        fc.property(
          specKeyArb,
          specValueArb,
          (key, value) => {
            const products = [
              { specs: { [key]: value } },
              { specs: { [key]: value } }
            ]

            const differences = detectSpecDifferences(products)

            // The key should NOT be marked as different
            return differences[key] === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should detect differences when key exists in one product but not another', () => {
      fc.assert(
        fc.property(
          specKeyArb,
          specValueArb,
          (key, value) => {
            const products = [
              { specs: { [key]: value } },
              { specs: {} }
            ]

            const differences = detectSpecDifferences(products)

            // The key should be marked as different (one has it, one doesn't)
            return differences[key] === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle products with undefined specs', () => {
      fc.assert(
        fc.property(
          specKeyArb,
          specValueArb,
          (key, value) => {
            const products = [
              { specs: { [key]: value } },
              { specs: undefined }
            ]

            const differences = detectSpecDifferences(products)

            // The key should be marked as different
            return differences[key] === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty object for single product', () => {
      fc.assert(
        fc.property(
          productWithSpecsArb,
          (product) => {
            const differences = detectSpecDifferences([product])
            return Object.keys(differences).length === 0
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty object for empty product list', () => {
      const differences = detectSpecDifferences([])
      expect(Object.keys(differences).length).toBe(0)
    })

    it('should correctly identify all different keys in complex specs', () => {
      fc.assert(
        fc.property(
          specsArb,
          specsArb,
          (specs1, specs2) => {
            const products = [{ specs: specs1 }, { specs: specs2 }]
            const differences = detectSpecDifferences(products)

            // Get all unique keys
            const allKeys = new Set([
              ...Object.keys(specs1 || {}),
              ...Object.keys(specs2 || {})
            ])

            // For each key, verify the difference detection is correct
            for (const key of allKeys) {
              const val1 = specs1?.[key]
              const val2 = specs2?.[key]
              
              const shouldBeDifferent = val1 !== val2
              const isDifferent = differences[key]

              if (shouldBeDifferent !== isDifferent) {
                return false
              }
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle multiple products with mixed differences', () => {
      fc.assert(
        fc.property(
          fc.array(productWithSpecsArb, { minLength: 2, maxLength: 4 }),
          (products) => {
            const differences = detectSpecDifferences(products)

            // Collect all keys
            const allKeys = new Set<string>()
            products.forEach(p => {
              if (p.specs) {
                Object.keys(p.specs).forEach(k => allKeys.add(k))
              }
            })

            // For each key, verify the logic
            for (const key of allKeys) {
              const values = products.map(p => p.specs?.[key])
              const definedValues = values.filter(v => v !== undefined)
              const uniqueDefinedValues = new Set(definedValues)
              
              // Should be different if:
              // 1. More than one unique defined value, OR
              // 2. Some products have the key and some don't
              const hasUndefined = values.some(v => v === undefined)
              const hasDefined = definedValues.length > 0
              const expectedDifferent = uniqueDefinedValues.size > 1 || (hasUndefined && hasDefined)

              if (differences[key] !== expectedDifferent) {
                return false
              }
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
