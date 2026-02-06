import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { calculateStrength } from './password-strength'

/**
 * Property-Based Tests for Password Strength Calculation
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: user-registration**
 */

describe('Password Strength Property Tests', () => {
  /**
   * **Feature: user-registration, Property 5: Password Strength Calculation**
   * 
   * *For any* password string, the strength indicator SHALL return a value between 0-4
   * that increases monotonically as more criteria are met (length, uppercase, lowercase,
   * digit, special char).
   * 
   * **Validates: Requirements 2.8**
   */
  describe('Property 5: Password Strength Calculation', () => {
    it('should always return a value between 0 and 4', () => {
      fc.assert(
        fc.property(fc.string(), (password) => {
          const strength = calculateStrength(password)
          return strength >= 0 && strength <= 4
        }),
        { numRuns: 100 }
      )
    })

    it('should return 0 for empty password', () => {
      expect(calculateStrength('')).toBe(0)
    })

    it('should return higher strength when more criteria are met', () => {
      // Test that adding criteria increases or maintains strength
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (basePassword) => {
            const base = calculateStrength(basePassword)
            
            // Adding uppercase should not decrease strength
            const withUpper = calculateStrength(basePassword + 'A')
            expect(withUpper).toBeGreaterThanOrEqual(base)
            
            // Adding lowercase should not decrease strength
            const withLower = calculateStrength(basePassword + 'a')
            expect(withLower).toBeGreaterThanOrEqual(base)
            
            // Adding digit should not decrease strength
            const withDigit = calculateStrength(basePassword + '1')
            expect(withDigit).toBeGreaterThanOrEqual(base)
            
            // Adding special char should not decrease strength
            const withSpecial = calculateStrength(basePassword + '!')
            expect(withSpecial).toBeGreaterThanOrEqual(base)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 4 (maximum) when all 5 criteria are met', () => {
      // Generator for passwords meeting all criteria
      const allCriteriaPassword = fc.tuple(
        fc.stringMatching(/^[A-Z]$/),           // uppercase
        fc.stringMatching(/^[a-z]$/),           // lowercase
        fc.stringMatching(/^[0-9]$/),           // digit
        fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*'), // special char
        fc.stringMatching(/^[a-zA-Z0-9]{4,20}$/)  // filler to reach 8+ chars
      ).map(([upper, lower, digit, special, filler]) => 
        `${upper}${lower}${digit}${special}${filler}`
      )

      fc.assert(
        fc.property(allCriteriaPassword, (password) => {
          const strength = calculateStrength(password)
          return strength === 4
        }),
        { numRuns: 100 }
      )
    })

    it('should return strength based on criteria count', () => {
      // 0 criteria = 0
      expect(calculateStrength('')).toBe(0)
      
      // 1 criterion (only lowercase, short) = 1
      expect(calculateStrength('abc')).toBe(1)
      
      // 2 criteria (lowercase + digit, short) = 1
      expect(calculateStrength('abc123')).toBe(1)
      
      // 3 criteria (lowercase + digit + length) = 2
      expect(calculateStrength('abcdefgh1')).toBe(2)
      
      // 4 criteria (lowercase + uppercase + digit + length) = 3
      expect(calculateStrength('Abcdefgh1')).toBe(3)
      
      // 5 criteria (all) = 4
      expect(calculateStrength('Abcdefgh1!')).toBe(4)
    })

    it('should correctly identify each criterion independently', () => {
      // Specific tests for each criterion
      // Only length (8+ chars of spaces)
      expect(calculateStrength('        ')).toBe(1) // length only
      
      // Only uppercase
      expect(calculateStrength('ABC')).toBe(1)
      
      // Only lowercase
      expect(calculateStrength('abc')).toBe(1)
      
      // Only digit
      expect(calculateStrength('123')).toBe(1)
      
      // Only special
      expect(calculateStrength('!@#')).toBe(1)
    })

    it('should handle passwords with all special characters correctly', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*']
      
      fc.assert(
        fc.property(
          fc.constantFrom(...specialChars),
          (special) => {
            // Password with uppercase, lowercase, digit, and this special char, 8+ length
            const password = `Aa1${special}xxxx`
            const strength = calculateStrength(password)
            return strength === 4
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not count criteria from characters outside the defined special set', () => {
      // Characters like () {} [] are NOT in the special char set !@#$%^&*
      const passwordWithOtherSpecial = 'Aa1(xxxx' // has ( instead of !@#$%^&*
      const strength = calculateStrength(passwordWithOtherSpecial)
      // Should be 3 (length + upper + lower + digit) but NOT special
      expect(strength).toBe(3)
    })
  })
})
