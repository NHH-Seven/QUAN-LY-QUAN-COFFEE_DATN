import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  address: string
  is_default: boolean
  created_at: string
}

// GET /api/addresses - Get user's addresses
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const addresses = await query<Address>(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user!.userId]
    )
    res.json({ success: true, data: addresses })
  } catch (error) {
    console.error('Get addresses error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/addresses - Add new address
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address, isDefault } = req.body

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin' })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user!.userId]
      )
    }

    const result = await queryOne<Address>(
      `INSERT INTO user_addresses (id, user_id, name, phone, address, is_default)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.userId, name, phone, address, isDefault || false]
    )

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    console.error('Create address error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/addresses/:id - Update address
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address, isDefault } = req.body

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user!.userId]
      )
    }

    const result = await queryOne<Address>(
      `UPDATE user_addresses 
       SET name = COALESCE($1, name), phone = COALESCE($2, phone), 
           address = COALESCE($3, address), is_default = COALESCE($4, is_default)
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, phone, address, isDefault, req.params.id, req.user!.userId]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy' })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Update address error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await queryOne(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.userId]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy' })
    }

    res.json({ success: true, message: 'Đã xóa' })
  } catch (error) {
    console.error('Delete address error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/addresses/:id/default - Set as default
router.post('/:id/default', async (req: AuthRequest, res: Response) => {
  try {
    // Unset all defaults
    await query(
      'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
      [req.user!.userId]
    )

    // Set new default
    const result = await queryOne<Address>(
      'UPDATE user_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user!.userId]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy' })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Set default address error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

export default router
