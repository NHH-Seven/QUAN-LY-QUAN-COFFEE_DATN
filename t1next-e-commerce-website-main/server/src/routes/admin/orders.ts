import { Router } from 'express'
import { pool, query, queryOne } from '../../db/index.js'
import { emitToUser } from '../../socket/index.js'
import { notifyOrderStatus } from '../../services/push.service.js'
import { createAndPushNotification } from '../../routes/notifications.js'
import type { Order, OrderItem } from '../../types/index.js'

const router = Router()

interface AdminOrder extends Order {
  user_name: string | null
  user_email: string | null
  items_count: number
}

interface OrderWithItems extends Order {
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  items: Array<OrderItem & { name: string; images: string[]; slug: string }>
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['awaiting_payment', 'confirmed', 'cancelled'],
  awaiting_payment: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipping', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
}

// GET /api/admin/orders - Paginated, filterable order list
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      from,
      to,
      sort = 'created_at',
      order = 'desc',
    } = req.query

    let sql = `
      SELECT o.*, u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    // Status filter
    if (status && typeof status === 'string') {
      sql += ' AND o.status = $' + paramIndex
      params.push(status)
      paramIndex++
    }

    // Date range filter
    if (from && typeof from === 'string') {
      sql += ' AND o.created_at >= $' + paramIndex
      params.push(from)
      paramIndex++
    }

    if (to && typeof to === 'string') {
      sql += ' AND o.created_at <= $' + paramIndex
      params.push(to)
      paramIndex++
    }


    // Sorting
    const allowedSortFields = ['created_at', 'total', 'status']
    const sortField = allowedSortFields.includes(sort as string) ? sort : 'created_at'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
    sql += ' ORDER BY o.' + sortField + ' ' + sortOrder

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    // Get total count
    const countSql = sql
      .replace(/SELECT o\.\*, u\.name as user_name, u\.email as user_email,[\s\S]*?FROM orders o/, 'SELECT COUNT(*) FROM orders o')
      .replace(/ORDER BY.*$/, '')

    const countResult = await query<{ count: string }>(countSql, params)
    const total = parseInt(countResult[0]?.count || '0', 10)

    // Add pagination
    sql += ' LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1)
    params.push(limitNum, offset)

    const orders = await query<AdminOrder>(sql, params)

    // Convert total to number
    const ordersWithNumericTotal = orders.map(order => ({
      ...order,
      total: Number(order.total)
    }))

    res.json({
      success: true,
      data: ordersWithNumericTotal,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (error) {
    console.error('Get admin orders error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/admin/orders/:id - Get order detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const order = await queryOne<OrderWithItems>(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    )

    if (!order) {
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    // Get order items
    const items = await query<OrderItem & { name: string; images: string[]; slug: string }>(
      `SELECT oi.*, p.name, p.images, p.slug
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    )

    // Convert price to number
    const itemsWithNumericPrice = items.map(item => ({
      ...item,
      price: Number(item.price)
    }))

    res.json({
      success: true,
      data: {
        ...order,
        total: Number(order.total),
        items: itemsWithNumericPrice,
      },
    })
  } catch (error) {
    console.error('Get admin order detail error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})


// PUT /api/admin/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  const client = await pool.connect()

  try {
    const { id } = req.params
    const { status: newStatus } = req.body

    if (!newStatus || typeof newStatus !== 'string') {
      return res.status(400).json({ success: false, error: 'Trạng thái là bắt buộc' })
    }

    const validStatuses = ['pending', 'awaiting_payment', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned']
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ success: false, error: 'Trạng thái đơn hàng không hợp lệ' })
    }

    await client.query('BEGIN')

    // Get current order
    const orderResult = await client.query<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    )

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    const order = orderResult.rows[0]
    const currentStatus = order.status

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || []
    if (!allowedTransitions.includes(newStatus)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        success: false,
        error: `Không thể chuyển từ trạng thái "${currentStatus}" sang "${newStatus}"`,
      })
    }

    // If cancelling, restore stock
    if (newStatus === 'cancelled') {
      const items = await client.query<OrderItem>(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      )

      for (const item of items.rows) {
        if (item.product_id) {
          await client.query(
            'UPDATE products SET stock = stock + $1 WHERE id = $2',
            [item.quantity, item.product_id]
          )
        }
      }
    }

    // Update order status
    const updatedOrder = await client.query<Order>(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    )

    await client.query('COMMIT')

    // Emit socket notification to user
    if (order.user_id) {
      const statusLabels: Record<string, string> = {
        pending: 'Chờ xác nhận',
        awaiting_payment: 'Chờ thanh toán',
        confirmed: 'Đã xác nhận',
        processing: 'Đang xử lý',
        shipping: 'Đang giao hàng',
        delivered: 'Đã giao hàng',
        cancelled: 'Đã hủy',
        returned: 'Đã hoàn trả'
      }
      emitToUser(order.user_id, 'order:status_changed', {
        orderId: order.id,
        status: newStatus,
        statusLabel: statusLabels[newStatus] || newStatus,
        total: Number(order.total),
        timestamp: new Date().toISOString()
      })

      // Send push notification for order status change
      notifyOrderStatus(
        order.user_id,
        order.id,
        newStatus,
        Number(order.total)
      ).catch(err => console.error('Push notification error:', err))

      // Create in-app notification
      createAndPushNotification(
        order.user_id,
        'order_status',
        `Đơn hàng ${statusLabels[newStatus] || newStatus}`,
        `Đơn hàng #${order.id.substring(0, 8)} đã được cập nhật trạng thái`,
        `/profile?tab=orders&order=${order.id}`,
        { orderId: order.id, status: newStatus }
      ).catch(err => console.error('Notification error:', err))
    }

    res.json({
      success: true,
      data: updatedOrder.rows[0],
      message: 'Cập nhật trạng thái đơn hàng thành công',
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Update order status error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

export default router
