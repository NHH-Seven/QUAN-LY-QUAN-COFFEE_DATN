import { Router } from 'express'
import { query, queryOne } from '../../db/index.js'
import type { User, Order } from '../../types/index.js'

const router = Router()

// User without password for API responses
type SafeUser = Omit<User, 'password'>

interface AdminUser extends SafeUser {
  orders_count: number
  total_spent: number
}

// GET /api/admin/users - Paginated, searchable user list
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      sort = 'created_at',
      order = 'desc',
    } = req.query

    let sql = `
      SELECT 
        u.id, u.email, u.name, u.avatar, u.phone, u.address, 
        u.role, u.is_active as "isActive", u.created_at,
        COALESCE((SELECT COUNT(*) FROM orders WHERE user_id = u.id), 0)::int as orders_count,
        COALESCE((SELECT SUM(total) FROM orders WHERE user_id = u.id AND status != 'cancelled'), 0)::numeric as total_spent
      FROM users u
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    // Search filter (name, email, phone)
    if (search && typeof search === 'string') {
      sql += ' AND (u.name ILIKE $' + paramIndex + ' OR u.email ILIKE $' + paramIndex + ' OR u.phone ILIKE $' + paramIndex + ')'
      params.push('%' + search + '%')
      paramIndex++
    }

    // Sorting
    const allowedSortFields = ['created_at', 'name', 'email', 'role']
    const sortField = allowedSortFields.includes(sort as string) ? sort : 'created_at'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
    sql += ' ORDER BY u.' + sortField + ' ' + sortOrder


    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    // Get total count
    let countSql = 'SELECT COUNT(*) FROM users u WHERE 1=1'
    if (search && typeof search === 'string') {
      countSql += ' AND (u.name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1)'
    }

    const countResult = await query<{ count: string }>(countSql, search ? ['%' + search + '%'] : [])
    const total = parseInt(countResult[0]?.count || '0', 10)

    // Add pagination
    sql += ' LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1)
    params.push(limitNum, offset)

    const users = await query<AdminUser>(sql, params)

    res.json({
      success: true,
      data: users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (error) {
    console.error('Get admin users error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/admin/users/:id - Get user detail with order history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const user = await queryOne<SafeUser>(
      `SELECT id, email, name, avatar, phone, address, role, is_active as "isActive", created_at
       FROM users
       WHERE id = $1`,
      [id]
    )

    if (!user) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' })
    }

    // Get order history
    const orders = await query<Order & { items_count: number }>(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id)::int as items_count
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [id]
    )

    // Calculate total spent
    const totalSpent = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0)

    res.json({
      success: true,
      data: {
        ...user,
        orders,
        total_spent: totalSpent,
      },
    })
  } catch (error) {
    console.error('Get admin user detail error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})


// PUT /api/admin/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, phone, address, role } = req.body

    // Check user exists
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE id = $1',
      [id]
    )

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' })
    }

    // Validate role if provided
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role không hợp lệ' })
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push('name = $' + paramIndex)
      params.push(name)
      paramIndex++
    }

    if (phone !== undefined) {
      updates.push('phone = $' + paramIndex)
      params.push(phone)
      paramIndex++
    }

    if (address !== undefined) {
      updates.push('address = $' + paramIndex)
      params.push(address)
      paramIndex++
    }

    if (role !== undefined) {
      updates.push('role = $' + paramIndex)
      params.push(role)
      paramIndex++
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có dữ liệu để cập nhật' })
    }

    params.push(id)

    const updatedUser = await queryOne<SafeUser>(
      'UPDATE users SET ' + updates.join(', ') + ' WHERE id = $' + paramIndex +
      ' RETURNING id, email, name, avatar, phone, address, role, is_active as "isActive", created_at',
      params
    )

    res.json({
      success: true,
      data: updatedUser,
      message: 'Cập nhật người dùng thành công',
    })
  } catch (error) {
    console.error('Update admin user error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /api/admin/users/:id/status - Activate/deactivate user
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive phải là boolean' })
    }

    // Check user exists
    const existingUser = await queryOne<User>(
      'SELECT id, role FROM users WHERE id = $1',
      [id]
    )

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' })
    }

    // Prevent deactivating admin users (optional safety check)
    if (existingUser.role === 'admin' && !isActive) {
      return res.status(400).json({ 
        success: false, 
        error: 'Không thể vô hiệu hóa tài khoản admin' 
      })
    }

    const updatedUser = await queryOne<SafeUser>(
      `UPDATE users 
       SET is_active = $1
       WHERE id = $2
       RETURNING id, email, name, avatar, phone, address, role, is_active as "isActive", created_at`,
      [isActive, id]
    )

    const message = isActive 
      ? 'Kích hoạt tài khoản thành công' 
      : 'Vô hiệu hóa tài khoản thành công'

    res.json({
      success: true,
      data: updatedUser,
      message,
    })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
