import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query, queryOne } from '../../db/index.js'
import prisma from '../../db/prisma.js'
import type { User, UserRole } from '../../types/index.js'
import { sanitizeObject } from '../../utils/sanitizer.js'

const router = Router()

const BCRYPT_COST_FACTOR = 12

// Staff response type (password excluded)
export type StaffResponse = Omit<User, 'password'>

// Valid staff roles
export const STAFF_ROLES: UserRole[] = ['admin', 'sales', 'warehouse']

// Allowed sort fields
const ALLOWED_SORT_FIELDS = ['created_at', 'name', 'email']

// Email validation schema
const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .transform((val) => val.trim().toLowerCase())

// Staff password validation - simpler than user registration (min 6 chars)
const staffPasswordSchema = z
  .string()
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')

// Name validation schema
const nameSchema = z
  .string()
  .min(2, 'Tên phải có ít nhất 2 ký tự')
  .max(100, 'Tên không được quá 100 ký tự')

// Role validation schema
const roleSchema = z.enum(['admin', 'sales', 'warehouse'], {
  errorMap: () => ({ message: 'Role phải là admin, sales hoặc warehouse' }),
})

// Create staff validation schema
export const createStaffSchema = z.object({
  email: emailSchema,
  password: staffPasswordSchema,
  name: nameSchema,
  role: roleSchema,
  phone: z.string().optional(),
})

// Update staff validation schema (email excluded - immutable)
export const updateStaffSchema = z.object({
  name: nameSchema.optional(),
  role: roleSchema.optional(),
  phone: z.string().nullable().optional(),
})

// Reset password validation schema
export const resetPasswordSchema = z.object({
  password: staffPasswordSchema,
})

// Update status validation schema
export const updateStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'isActive là bắt buộc',
    invalid_type_error: 'isActive phải là boolean',
  }),
})

// GET /api/admin/staff - Paginated, searchable staff list
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      role,
      sort = 'created_at',
      order = 'desc',
    } = req.query

    // Build base query
    let sql = `
      SELECT 
        id, email, name, phone, role, is_active as "isActive", created_at as "createdAt"
      FROM users
      WHERE role != 'user'
    `
    const params: unknown[] = []
    let paramIndex = 1

    // Search filter (name or email) - ILIKE for case-insensitive
    if (search && typeof search === 'string' && search.trim()) {
      sql += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      params.push(`%${search.trim()}%`)
      paramIndex++
    }

    // Role filter
    if (role && typeof role === 'string' && STAFF_ROLES.includes(role as UserRole)) {
      sql += ` AND role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    // Sorting - validate sort field to prevent SQL injection
    const sortField = ALLOWED_SORT_FIELDS.includes(sort as string) ? sort : 'created_at'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
    sql += ` ORDER BY ${sortField} ${sortOrder}`

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20))
    const offset = (pageNum - 1) * limitNum

    // Build count query with same filters
    let countSql = `SELECT COUNT(*) FROM users WHERE role != 'user'`
    const countParams: unknown[] = []
    let countParamIndex = 1

    if (search && typeof search === 'string' && search.trim()) {
      countSql += ` AND (name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`
      countParams.push(`%${search.trim()}%`)
      countParamIndex++
    }

    if (role && typeof role === 'string' && STAFF_ROLES.includes(role as UserRole)) {
      countSql += ` AND role = $${countParamIndex}`
      countParams.push(role)
    }

    // Execute count query
    const countResult = await query<{ count: string }>(countSql, countParams)
    const total = parseInt(countResult[0]?.count || '0', 10)

    // Add pagination to main query
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limitNum, offset)

    // Execute main query
    const staff = await query<StaffResponse>(sql, params)

    res.json({
      success: true,
      data: staff,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (error) {
    console.error('Get staff list error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/admin/staff/:id - Get staff detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const staff = await queryOne<StaffResponse>(
      `SELECT id, email, name, phone, role, is_active as "isActive", created_at as "createdAt"
       FROM users
       WHERE id = $1 AND role != 'user'`,
      [id]
    )

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Nhân viên không tồn tại' })
    }

    res.json({
      success: true,
      data: staff,
    })
  } catch (error) {
    console.error('Get staff detail error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /api/admin/staff - Create new staff member
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validatedData = createStaffSchema.parse(req.body)
    
    // Sanitize input
    const sanitizedData = sanitizeObject({
      email: validatedData.email,
      name: validatedData.name,
      phone: validatedData.phone || null,
    })

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedData.email },
      select: { id: true },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email đã tồn tại',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, BCRYPT_COST_FACTOR)

    // Create staff member
    const newStaff = await prisma.user.create({
      data: {
        email: sanitizedData.email,
        password: hashedPassword,
        name: sanitizedData.name,
        role: validatedData.role,
        phone: sanitizedData.phone,
        isActive: true, // Default to active
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    res.status(201).json({
      success: true,
      data: newStaff,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      })
    }
    console.error('Create staff error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /api/admin/staff/:id - Update staff member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if staff exists and is not a regular user
    const existingStaff = await prisma.user.findFirst({
      where: {
        id,
        role: { not: 'user' },
      },
      select: { id: true, email: true },
    })

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Nhân viên không tồn tại',
      })
    }

    // Validate request body (email is ignored even if provided)
    const validatedData = updateStaffSchema.parse(req.body)

    // Build update data - only include fields that were provided
    const updateData: {
      name?: string
      role?: 'admin' | 'sales' | 'warehouse'
      phone?: string | null
    } = {}

    if (validatedData.name !== undefined) {
      updateData.name = sanitizeObject({ name: validatedData.name }).name
    }

    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role
    }

    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone
        ? sanitizeObject({ phone: validatedData.phone }).phone
        : null
    }

    // Update staff member
    const updatedStaff = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedStaff,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      })
    }
    console.error('Update staff error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /api/admin/staff/:id/password - Reset staff password
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params

    // Check if staff exists and is not a regular user
    const existingStaff = await prisma.user.findFirst({
      where: {
        id,
        role: { not: 'user' },
      },
      select: { id: true },
    })

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Nhân viên không tồn tại',
      })
    }

    // Validate request body
    const validatedData = resetPasswordSchema.parse(req.body)

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.password, BCRYPT_COST_FACTOR)

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      })
    }
    console.error('Reset staff password error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /api/admin/staff/:id/status - Toggle staff active status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = req.user?.userId

    // Check if staff exists and is not a regular user
    const existingStaff = await prisma.user.findFirst({
      where: {
        id,
        role: { not: 'user' },
      },
      select: { id: true, role: true, isActive: true },
    })

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Nhân viên không tồn tại',
      })
    }

    // Validate request body
    const validatedData = updateStatusSchema.parse(req.body)

    // Check if admin is trying to modify their own account
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Không thể thực hiện thao tác này trên tài khoản của bạn',
      })
    }

    // If deactivating an admin, check if this is the last active admin
    if (!validatedData.isActive && existingStaff.role === 'admin') {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: 'admin',
          isActive: true,
        },
      })

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Không thể vô hiệu hóa admin cuối cùng',
        })
      }
    }

    // Update status
    const updatedStaff = await prisma.user.update({
      where: { id },
      data: { isActive: validatedData.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedStaff,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      })
    }
    console.error('Update staff status error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// DELETE /api/admin/staff/:id - Delete staff member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const currentUserId = req.user?.userId

    // Check if staff exists and is not a regular user
    const existingStaff = await prisma.user.findFirst({
      where: {
        id,
        role: { not: 'user' },
      },
      select: { id: true, role: true },
    })

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        error: 'Nhân viên không tồn tại',
      })
    }

    // Check if admin is trying to delete their own account
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        error: 'Không thể thực hiện thao tác này trên tài khoản của bạn',
      })
    }

    // If deleting an admin, check if this is the last admin
    if (existingStaff.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: {
          role: 'admin',
        },
      })

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Không thể xóa admin cuối cùng',
        })
      }
    }

    // Delete staff member
    // Related records are handled by Prisma schema:
    // - StockTransaction: CASCADE (deleted)
    // - CartItem: CASCADE (deleted)
    // - Order: SET NULL (userId set to null, order preserved)
    // - Review: SET NULL (userId set to null, review preserved)
    await prisma.user.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Xóa nhân viên thành công',
    })
  } catch (error) {
    console.error('Delete staff error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
