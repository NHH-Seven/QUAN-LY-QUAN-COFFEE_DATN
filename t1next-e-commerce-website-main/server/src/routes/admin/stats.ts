import { Router } from 'express'
import { query, queryOne } from '../../db/index.js'

const router = Router()

interface RevenueStats {
  today: number
  week: number
  month: number
  total: number
}

interface OrderStats {
  pending: number
  confirmed: number
  shipping: number
  delivered: number
  cancelled: number
}

interface UserStats {
  total: number
  newThisMonth: number
}

interface ProductStats {
  total: number
  lowStock: number
}

interface RecentOrder {
  id: string
  total: number
  status: string
  created_at: Date
  user_name: string | null
  user_email: string | null
}

interface LowStockProduct {
  id: string
  name: string
  slug: string
  stock: number
  images: string[]
}

interface AdminStats {
  revenue: RevenueStats
  orders: OrderStats
  users: UserStats
  products: ProductStats
  recentOrders: RecentOrder[]
  lowStockProducts: LowStockProduct[]
}

// GET /api/admin/stats
router.get('/', async (req, res) => {
  try {
    // Revenue stats
    const revenueResult = await queryOne<{
      today: string
      week: string
      month: string
      total: string
    }>(`
      SELECT 
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE AND status = 'delivered' THEN total ELSE 0 END), 0) as today,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'delivered' THEN total ELSE 0 END), 0) as week,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) AND status = 'delivered' THEN total ELSE 0 END), 0) as month,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as total
      FROM orders
    `)

    const revenue: RevenueStats = {
      today: parseFloat(revenueResult?.today || '0'),
      week: parseFloat(revenueResult?.week || '0'),
      month: parseFloat(revenueResult?.month || '0'),
      total: parseFloat(revenueResult?.total || '0'),
    }

    // Orders count by status
    const ordersResult = await query<{ status: string; count: string }>(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `)

    const orders: OrderStats = {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    }

    ordersResult.forEach((row) => {
      const status = row.status as keyof OrderStats
      if (status in orders) {
        orders[status] = parseInt(row.count, 10)
      }
    })

    // Users count
    const usersResult = await queryOne<{ total: string; new_this_month: string }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_this_month
      FROM users
    `)

    const users: UserStats = {
      total: parseInt(usersResult?.total || '0', 10),
      newThisMonth: parseInt(usersResult?.new_this_month || '0', 10),
    }

    // Products count
    const productsResult = await queryOne<{ total: string; low_stock: string }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN stock < 10 THEN 1 END) as low_stock
      FROM products
    `)

    const products: ProductStats = {
      total: parseInt(productsResult?.total || '0', 10),
      lowStock: parseInt(productsResult?.low_stock || '0', 10),
    }

    // Recent orders (last 10)
    const recentOrders = await query<RecentOrder>(`
      SELECT o.id, o.total, o.status, o.created_at, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `)

    // Low stock products (stock < 10)
    const lowStockProducts = await query<LowStockProduct>(`
      SELECT id, name, slug, stock, images
      FROM products
      WHERE stock < 10
      ORDER BY stock ASC
      LIMIT 10
    `)

    const stats: AdminStats = {
      revenue,
      orders,
      users,
      products,
      recentOrders,
      lowStockProducts,
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
