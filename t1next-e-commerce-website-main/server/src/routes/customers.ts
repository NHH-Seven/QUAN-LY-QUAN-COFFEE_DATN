import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { staffMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(staffMiddleware)

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 20000
}

function calculateTier(points: number): string {
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum'
  if (points >= TIER_THRESHOLDS.gold) return 'gold'
  if (points >= TIER_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

/**
 * GET /api/customers
 * List customers with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, tier, sort = 'created_at', order = 'desc', page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, parseInt(limit as string))
    const offset = (pageNum - 1) * limitNum

    let whereClause = "WHERE role = 'user'"
    const params: unknown[] = []
    let paramIdx = 1

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR phone ILIKE $${paramIdx})`
      params.push(`%${search}%`)
      paramIdx++
    }

    if (tier && tier !== 'all') {
      whereClause += ` AND tier = $${paramIdx}`
      params.push(tier)
      paramIdx++
    }

    // Count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0')

    // Validate sort column
    const validSorts = ['created_at', 'name', 'email', 'points', 'total_spent', 'order_count']
    const sortCol = validSorts.includes(sort as string) ? sort : 'created_at'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'

    // Get customers
    const customers = await query<{
      id: string; email: string; name: string; phone: string | null
      address: string | null; avatar: string | null; points: string
      tier: string; total_spent: string; order_count: string
      note: string | null; is_active: boolean; created_at: string
    }>(
      `SELECT id, email, name, phone, address, avatar, 
              COALESCE(points, 0) as points, COALESCE(tier, 'bronze') as tier,
              COALESCE(total_spent, 0) as total_spent, COALESCE(order_count, 0) as order_count,
              note, is_active, created_at
       FROM users
       ${whereClause}
       ORDER BY ${sortCol} ${sortOrder}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    )

    res.json({
      success: true,
      data: customers.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        phone: c.phone,
        address: c.address,
        avatar: c.avatar,
        points: parseInt(c.points),
        tier: c.tier,
        totalSpent: parseFloat(c.total_spent),
        orderCount: parseInt(c.order_count),
        note: c.note,
        isActive: c.is_active,
        createdAt: c.created_at
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

/**
 * GET /api/customers/stats
 * Customer statistics
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await queryOne<{
      total: string
      bronze: string
      silver: string
      gold: string
      platinum: string
      total_points: string
      new_this_month: string
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE COALESCE(tier, 'bronze') = 'bronze') as bronze,
        COUNT(*) FILTER (WHERE tier = 'silver') as silver,
        COUNT(*) FILTER (WHERE tier = 'gold') as gold,
        COUNT(*) FILTER (WHERE tier = 'platinum') as platinum,
        COALESCE(SUM(points), 0) as total_points,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as new_this_month
       FROM users WHERE role = 'user'`
    )

    res.json({
      success: true,
      data: {
        total: parseInt(stats?.total || '0'),
        byTier: {
          bronze: parseInt(stats?.bronze || '0'),
          silver: parseInt(stats?.silver || '0'),
          gold: parseInt(stats?.gold || '0'),
          platinum: parseInt(stats?.platinum || '0')
        },
        totalPoints: parseInt(stats?.total_points || '0'),
        newThisMonth: parseInt(stats?.new_this_month || '0')
      }
    })
  } catch (error) {
    console.error('Get customer stats error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

/**
 * GET /api/customers/:id
 * Get customer detail with order history
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const customer = await queryOne<{
      id: string; email: string; name: string; phone: string | null
      address: string | null; avatar: string | null; points: string
      tier: string; total_spent: string; order_count: string
      note: string | null; is_active: boolean; created_at: string
    }>(
      `SELECT id, email, name, phone, address, avatar,
              COALESCE(points, 0) as points, COALESCE(tier, 'bronze') as tier,
              COALESCE(total_spent, 0) as total_spent, COALESCE(order_count, 0) as order_count,
              note, is_active, created_at
       FROM users WHERE id = $1 AND role = 'user'`,
      [id]
    )

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khách hàng' })
    }

    // Get recent orders
    const orders = await query<{
      id: string; total: string; status: string; created_at: string; items_count: string
    }>(
      `SELECT o.id, o.total, o.status, o.created_at,
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [id]
    )

    res.json({
      success: true,
      data: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        avatar: customer.avatar,
        points: parseInt(customer.points),
        tier: customer.tier,
        totalSpent: parseFloat(customer.total_spent),
        orderCount: parseInt(customer.order_count),
        note: customer.note,
        isActive: customer.is_active,
        createdAt: customer.created_at,
        recentOrders: orders.map(o => ({
          id: o.id,
          total: parseFloat(o.total),
          status: o.status,
          itemsCount: parseInt(o.items_count),
          createdAt: o.created_at
        }))
      }
    })
  } catch (error) {
    console.error('Get customer detail error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

/**
 * PUT /api/customers/:id
 * Update customer (note, points adjustment)
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { note, pointsAdjust, pointsReason } = req.body

    const customer = await queryOne<{ id: string; points: string }>(
      'SELECT id, COALESCE(points, 0) as points FROM users WHERE id = $1 AND role = $2',
      [id, 'user']
    )

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khách hàng' })
    }

    let newPoints = parseInt(customer.points)
    
    // Adjust points if provided
    if (typeof pointsAdjust === 'number' && pointsAdjust !== 0) {
      newPoints = Math.max(0, newPoints + pointsAdjust)
    }

    const newTier = calculateTier(newPoints)

    await queryOne(
      `UPDATE users SET 
        note = COALESCE($1, note),
        points = $2,
        tier = $3
       WHERE id = $4`,
      [note, newPoints, newTier, id]
    )

    res.json({
      success: true,
      data: { points: newPoints, tier: newTier },
      message: 'Cập nhật thành công'
    })
  } catch (error) {
    console.error('Update customer error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

/**
 * POST /api/customers/:id/recalculate
 * Recalculate customer stats from orders
 */
router.post('/:id/recalculate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Calculate from orders
    const stats = await queryOne<{ total_spent: string; order_count: string }>(
      `SELECT 
        COALESCE(SUM(total), 0) as total_spent,
        COUNT(*) as order_count
       FROM orders
       WHERE user_id = $1 AND status NOT IN ('cancelled')`,
      [id]
    )

    const totalSpent = parseFloat(stats?.total_spent || '0')
    const orderCount = parseInt(stats?.order_count || '0')
    const points = Math.floor(totalSpent / 10000) // 1 point per 10,000 VND
    const tier = calculateTier(points)

    await queryOne(
      `UPDATE users SET 
        total_spent = $1,
        order_count = $2,
        points = $3,
        tier = $4
       WHERE id = $5`,
      [totalSpent, orderCount, points, tier, id]
    )

    res.json({
      success: true,
      data: { totalSpent, orderCount, points, tier },
      message: 'Đã cập nhật thống kê'
    })
  } catch (error) {
    console.error('Recalculate customer error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

/**
 * POST /api/customers/recalculate-all
 * Recalculate all customers stats
 */
router.post('/recalculate-all', async (req: AuthRequest, res: Response) => {
  try {
    // Update all customers in one query
    await query(
      `UPDATE users u SET
        total_spent = COALESCE(stats.total_spent, 0),
        order_count = COALESCE(stats.order_count, 0),
        points = FLOOR(COALESCE(stats.total_spent, 0) / 10000),
        tier = CASE 
          WHEN FLOOR(COALESCE(stats.total_spent, 0) / 10000) >= 20000 THEN 'platinum'
          WHEN FLOOR(COALESCE(stats.total_spent, 0) / 10000) >= 5000 THEN 'gold'
          WHEN FLOOR(COALESCE(stats.total_spent, 0) / 10000) >= 1000 THEN 'silver'
          ELSE 'bronze'
        END
       FROM (
         SELECT user_id, SUM(total) as total_spent, COUNT(*) as order_count
         FROM orders WHERE status NOT IN ('cancelled')
         GROUP BY user_id
       ) stats
       WHERE u.id = stats.user_id AND u.role = 'user'`
    )

    res.json({ success: true, message: 'Đã cập nhật tất cả khách hàng' })
  } catch (error) {
    console.error('Recalculate all customers error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

export default router
