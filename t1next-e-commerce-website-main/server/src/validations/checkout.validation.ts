import { z } from 'zod'

/**
 * Idempotency key validation schema
 * - Required for duplicate order prevention
 * - UUID v4 format
 * 
 * Requirements: 6.4
 */
export const idempotencyKeySchema = z
  .string()
  .uuid('Idempotency key phải là UUID hợp lệ')

/**
 * Vietnamese phone number validation schema
 * - Required
 * - 10-11 digits starting with 0
 * - Common formats: 09x, 08x, 07x, 05x, 03x (10 digits)
 * - Old format: 01x (11 digits)
 * 
 * Requirements: 2.3
 */
export const vietnamesePhoneSchema = z
  .string()
  .min(1, 'Số điện thoại không được để trống')
  .regex(
    /^0[0-9]{9,10}$/,
    'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)'
  )

/**
 * Recipient name validation schema
 * - Required
 * - 2-100 characters
 * 
 * Requirements: 2.1
 */
export const recipientNameSchema = z
  .string()
  .min(2, 'Tên người nhận phải có ít nhất 2 ký tự')
  .max(100, 'Tên người nhận không được quá 100 ký tự')

/**
 * Address validation schema
 * - Required
 * - Not empty
 * 
 * Requirements: 2.4
 */
export const addressSchema = z
  .string()
  .min(1, 'Địa chỉ không được để trống')

/**
 * Payment method validation schema
 * - Required
 * - Must be 'cod' or 'bank_transfer'
 * 
 * Requirements: 3.4
 */
export const paymentMethodSchema = z.enum(['cod', 'bank_transfer'], {
  errorMap: () => ({ message: 'Phương thức thanh toán không hợp lệ' })
})

/**
 * Create order request body validation schema
 * Combines all checkout field validations
 * 
 * Requirements: 2.1, 2.3, 2.4, 2.5, 3.4, 6.4
 */
export const createOrderSchema = z.object({
  recipientName: recipientNameSchema,
  phone: vietnamesePhoneSchema,
  address: addressSchema,
  note: z.string().optional(),
  paymentMethod: paymentMethodSchema,
  idempotencyKey: idempotencyKeySchema.optional(),
  promotionId: z.string().uuid().optional(),
  discountAmount: z.number().min(0).optional()
})

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
