import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from '../config/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { 
  loginRateLimiter, 
  registerRateLimiter, 
  passwordResetRateLimiter,
  resendVerificationRateLimiter,
  otpVerificationRateLimiter 
} from '../middleware/rate-limit.js'
import prisma from '../db/prisma.js'
import { serverRegisterSchema, loginSchema } from '../validations/auth.validation.js'
import { sanitizeObject } from '../utils/sanitizer.js'
import { generateOTP, hashToken, getOTPExpiry } from '../utils/token.js'
import { sendOTPEmail } from '../services/email.service.js'

const router = Router()

// Apply specific rate limiters to each endpoint
// Requirements: 6.2 - Rate limiting for sensitive endpoints

const BCRYPT_COST_FACTOR = 12
const MAX_OTP_ATTEMPTS = 5

const userSelectFields = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  phone: true,
  address: true,
  role: true,
  isActive: true,
  createdAt: true,
  // Loyalty fields
  points: true,
  tier: true,
  totalSpent: true,
  orderCount: true,
}

// Step 1: Register - Create pending registration and send OTP
// Rate limit: 3 requests/minute (Requirements: 6.2)
router.post('/register', registerRateLimiter, async (req, res) => {
  try {
    const rawData = {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
    }

    const validatedData = serverRegisterSchema.parse(rawData)
    const sanitizedData = sanitizeObject({
      email: validatedData.email,
      name: validatedData.name,
    })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedData.email },
      select: { id: true },
    })

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email đã được sử dụng' 
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, BCRYPT_COST_FACTOR)

    // Generate OTP
    const otp = generateOTP()
    const otpHash = hashToken(otp)

    // Delete any existing pending registration for this email
    await prisma.pendingRegistration.deleteMany({
      where: { email: sanitizedData.email },
    })

    // Create pending registration
    await prisma.pendingRegistration.create({
      data: {
        email: sanitizedData.email,
        password: hashedPassword,
        name: sanitizedData.name,
        otp: otp, // Store plain OTP for debugging in dev (remove in production)
        otpHash: otpHash,
        expiresAt: getOTPExpiry(),
        attempts: 0,
      },
    })

    // Send OTP email
    try {
      await sendOTPEmail(sanitizedData.email, sanitizedData.name, otp)
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      // In development, still return success so we can test with the OTP from DB
      if (config.nodeEnv === 'production') {
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể gửi email xác thực, vui lòng thử lại' 
        })
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Mã xác thực đã được gửi đến email của bạn',
      email: sanitizedData.email,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error('Register error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại' })
  }
})

// Step 2: Verify OTP and create actual user account
// Rate limit: 10 requests/15 minutes
router.post('/verify-otp', otpVerificationRateLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email và mã OTP là bắt buộc' })
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!pending) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy yêu cầu đăng ký' })
    }

    // Check expiry
    if (pending.expiresAt < new Date()) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } })
      return res.status(400).json({ success: false, error: 'Mã OTP đã hết hạn, vui lòng đăng ký lại' })
    }

    // Check attempts
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } })
      return res.status(400).json({ success: false, error: 'Quá nhiều lần thử, vui lòng đăng ký lại' })
    }

    // Verify OTP
    const otpHash = hashToken(otp)
    if (otpHash !== pending.otpHash) {
      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { attempts: pending.attempts + 1 },
      })
      const remaining = MAX_OTP_ATTEMPTS - pending.attempts - 1
      return res.status(400).json({ 
        success: false, 
        error: `Mã OTP không đúng. Còn ${remaining} lần thử` 
      })
    }

    // OTP is valid - create actual user
    const user = await prisma.user.create({
      data: {
        email: pending.email,
        password: pending.password,
        name: pending.name,
      },
      select: userSelectFields,
    })

    // Delete pending registration
    await prisma.pendingRegistration.delete({ where: { id: pending.id } })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    )

    res.status(201).json({ success: true, data: { user, token } })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại' })
  }
})

// Resend OTP
router.post('/resend-otp', resendVerificationRateLimiter, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email là bắt buộc' })
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!pending) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy yêu cầu đăng ký' })
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpHash = hashToken(otp)

    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: {
        otp: otp,
        otpHash: otpHash,
        expiresAt: getOTPExpiry(),
        attempts: 0,
      },
    })

    // Send OTP email
    try {
      await sendOTPEmail(pending.email, pending.name, otp)
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)
      if (config.nodeEnv === 'production') {
        return res.status(500).json({ 
          success: false, 
          error: 'Không thể gửi email, vui lòng thử lại' 
        })
      }
    }

    res.json({ success: true, message: 'Mã OTP mới đã được gửi' })
  } catch (error) {
    console.error('Resend OTP error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại' })
  }
})

// Login
// Rate limit: 5 requests/minute (Requirements: 6.2)
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const userWithPassword = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!userWithPassword) {
      return res.status(401).json({ success: false, error: 'Thông tin đăng nhập không hợp lệ' })
    }

    // Check if user is active
    if (!userWithPassword.isActive) {
      return res.status(403).json({ success: false, error: 'Tài khoản đã bị vô hiệu hóa' })
    }

    const validPassword = await bcrypt.compare(password, userWithPassword.password)
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Thông tin đăng nhập không hợp lệ' })
    }

    const token = jwt.sign(
      { userId: userWithPassword.id, email: userWithPassword.email, role: userWithPassword.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    )

    const user = await prisma.user.findUnique({
      where: { id: userWithPassword.id },
      select: userSelectFields,
    })

    res.json({ success: true, data: { user, token } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors })
    }
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại' })
  }
})

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: userSelectFields,
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại' })
  }
})

// Update profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body

    const sanitizedData: Record<string, string | undefined> = {}
    if (name !== undefined) sanitizedData.name = sanitizeObject({ name }).name
    if (phone !== undefined) sanitizedData.phone = sanitizeObject({ phone }).phone
    if (address !== undefined) sanitizedData.address = sanitizeObject({ address }).address
    // Avatar is base64 string or URL, don't sanitize it
    if (avatar !== undefined) {
      // Validate it's a valid data URL or uploaded file URL
      if (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/uploads/'))) {
        sanitizedData.avatar = avatar
      } else {
        return res.status(400).json({ success: false, error: 'Avatar phải là URL hợp lệ' })
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: sanitizedData,
      select: userSelectFields,
    })

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại' })
  }
})

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    })

    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' })
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không đúng' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_COST_FACTOR)

    // Update password
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    })

    res.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra, vui lòng thử lại' })
  }
})

// Forgot password - Send reset OTP
// Rate limit: 3 requests/hour (Requirements: 6.2)
router.post('/forgot-password', passwordResetRateLimiter, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email là bắt buộc' })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'Nếu email tồn tại, mã xác thực sẽ được gửi' })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = hashToken(otp)

    // Store reset token (reuse pendingRegistration table or create new)
    await prisma.passwordReset.upsert({
      where: { email: user.email },
      update: {
        otpHash,
        expiresAt: getOTPExpiry(),
        attempts: 0,
      },
      create: {
        email: user.email,
        otpHash,
        expiresAt: getOTPExpiry(),
        attempts: 0,
      },
    })

    // Send email
    try {
      await sendOTPEmail(user.email, user.name || 'Khách hàng', otp, 'reset')
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
    }

    res.json({ success: true, message: 'Mã xác thực đã được gửi đến email của bạn' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ thông tin' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!resetRecord) {
      return res.status(400).json({ success: false, error: 'Yêu cầu không hợp lệ hoặc đã hết hạn' })
    }

    // Check expiry
    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordReset.delete({ where: { id: resetRecord.id } })
      return res.status(400).json({ success: false, error: 'Mã OTP đã hết hạn' })
    }

    // Check attempts
    if (resetRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.passwordReset.delete({ where: { id: resetRecord.id } })
      return res.status(400).json({ success: false, error: 'Quá nhiều lần thử, vui lòng yêu cầu mã mới' })
    }

    // Verify OTP
    const otpHash = hashToken(otp)
    if (otpHash !== resetRecord.otpHash) {
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { attempts: resetRecord.attempts + 1 },
      })
      return res.status(400).json({ success: false, error: 'Mã OTP không đúng' })
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_COST_FACTOR)
    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
    })

    // Delete reset record
    await prisma.passwordReset.delete({ where: { id: resetRecord.id } })

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

export default router
