import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  registerSchema,
} from './auth.validation'

/**
 * Property-Based Tests for Auth Validation Schemas
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: user-registration**
 */

describe('Auth Validation Property Tests', () => {
  /**
   * **Feature: user-registration, Property 1: Email Validation Consistency**
   * 
   * *For any* string input, the email validator SHALL accept the input if and only if
   * it matches RFC 5322 email format, and both client and server validators SHALL
   * produce identical results.
   * 
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: Email Validation Consistency', () => {
    // RFC 5322 simplified pattern for valid emails
    // Local part: starts with letter, can contain letters/numbers, no consecutive dots, no trailing dot
    const validEmailArbitrary = fc.tuple(
      fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{1,20}$/), // Simple local part without dots
      fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,15}$/), // Domain
      fc.stringMatching(/^[a-zA-Z]{2,6}$/)              // TLD
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

    it('should accept valid RFC 5322 email formats', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (email) => {
          const result = emailSchema.safeParse(email)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject strings without @ symbol', () => {
      const noAtSymbol = fc.string().filter(s => !s.includes('@') && s.length > 0)
      
      fc.assert(
        fc.property(noAtSymbol, (input) => {
          const result = emailSchema.safeParse(input)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject strings without domain part', () => {
      const noDomain = fc.string().map(s => `${s}@`)
      
      fc.assert(
        fc.property(noDomain, (input) => {
          const result = emailSchema.safeParse(input)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: user-registration, Property 3: Password Strength Validation**
   * 
   * *For any* string input, the password validator SHALL accept the input if and only if
   * it has ≥8 characters AND contains at least one uppercase letter AND one lowercase
   * letter AND one digit AND one special character (!@#$%^&*).
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
   */
  describe('Property 3: Password Strength Validation', () => {
    // Generator for valid passwords meeting all criteria
    const validPasswordArbitrary = fc.tuple(
      fc.stringMatching(/^[A-Z]$/),           // uppercase
      fc.stringMatching(/^[a-z]$/),           // lowercase
      fc.stringMatching(/^[0-9]$/),           // digit
      fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*'), // special char
      fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*]{4,20}$/)  // filler to reach 8+ chars
    ).map(([upper, lower, digit, special, filler]) => 
      `${upper}${lower}${digit}${special}${filler}`
    )

    it('should accept passwords meeting all criteria', () => {
      fc.assert(
        fc.property(validPasswordArbitrary, (password) => {
          const result = passwordSchema.safeParse(password)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject passwords shorter than 8 characters', () => {
      const shortPassword = fc.stringMatching(/^[A-Za-z0-9!@#$%^&*]{1,7}$/)
      
      fc.assert(
        fc.property(shortPassword, (password) => {
          const result = passwordSchema.safeParse(password)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject passwords without uppercase letter', () => {
      // Password with lowercase, digit, special, but no uppercase
      const noUppercase = fc.tuple(
        fc.stringMatching(/^[a-z]{2}$/),
        fc.stringMatching(/^[0-9]{2}$/),
        fc.constantFrom('!@', '#$', '%^', '&*'),
        fc.stringMatching(/^[a-z0-9]{2,10}$/)
      ).map(parts => parts.join(''))
      
      fc.assert(
        fc.property(noUppercase, (password) => {
          const result = passwordSchema.safeParse(password)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject passwords without lowercase letter', () => {
      // Password with uppercase, digit, special, but no lowercase
      const noLowercase = fc.tuple(
        fc.stringMatching(/^[A-Z]{2}$/),
        fc.stringMatching(/^[0-9]{2}$/),
        fc.constantFrom('!@', '#$', '%^', '&*'),
        fc.stringMatching(/^[A-Z0-9]{2,10}$/)
      ).map(parts => parts.join(''))
      
      fc.assert(
        fc.property(noLowercase, (password) => {
          const result = passwordSchema.safeParse(password)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject passwords without digit', () => {
      // Password with uppercase, lowercase, special, but no digit
      const noDigit = fc.tuple(
        fc.stringMatching(/^[A-Z]{2}$/),
        fc.stringMatching(/^[a-z]{2}$/),
        fc.constantFrom('!@', '#$', '%^', '&*'),
        fc.stringMatching(/^[A-Za-z]{2,10}$/)
      ).map(parts => parts.join(''))
      
      fc.assert(
        fc.property(noDigit, (password) => {
          const result = passwordSchema.safeParse(password)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject passwords without special character', () => {
      // Password with uppercase, lowercase, digit, but no special char
      const noSpecial = fc.tuple(
        fc.stringMatching(/^[A-Z]{2}$/),
        fc.stringMatching(/^[a-z]{2}$/),
        fc.stringMatching(/^[0-9]{2}$/),
        fc.stringMatching(/^[A-Za-z0-9]{2,10}$/)
      ).map(parts => parts.join(''))
      
      fc.assert(
        fc.property(noSpecial, (password) => {
          const result = passwordSchema.safeParse(password)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: user-registration, Property 4: Password Confirmation Match**
   * 
   * *For any* two string inputs (password, confirmPassword), the validator SHALL
   * accept if and only if password === confirmPassword.
   * 
   * **Validates: Requirements 2.7**
   */
  describe('Property 4: Password Confirmation Match', () => {
    // Valid password generator
    const validPasswordArbitrary = fc.tuple(
      fc.stringMatching(/^[A-Z]$/),
      fc.stringMatching(/^[a-z]$/),
      fc.stringMatching(/^[0-9]$/),
      fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*'),
      fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*]{4,20}$/)
    ).map(([upper, lower, digit, special, filler]) => 
      `${upper}${lower}${digit}${special}${filler}`
    )

    // Valid name generator
    const validNameArbitrary = fc.stringMatching(/^[A-Za-z\s]{2,50}$/)
      .filter(s => s.trim().length >= 2)

    // Valid email generator
    const validEmailArbitrary = fc.tuple(
      fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{1,10}$/),
      fc.stringMatching(/^[a-zA-Z]{3,10}$/),
      fc.stringMatching(/^[a-zA-Z]{2,4}$/)
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

    it('should accept when password and confirmPassword match', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary,
          validPasswordArbitrary,
          validNameArbitrary,
          (email, password, name) => {
            const result = registerSchema.safeParse({
              email,
              password,
              confirmPassword: password, // Same as password
              name,
            })
            return result.success === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject when password and confirmPassword do not match', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary,
          validPasswordArbitrary,
          validPasswordArbitrary,
          validNameArbitrary,
          (email, password, differentPassword, name) => {
            // Ensure passwords are different
            fc.pre(password !== differentPassword)
            
            const result = registerSchema.safeParse({
              email,
              password,
              confirmPassword: differentPassword,
              name,
            })
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: user-registration, Property 6: Name Length Validation**
   * 
   * *For any* string input, the name validator SHALL reject if length < 2 OR length > 100.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 6: Name Length Validation', () => {
    it('should accept names with length between 2 and 100 characters', () => {
      // Generate names with only letters and spaces, length 2-100
      const validLengthName = fc.integer({ min: 2, max: 100 })
        .chain(len => fc.stringMatching(new RegExp(`^[A-Za-z\\s]{${len}}$`)))
        .filter(s => s.trim().length >= 2) // Ensure not all spaces
      
      fc.assert(
        fc.property(validLengthName, (name) => {
          const result = nameSchema.safeParse(name)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject names shorter than 2 characters', () => {
      const shortName = fc.stringMatching(/^[A-Za-z]{0,1}$/)
      
      fc.assert(
        fc.property(shortName, (name) => {
          const result = nameSchema.safeParse(name)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject names longer than 100 characters', () => {
      // Generate names with 101-150 characters (only letters)
      const longName = fc.integer({ min: 101, max: 150 })
        .chain(len => fc.stringMatching(new RegExp(`^[A-Za-z]{${len}}$`)))
      
      fc.assert(
        fc.property(longName, (name) => {
          const result = nameSchema.safeParse(name)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: user-registration, Property 7: Name Character Validation**
   * 
   * *For any* string input, the name validator SHALL accept if and only if it contains
   * only Unicode letters (including Vietnamese diacritics) and spaces.
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Property 7: Name Character Validation', () => {
    it('should accept names with only letters and spaces', () => {
      const validCharName = fc.stringMatching(/^[A-Za-z\s]{2,50}$/)
        .filter(s => s.trim().length >= 2)
      
      fc.assert(
        fc.property(validCharName, (name) => {
          const result = nameSchema.safeParse(name)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should accept Vietnamese names with diacritics', () => {
      const vietnameseNames = fc.constantFrom(
        'Nguyễn Văn An',
        'Trần Thị Bình',
        'Lê Hoàng Minh',
        'Phạm Đức Anh',
        'Võ Thị Hương',
        'Đặng Quốc Việt',
        'Bùi Thị Lan',
        'Hoàng Minh Tuấn',
        'Ngô Thanh Hà',
        'Đỗ Văn Hùng'
      )
      
      fc.assert(
        fc.property(vietnameseNames, (name) => {
          const result = nameSchema.safeParse(name)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject names containing numbers', () => {
      const nameWithNumbers = fc.tuple(
        fc.stringMatching(/^[A-Za-z]{1,10}$/),
        fc.stringMatching(/^[0-9]+$/),
        fc.stringMatching(/^[A-Za-z]{1,10}$/)
      ).map(parts => parts.join(''))
      
      fc.assert(
        fc.property(nameWithNumbers, (name) => {
          const result = nameSchema.safeParse(name)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject names containing special characters', () => {
      const nameWithSpecial = fc.tuple(
        fc.stringMatching(/^[A-Za-z]{2,10}$/),
        fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '.'),
        fc.stringMatching(/^[A-Za-z]{2,10}$/)
      ).map(parts => parts.join(''))
      
      fc.assert(
        fc.property(nameWithSpecial, (name) => {
          const result = nameSchema.safeParse(name)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })
})
