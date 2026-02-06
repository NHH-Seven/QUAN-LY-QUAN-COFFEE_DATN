import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware, staffMiddleware, AuthRequest } from '../middleware/auth.js'
import { notifyFlashSale } from '../services/push.service.js'

const router = Router()

interface Promotion {
  id: string
  code: string
  name: string
  description: string | null
  type: 'percentage' | 'fixed'
  value: string
  min_order_value: string
  max_discount: string | null
  usage_limit: number | null
  used_count: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

// GET /api/promotions/validate/:code - Validate and get promotion details (public)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { orderTotal } = req.query
    const total = parseFloat(orderTotal as string) || 0

    const promo = await queryOne<Promotion>(
      `SELECT * FROM promotions 
       WHERE UPPER(code) = UPPER($1) 
         AND is_active = true
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
         AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [code]
    )

    if (!promo) {
      return res.status(404).json({ success: false, error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' })
    }

    if (total < Number(promo.min_order_value)) {
      return res.status(400).json({ 
        success: false, 
        error: `Đơn hàng tối thiểu ${Number(promo.min_order_value).toLocaleString('vi-VN')}đ` 
      })
    }

    // Calculate discount
    let discount = 0
    if (promo.type === 'percentage') {
      discount = total * (Number(promo.value) / 100)
      if (promo.max_discount && discount > Number(promo.max_discount)) {
        discount = Number(promo.max_discount)
      }
    } else {
      discount = Number(promo.value)
    }

    res.json({
      success: true,
      data: {
        id: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: Number(promo.value),
        discount: Math.min(discount, total),
        minOrderValue: Number(promo.min_order_value),
        maxDiscount: promo.max_discount ? Number(promo.max_discount) : null
      }
    })
  } catch (error) {
    console.error('Validate promotion error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})


// ============ STAFF ROUTES ============
router.use(staffMiddleware)

// GET /api/promotions - List all promotions (staff)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, parseInt(limit as string))
    const offset = (pageNum - 1) * limitNum

    let sql = 'SELECT * FROM promotions WHERE 1=1'
    const params: unknown[] = []
    let paramIdx = 1

    if (status === 'active') {
      sql += ` AND is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW())`
    } else if (status === 'expired') {
      sql += ` AND (end_date < NOW() OR (usage_limit IS NOT NULL AND used_count >= usage_limit))`
    } else if (status === 'inactive') {
      sql += ` AND is_active = false`
    }

    // Count
    const countResult = await queryOne<{ count: string }>(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    const total = parseInt(countResult?.count || '0')

    // Get data
    sql += ` ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`
    params.push(limitNum, offset)

    const promotions = await query<Promotion>(sql, params)

    res.json({
      success: true,
      data: promotions.map(p => ({
        ...p,
        value: Number(p.value),
        minOrderValue: Number(p.min_order_value),
        maxDiscount: p.max_discount ? Number(p.max_discount) : null,
        usageLimit: p.usage_limit,
        usedCount: p.used_count
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get promotions error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/promotions/:id - Get single promotion
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const promo = await queryOne<Promotion>('SELECT * FROM promotions WHERE id = $1', [req.params.id])
    if (!promo) return res.status(404).json({ success: false, error: 'Không tìm thấy' })

    res.json({ success: true, data: promo })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/promotions - Create promotion
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, type, value, minOrderValue, maxDiscount, usageLimit, startDate, endDate } = req.body

    if (!code || !name || !type || value === undefined) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' })
    }

    // Check duplicate code
    const existing = await queryOne<{ id: string }>('SELECT id FROM promotions WHERE UPPER(code) = UPPER($1)', [code])
    if (existing) {
      return res.status(400).json({ success: false, error: 'Mã giảm giá đã tồn tại' })
    }

    const result = await queryOne<Promotion>(
      `INSERT INTO promotions (code, name, description, type, value, min_order_value, max_discount, usage_limit, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [code.toUpperCase(), name, description, type, value, minOrderValue || 0, maxDiscount, usageLimit, startDate, endDate]
    )

    res.status(201).json({ success: true, data: result, message: 'Tạo mã giảm giá thành công' })
  } catch (error) {
    console.error('Create promotion error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})


// PUT /api/promotions/:id - Update promotion
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { code, name, description, type, value, minOrderValue, maxDiscount, usageLimit, startDate, endDate, isActive } = req.body

    const existing = await queryOne<Promotion>('SELECT * FROM promotions WHERE id = $1', [id])
    if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy' })

    // Check duplicate code if changed
    if (code && code.toUpperCase() !== existing.code) {
      const dup = await queryOne<{ id: string }>('SELECT id FROM promotions WHERE UPPER(code) = UPPER($1) AND id != $2', [code, id])
      if (dup) return res.status(400).json({ success: false, error: 'Mã giảm giá đã tồn tại' })
    }

    const result = await queryOne<Promotion>(
      `UPDATE promotions SET 
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        type = COALESCE($4, type),
        value = COALESCE($5, value),
        min_order_value = COALESCE($6, min_order_value),
        max_discount = $7,
        usage_limit = $8,
        start_date = $9,
        end_date = $10,
        is_active = COALESCE($11, is_active),
        updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [code?.toUpperCase(), name, description, type, value, minOrderValue, maxDiscount, usageLimit, startDate, endDate, isActive, id]
    )

    res.json({ success: true, data: result, message: 'Cập nhật thành công' })
  } catch (error) {
    console.error('Update promotion error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// DELETE /api/promotions/:id - Delete promotion
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await queryOne<{ id: string }>('DELETE FROM promotions WHERE id = $1 RETURNING id', [req.params.id])
    if (!result) return res.status(404).json({ success: false, error: 'Không tìm thấy' })

    res.json({ success: true, message: 'Xóa thành công' })
  } catch (error) {
    console.error('Delete promotion error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/promotions/:id/toggle - Toggle active status
router.post('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const result = await queryOne<Promotion>(
      'UPDATE promotions SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    if (!result) return res.status(404).json({ success: false, error: 'Không tìm thấy' })

    res.json({ success: true, data: result, message: result.is_active ? 'Đã kích hoạt' : 'Đã tắt' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/promotions/notify-flash-sale - Send flash sale notification to all users
router.post('/notify-flash-sale', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, productIds } = req.body

    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tiêu đề và mô tả là bắt buộc' 
      })
    }

    const result = await notifyFlashSale(title, description, productIds)

    res.json({ 
      success: true, 
      message: `Đã gửi thông báo đến ${result.sent} người dùng`,
      data: result
    })
  } catch (error) {
    console.error('Notify flash sale error:', error)
    res.status(500).json({ success: false, error: 'Lỗi gửi thông báo' })
  }
})

export default router
