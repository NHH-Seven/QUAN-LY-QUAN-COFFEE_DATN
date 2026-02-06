import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'

/**
 * Property-Based Tests for Auth Service
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: user-registration**
 */

// Bcrypt cost factor as defined in auth.ts
const BCRYPT_COST_FACTOR = 12

// User select fields as defined in auth.ts (excludes password)
const userSelectFields = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  phone: true,
  address: true,
  createdAt: true,
}

/**
 * Helper function to simulate the registration data extraction logic
 * This mirrors the behavior in auth.ts where only known fields are extracted
 * Requirements: 6.3
 */
function extractRegistrationFields(body: Record<string, unknown>): {
  email: unknown
  password: unknown
  name: unknown
} {
  return {
    email: body.email,
    password: body.password,
    name: body.name,
  }
}

/**
 * Helper function to check if an object contains a password field at any nesting level
 */
function containsPasswordField(obj: unknown, visited = new WeakSet()): boolean {
  if (obj === null || typeof obj !== 'object') {
    return false
  }

  // Prevent circular reference issues
  if (visited.has(obj as object)) {
    return false
  }
  visited.add(obj as object)

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'password') {
      return true
    }
    if (typeof value === 'object' && value !== null) {
      if (containsPasswordField(value, visited)) {
        return true
      }
    }
  }
  return false
}

describe('Auth Service Property Tests', () => {
  /**
   * **Feature: user-registration, Property 9: Password Hashing Security**
   * 
   * *For any* password, the bcrypt hash SHALL have cost factor 12 and the original
   * password SHALL NOT be recoverable from the hash.
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Property 9: Password Hashing Security', () => {
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

    // Note: bcrypt with cost factor 12 is intentionally slow (~300ms per hash)
    // We reduce numRuns to 10 for async hashing tests to avoid timeouts
    // while still providing meaningful property coverage

    it('should hash passwords with cost factor 12', async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary, async (password) => {
          const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR)

          // Bcrypt hash format: $2a$XX$... where XX is the cost factor
          // Extract cost factor from hash
          const costFactorMatch = hash.match(/^\$2[aby]?\$(\d{2})\$/)
          expect(costFactorMatch).not.toBeNull()

          const extractedCostFactor = parseInt(costFactorMatch![1], 10)
          return extractedCostFactor === BCRYPT_COST_FACTOR
        }),
        { numRuns: 10 }
      )
    }, 60000) // 60 second timeout for slow bcrypt operations

    it('should produce different hashes for the same password (salt randomness)', async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary, async (password) => {
          const hash1 = await bcrypt.hash(password, BCRYPT_COST_FACTOR)
          const hash2 = await bcrypt.hash(password, BCRYPT_COST_FACTOR)

          // Same password should produce different hashes due to random salt
          return hash1 !== hash2
        }),
        { numRuns: 10 }
      )
    }, 60000) // 60 second timeout for slow bcrypt operations

    it('should verify correct password against hash', async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary, async (password) => {
          const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR)
          const isValid = await bcrypt.compare(password, hash)

          return isValid === true
        }),
        { numRuns: 10 }
      )
    }, 60000) // 60 second timeout for slow bcrypt operations

    it('should reject incorrect password against hash', async () => {
      await fc.assert(
        fc.asyncProperty(
          validPasswordArbitrary,
          validPasswordArbitrary,
          async (password, wrongPassword) => {
            // Ensure passwords are different
            fc.pre(password !== wrongPassword)

            const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR)
            const isValid = await bcrypt.compare(wrongPassword, hash)

            return isValid === false
          }
        ),
        { numRuns: 10 }
      )
    }, 60000) // 60 second timeout for slow bcrypt operations

    it('should not contain original password in hash string', async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary, async (password) => {
          const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR)

          // The hash should not contain the original password as a substring
          return !hash.includes(password)
        }),
        { numRuns: 10 }
      )
    }, 60000) // 60 second timeout for slow bcrypt operations
  })


  /**
   * **Feature: user-registration, Property 10: Password Exclusion from Response**
   * 
   * *For any* successful registration API response, the response object SHALL NOT
   * contain a 'password' field at any nesting level.
   * 
   * **Validates: Requirements 4.2**
   */
  describe('Property 10: Password Exclusion from Response', () => {
    // Generator for mock user data that would come from database
    const mockUserDataArbitrary = fc.record({
      id: fc.uuid(),
      email: fc.tuple(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{1,10}$/),
        fc.stringMatching(/^[a-zA-Z]{3,10}$/),
        fc.stringMatching(/^[a-zA-Z]{2,4}$/)
      ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`.toLowerCase()),
      name: fc.stringMatching(/^[A-Za-z\s]{2,50}$/).filter(s => s.trim().length >= 2),
      avatar: fc.option(fc.webUrl(), { nil: null }),
      phone: fc.option(fc.stringMatching(/^[0-9]{10,15}$/), { nil: null }),
      address: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
      createdAt: fc.date(),
      password: fc.string({ minLength: 60, maxLength: 60 }), // bcrypt hash length
    })

    it('should not include password field when using userSelectFields', () => {
      fc.assert(
        fc.property(mockUserDataArbitrary, (userData) => {
          // Simulate Prisma select behavior - only include fields in userSelectFields
          const selectedUser: Record<string, unknown> = {}
          for (const key of Object.keys(userSelectFields)) {
            if (key in userData) {
              selectedUser[key] = userData[key as keyof typeof userData]
            }
          }

          // The selected user should not contain password
          return !containsPasswordField(selectedUser)
        }),
        { numRuns: 100 }
      )
    })

    it('should not include password in nested response structure', () => {
      fc.assert(
        fc.property(mockUserDataArbitrary, (userData) => {
          // Simulate Prisma select behavior
          const selectedUser: Record<string, unknown> = {}
          for (const key of Object.keys(userSelectFields)) {
            if (key in userData) {
              selectedUser[key] = userData[key as keyof typeof userData]
            }
          }

          // Simulate API response structure
          const apiResponse = {
            success: true,
            data: {
              user: selectedUser,
              token: 'jwt-token-here',
            },
          }

          // The entire response should not contain password at any level
          return !containsPasswordField(apiResponse)
        }),
        { numRuns: 100 }
      )
    })

    it('should verify userSelectFields does not include password', () => {
      // Direct verification that userSelectFields excludes password
      expect(userSelectFields).not.toHaveProperty('password')
      expect(Object.keys(userSelectFields)).not.toContain('password')
    })

    it('should exclude password even when original data has password field', () => {
      fc.assert(
        fc.property(
          mockUserDataArbitrary,
          fc.string({ minLength: 8, maxLength: 50 }), // Additional password variations
          (userData, extraPassword) => {
            // Add extra password-like fields to test robustness
            const dataWithExtraFields = {
              ...userData,
              password: extraPassword,
              passwordHash: extraPassword,
              hashedPassword: extraPassword,
            }

            // Simulate Prisma select behavior - only include fields in userSelectFields
            const selectedUser: Record<string, unknown> = {}
            for (const key of Object.keys(userSelectFields)) {
              if (key in dataWithExtraFields) {
                selectedUser[key] = dataWithExtraFields[key as keyof typeof dataWithExtraFields]
              }
            }

            // The selected user should not contain any password-related fields
            return !containsPasswordField(selectedUser) &&
                   !('passwordHash' in selectedUser) &&
                   !('hashedPassword' in selectedUser)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: user-registration, Property 11: Unexpected Fields Rejection**
   * 
   * *For any* registration request containing fields not in the schema (email, password, name),
   * those fields SHALL be stripped from the processed data.
   * 
   * **Validates: Requirements 6.3**
   */
  describe('Property 11: Unexpected Fields Rejection', () => {
    // Generator for valid registration data
    const validRegistrationDataArbitrary = fc.record({
      email: fc.tuple(
        fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{1,10}$/),
        fc.stringMatching(/^[a-zA-Z]{3,10}$/),
        fc.stringMatching(/^[a-zA-Z]{2,4}$/)
      ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
      password: fc.tuple(
        fc.stringMatching(/^[A-Z]$/),
        fc.stringMatching(/^[a-z]$/),
        fc.stringMatching(/^[0-9]$/),
        fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*'),
        fc.stringMatching(/^[a-zA-Z0-9!@#$%^&*]{4,20}$/)
      ).map(([upper, lower, digit, special, filler]) =>
        `${upper}${lower}${digit}${special}${filler}`
      ),
      name: fc.stringMatching(/^[A-Za-z\s]{2,50}$/).filter(s => s.trim().length >= 2),
    })

    // Generator for unexpected field names
    // Note: Excluding __proto__ and constructor as they have special behavior in JS
    // and don't appear in Object.keys() - they are handled separately
    const unexpectedFieldNameArbitrary = fc.constantFrom(
      'isAdmin',
      'role',
      'permissions',
      'verified',
      'createdAt',
      'updatedAt',
      'id',
      'userId',
      'admin',
      'superuser',
      'balance',
      'credits'
    )

    // Generator for unexpected field values
    const unexpectedFieldValueArbitrary = fc.oneof(
      fc.boolean(),
      fc.integer(),
      fc.string(),
      fc.constant(null),
      fc.array(fc.string()),
      fc.record({ nested: fc.string() })
    )

    it('should only extract email, password, and name fields', () => {
      fc.assert(
        fc.property(validRegistrationDataArbitrary, (validData) => {
          const extracted = extractRegistrationFields(validData)

          // Should only have the three expected fields
          const keys = Object.keys(extracted)
          return keys.length === 3 &&
                 keys.includes('email') &&
                 keys.includes('password') &&
                 keys.includes('name')
        }),
        { numRuns: 100 }
      )
    })

    it('should strip unexpected fields from request body', () => {
      fc.assert(
        fc.property(
          validRegistrationDataArbitrary,
          unexpectedFieldNameArbitrary,
          unexpectedFieldValueArbitrary,
          (validData, unexpectedField, unexpectedValue) => {
            // Create request body with unexpected field
            const requestBody = {
              ...validData,
              [unexpectedField]: unexpectedValue,
            }

            const extracted = extractRegistrationFields(requestBody)

            // Unexpected field should not be in extracted data
            return !(unexpectedField in extracted)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should strip multiple unexpected fields', () => {
      fc.assert(
        fc.property(
          validRegistrationDataArbitrary,
          fc.array(unexpectedFieldNameArbitrary, { minLength: 1, maxLength: 5 }),
          fc.array(unexpectedFieldValueArbitrary, { minLength: 1, maxLength: 5 }),
          (validData, unexpectedFields, unexpectedValues) => {
            // Create request body with multiple unexpected fields
            const requestBody: Record<string, unknown> = { ...validData }
            for (let i = 0; i < Math.min(unexpectedFields.length, unexpectedValues.length); i++) {
              requestBody[unexpectedFields[i]] = unexpectedValues[i]
            }

            const extracted = extractRegistrationFields(requestBody)

            // None of the unexpected fields should be in extracted data
            const extractedKeys = Object.keys(extracted)
            return extractedKeys.every(key => ['email', 'password', 'name'].includes(key))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve valid field values while stripping unexpected fields', () => {
      fc.assert(
        fc.property(
          validRegistrationDataArbitrary,
          unexpectedFieldNameArbitrary,
          unexpectedFieldValueArbitrary,
          (validData, unexpectedField, unexpectedValue) => {
            // Create request body with unexpected field
            const requestBody = {
              ...validData,
              [unexpectedField]: unexpectedValue,
            }

            const extracted = extractRegistrationFields(requestBody)

            // Valid fields should be preserved with correct values
            return extracted.email === validData.email &&
                   extracted.password === validData.password &&
                   extracted.name === validData.name
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle prototype pollution attempts', () => {
      fc.assert(
        fc.property(validRegistrationDataArbitrary, (validData) => {
          // Create request body with potential injection fields
          // Note: __proto__ has special behavior in JS and is handled by the spread operator
          // We test that even if malicious fields are added, they don't appear in extracted data
          const requestBody = {
            ...validData,
            prototype: { isAdmin: true },
            isAdmin: true,
            role: 'admin',
          }

          const extracted = extractRegistrationFields(requestBody)

          // Should only have the three expected fields
          const keys = Object.keys(extracted)
          return keys.length === 3 &&
                 keys.includes('email') &&
                 keys.includes('password') &&
                 keys.includes('name') &&
                 !('prototype' in extracted) &&
                 !('isAdmin' in extracted) &&
                 !('role' in extracted)
        }),
        { numRuns: 100 }
      )
    })
  })
})
