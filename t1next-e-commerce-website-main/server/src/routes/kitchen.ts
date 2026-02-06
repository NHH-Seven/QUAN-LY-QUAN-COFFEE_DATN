/**
 * Kitchen Display System (KDS) Routes
 * Quản lý màn hình pha chế cho nhân viên
 */

import { Router } from 'express'
import { query, queryOne, pool } from '../db/index.js'
import { staffMiddleware } from '../middleware/auth.js'
import { emitToRoom } from '../socket/index.js'

const router = Router()

interface OrderItem {
  id: string
  table_order_id: string
  order_number?: string
  table_number?: string
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  price: number
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

// GET /api/kitchen/orders - Lấy danh sách món cần pha chế
router.get('/orders', staffMiddleware, async (req, res) => {
  try {
    const { status } = req.query

    let sql = `
      SELECT toi.*, 
        tor.order_number, 
        t.table_number,
        tor.id as table_order_id
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE tor.status = 'active'
    `
    const params: unknown[] = []
    let idx = 1

    if (status) {
      sql += ` AND toi.status = $${idx}`
      params.push(status)
      idx++
    } else {
      // Default: show pending and preparing
      sql += ` AND toi.status IN ('pending', 'preparing')`
    }

    sql += ' ORDER BY toi.created_at ASC'

    const items = await query<OrderItem>(sql, params)
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Get kitchen orders error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})


// GET /api/kitchen/stats - Thống kê pha chế
router.get('/stats', staffMiddleware, async (_req, res) => {
  try {
    const stats = await queryOne<{
      pending: string
      preparing: string
      ready: string
      served: string
    }>(`
      SELECT 
        COUNT(*) FILTER (WHERE toi.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE toi.status = 'preparing') as preparing,
        COUNT(*) FILTER (WHERE toi.status = 'ready') as ready,
        COUNT(*) FILTER (WHERE toi.status = 'served') as served
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      WHERE tor.status = 'active'
    `)

    res.json({
      success: true,
      data: {
        pending: parseInt(stats?.pending || '0'),
        preparing: parseInt(stats?.preparing || '0'),
        ready: parseInt(stats?.ready || '0'),
        served: parseInt(stats?.served || '0'),
      }
    })
  } catch (error) {
    console.error('Get kitchen stats error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/kitchen/items/:id/status - Cập nhật trạng thái món
router.put('/items/:id/status', staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' })
    }

    // Get item info before update
    const itemBefore = await queryOne<OrderItem>(`
      SELECT toi.*, tor.order_number, t.table_number
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE toi.id = $1
    `, [id])

    if (!itemBefore) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy món' })
    }

    // Update status
    const item = await queryOne<OrderItem>(
      `UPDATE table_order_items SET 
        status = $1, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [status, id]
    )

    // Emit socket event for real-time updates
    const eventData = {
      itemId: id,
      orderId: itemBefore.table_order_id,
      orderNumber: itemBefore.order_number,
      tableNumber: itemBefore.table_number,
      productName: itemBefore.product_name,
      quantity: itemBefore.quantity,
      status,
      previousStatus: itemBefore.status,
    }

    // Notify kitchen display
    emitToRoom('kitchen', 'kitchen:item_updated', eventData)

    // If ready, notify service staff
    if (status === 'ready') {
      emitToRoom('service', 'service:item_ready', eventData)
    }

    res.json({ success: true, data: item })
  } catch (error) {
    console.error('Update item status error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/kitchen/items/:id/start - Bắt đầu pha chế
router.put('/items/:id/start', staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const item = await queryOne<OrderItem>(`
      SELECT toi.*, tor.order_number, t.table_number
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE toi.id = $1 AND toi.status = 'pending'
    `, [id])

    if (!item) {
      return res.status(404).json({ success: false, error: 'Món không tồn tại hoặc đã được xử lý' })
    }

    const updated = await queryOne<OrderItem>(
      `UPDATE table_order_items SET status = 'preparing', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    )

    emitToRoom('kitchen', 'kitchen:item_updated', {
      itemId: id,
      orderNumber: item.order_number,
      tableNumber: item.table_number,
      productName: item.product_name,
      status: 'preparing',
    })

    res.json({ success: true, data: updated, message: 'Đã bắt đầu pha chế' })
  } catch (error) {
    console.error('Start preparing error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})


// PUT /api/kitchen/items/:id/complete - Hoàn thành pha chế
router.put('/items/:id/complete', staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const item = await queryOne<OrderItem>(`
      SELECT toi.*, tor.order_number, t.table_number
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE toi.id = $1 AND toi.status IN ('pending', 'preparing')
    `, [id])

    if (!item) {
      return res.status(404).json({ success: false, error: 'Món không tồn tại hoặc đã hoàn thành' })
    }

    const updated = await queryOne<OrderItem>(
      `UPDATE table_order_items SET status = 'ready', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    )

    // Notify both kitchen and service
    const eventData = {
      itemId: id,
      orderId: item.table_order_id,
      orderNumber: item.order_number,
      tableNumber: item.table_number,
      productName: item.product_name,
      quantity: item.quantity,
      status: 'ready',
    }

    emitToRoom('kitchen', 'kitchen:item_updated', eventData)
    emitToRoom('service', 'service:item_ready', eventData)

    res.json({ success: true, data: updated, message: 'Món đã sẵn sàng phục vụ' })
  } catch (error) {
    console.error('Complete item error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/kitchen/items/:id/serve - Đánh dấu đã phục vụ
router.put('/items/:id/serve', staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const item = await queryOne<OrderItem>(`
      SELECT toi.*, tor.order_number, t.table_number
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE toi.id = $1 AND toi.status = 'ready'
    `, [id])

    if (!item) {
      return res.status(404).json({ success: false, error: 'Món chưa sẵn sàng hoặc đã phục vụ' })
    }

    const updated = await queryOne<OrderItem>(
      `UPDATE table_order_items SET status = 'served', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    )

    emitToRoom('kitchen', 'kitchen:item_updated', {
      itemId: id,
      orderNumber: item.order_number,
      tableNumber: item.table_number,
      productName: item.product_name,
      status: 'served',
    })

    res.json({ success: true, data: updated, message: 'Đã phục vụ khách' })
  } catch (error) {
    console.error('Serve item error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/kitchen/items/bulk-complete - Hoàn thành nhiều món
router.post('/items/bulk-complete', staffMiddleware, async (req, res) => {
  const client = await pool.connect()
  try {
    const { itemIds } = req.body

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Danh sách món trống' })
    }

    await client.query('BEGIN')

    // Get items info
    const items = await client.query<OrderItem>(`
      SELECT toi.*, tor.order_number, t.table_number
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE toi.id = ANY($1) AND toi.status IN ('pending', 'preparing')
    `, [itemIds])

    // Update all
    await client.query(
      `UPDATE table_order_items SET status = 'ready', updated_at = CURRENT_TIMESTAMP WHERE id = ANY($1)`,
      [itemIds]
    )

    await client.query('COMMIT')

    // Emit events for each item
    for (const item of items.rows) {
      const eventData = {
        itemId: item.id,
        orderNumber: item.order_number,
        tableNumber: item.table_number,
        productName: item.product_name,
        quantity: item.quantity,
        status: 'ready',
      }
      emitToRoom('kitchen', 'kitchen:item_updated', eventData)
      emitToRoom('service', 'service:item_ready', eventData)
    }

    res.json({ success: true, message: `Đã hoàn thành ${items.rows.length} món` })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Bulk complete error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// GET /api/kitchen/ready-items - Lấy món đã sẵn sàng (cho nhân viên phục vụ)
router.get('/ready-items', staffMiddleware, async (_req, res) => {
  try {
    const items = await query<OrderItem>(`
      SELECT toi.*, tor.order_number, t.table_number
      FROM table_order_items toi
      JOIN table_orders tor ON toi.table_order_id = tor.id
      JOIN tables t ON tor.table_id = t.id
      WHERE toi.status = 'ready' AND tor.status = 'active'
      ORDER BY toi.updated_at ASC
    `)

    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Get ready items error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

export default router
