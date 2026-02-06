import { Router, Response } from 'express'
import { query } from '../db/index.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

interface PointsHistory {
  id: string
  points: number
  type: string
  description: string | null
  order_id: string | null
  created_at: string
}

// GET /api/points/history - Get user's points history
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const history = await query<PointsHistory>(
      `SELECT id, points, type, description, order_id, created_at
       FROM points_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.userId, limit, offset]
    )

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) FROM points_history WHERE user_id = $1',
      [req.user!.userId]
    )
    const total = parseInt(countResult[0]?.count || '0', 10)

    res.json({ 
      success: true, 
      data: history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get points history error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// Helper function to add points history (used by other routes)
export async function addPointsHistory(
  userId: string, 
  points: number, 
  type: 'earn' | 'redeem' | 'expire' | 'adjust',
  description: string,
  orderId?: string
) {
  await query(
    `INSERT INTO points_history (user_id, points, type, description, order_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, points, type, description, orderId || null]
  )
}

export default router
