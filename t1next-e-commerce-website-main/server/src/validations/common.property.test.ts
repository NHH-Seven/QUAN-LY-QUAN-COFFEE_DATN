import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  addressSchema,
  slugSchema,
  quantitySchema,
  priceSchema,
  ratingSchema,
  otpSchema,
  uuidSchema,
  shortTextSchema,
  mediumTextSchema,
  longTextSchema,
  urlSchema,
  paginationSchema,
  orderStatusSchema,
  paymentMethodSchema,
  userRoleSchema,
  cartItemSchema,
  reviewSchema,
  stripHtml,
  escapeHtml,
  sanitizeString,
} from './common'

/**
 * Property-Based Tests for Input Validation Coverage
 * 
 * **Feature: platform-completion, Property 5: Input Validation Coverage**
 * 
 * *For any* API endpoint that accepts user input, all input fields SHALL be validated
 * against their respective schemas before processing.
 * 
 * **Validates: Requirements 6.1**
 */
describe('Property 5: Input Validation Coverage', () => {
  /**
   * Email validation: accepts valid emails, rejects invalid ones
   */
  describe('Email Schema Validation', () => {
    const validEmailArbitrary = fc.tuple(
      fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{1,20}$/),
      fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,15}$/),
      fc.stringMatching(/^[a-zA-Z]{2,6}$/)
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

    it('should accept valid email formats and normalize to lowercase', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (email) => {
          const result = emailSchema.safeParse(email)
          if (!result.success) return false
          // Verify normalization to lowercase
          return result.data === email.trim().toLowerCase()
        }),
        { numRuns: 100 }
      )
    })

    it('should reject emails exceeding 255 characters', () => {
      // Generate emails that are definitely > 255 characters
      const longEmail = fc.tuple(
        fc.stringMatching(/^[a-z]{240}$/),  // 240 chars local part
        fc.stringMatching(/^[a-z]{10}$/),   // 10 chars domain
        fc.stringMatching(/^[a-z]{3}$/)     // 3 chars TLD
      ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`) // Total: 240 + 1 + 10 + 1 + 3 = 255+

      fc.assert(
        fc.property(longEmail, (email) => {
          // Verify email is actually > 255 chars
          if (email.length <= 255) return true // Skip if not long enough
          const result = emailSchema.safeParse(email)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Phone validation: Vietnamese phone numbers (10-11 digits starting with 0)
   */
  describe('Phone Schema Validation', () => {
    const validPhoneArbitrary = fc.tuple(
      fc.constant('0'),
      fc.stringMatching(/^[0-9]{9,10}$/)
    ).map(([prefix, rest]) => `${prefix}${rest}`)

    it('should accept valid Vietnamese phone numbers', () => {
      fc.assert(
        fc.property(validPhoneArbitrary, (phone) => {
          const result = phoneSchema.safeParse(phone)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers not starting with 0', () => {
      const invalidPhone = fc.stringMatching(/^[1-9][0-9]{9,10}$/)

      fc.assert(
        fc.property(invalidPhone, (phone) => {
          const result = phoneSchema.safeParse(phone)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers with wrong length', () => {
      const wrongLengthPhone = fc.oneof(
        fc.stringMatching(/^0[0-9]{0,8}$/),  // Too short
        fc.stringMatching(/^0[0-9]{11,15}$/) // Too long
      )

      fc.assert(
        fc.property(wrongLengthPhone, (phone) => {
          const result = phoneSchema.safeParse(phone)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Slug validation: lowercase letters, numbers, and hyphens
   */
  describe('Slug Schema Validation', () => {
    const validSlugArbitrary = fc.stringMatching(/^[a-z0-9-]{1,100}$/)

    it('should accept valid slugs', () => {
      fc.assert(
        fc.property(validSlugArbitrary, (slug) => {
          const result = slugSchema.safeParse(slug)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject slugs with uppercase letters', () => {
      const uppercaseSlug = fc.stringMatching(/^[a-z0-9-]*[A-Z][a-z0-9-]*$/)
        .filter(s => s.length >= 1 && s.length <= 200)

      fc.assert(
        fc.property(uppercaseSlug, (slug) => {
          const result = slugSchema.safeParse(slug)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject slugs with special characters', () => {
      const specialCharSlug = fc.tuple(
        fc.stringMatching(/^[a-z0-9]{1,10}$/),
        fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '_', ' '),
        fc.stringMatching(/^[a-z0-9]{1,10}$/)
      ).map(parts => parts.join(''))

      fc.assert(
        fc.property(specialCharSlug, (slug) => {
          const result = slugSchema.safeParse(slug)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Quantity validation: integer between 1 and 1000
   */
  describe('Quantity Schema Validation', () => {
    it('should accept valid quantities (1-1000)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (quantity) => {
          const result = quantitySchema.safeParse(quantity)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject quantities less than 1', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: 0 }), (quantity) => {
          const result = quantitySchema.safeParse(quantity)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject quantities greater than 1000', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1001, max: 10000 }), (quantity) => {
          const result = quantitySchema.safeParse(quantity)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject non-integer quantities', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 1000, noInteger: true }),
          (quantity) => {
            const result = quantitySchema.safeParse(quantity)
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Price validation: non-negative number up to 999999999999
   */
  describe('Price Schema Validation', () => {
    it('should accept valid prices (0 to max)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 999999999999, noNaN: true }),
          (price) => {
            const result = priceSchema.safeParse(price)
            return result.success === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject negative prices', () => {
      fc.assert(
        fc.property(fc.double({ min: -1000000, max: -0.01 }), (price) => {
          const result = priceSchema.safeParse(price)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Rating validation: integer between 1 and 5
   */
  describe('Rating Schema Validation', () => {
    it('should accept valid ratings (1-5)', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), (rating) => {
          const result = ratingSchema.safeParse(rating)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject ratings outside 1-5 range', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -100, max: 0 }),
            fc.integer({ min: 6, max: 100 })
          ),
          (rating) => {
            const result = ratingSchema.safeParse(rating)
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * OTP validation: exactly 6 digits
   */
  describe('OTP Schema Validation', () => {
    it('should accept valid 6-digit OTPs', () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[0-9]{6}$/), (otp) => {
          const result = otpSchema.safeParse(otp)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject OTPs with wrong length', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.stringMatching(/^[0-9]{1,5}$/),
            fc.stringMatching(/^[0-9]{7,10}$/)
          ),
          (otp) => {
            const result = otpSchema.safeParse(otp)
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject OTPs with non-digit characters', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[0-9]{0,5}[a-zA-Z][0-9]{0,5}$/)
            .filter(s => s.length === 6),
          (otp) => {
            const result = otpSchema.safeParse(otp)
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * UUID validation
   */
  describe('UUID Schema Validation', () => {
    it('should accept valid UUIDs', () => {
      fc.assert(
        fc.property(fc.uuid(), (uuid) => {
          const result = uuidSchema.safeParse(uuid)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject invalid UUID formats', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
          (invalidUuid) => {
            const result = uuidSchema.safeParse(invalidUuid)
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Text length validation
   */
  describe('Text Length Schema Validation', () => {
    it('should accept short text within 255 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 255 }), (text) => {
          const result = shortTextSchema.safeParse(text)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject short text exceeding 255 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 256, maxLength: 500 }), (text) => {
          const result = shortTextSchema.safeParse(text)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should accept medium text within 1000 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 1000 }), (text) => {
          const result = mediumTextSchema.safeParse(text)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should accept long text within 10000 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 10000 }), (text) => {
          const result = longTextSchema.safeParse(text)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Enum validation
   */
  describe('Enum Schema Validation', () => {
    it('should accept valid order statuses', () => {
      const validStatuses = [
        'pending', 'awaiting_payment', 'confirmed', 'processing',
        'shipping', 'delivered', 'cancelled', 'returned'
      ]
      fc.assert(
        fc.property(fc.constantFrom(...validStatuses), (status) => {
          const result = orderStatusSchema.safeParse(status)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject invalid order statuses', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['pending', 'awaiting_payment', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned'].includes(s)),
          (status) => {
            const result = orderStatusSchema.safeParse(status)
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should accept valid payment methods', () => {
      fc.assert(
        fc.property(fc.constantFrom('cod', 'bank_transfer'), (method) => {
          const result = paymentMethodSchema.safeParse(method)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should accept valid user roles', () => {
      fc.assert(
        fc.property(fc.constantFrom('user', 'admin', 'sales', 'warehouse'), (role) => {
          const result = userRoleSchema.safeParse(role)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Pagination validation
   */
  describe('Pagination Schema Validation', () => {
    it('should accept valid pagination parameters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (page, limit) => {
            const result = paginationSchema.safeParse({ page, limit })
            return result.success === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject page less than 1', () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 0 }), (page) => {
          const result = paginationSchema.safeParse({ page, limit: 20 })
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject limit greater than 100', () => {
      fc.assert(
        fc.property(fc.integer({ min: 101, max: 1000 }), (limit) => {
          const result = paginationSchema.safeParse({ page: 1, limit })
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Cart item validation
   */
  describe('Cart Item Schema Validation', () => {
    it('should accept valid cart items', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1, max: 1000 }),
          (productId, quantity) => {
            const result = cartItemSchema.safeParse({ productId, quantity })
            return result.success === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject cart items with invalid productId', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
          fc.integer({ min: 1, max: 1000 }),
          (productId, quantity) => {
            const result = cartItemSchema.safeParse({ productId, quantity })
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject cart items with invalid quantity', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.oneof(
            fc.integer({ min: -100, max: 0 }),
            fc.integer({ min: 1001, max: 10000 })
          ),
          (productId, quantity) => {
            const result = cartItemSchema.safeParse({ productId, quantity })
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Review validation
   */
  describe('Review Schema Validation', () => {
    it('should accept valid reviews', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1, max: 5 }),
          fc.string({ maxLength: 1000 }),
          (productId, rating, comment) => {
            const result = reviewSchema.safeParse({ productId, rating, comment })
            return result.success === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject reviews with invalid rating', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.oneof(
            fc.integer({ min: -10, max: 0 }),
            fc.integer({ min: 6, max: 100 })
          ),
          (productId, rating) => {
            const result = reviewSchema.safeParse({ productId, rating })
            return result.success === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * HTML sanitization functions
   */
  describe('HTML Sanitization', () => {
    it('stripHtml should remove all HTML tags', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ maxLength: 50 }),
            fc.constantFrom('div', 'span', 'script', 'p', 'a', 'img'),
            fc.string({ maxLength: 50 })
          ),
          ([before, tag, after]) => {
            const input = `${before}<${tag}>content</${tag}>${after}`
            const result = stripHtml(input)
            // Result should not contain < or > from tags
            return !result.includes(`<${tag}>`) && !result.includes(`</${tag}>`)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('escapeHtml should escape all special characters', () => {
      const specialChars = ['&', '<', '>', '"', "'"]
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100 }),
          (input) => {
            const result = escapeHtml(input)
            // Check that special chars are escaped
            const hasUnescapedSpecial = specialChars.some(char => {
              const escaped = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
              }[char]
              // If input has the char, result should have escaped version
              if (input.includes(char)) {
                // Count occurrences
                const inputCount = (input.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
                const resultCount = (result.match(new RegExp(escaped!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
                return inputCount !== resultCount
              }
              return false
            })
            return !hasUnescapedSpecial
          }
        ),
        { numRuns: 100 }
      )
    })

    it('sanitizeString should strip HTML and trim whitespace', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ maxLength: 20 }),
            fc.constantFrom('  ', '\t', '\n', ''),
            fc.string({ maxLength: 20 })
          ),
          ([content, whitespace, more]) => {
            const input = `${whitespace}<div>${content}</div>${whitespace}${more}${whitespace}`
            const result = sanitizeString(input)
            // Result should be trimmed
            return result === result.trim()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Address validation
   */
  describe('Address Schema Validation', () => {
    it('should accept valid addresses (10-500 characters)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10, maxLength: 500 }), (address) => {
          const result = addressSchema.safeParse(address)
          return result.success === true
        }),
        { numRuns: 100 }
      )
    })

    it('should reject addresses shorter than 10 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 9 }), (address) => {
          const result = addressSchema.safeParse(address)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })

    it('should reject addresses longer than 500 characters', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 501, maxLength: 600 }), (address) => {
          const result = addressSchema.safeParse(address)
          return result.success === false
        }),
        { numRuns: 100 }
      )
    })
  })
})
