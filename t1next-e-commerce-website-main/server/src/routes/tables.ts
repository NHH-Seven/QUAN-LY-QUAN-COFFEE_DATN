/**
 * Tables Management Routes
 * Quản lý bàn cho quán cà phê
 */

import { Router } from 'express'
import { query, queryOne, pool } from '../db/index.js'
import { authMiddleware, adminMiddleware, staffMiddleware } from '../middleware/auth.js'
import { emitToRoom } from '../socket/index.js'

const router = Router()

// Types
interface Area {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  table_count?: number
}

interface Table {
  id: string
  table_number: string
  area_id: string | null
  area_name?: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  current_order_id: string | null
  current_guests: number
  occupied_at: Date | null
  reserved_at: Date | null
  reserved_for: string | null
  reserved_phone: string | null
  notes: string | null
  is_active: boolean
}

interface TableOrder {
  id: string
  order_number: string
  table_id: string
  staff_id: string | null
  staff_name?: string
  guests_count: number
  subtotal: number
  discount_amount: number
  discount_reason: string | null
  total: number
  status: 'active' | 'completed' | 'cancelled'
  payment_method: string | null
  payment_status: 'pending' | 'paid' | 'refunded'
  paid_at: Date | null
  notes: string | null
  created_at: Date
  items?: TableOrderItem[]
}

interface TableOrderItem {
  id: string
  table_order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  quantity: number
  price: number
  notes: string | null
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
}

// ==================== AREAS ====================

// GET /api/tables/areas - Lấy danh sách khu vực
router.get('/areas', async (_req, res) => {
  try {
    const areas = await query<Area & { table_count: string }>(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM tables t WHERE t.area_id = a.id AND t.is_active = true) as table_count
      FROM areas a 
      WHERE a.is_active = true 
      ORDER BY a.sort_order, a.name
    `)

    res.json({
      success: true,
      data: areas.map(a => ({ ...a, table_count: parseInt(a.table_count) }))
    })
  } catch (error) {
    console.error('Get areas error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/tables/areas - Tạo khu vực mới (Admin only)
router.post('/areas', adminMiddleware, async (req, res) => {
  try {
    const { name, description, sort_order } = req.body

    if (!name) {
      return res.status(400).json({ success: false, error: 'Tên khu vực là bắt buộc' })
    }

    const area = await queryOne<Area>(
      `INSERT INTO areas (name, description, sort_order) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, sort_order || 0]
    )

    res.status(201).json({ success: true, data: area })
  } catch (error) {
    console.error('Create area error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/tables/areas/:id - Cập nhật khu vực (Admin only)
router.put('/areas/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, sort_order, is_active } = req.body

    const area = await queryOne<Area>(
      `UPDATE areas SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        sort_order = COALESCE($3, sort_order),
        is_active = COALESCE($4, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name, description, sort_order, is_active, id]
    )

    if (!area) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khu vực' })
    }

    res.json({ success: true, data: area })
  } catch (error) {
    console.error('Update area error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// DELETE /api/tables/areas/:id - Xóa khu vực (Admin only)
router.delete('/areas/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    // Soft delete
    const result = await queryOne<Area>(
      'UPDATE areas SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy khu vực' })
    }

    res.json({ success: true, message: 'Đã xóa khu vực' })
  } catch (error) {
    console.error('Delete area error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// ==================== TABLES ====================

// GET /api/tables - Lấy danh sách bàn
router.get('/', async (req, res) => {
  try {
    const { area_id, status } = req.query

    let sql = `
      SELECT t.*, a.name as area_name
      FROM tables t
      LEFT JOIN areas a ON t.area_id = a.id
      WHERE t.is_active = true
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (area_id) {
      sql += ` AND t.area_id = $${paramIndex}`
      params.push(area_id)
      paramIndex++
    }

    if (status) {
      sql += ` AND t.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    sql += ' ORDER BY a.sort_order, t.table_number'

    const tables = await query<Table>(sql, params)

    res.json({ success: true, data: tables })
  } catch (error) {
    console.error('Get tables error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/tables/overview - Lấy tổng quan bàn theo khu vực
router.get('/overview', async (_req, res) => {
  try {
    const areas = await query<Area & { table_count: string }>(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM tables t WHERE t.area_id = a.id AND t.is_active = true) as table_count
      FROM areas a 
      WHERE a.is_active = true 
      ORDER BY a.sort_order
    `)

    const tables = await query<Table>(`
      SELECT t.*, a.name as area_name
      FROM tables t
      LEFT JOIN areas a ON t.area_id = a.id
      WHERE t.is_active = true
      ORDER BY a.sort_order, t.table_number
    `)

    // Group tables by area
    const tablesByArea = areas.map(area => ({
      ...area,
      table_count: parseInt(area.table_count),
      tables: tables.filter(t => t.area_id === area.id)
    }))

    // Stats
    const stats = {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      cleaning: tables.filter(t => t.status === 'cleaning').length,
    }

    res.json({ success: true, data: { areas: tablesByArea, stats } })
  } catch (error) {
    console.error('Get tables overview error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})


// GET /api/tables/:id - Lấy chi tiết bàn
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const table = await queryOne<Table>(`
      SELECT t.*, a.name as area_name
      FROM tables t
      LEFT JOIN areas a ON t.area_id = a.id
      WHERE t.id = $1
    `, [id])

    if (!table) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bàn' })
    }

    // Get current order if occupied
    let currentOrder: TableOrder | null = null
    if (table.current_order_id) {
      currentOrder = await queryOne<TableOrder>(`
        SELECT o.*, u.name as staff_name
        FROM table_orders o
        LEFT JOIN users u ON o.staff_id = u.id
        WHERE o.id = $1
      `, [table.current_order_id])

      if (currentOrder) {
        const items = await query<TableOrderItem>(
          'SELECT * FROM table_order_items WHERE table_order_id = $1 ORDER BY created_at',
          [currentOrder.id]
        )
        currentOrder.items = items
        currentOrder.subtotal = Number(currentOrder.subtotal)
        currentOrder.discount_amount = Number(currentOrder.discount_amount)
        currentOrder.total = Number(currentOrder.total)
      }
    }

    res.json({ success: true, data: { ...table, current_order: currentOrder } })
  } catch (error) {
    console.error('Get table detail error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/tables - Tạo bàn mới (Admin only)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { table_number, area_id, capacity, notes } = req.body

    if (!table_number) {
      return res.status(400).json({ success: false, error: 'Số bàn là bắt buộc' })
    }

    // Check duplicate
    const existing = await queryOne('SELECT id FROM tables WHERE table_number = $1', [table_number])
    if (existing) {
      return res.status(400).json({ success: false, error: 'Số bàn đã tồn tại' })
    }

    const table = await queryOne<Table>(
      `INSERT INTO tables (table_number, area_id, capacity, notes) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [table_number, area_id || null, capacity || 4, notes || null]
    )

    res.status(201).json({ success: true, data: table })
  } catch (error) {
    console.error('Create table error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/tables/:id - Cập nhật bàn (Admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { table_number, area_id, capacity, notes, is_active } = req.body

    // Check duplicate if changing table_number
    if (table_number) {
      const existing = await queryOne('SELECT id FROM tables WHERE table_number = $1 AND id != $2', [table_number, id])
      if (existing) {
        return res.status(400).json({ success: false, error: 'Số bàn đã tồn tại' })
      }
    }

    const table = await queryOne<Table>(
      `UPDATE tables SET 
        table_number = COALESCE($1, table_number),
        area_id = COALESCE($2, area_id),
        capacity = COALESCE($3, capacity),
        notes = COALESCE($4, notes),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [table_number, area_id, capacity, notes, is_active, id]
    )

    if (!table) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bàn' })
    }

    res.json({ success: true, data: table })
  } catch (error) {
    console.error('Update table error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// DELETE /api/tables/:id - Xóa bàn (Admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    // Check if table has active order
    const table = await queryOne<Table>('SELECT * FROM tables WHERE id = $1', [id])
    if (!table) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bàn' })
    }

    if (table.status === 'occupied' && table.current_order_id) {
      return res.status(400).json({ success: false, error: 'Không thể xóa bàn đang có khách' })
    }

    // Soft delete
    await queryOne(
      'UPDATE tables SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    )

    res.json({ success: true, message: 'Đã xóa bàn' })
  } catch (error) {
    console.error('Delete table error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// ==================== TABLE STATUS ====================

// PUT /api/tables/:id/status - Cập nhật trạng thái bàn (Staff+)
router.put('/:id/status', staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status, guests_count, reserved_for, reserved_phone, reserved_at } = req.body

    const validStatuses = ['available', 'occupied', 'reserved', 'cleaning']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' })
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date()
    }

    if (status === 'occupied') {
      updateData.occupied_at = new Date()
      updateData.current_guests = guests_count || 1
    } else if (status === 'reserved') {
      updateData.reserved_at = reserved_at || new Date()
      updateData.reserved_for = reserved_for || null
      updateData.reserved_phone = reserved_phone || null
    } else if (status === 'available') {
      updateData.occupied_at = null
      updateData.current_guests = 0
      updateData.reserved_at = null
      updateData.reserved_for = null
      updateData.reserved_phone = null
      updateData.current_order_id = null
    }

    const table = await queryOne<Table>(
      `UPDATE tables SET 
        status = $1, 
        occupied_at = $2,
        current_guests = $3,
        reserved_at = $4,
        reserved_for = $5,
        reserved_phone = $6,
        current_order_id = $7,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        status,
        updateData.occupied_at || null,
        updateData.current_guests || 0,
        updateData.reserved_at || null,
        updateData.reserved_for || null,
        updateData.reserved_phone || null,
        updateData.current_order_id || null,
        id
      ]
    )

    if (!table) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bàn' })
    }

    res.json({ success: true, data: table })
  } catch (error) {
    console.error('Update table status error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})


// ==================== TABLE ORDERS ====================

// Generate order number
function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

// POST /api/tables/:id/orders - Tạo đơn hàng cho bàn (Staff+)
router.post('/:id/orders', staffMiddleware, async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { id } = req.params
    const { guests_count, notes } = req.body
    const staffId = req.user?.id

    await client.query('BEGIN')

    // Check table exists and available
    const tableResult = await client.query<Table>(
      'SELECT * FROM tables WHERE id = $1 AND is_active = true',
      [id]
    )

    if (tableResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Không tìm thấy bàn' })
    }

    const table = tableResult.rows[0]

    if (table.status === 'occupied' && table.current_order_id) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, error: 'Bàn đang có đơn hàng' })
    }

    // Create order
    const orderNumber = generateOrderNumber()
    const orderResult = await client.query<TableOrder>(
      `INSERT INTO table_orders (order_number, table_id, staff_id, guests_count, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderNumber, id, staffId, guests_count || 1, notes || null]
    )

    const order = orderResult.rows[0]

    // Update table status
    await client.query(
      `UPDATE tables SET 
        status = 'occupied', 
        current_order_id = $1, 
        current_guests = $2,
        occupied_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [order.id, guests_count || 1, id]
    )

    await client.query('COMMIT')

    res.status(201).json({ success: true, data: { ...order, items: [] } })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create table order error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// GET /api/tables/orders/:orderId - Lấy chi tiết đơn hàng
router.get('/orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await queryOne<TableOrder>(`
      SELECT o.*, u.name as staff_name, t.table_number
      FROM table_orders o
      LEFT JOIN users u ON o.staff_id = u.id
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.id = $1
    `, [orderId])

    if (!order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' })
    }

    const items = await query<TableOrderItem>(
      'SELECT * FROM table_order_items WHERE table_order_id = $1 ORDER BY created_at',
      [orderId]
    )

    res.json({
      success: true,
      data: {
        ...order,
        subtotal: Number(order.subtotal),
        discount_amount: Number(order.discount_amount),
        total: Number(order.total),
        items: items.map(i => ({ ...i, price: Number(i.price) }))
      }
    })
  } catch (error) {
    console.error('Get table order error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/tables/orders/:orderId/items - Thêm món vào đơn (Staff+)
router.post('/orders/:orderId/items', staffMiddleware, async (req, res) => {
  const client = await pool.connect()

  try {
    const { orderId } = req.params
    const { product_id, quantity, notes } = req.body

    if (!product_id || !quantity) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin sản phẩm' })
    }

    await client.query('BEGIN')

    // Check order exists and active
    const orderResult = await client.query<TableOrder>(
      'SELECT * FROM table_orders WHERE id = $1 AND status = $2',
      [orderId, 'active']
    )

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại hoặc đã đóng' })
    }

    // Get product info
    const productResult = await client.query<{ id: string; name: string; price: number; images: string[] }>(
      'SELECT id, name, price, images FROM products WHERE id = $1',
      [product_id]
    )

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' })
    }

    const product = productResult.rows[0]

    // Add item
    const itemResult = await client.query<TableOrderItem>(
      `INSERT INTO table_order_items (table_order_id, product_id, product_name, product_image, quantity, price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orderId, product_id, product.name, product.images?.[0] || null, quantity, product.price, notes || null]
    )

    // Update order totals
    await client.query(`
      UPDATE table_orders SET 
        subtotal = (SELECT COALESCE(SUM(price * quantity), 0) FROM table_order_items WHERE table_order_id = $1 AND status != 'cancelled'),
        total = subtotal - discount_amount,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId])

    // Recalculate total
    await client.query(`
      UPDATE table_orders SET 
        total = subtotal - discount_amount
      WHERE id = $1
    `, [orderId])

    await client.query('COMMIT')

    const item = itemResult.rows[0]
    
    // Get table number for notification
    const tableResult = await client.query(
      'SELECT t.table_number FROM tables t JOIN table_orders tor ON t.id = tor.table_id WHERE tor.id = $1', 
      [orderId]
    )
    const tableNumber = tableResult.rows[0]?.table_number || 'Unknown'
    
    // Emit to kitchen for real-time update
    console.log('🔔 Emitting kitchen:new-item for:', item.product_name, 'Table:', tableNumber)
    emitToRoom('kitchen', 'kitchen:new-item', {
      id: item.id,
      table_order_id: orderId,
      order_number: orderResult.rows[0].order_number,
      table_number: tableNumber,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status,
      created_at: item.created_at
    })
    
    res.status(201).json({ success: true, data: { ...item, price: Number(item.price) } })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Add order item error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// PUT /api/tables/orders/:orderId/items/:itemId - Cập nhật món (Staff+)
router.put('/orders/:orderId/items/:itemId', staffMiddleware, async (req, res) => {
  const client = await pool.connect()

  try {
    const { orderId, itemId } = req.params
    const { quantity, status, notes } = req.body

    await client.query('BEGIN')

    const itemResult = await client.query<TableOrderItem>(
      `UPDATE table_order_items SET 
        quantity = COALESCE($1, quantity),
        status = COALESCE($2, status),
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND table_order_id = $5 RETURNING *`,
      [quantity, status, notes, itemId, orderId]
    )

    if (itemResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Không tìm thấy món' })
    }

    // Update order totals
    await client.query(`
      UPDATE table_orders SET 
        subtotal = (SELECT COALESCE(SUM(price * quantity), 0) FROM table_order_items WHERE table_order_id = $1 AND status != 'cancelled'),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId])

    await client.query(`
      UPDATE table_orders SET total = subtotal - discount_amount WHERE id = $1
    `, [orderId])

    await client.query('COMMIT')

    const item = itemResult.rows[0]
    res.json({ success: true, data: { ...item, price: Number(item.price) } })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Update order item error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// DELETE /api/tables/orders/:orderId/items/:itemId - Xóa món (Staff+)
router.delete('/orders/:orderId/items/:itemId', staffMiddleware, async (req, res) => {
  const client = await pool.connect()

  try {
    const { orderId, itemId } = req.params

    await client.query('BEGIN')

    // Cancel item instead of delete
    const result = await client.query(
      `UPDATE table_order_items SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND table_order_id = $2 RETURNING id`,
      [itemId, orderId]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Không tìm thấy món' })
    }

    // Update order totals
    await client.query(`
      UPDATE table_orders SET 
        subtotal = (SELECT COALESCE(SUM(price * quantity), 0) FROM table_order_items WHERE table_order_id = $1 AND status != 'cancelled'),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId])

    await client.query(`
      UPDATE table_orders SET total = subtotal - discount_amount WHERE id = $1
    `, [orderId])

    await client.query('COMMIT')

    res.json({ success: true, message: 'Đã hủy món' })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Delete order item error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// POST /api/tables/orders/:orderId/checkout - Thanh toán (Staff+)
router.post('/orders/:orderId/checkout', staffMiddleware, async (req, res) => {
  const client = await pool.connect()

  try {
    const { orderId } = req.params
    const { payment_method, discount_amount, discount_reason, recipient_name, phone, shipping_address } = req.body

    await client.query('BEGIN')

    // Get table order with items
    const orderResult = await client.query<TableOrder & { table_number: string }>(
      `SELECT o.*, t.table_number 
       FROM table_orders o
       JOIN tables t ON o.table_id = t.id
       WHERE o.id = $1 AND o.status = $2`,
      [orderId, 'active']
    )

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại hoặc đã thanh toán' })
    }

    const tableOrder = orderResult.rows[0]

    // Get order items
    const itemsResult = await client.query<TableOrderItem>(
      'SELECT * FROM table_order_items WHERE table_order_id = $1 AND status != $2',
      [orderId, 'cancelled']
    )

    if (itemsResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, error: 'Đơn hàng không có món nào' })
    }

    // Calculate final total
    const finalDiscount = discount_amount || tableOrder.discount_amount || 0
    const finalTotal = Number(tableOrder.subtotal) - Number(finalDiscount)

    // Create Order in orders table (for Orders management page)
    const newOrderResult = await client.query(
      `INSERT INTO orders (
        id,
        user_id, 
        total, 
        subtotal,
        discount_amount,
        shipping_fee,
        status, 
        shipping_address, 
        payment_method,
        recipient_name,
        phone,
        note
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        null, // Khách vãng lai (dine-in)
        finalTotal,
        tableOrder.subtotal,
        finalDiscount,
        0, // No shipping fee for dine-in
        'delivered', // Đã giao (khách đã ăn xong và thanh toán)
        shipping_address || `Bàn ${tableOrder.table_number}`,
        payment_method || 'cash',
        recipient_name || 'Khách',
        phone || 'N/A',
        `Đơn tại bàn ${tableOrder.table_number}. ${discount_reason || ''}`
      ]
    )

    const newOrderId = newOrderResult.rows[0].id

    // Copy items to order_items
    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [newOrderId, item.product_id, item.quantity, item.price]
      )
    }

    // Update table order
    const updatedTableOrder = await client.query<TableOrder>(
      `UPDATE table_orders SET 
        discount_amount = $1,
        discount_reason = $2,
        total = $3,
        status = 'completed',
        payment_method = $4,
        payment_status = 'paid',
        paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [finalDiscount, discount_reason || null, finalTotal, payment_method || 'cash', orderId]
    )

    // Free up the table
    await client.query(
      `UPDATE tables SET 
        status = 'available',
        current_order_id = NULL,
        current_guests = 0,
        occupied_at = NULL,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [tableOrder.table_id]
    )

    await client.query('COMMIT')

    // Emit to staff for notification
    emitToRoom('staff', 'order:new', {
      orderId: newOrderId,
      tableNumber: tableOrder.table_number,
      total: finalTotal,
      status: 'delivered'
    })

    res.json({
      success: true,
      data: {
        tableOrder: {
          ...updatedTableOrder.rows[0],
          subtotal: Number(updatedTableOrder.rows[0].subtotal),
          discount_amount: Number(updatedTableOrder.rows[0].discount_amount),
          total: Number(updatedTableOrder.rows[0].total)
        },
        orderId: newOrderId
      },
      message: 'Thanh toán thành công. Đơn hàng đã hoàn tất.'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Checkout error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// POST /api/tables/orders/:orderId/cancel - Hủy đơn (Staff+)
router.post('/orders/:orderId/cancel', staffMiddleware, async (req, res) => {
  const client = await pool.connect()

  try {
    const { orderId } = req.params
    const { reason } = req.body

    await client.query('BEGIN')

    const orderResult = await client.query<TableOrder>(
      'SELECT * FROM table_orders WHERE id = $1 AND status = $2',
      [orderId, 'active']
    )

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại hoặc đã đóng' })
    }

    const order = orderResult.rows[0]

    // Cancel order
    await client.query(
      `UPDATE table_orders SET 
        status = 'cancelled',
        notes = COALESCE(notes || ' | ', '') || $1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason ? `Lý do hủy: ${reason}` : 'Đã hủy', orderId]
    )

    // Free up the table
    await client.query(
      `UPDATE tables SET 
        status = 'available',
        current_order_id = NULL,
        current_guests = 0,
        occupied_at = NULL,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [order.table_id]
    )

    await client.query('COMMIT')

    res.json({ success: true, message: 'Đã hủy đơn hàng' })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Cancel order error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

export default router
