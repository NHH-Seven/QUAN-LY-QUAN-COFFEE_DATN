import { Router } from 'express'
import { pool, query, queryOne } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import type { Order, OrderItem, CartItem, Product } from '../types/index.js'

const router = Router()

router.use(authMiddleware)

// Get user orders (legacy endpoint - use /my for pagination)
router.get('/', async (req, res) => {
  try {
    const orders = await query<Order>(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.userId]
    )

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await query<OrderItem & { name: string; images: string[] }>(
          `SELECT oi.*, p.name, p.images FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1`,
          [order.id]
        )
        // Convert price to number
        const itemsWithNumericPrice = items.map(item => ({
          ...item,
          price: Number(item.price)
        }))
        return { 
          ...order, 
          total: Number(order.total),
          items: itemsWithNumericPrice 
        }
      })
    )

    res.json({ success: true, data: ordersWithItems })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/orders/my - Get user's orders with pagination (Requirement 7.2)
router.get('/my', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = $1',
      [req.user!.userId]
    )
    const total = parseInt(countResult?.count || '0')
    const totalPages = Math.ceil(total / limit)

    // Get orders with pagination
    const orders = await query<Order & { recipient_name: string; phone: string; note: string | null }>(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user!.userId, limit, offset]
    )

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await query<OrderItem & { name: string; images: string[]; slug: string }>(
          `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price,
                  p.name, p.images, p.slug 
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1`,
          [order.id]
        )
        
        // Format items according to design
        const formattedItems = items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: Number(item.price),
          product: item.product_id ? {
            id: item.product_id,
            name: item.name,
            images: item.images,
            slug: item.slug
          } : null
        }))

        return {
          id: order.id,
          status: order.status,
          total: Number(order.total),
          shippingAddress: order.shipping_address,
          paymentMethod: order.payment_method,
          recipientName: order.recipient_name,
          phone: order.phone,
          note: order.note,
          createdAt: order.created_at,
          items: formattedItems
        }
      })
    )

    res.json({
      success: true,
      data: ordersWithItems,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Get my orders error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

// GET /api/orders/:id - Get single order (Requirements 5.2, 7.2)
// Allow owner or admin to view
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId
    const userRole = req.user!.role
    const orderId = req.params.id

    // Admin can view any order, regular users can only view their own
    let order: (Order & { recipient_name: string; phone: string; note: string | null }) | null

    if (userRole === 'admin') {
      order = await queryOne<Order & { recipient_name: string; phone: string; note: string | null }>(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      )
    } else {
      order = await queryOne<Order & { recipient_name: string; phone: string; note: string | null }>(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
      )
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' })
    }

    // Get order items with product details
    const items = await query<OrderItem & { name: string; images: string[]; slug: string }>(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price,
              p.name, p.images, p.slug 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    )

    // Format items according to design (OrderItemDetail interface)
    const formattedItems = items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: item.product_id ? {
        id: item.product_id,
        name: item.name,
        images: item.images,
        slug: item.slug
      } : null
    }))

    // Format response according to design (OrderDetail interface)
    res.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        shippingAddress: order.shipping_address,
        paymentMethod: order.payment_method,
        recipientName: order.recipient_name,
        phone: order.phone,
        note: order.note,
        createdAt: order.created_at,
        items: formattedItems
      }
    })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

// Create order from cart
router.post('/', async (req, res) => {
  const client = await pool.connect()

  try {
    const { shippingAddress, paymentMethod, recipient_name, phone, note, items: directItems, subtotal: directSubtotal, discount_amount, total: directTotal } = req.body

    if (!paymentMethod) {
      return res.status(400).json({ success: false, error: 'Payment method is required' })
    }

    await client.query('BEGIN')

    let orderItems: { product_id: string; quantity: number; price: number; name?: string; images?: string[] }[] = []
    let total = 0

    // Check if this is a direct order (from POS/Takeaway) or cart-based order
    if (directItems && Array.isArray(directItems)) {
      // Direct order - validate items and calculate total
      for (const item of directItems) {
        const product = await client.query<{ id: string; price: number; stock: number; name: string; images: string[] }>(
          'SELECT id, price, stock, name, images FROM products WHERE id = $1',
          [item.product_id]
        )

        if (product.rows.length === 0) {
          await client.query('ROLLBACK')
          return res.status(400).json({ success: false, error: `Product ${item.product_id} not found` })
        }

        const prod = product.rows[0]
        if (prod.stock < item.quantity) {
          await client.query('ROLLBACK')
          return res.status(400).json({ success: false, error: `Not enough stock for ${prod.name}` })
        }

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price || prod.price,
          name: prod.name,
          images: prod.images,
        })
        total += (item.price || prod.price) * item.quantity
      }

      // Apply discount if provided
      if (discount_amount) {
        total -= discount_amount
      }

      // Use provided total if available
      if (directTotal !== undefined) {
        total = directTotal
      }
    } else {
      // Cart-based order
      if (!shippingAddress) {
        return res.status(400).json({ success: false, error: 'Shipping address is required' })
      }

      const cartItems = await client.query<{ product_id: string; quantity: number; price: number; stock: number; name: string; images: string[] }>(
        `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name, p.images
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1`,
        [req.user!.userId]
      )

      if (cartItems.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({ success: false, error: 'Cart is empty' })
      }

      // Check stock and calculate total
      for (const item of cartItems.rows) {
        if (item.stock < item.quantity) {
          await client.query('ROLLBACK')
          return res.status(400).json({ success: false, error: 'Not enough stock for some items' })
        }
        orderItems.push(item)
        total += item.price * item.quantity
      }
    }

    // Create order
    const orderResult = await client.query<Order>(
      `INSERT INTO orders (id, user_id, total, shipping_address, payment_method, recipient_name, phone, note, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [
        req.user?.userId || null,
        total,
        shippingAddress || 'Mang đi',
        paymentMethod,
        recipient_name || 'Khách hàng',
        phone || '',
        note || null
      ]
    )
    const order = orderResult.rows[0]

    // Create order items and update stock
    for (const item of orderItems) {
      await client.query(
        'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
        [order.id, item.product_id, item.quantity, item.price]
      )
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      )
    }

    // Clear cart if this was a cart-based order
    if (!directItems && req.user?.userId) {
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId])
    }

    await client.query('COMMIT')

    // Emit socket events to kitchen and staff
    try {
      const { getIO } = await import('../socket/index.js')
      const io = getIO()
      
      // Emit to kitchen for each item
      for (const item of orderItems) {
        io.to('kitchen').emit('kitchen:new-item', {
          product_name: item.name,
          product_image: item.images?.[0],
          quantity: item.quantity,
          table_number: shippingAddress || 'Mang đi',
          order_number: order.id.slice(0, 8),
          status: 'pending',
        })
      }

      // Emit to staff room for new order notification
      io.to('staff').emit('order:new', {
        orderId: order.id,
        total: Number(order.total),
        status: order.status,
      })
    } catch (socketError) {
      console.error('Socket emit error:', socketError)
      // Don't fail the request if socket fails
    }

    res.status(201).json({ success: true, data: order })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create order error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// Cancel order
router.put('/:id/cancel', async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const order = await client.query<Order>(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    )

    if (order.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Order not found' })
    }

    if (order.rows[0].status !== 'pending') {
      await client.query('ROLLBACK')
      return res.status(400).json({ success: false, error: 'Only pending orders can be cancelled' })
    }

    // Restore stock
    const items = await client.query<OrderItem>(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [req.params.id]
    )

    for (const item of items.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      )
    }

    // Update order status
    await client.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = $1",
      [req.params.id]
    )

    await client.query('COMMIT')

    res.json({ success: true, message: 'Order cancelled' })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Cancel order error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

export default router
