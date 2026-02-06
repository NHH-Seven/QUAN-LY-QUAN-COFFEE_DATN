import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  welcomeTemplate,
  orderConfirmationTemplate,
  orderStatusTemplate,
  passwordResetTemplate,
  promotionalTemplate,
  type WelcomeEmailData,
  type OrderConfirmationData,
  type OrderStatusData,
  type PasswordResetData,
  type PromotionalEmailData,
  type ProductPreview,
} from './index.js'

/**
 * Property-Based Tests for Email Templates
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: platform-completion**
 */

// Arbitraries for generating test data
const nameArb = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0 && !s.includes('<') && !s.includes('>'))
const emailArb = fc.emailAddress()
const urlArb = fc.webUrl()
const otpArb = fc.stringMatching(/^[0-9]{6}$/)
const phoneArb = fc.stringMatching(/^[0-9]{10,11}$/)
const addressArb = fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0)
const orderIdArb = fc.uuid()
const priceArb = fc.integer({ min: 1000, max: 100000000 })
const quantityArb = fc.integer({ min: 1, max: 100 })

const paymentMethodArb = fc.constantFrom<'cod' | 'bank_transfer' | 'credit_card' | 'momo' | 'vnpay'>(
  'cod', 'bank_transfer', 'credit_card', 'momo', 'vnpay'
)

const orderStatusArb = fc.constantFrom<'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned'>(
  'confirmed', 'shipping', 'delivered', 'cancelled', 'returned'
)

const promoTypeArb = fc.constantFrom<'flash_sale' | 'promotion' | 'wishlist_sale' | 'new_arrival'>(
  'flash_sale', 'promotion', 'wishlist_sale', 'new_arrival'
)

// Product preview arbitrary
const productPreviewArb: fc.Arbitrary<ProductPreview> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  image: urlArb,
  originalPrice: priceArb,
  salePrice: priceArb,
  discountPercent: fc.option(fc.integer({ min: 1, max: 90 }), { nil: undefined }),
  url: fc.option(urlArb, { nil: undefined }),
})

// Order item arbitrary
const orderItemArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  image: fc.option(urlArb, { nil: undefined }),
  quantity: quantityArb,
  price: priceArb,
  variant: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
})

/**
 * **Property 1: Email Template Completeness**
 * *For any* email template type and valid input data, the generated email SHALL contain 
 * both HTML and plain text versions with all required fields populated.
 * 
 * **Validates: Requirements 1.1-1.6**
 */
describe('Property 1: Email Template Completeness', () => {
  /**
   * **Feature: platform-completion, Property 1: Email Template Completeness**
   * 
   * Tests that welcome email templates contain both HTML and plain text versions
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Welcome Email Template (Requirement 1.1)', () => {
    it('should generate both HTML and plain text versions with required fields', async () => {
      const welcomeDataArb: fc.Arbitrary<WelcomeEmailData> = fc.record({
        name: nameArb,
        email: emailArb,
        verifyUrl: fc.option(urlArb, { nil: undefined }),
        verifyOtp: fc.option(otpArb, { nil: undefined }),
      })

      await fc.assert(
        fc.property(welcomeDataArb, (data) => {
          const result = welcomeTemplate(data)

          // Must have subject, html, and text
          expect(result.subject).toBeDefined()
          expect(result.subject.length).toBeGreaterThan(0)
          expect(result.html).toBeDefined()
          expect(result.html.length).toBeGreaterThan(0)
          expect(result.text).toBeDefined()
          expect(result.text.length).toBeGreaterThan(0)

          // HTML should be valid HTML structure
          expect(result.html).toContain('<!DOCTYPE html>')
          expect(result.html).toContain('<html')
          expect(result.html).toContain('</html>')

          // Should contain recipient name in both versions
          expect(result.html).toContain(data.name)
          expect(result.text).toContain(data.name)

          // Should contain email in both versions
          expect(result.html).toContain(data.email)
          expect(result.text).toContain(data.email)

          // If verifyOtp provided, should be in both versions
          if (data.verifyOtp) {
            expect(result.html).toContain(data.verifyOtp)
            expect(result.text).toContain(data.verifyOtp)
          }

          // If verifyUrl provided, should be in both versions
          if (data.verifyUrl) {
            expect(result.html).toContain(data.verifyUrl)
            expect(result.text).toContain(data.verifyUrl)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: platform-completion, Property 1: Email Template Completeness**
   * 
   * Tests that order confirmation email templates contain both HTML and plain text versions
   * 
   * **Validates: Requirements 1.2**
   */
  describe('Order Confirmation Email Template (Requirement 1.2)', () => {
    it('should generate both HTML and plain text versions with order details', async () => {
      const orderConfirmationDataArb: fc.Arbitrary<OrderConfirmationData> = fc.record({
        orderId: orderIdArb,
        recipientName: nameArb,
        email: emailArb,
        phone: phoneArb,
        shippingAddress: addressArb,
        paymentMethod: paymentMethodArb,
        items: fc.array(orderItemArb, { minLength: 1, maxLength: 5 }),
        subtotal: priceArb,
        shippingFee: fc.integer({ min: 0, max: 100000 }),
        discount: fc.integer({ min: 0, max: 1000000 }),
        total: priceArb,
        note: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        estimatedDelivery: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      })

      await fc.assert(
        fc.property(orderConfirmationDataArb, (data) => {
          const result = orderConfirmationTemplate(data)

          // Must have subject, html, and text
          expect(result.subject).toBeDefined()
          expect(result.subject.length).toBeGreaterThan(0)
          expect(result.html).toBeDefined()
          expect(result.html.length).toBeGreaterThan(0)
          expect(result.text).toBeDefined()
          expect(result.text.length).toBeGreaterThan(0)

          // HTML should be valid HTML structure
          expect(result.html).toContain('<!DOCTYPE html>')

          // Should contain order code (first 8 chars of orderId)
          const orderCode = data.orderId.slice(0, 8).toUpperCase()
          expect(result.subject).toContain(orderCode)
          expect(result.html).toContain(orderCode)
          expect(result.text).toContain(orderCode)

          // Should contain recipient name
          expect(result.html).toContain(data.recipientName)
          expect(result.text).toContain(data.recipientName)

          // Should contain shipping address
          expect(result.html).toContain(data.shippingAddress)
          expect(result.text).toContain(data.shippingAddress)

          // Should contain phone
          expect(result.html).toContain(data.phone)
          expect(result.text).toContain(data.phone)

          // Should contain at least one product name
          expect(result.html).toContain(data.items[0].name)
          expect(result.text).toContain(data.items[0].name)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: platform-completion, Property 1: Email Template Completeness**
   * 
   * Tests that order status email templates contain both HTML and plain text versions
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Order Status Email Template (Requirement 1.3)', () => {
    it('should generate both HTML and plain text versions with status info', async () => {
      const orderStatusDataArb: fc.Arbitrary<OrderStatusData> = fc.record({
        orderId: orderIdArb,
        recipientName: nameArb,
        status: orderStatusArb,
        trackingNumber: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: undefined }),
        trackingUrl: fc.option(urlArb, { nil: undefined }),
        carrier: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        estimatedDelivery: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        cancelReason: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        refundAmount: fc.option(priceArb, { nil: undefined }),
      })

      await fc.assert(
        fc.property(orderStatusDataArb, (data) => {
          const result = orderStatusTemplate(data)

          // Must have subject, html, and text
          expect(result.subject).toBeDefined()
          expect(result.subject.length).toBeGreaterThan(0)
          expect(result.html).toBeDefined()
          expect(result.html.length).toBeGreaterThan(0)
          expect(result.text).toBeDefined()
          expect(result.text.length).toBeGreaterThan(0)

          // HTML should be valid HTML structure
          expect(result.html).toContain('<!DOCTYPE html>')

          // Should contain order code
          const orderCode = data.orderId.slice(0, 8).toUpperCase()
          expect(result.subject).toContain(orderCode)
          expect(result.html).toContain(orderCode)
          expect(result.text).toContain(orderCode)

          // Should contain recipient name
          expect(result.html).toContain(data.recipientName)
          expect(result.text).toContain(data.recipientName)

          // If tracking number provided and status is shipping, should be in both versions
          if (data.trackingNumber && data.status === 'shipping') {
            expect(result.html).toContain(data.trackingNumber)
            expect(result.text).toContain(data.trackingNumber)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: platform-completion, Property 1: Email Template Completeness**
   * 
   * Tests that password reset email templates contain both HTML and plain text versions
   * 
   * **Validates: Requirements 1.4**
   */
  describe('Password Reset Email Template (Requirement 1.4)', () => {
    it('should generate both HTML and plain text versions with OTP and security warning', async () => {
      const passwordResetDataArb: fc.Arbitrary<PasswordResetData> = fc.record({
        name: nameArb,
        email: emailArb,
        otp: otpArb,
        resetUrl: fc.option(urlArb, { nil: undefined }),
        expiresIn: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
        userAgent: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      })

      await fc.assert(
        fc.property(passwordResetDataArb, (data) => {
          const result = passwordResetTemplate(data)

          // Must have subject, html, and text
          expect(result.subject).toBeDefined()
          expect(result.subject.length).toBeGreaterThan(0)
          expect(result.html).toBeDefined()
          expect(result.html.length).toBeGreaterThan(0)
          expect(result.text).toBeDefined()
          expect(result.text.length).toBeGreaterThan(0)

          // HTML should be valid HTML structure
          expect(result.html).toContain('<!DOCTYPE html>')

          // Should contain recipient name
          expect(result.html).toContain(data.name)
          expect(result.text).toContain(data.name)

          // Should contain email
          expect(result.html).toContain(data.email)
          expect(result.text).toContain(data.email)

          // Should contain OTP in both versions
          expect(result.html).toContain(data.otp)
          expect(result.text).toContain(data.otp)

          // If resetUrl provided, should be in both versions
          if (data.resetUrl) {
            expect(result.html).toContain(data.resetUrl)
            expect(result.text).toContain(data.resetUrl)
          }

          // Should contain security warning (checking for key phrases)
          expect(result.html.toLowerCase()).toContain('không chia sẻ')
          expect(result.text.toLowerCase()).toContain('không chia sẻ')
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: platform-completion, Property 1: Email Template Completeness**
   * 
   * Tests that promotional email templates contain both HTML and plain text versions
   * 
   * **Validates: Requirements 1.5**
   */
  describe('Promotional Email Template (Requirement 1.5)', () => {
    it('should generate both HTML and plain text versions with products and CTA', async () => {
      const promotionalDataArb: fc.Arbitrary<PromotionalEmailData> = fc.record({
        recipientName: nameArb,
        title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        subtitle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        products: fc.array(productPreviewArb, { minLength: 1, maxLength: 4 }),
        ctaText: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        ctaUrl: urlArb,
        expiresAt: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        promoCode: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
        bannerImage: fc.option(urlArb, { nil: undefined }),
        type: fc.option(promoTypeArb, { nil: undefined }),
      })

      await fc.assert(
        fc.property(promotionalDataArb, (data) => {
          const result = promotionalTemplate(data)

          // Must have subject, html, and text
          expect(result.subject).toBeDefined()
          expect(result.subject.length).toBeGreaterThan(0)
          expect(result.html).toBeDefined()
          expect(result.html.length).toBeGreaterThan(0)
          expect(result.text).toBeDefined()
          expect(result.text.length).toBeGreaterThan(0)

          // HTML should be valid HTML structure
          expect(result.html).toContain('<!DOCTYPE html>')

          // Should contain recipient name
          expect(result.html).toContain(data.recipientName)
          expect(result.text).toContain(data.recipientName)

          // Should contain title
          expect(result.subject).toContain(data.title)

          // Should contain description
          expect(result.html).toContain(data.description)
          expect(result.text).toContain(data.description)

          // Should contain CTA URL
          expect(result.html).toContain(data.ctaUrl)
          expect(result.text).toContain(data.ctaUrl)

          // Should contain at least one product name
          expect(result.html).toContain(data.products[0].name)
          expect(result.text).toContain(data.products[0].name)

          // If promoCode provided, should be in both versions
          if (data.promoCode) {
            expect(result.html).toContain(data.promoCode)
            expect(result.text).toContain(data.promoCode)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: platform-completion, Property 1: Email Template Completeness**
   * 
   * Tests that all email templates support both HTML and plain text fallback
   * 
   * **Validates: Requirements 1.6**
   */
  describe('HTML and Plain Text Fallback (Requirement 1.6)', () => {
    it('plain text version should be readable without HTML tags', async () => {
      const welcomeDataArb: fc.Arbitrary<WelcomeEmailData> = fc.record({
        name: nameArb,
        email: emailArb,
        verifyUrl: fc.option(urlArb, { nil: undefined }),
        verifyOtp: fc.option(otpArb, { nil: undefined }),
      })

      await fc.assert(
        fc.property(welcomeDataArb, (data) => {
          const result = welcomeTemplate(data)

          // Plain text should not contain HTML tags
          expect(result.text).not.toMatch(/<[^>]+>/)

          // Plain text should not contain HTML entities (except basic ones)
          expect(result.text).not.toContain('&nbsp;')
          expect(result.text).not.toContain('&zwnj;')

          // Plain text should be human readable
          expect(result.text.length).toBeGreaterThan(50)
        }),
        { numRuns: 100 }
      )
    })

    it('HTML version should contain proper meta tags for email clients', async () => {
      const passwordResetDataArb: fc.Arbitrary<PasswordResetData> = fc.record({
        name: nameArb,
        email: emailArb,
        otp: otpArb,
        resetUrl: fc.option(urlArb, { nil: undefined }),
        expiresIn: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
        userAgent: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      })

      await fc.assert(
        fc.property(passwordResetDataArb, (data) => {
          const result = passwordResetTemplate(data)

          // Should have proper charset
          expect(result.html).toContain('charset="UTF-8"')

          // Should have viewport meta for responsive
          expect(result.html).toContain('viewport')

          // Should have color-scheme meta for dark mode support
          expect(result.html).toContain('color-scheme')
        }),
        { numRuns: 100 }
      )
    })
  })
})
