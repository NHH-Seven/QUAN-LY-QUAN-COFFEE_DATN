import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property-Based Tests for CheckoutForm Validation Logic
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: customer-features**
 */

/**
 * Pure function to validate recipient name
 * Returns error message or null if valid
 */
export function validateRecipientName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Vui lòng nhập tên người nhận'
  }
  if (trimmed.length < 2) {
    return 'Tên phải có ít nhất 2 ký tự'
  }
  if (trimmed.length > 100) {
    return 'Tên không được quá 100 ký tự'
  }
  return null
}

/**
 * Pure function to validate Vietnamese phone number
 * Returns error message or null if valid
 */
export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) {
    return 'Vui lòng nhập số điện thoại'
  }
  // Vietnamese phone number pattern: starts with 0, followed by 9-10 digits
  const phoneRegex = /^0\d{9,10}$/
  if (!phoneRegex.test(trimmed)) {
    return 'Số điện thoại không hợp lệ (VD: 0912345678)'
  }
  return null
}

/**
 * Pure function to validate shipping address
 * Returns error message or null if valid
 */
export function validateAddress(address: string): string | null {
  const trimmed = address.trim()
  if (!trimmed) {
    return 'Vui lòng nhập địa chỉ giao hàng'
  }
  if (trimmed.length < 10) {
    return 'Địa chỉ phải có ít nhất 10 ký tự'
  }
  if (trimmed.length > 500) {
    return 'Địa chỉ không được quá 500 ký tự'
  }
  return null
}

/**
 * Pure function to validate entire checkout form
 * Returns object with field errors
 */
export function validateCheckoutForm(data: {
  recipientName: string
  phone: string
  address: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  
  const nameError = validateRecipientName(data.recipientName)
  if (nameError) errors.recipientName = nameError
  
  const phoneError = validatePhone(data.phone)
  if (phoneError) errors.phone = phoneError
  
  const addressError = validateAddress(data.address)
  if (addressError) errors.address = addressError
  
  return errors
}

/**
 * Pure function to check if form is valid
 */
export function isFormValid(errors: Record<string, string>): boolean {
  return Object.keys(errors).length === 0
}

// Arbitraries for generating test data
const validVietnamesePhoneArb = fc.stringMatching(/^0[3-9]\d{8}$/)
const invalidPhoneArb = fc.oneof(
  fc.constant(''),
  fc.stringMatching(/^[1-9]\d{9}$/), // Doesn't start with 0
  fc.stringMatching(/^0\d{0,7}$/),   // Too short
  fc.stringMatching(/^0\d{12,}$/),   // Too long
  fc.stringMatching(/^[a-zA-Z]+$/)   // Letters only
)

const validNameArb = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2)
const invalidNameArb = fc.oneof(
  fc.constant(''),
  fc.constant(' '),
  fc.constant('A'),
  fc.string({ minLength: 101, maxLength: 150 })
)

const validAddressArb = fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10)
const invalidAddressArb = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 9 }),
  fc.string({ minLength: 501, maxLength: 600 })
)

describe('CheckoutForm Property Tests', () => {
  /**
   * **Feature: customer-features, Property: Recipient Name Validation**
   * 
   * *For any* recipient name, the validation SHALL return null for valid names
   * and an error message for invalid names.
   */
  describe('Property: Recipient Name Validation', () => {
    it('should accept valid names (2-100 chars)', () => {
      fc.assert(
        fc.property(validNameArb, (name) => {
          return validateRecipientName(name) === null
        }),
        { numRuns: 100 }
      )
    })

    it('should reject empty names', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', ' ', '  ', '\t', '\n'),
          (name) => {
            const error = validateRecipientName(name)
            return error !== null && error.includes('nhập tên')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject names shorter than 2 chars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1 }),
          (name) => {
            const error = validateRecipientName(name)
            return error !== null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject names longer than 100 chars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (name) => {
            const error = validateRecipientName(name)
            return error !== null && error.includes('100')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property: Phone Number Validation**
   * 
   * *For any* phone number, the validation SHALL return null for valid
   * Vietnamese phone numbers and an error message for invalid ones.
   */
  describe('Property: Phone Number Validation', () => {
    it('should accept valid Vietnamese phone numbers', () => {
      fc.assert(
        fc.property(validVietnamesePhoneArb, (phone) => {
          return validatePhone(phone) === null
        }),
        { numRuns: 100 }
      )
    })

    it('should reject empty phone numbers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', ' ', '  '),
          (phone) => {
            const error = validatePhone(phone)
            return error !== null && error.includes('nhập số điện thoại')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers not starting with 0', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[1-9]\d{9}$/),
          (phone) => {
            const error = validatePhone(phone)
            return error !== null && error.includes('không hợp lệ')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject phone numbers with wrong length', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.stringMatching(/^0\d{0,7}$/),
            fc.stringMatching(/^0\d{12,15}$/)
          ),
          (phone) => {
            const error = validatePhone(phone)
            return error !== null
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property: Address Validation**
   * 
   * *For any* address, the validation SHALL return null for valid addresses
   * (10-500 chars) and an error message for invalid ones.
   */
  describe('Property: Address Validation', () => {
    it('should accept valid addresses (10-500 chars)', () => {
      fc.assert(
        fc.property(validAddressArb, (address) => {
          return validateAddress(address) === null
        }),
        { numRuns: 100 }
      )
    })

    it('should reject empty addresses', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', ' ', '  '),
          (address) => {
            const error = validateAddress(address)
            return error !== null && error.includes('nhập địa chỉ')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject addresses shorter than 10 chars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 9 }).filter(s => s.trim().length > 0 && s.trim().length < 10),
          (address) => {
            const error = validateAddress(address)
            return error !== null && error.includes('10')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject addresses longer than 500 chars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 501, maxLength: 600 }),
          (address) => {
            const error = validateAddress(address)
            return error !== null && error.includes('500')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property: Form Validation Completeness**
   * 
   * *For any* form data, the validation SHALL check all required fields
   * and return appropriate errors.
   */
  describe('Property: Form Validation Completeness', () => {
    it('should return no errors for valid form data', () => {
      fc.assert(
        fc.property(
          fc.record({
            recipientName: validNameArb,
            phone: validVietnamesePhoneArb,
            address: validAddressArb
          }),
          (formData) => {
            const errors = validateCheckoutForm(formData)
            return Object.keys(errors).length === 0
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return errors for all invalid fields', () => {
      const errors = validateCheckoutForm({
        recipientName: '',
        phone: '',
        address: ''
      })
      expect(errors.recipientName).toBeDefined()
      expect(errors.phone).toBeDefined()
      expect(errors.address).toBeDefined()
    })

    it('should validate each field independently', () => {
      fc.assert(
        fc.property(
          fc.record({
            recipientName: fc.oneof(validNameArb, invalidNameArb),
            phone: fc.oneof(validVietnamesePhoneArb, invalidPhoneArb),
            address: fc.oneof(validAddressArb, invalidAddressArb)
          }),
          (formData) => {
            const errors = validateCheckoutForm(formData)
            
            // Check each field validation is independent
            const nameValid = validateRecipientName(formData.recipientName) === null
            const phoneValid = validatePhone(formData.phone) === null
            const addressValid = validateAddress(formData.address) === null
            
            const hasNameError = 'recipientName' in errors
            const hasPhoneError = 'phone' in errors
            const hasAddressError = 'address' in errors
            
            return (
              nameValid === !hasNameError &&
              phoneValid === !hasPhoneError &&
              addressValid === !hasAddressError
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property: Form Valid State**
   * 
   * *For any* errors object, isFormValid SHALL return true only when
   * there are no errors.
   */
  describe('Property: Form Valid State', () => {
    it('should return true for empty errors object', () => {
      expect(isFormValid({})).toBe(true)
    })

    it('should return false for non-empty errors object', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.stringMatching(/^[a-zA-Z]+$/),
            fc.string({ minLength: 1 }),
            { minKeys: 1, maxKeys: 5 }
          ),
          (errors) => {
            return isFormValid(errors) === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
