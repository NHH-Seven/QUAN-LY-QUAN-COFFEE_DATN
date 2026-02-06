import { z } from 'zod'

/**
 * Password validation schema with all security requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*)
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
  .regex(/[!@#$%^&*]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)')

/**
 * Email validation schema with RFC 5322 format and normalization
 * - Validates email format
 * - Trims whitespace
 * - Converts to lowercase
 * 
 * Requirements: 1.1, 1.2, 1.4
 */
export const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .transform((val) => val.trim().toLowerCase())

/**
 * Name validation schema
 * - Minimum 2 characters
 * - Maximum 100 characters
 * - Only Unicode letters (including Vietnamese diacritics) and spaces
 * 
 * Requirements: 3.1, 3.2, 3.4
 */
export const nameSchema = z
  .string()
  .min(2, 'Tên phải có ít nhất 2 ký tự')
  .max(100, 'Tên không được quá 100 ký tự')
  .regex(
    /^[\p{L}\s]+$/u,
    'Tên chỉ được chứa chữ cái và khoảng trắng'
  )

/**
 * Registration schema for user registration
 * Combines email, password, confirmPassword, and name validation
 * 
 * Requirements: 1.1, 1.2, 2.1-2.7, 3.1, 3.2, 3.4
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: nameSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

/**
 * Server-side registration schema (without confirmPassword)
 * Used when the server receives registration data
 * 
 * Requirements: 1.1, 1.2, 2.1-2.6, 3.1, 3.2, 3.4
 */
export const serverRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
})

/**
 * Login schema for user authentication
 */
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type ServerRegisterInput = z.infer<typeof serverRegisterSchema>
export type LoginInput = z.infer<typeof loginSchema>
