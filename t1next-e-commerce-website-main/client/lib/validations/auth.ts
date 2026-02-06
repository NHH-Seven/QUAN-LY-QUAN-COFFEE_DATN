import { z } from 'zod'

/**
 * Password validation schema with all security requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*)
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
  .regex(/[!@#$%^&*]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)')

/**
 * Email validation schema with RFC 5322 format
 * Requirements: 1.1
 */
export const emailSchema = z
  .string()
  .min(1, 'Email không được để trống')
  .email('Email không hợp lệ')

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
 * Registration schema for user registration form
 * Combines email, password, confirmPassword, name, and acceptTerms validation
 * 
 * Requirements: 1.1, 2.1-2.5, 2.7, 3.1, 3.2, 3.4
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    name: nameSchema,
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Bạn phải đồng ý với điều khoản sử dụng' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

/**
 * Login schema for user authentication
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
