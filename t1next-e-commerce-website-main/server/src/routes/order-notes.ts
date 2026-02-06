import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { staffMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(staffMiddleware)

interface OrderNote {
  id: string
  order_id: string
  staff_id: string
  note: string
  created_at: string
  staff_name?: string
}

// GET /api/order-notes/:orderId - Get notes for an order
router.get('/:orderId', async (req: AuthRequest, res: Response) => {
  try {
    const notes = await query<OrderNote>(
      `SELECT n.*, u.name as staff_name
       FROM order_notes n
       LEFT JOIN users u ON n.staff_id = u.id
       WHERE n.order_id = $1
       ORDER BY n.created_at DESC`,
      [req.params.orderId]
    )
    res.json({ success: true, data: notes })
  } catch (error) {
    console.error('Get order notes error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/order-notes/:orderId - Add note to order
router.post('/:orderId', async (req: AuthRequest, res: Response) => {
  try {
    const { note } = req.body

    if (!note?.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu nội dung ghi chú' })
    }

    const result = await queryOne<OrderNote>(
      `INSERT INTO order_notes (order_id, staff_id, note)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.orderId, req.user!.userId, note.trim()]
    )

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    console.error('Create order note error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// DELETE /api/order-notes/:id - Delete note
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await queryOne(
      'DELETE FROM order_notes WHERE id = $1 RETURNING id',
      [req.params.id]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy' })
    }

    res.json({ success: true, message: 'Đã xóa' })
  } catch (error) {
    console.error('Delete order note error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

export default router
