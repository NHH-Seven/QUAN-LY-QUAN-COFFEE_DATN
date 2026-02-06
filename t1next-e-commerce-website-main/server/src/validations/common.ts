import { z } from 'zod'

/**
 * Common validation schemas for input validation
 * 
 * Requirements: 6.1 - Validate all user inputs to prevent SQL injection and XSS
 */

// ============================================
// PRIMITIVE SCHEMAS
// ============================================

/**
 * UUID validation schema
 * Used for all ID fields
 */
export const uuidSchema = z.string().uuid('ID không hợp lệ')

/**
 * Email validation schema with normalization
 */
export const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .max(255, 'Email không được quá 255 ký tự')
  .transform((val) => val.trim().toLowerCase())

/**
 * Password validation schema with security requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(100, 'Mật khẩu không được quá 100 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt')

/**
 * Vietnamese phone number validation
 * - 10-11 digits starting with 0
 */
export const phoneSchema = z
  .string()
  .regex(/^0[0-9]{9,10}$/, 'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)')

/**
 * Name validation schema
 * - 2-100 characters
 * - Only Unicode letters and spaces
 */
export const nameSchema = z
  .string()
  .min(2, 'Tên phải có ít nhất 2 ký tự')
  .max(100, 'Tên không được quá 100 ký tự')
  .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Tên chỉ được chứa chữ cái và khoảng trắng')

/**
 * Address validation schema
 * - 10-500 characters
 */
export const addressSchema = z
  .string()
  .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
  .max(500, 'Địa chỉ không được quá 500 ký tự')

/**
 * Slug validation schema
 * - Lowercase letters, numbers, and hyphens
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug không được để trống')
  .max(200, 'Slug không được quá 200 ký tự')
  .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang')

/**
 * Positive integer validation
 */
export const positiveIntSchema = z
  .number()
  .int('Phải là số nguyên')
  .positive('Phải là số dương')

/**
 * Non-negative integer validation
 */
export const nonNegativeIntSchema = z
  .number()
  .int('Phải là số nguyên')
  .min(0, 'Không được là số âm')

/**
 * Quantity validation (1-1000)
 */
export const quantitySchema = z
  .number()
  .int('Số lượng phải là số nguyên')
  .min(1, 'Số lượng tối thiểu là 1')
  .max(1000, 'Số lượng tối đa là 1000')

/**
 * Price validation (non-negative)
 */
export const priceSchema = z
  .number()
  .min(0, 'Giá không được âm')
  .max(999999999999, 'Giá quá lớn')

/**
 * Percentage validation (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Phần trăm không được âm')
  .max(100, 'Phần trăm không được quá 100')

/**
 * Rating validation (1-5)
 */
export const ratingSchema = z
  .number()
  .int('Đánh giá phải là số nguyên')
  .min(1, 'Đánh giá tối thiểu là 1')
  .max(5, 'Đánh giá tối đa là 5')

// ============================================
// TEXT CONTENT SCHEMAS
// ============================================

/**
 * Short text validation (max 255 chars)
 * Used for titles, names, etc.
 */
export const shortTextSchema = z
  .string()
  .min(1, 'Không được để trống')
  .max(255, 'Không được quá 255 ký tự')

/**
 * Medium text validation (max 1000 chars)
 * Used for descriptions, notes, etc.
 */
export const mediumTextSchema = z
  .string()
  .max(1000, 'Không được quá 1000 ký tự')

/**
 * Long text validation (max 10000 chars)
 * Used for content, reviews, etc.
 */
export const longTextSchema = z
  .string()
  .max(10000, 'Không được quá 10000 ký tự')

/**
 * OTP validation (6 digits)
 */
export const otpSchema = z
  .string()
  .length(6, 'Mã OTP phải có 6 ký tự')
  .regex(/^[0-9]+$/, 'Mã OTP chỉ được chứa số')

// ============================================
// URL SCHEMAS
// ============================================

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('URL không hợp lệ')
  .max(2000, 'URL không được quá 2000 ký tự')

/**
 * Image URL validation
 * Accepts http/https URLs or relative paths starting with /
 */
export const imageUrlSchema = z
  .string()
  .max(2000, 'URL không được quá 2000 ký tự')
  .refine(
    (val) => {
      if (!val) return true
      return (
        val.startsWith('http://') ||
        val.startsWith('https://') ||
        val.startsWith('/') ||
        val.startsWith('data:image/')
      )
    },
    'URL hình ảnh không hợp lệ'
  )

// ============================================
// DATE SCHEMAS
// ============================================

/**
 * ISO date string validation
 */
export const dateStringSchema = z
  .string()
  .datetime({ message: 'Ngày không hợp lệ' })

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  'Ngày bắt đầu phải trước ngày kết thúc'
)

// ============================================
// PAGINATION SCHEMAS
// ============================================

/**
 * Pagination query parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Search query parameters
 */
export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  ...paginationSchema.shape,
})

// ============================================
// ENUM SCHEMAS
// ============================================

/**
 * Order status enum
 */
export const orderStatusSchema = z.enum([
  'pending',
  'awaiting_payment',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
  'cancelled',
  'returned',
])

/**
 * Payment method enum
 */
export const paymentMethodSchema = z.enum(['cod', 'bank_transfer'])

/**
 * User role enum
 */
export const userRoleSchema = z.enum(['user', 'admin', 'sales', 'warehouse'])

/**
 * Sort order enum
 */
export const sortOrderSchema = z.enum(['asc', 'desc'])

// ============================================
// COMPOSITE SCHEMAS
// ============================================

/**
 * Product filter schema
 */
export const productFilterSchema = z.object({
  category: slugSchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  brand: z.string().max(100).optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'bestseller', 'rating']).optional(),
  ...paginationSchema.shape,
})

/**
 * Cart item schema
 */
export const cartItemSchema = z.object({
  productId: uuidSchema,
  quantity: quantitySchema,
})

/**
 * Review schema
 */
export const reviewSchema = z.object({
  productId: uuidSchema,
  rating: ratingSchema,
  comment: longTextSchema.optional(),
  images: z.array(imageUrlSchema).max(5).optional(),
})

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: shortTextSchema,
  message: longTextSchema,
})

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Strips HTML tags from string
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Escapes HTML special characters
 */
export function escapeHtml(input: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return input.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}

/**
 * Sanitizes string input by stripping HTML and trimming
 */
export function sanitizeString(input: string): string {
  return stripHtml(input).trim()
}

/**
 * Creates a sanitized string schema
 */
export const sanitizedStringSchema = z.string().transform(sanitizeString)

/**
 * Creates a sanitized text schema with max length
 */
export function createSanitizedTextSchema(maxLength: number) {
  return z
    .string()
    .max(maxLength, `Không được quá ${maxLength} ký tự`)
    .transform(sanitizeString)
}

// ============================================
// VALIDATION MIDDLEWARE HELPER
// ============================================

import { Request, Response, NextFunction } from 'express'

/**
 * Creates an Express middleware that validates request body against a Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(error)
    }
  }
}

/**
 * Creates an Express middleware that validates request query against a Zod schema
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Tham số không hợp lệ',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(error)
    }
  }
}

/**
 * Creates an Express middleware that validates request params against a Zod schema
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as typeof req.params
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Tham số URL không hợp lệ',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(error)
    }
  }
}

// Type exports
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type PaymentMethod = z.infer<typeof paymentMethodSchema>
export type UserRole = z.infer<typeof userRoleSchema>
