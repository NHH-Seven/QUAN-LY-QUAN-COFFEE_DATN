import { Router } from 'express'
import { pool, query, queryOne } from '../db/index.js'
import { salesMiddleware, AuthRequest } from '../middleware/auth.js'
import type { Order, OrderItem } from '../types/index.js'
import { Response } from 'express'

const router = Router()

// All POS routes require sales or admin role
router.use(salesMiddleware)

/**
 * POST /api/pos/order
 * Create POS order (direct sale at store)
 */
router.post('/order', async (req: AuthRequest, res: Response) => {
  const client = await pool.connect()

  try {
    const { 
      items, 
      customerName = 'Khách lẻ', 
      customerPhone = '',
      customerId,
      paymentMethod = 'cash',
      shippingAddress = 'Mua tại cửa hàng',
      promotionId,
      discountAmount = 0
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Giỏ hàng trống' })
    }

    await client.query('BEGIN')

    // Validate items and calculate total
    let subtotal = 0
    const validatedItems: Array<{ productId: string; quantity: number; price: number; stock: number }> = []

    for (const item of items) {
      const product = await client.query<{ id: string; price: string; stock: number }>(
        'SELECT id, price, stock FROM products WHERE id = $1',
        [item.productId]
      )

      if (product.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, error: `Sản phẩm không tồn tại: ${item.productId}` })
      }

      const p = product.rows[0]
      if (p.stock < item.quantity) {
        await client.query('ROLLBACK')
        return res.status(400).json({ 
          success: false, 
          error: `Không đủ hàng trong kho. Còn lại: ${p.stock}` 
        })
      }

      const price = item.price || Number(p.price)
      subtotal += price * item.quantity
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
        stock: p.stock
      })
    }

    // Calculate final total with discount
    const finalDiscount = Math.min(discountAmount, subtotal)
    const total = subtotal - finalDiscount

    // Validate promotion if provided
    if (promotionId) {
      const promo = await client.query(
        `SELECT id, usage_limit, used_count FROM promotions 
         WHERE id = $1 AND is_active = true 
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())`,
        [promotionId]
      )
      if (promo.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, error: 'Mã giảm giá không hợp lệ' })
      }
      const p = promo.rows[0]
      if (p.usage_limit && p.used_count >= p.usage_limit) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, error: 'Mã giảm giá đã hết lượt sử dụng' })
      }
    }

    // Create order - POS orders are immediately confirmed
    const orderResult = await client.query<Order>(
      `INSERT INTO orders (
        id, user_id, total, shipping_address, payment_method, 
        status, recipient_name, phone, note, promotion_id, discount_amount
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        'confirmed', $5, $6, $7, $8, $9
      ) RETURNING *`,
      [
        customerId || null, // Can be null for walk-in customers
        total,
        shippingAddress,
        paymentMethod,
        customerName,
        customerPhone,
        `POS - Nhân viên: ${req.user!.email}`,
        promotionId || null,
        finalDiscount
      ]
    )
    const order = orderResult.rows[0]

    // Create order items and update stock
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, item.price]
      )

      // Update stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.productId]
      )

      // Log stock transaction
      await client.query(
        `INSERT INTO stock_transactions (id, product_id, user_id, type, quantity, reason, reference, stock_before, stock_after)
         VALUES (gen_random_uuid(), $1, $2, 'order', $3, 'Bán hàng POS', $4, $5, $6)`,
        [
          item.productId,
          req.user!.userId,
          -item.quantity,
          order.id,
          item.stock,
          item.stock - item.quantity
        ]
      )
    }

    // Update promotion usage count if used
    if (promotionId) {
      await client.query(
        'UPDATE promotions SET used_count = used_count + 1 WHERE id = $1',
        [promotionId]
      )
      // Record promotion usage
      await client.query(
        `INSERT INTO promotion_usage (id, promotion_id, order_id, discount_amount)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [promotionId, order.id, finalDiscount]
      )
    }

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        total: Number(order.total),
        status: order.status,
        paymentMethod: order.payment_method,
        customerName,
        customerPhone,
        createdAt: order.created_at
      },
      message: 'Tạo đơn hàng thành công'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create POS order error:', error)
    res.status(500).json({ success: false, error: 'Lỗi tạo đơn hàng' })
  } finally {
    client.release()
  }
})

/**
 * GET /api/pos/orders
 * Get today's POS orders
 */
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const orders = await query<Order & { recipient_name: string; items_count: number }>(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
       FROM orders o
       WHERE o.note LIKE 'POS%'
         AND o.created_at >= $1
       ORDER BY o.created_at DESC`,
      [today.toISOString()]
    )

    res.json({
      success: true,
      data: orders.map(o => ({
        id: o.id,
        total: Number(o.total),
        status: o.status,
        customerName: o.recipient_name,
        itemsCount: Number(o.items_count),
        createdAt: o.created_at
      }))
    })
  } catch (error) {
    console.error('Get POS orders error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy danh sách đơn hàng' })
  }
})

/**
 * GET /api/pos/history
 * Get POS order history with filters
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { search, from, to, payment, page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, parseInt(limit as string))
    const offset = (pageNum - 1) * limitNum

    let whereClause = "WHERE o.note LIKE 'POS%'"
    const params: unknown[] = []
    let paramIdx = 1

    if (from) {
      whereClause += ` AND o.created_at >= $${paramIdx++}`
      params.push(from)
    }
    if (to) {
      whereClause += ` AND o.created_at <= $${paramIdx++}`
      params.push(to)
    }
    if (payment && payment !== 'all') {
      whereClause += ` AND o.payment_method = $${paramIdx++}`
      params.push(payment)
    }
    if (search) {
      whereClause += ` AND (o.id::text ILIKE $${paramIdx} OR o.recipient_name ILIKE $${paramIdx} OR o.phone ILIKE $${paramIdx})`
      params.push(`%${search}%`)
      paramIdx++
    }

    // Count total
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0')

    // Get orders
    const orders = await query<{
      id: string; total: string; status: string; payment_method: string
      recipient_name: string; phone: string; created_at: string
      discount_amount: string; items_count: string; staff_email: string
    }>(
      `SELECT o.id, o.total, o.status, o.payment_method, o.recipient_name, o.phone, 
              o.created_at, COALESCE(o.discount_amount, 0) as discount_amount,
              (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
              SUBSTRING(o.note FROM 'Nhân viên: (.+)$') as staff_email
       FROM orders o
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    )

    res.json({
      success: true,
      data: orders.map(o => ({
        id: o.id,
        total: parseFloat(o.total),
        status: o.status,
        paymentMethod: o.payment_method,
        customerName: o.recipient_name,
        phone: o.phone,
        discount: parseFloat(o.discount_amount),
        itemsCount: parseInt(o.items_count),
        staffEmail: o.staff_email,
        createdAt: o.created_at
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get POS history error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy lịch sử' })
  }
})

/**
 * GET /api/pos/order/:id
 * Get single POS order detail for receipt
 */
router.get('/order/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const order = await queryOne<{
      id: string; total: string; status: string; payment_method: string
      recipient_name: string; phone: string; created_at: string
      discount_amount: string; note: string; promotion_id: string
    }>(
      `SELECT o.*, COALESCE(o.discount_amount, 0) as discount_amount
       FROM orders o WHERE o.id = $1 AND o.note LIKE 'POS%'`,
      [id]
    )

    if (!order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' })
    }

    // Get order items
    const items = await query<{
      id: string; product_id: string; quantity: string; price: string
      name: string; images: string[]
    }>(
      `SELECT oi.*, p.name, p.images
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    )

    // Get promotion info if used
    let promotion = null
    if (order.promotion_id) {
      promotion = await queryOne<{ code: string; name: string }>(
        'SELECT code, name FROM promotions WHERE id = $1',
        [order.promotion_id]
      )
    }

    const subtotal = items.reduce((sum, i) => sum + parseFloat(i.price) * parseInt(i.quantity), 0)

    res.json({
      success: true,
      data: {
        id: order.id,
        total: parseFloat(order.total),
        subtotal,
        discount: parseFloat(order.discount_amount),
        status: order.status,
        paymentMethod: order.payment_method,
        customerName: order.recipient_name,
        phone: order.phone,
        createdAt: order.created_at,
        staffEmail: order.note?.match(/Nhân viên: (.+)$/)?.[1] || '',
        promotion: promotion ? { code: promotion.code, name: promotion.name } : null,
        items: items.map(i => ({
          id: i.id,
          productId: i.product_id,
          name: i.name,
          image: i.images?.[0] || null,
          quantity: parseInt(i.quantity),
          price: parseFloat(i.price)
        }))
      }
    })
  } catch (error) {
    console.error('Get POS order detail error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy chi tiết đơn hàng' })
  }
})

/**
 * GET /api/pos/stats
 * Get today's sales stats
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = await queryOne<{ 
      total_orders: string
      total_revenue: string
      total_items: string 
    }>(
      `SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue,
        COALESCE(SUM(oi.quantity), 0) as total_items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.note LIKE 'POS%'
         AND o.created_at >= $1
         AND o.status != 'cancelled'`,
      [today.toISOString()]
    )

    res.json({
      success: true,
      data: {
        totalOrders: parseInt(stats?.total_orders || '0'),
        totalRevenue: parseFloat(stats?.total_revenue || '0'),
        totalItems: parseInt(stats?.total_items || '0')
      }
    })
  } catch (error) {
    console.error('Get POS stats error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy thống kê' })
  }
})

export default router
