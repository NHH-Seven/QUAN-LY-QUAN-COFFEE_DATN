import { Router } from 'express'
import { query, queryOne, pool } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { createOrderSchema } from '../validations/checkout.validation.js'
import { sendOrderConfirmationEmail, OrderEmailData } from '../services/email.service.js'
import { checkIdempotencyKey, storeIdempotencyKey } from '../services/idempotency.service.js'
import { calculateShippingFee } from '../services/shipping.service.js'

const router = Router()

// Default shipping fee (used when no address provided)
const DEFAULT_SHIPPING_FEE = 30000

// All checkout routes require authentication
router.use(authMiddleware)

// GET /api/checkout - Get checkout information
router.get('/', async (req, res) => {
  try {
    // Get cart items with product details
    const cartItems = await query<{
      id: string
      quantity: number
      product_id: string
      name: string
      price: number
      images: string[]
      stock: number
    }>(
      `SELECT ci.id, ci.quantity,
              p.id as product_id, p.name, p.price, p.images, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.user!.userId]
    )

    // If cart is empty, return error (Requirement 1.3)
    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Giỏ hàng trống'
      })
    }

    // Get user info for pre-filling form (Requirement 2.2)
    const user = await queryOne<{
      name: string
      phone: string | null
      address: string | null
    }>(
      'SELECT name, phone, address FROM users WHERE id = $1',
      [req.user!.userId]
    )

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (Number(item.price) * item.quantity)
    }, 0)

    // Get user's address for shipping calculation
    const userAddress = user?.address || ''
    const shippingResult = calculateShippingFee(userAddress, subtotal)
    
    // Calculate total
    const total = subtotal + shippingResult.fee

    // Format response according to design
    const items = cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        name: item.name,
        price: Number(item.price),
        images: item.images,
        stock: item.stock
      }
    }))

    res.json({
      success: true,
      data: {
        items,
        subtotal,
        shippingFee: shippingResult.fee,
        shippingInfo: {
          region: shippingResult.region,
          freeShippingThreshold: shippingResult.freeShippingThreshold,
          isFreeShipping: shippingResult.isFreeShipping
        },
        total,
        user: user ? {
          name: user.name,
          phone: user.phone,
          address: user.address
        } : null
      }
    })
  } catch (error) {
    console.error('Get checkout error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

// POST /api/checkout - Create order
router.post('/', async (req, res) => {
  const client = await pool.connect()
  
  try {
    // Validate request body (Requirements: 2.1, 2.3, 2.4, 3.4)
    const parseResult = createOrderSchema.safeParse(req.body)
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]
      return res.status(400).json({
        success: false,
        error: firstError.message
      })
    }

    const { recipientName, phone, address, note, paymentMethod, idempotencyKey, promotionId, discountAmount } = parseResult.data
    const userId = req.user!.userId
    const userEmail = req.user!.email

    // Validate promotion if provided
    let validatedDiscount = 0
    if (promotionId && discountAmount) {
      // Verify promotion exists and is valid
      const promotion = await queryOne<{
        id: string
        is_active: boolean
        usage_limit: number | null
        used_count: number
        start_date: string | null
        end_date: string | null
        min_order_value: number
      }>(
        `SELECT id, is_active, usage_limit, used_count, start_date, end_date, min_order_value
         FROM promotions WHERE id = $1`,
        [promotionId]
      )

      if (promotion && promotion.is_active) {
        const now = new Date()
        const startDate = promotion.start_date ? new Date(promotion.start_date) : null
        const endDate = promotion.end_date ? new Date(promotion.end_date) : null
        
        const isWithinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate)
        const hasUsageLeft = !promotion.usage_limit || promotion.used_count < promotion.usage_limit
        
        if (isWithinDateRange && hasUsageLeft) {
          validatedDiscount = discountAmount
        }
      }
    }

    // Check for duplicate order using idempotency key (Requirement 6.4)
    if (idempotencyKey) {
      const existingOrder = checkIdempotencyKey(userId, idempotencyKey)
      if (existingOrder) {
        // Return the same response as the original order
        return res.status(200).json({
          success: true,
          data: {
            orderId: existingOrder.orderId,
            total: existingOrder.total,
            status: existingOrder.status
          },
          duplicate: true
        })
      }
    }

    // Start transaction
    await client.query('BEGIN')

    // Get cart items with product details
    // FOR UPDATE OF p locks the product rows - prevents race condition
    // If another transaction is holding the lock, this will WAIT until it's released
    const cartItemsResult = await client.query<{
      id: string
      quantity: number
      product_id: string
      name: string
      price: string
      stock: number
    }>(
      `SELECT ci.id, ci.quantity,
              p.id as product_id, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       FOR UPDATE OF p`,
      [userId]
    )

    const cartItems = cartItemsResult.rows

    // Check cart not empty (Requirement 4.1)
    if (cartItems.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        success: false,
        error: 'Giỏ hàng trống'
      })
    }

    // Check stock availability (Requirement 4.6 + Stock Alert Req 6)
    // At this point, we have exclusive lock on products, so stock value is accurate
    // No other transaction can modify these products until we COMMIT/ROLLBACK
    const outOfStockItems: { name: string; requested: number; available: number }[] = []
    
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        outOfStockItems.push({
          name: item.name,
          requested: item.quantity,
          available: item.stock
        })
      }
    }

    if (outOfStockItems.length > 0) {
      await client.query('ROLLBACK')
      
      // Return detailed error for all out-of-stock items
      const errorMessages = outOfStockItems.map(item => 
        item.available === 0 
          ? `"${item.name}" đã hết hàng`
          : `"${item.name}" chỉ còn ${item.available} (bạn đặt ${item.requested})`
      )
      
      return res.status(409).json({
        success: false,
        error: outOfStockItems.length === 1 
          ? `Sản phẩm ${errorMessages[0]}`
          : `Một số sản phẩm không đủ hàng:\n${errorMessages.join('\n')}`,
        code: 'INSUFFICIENT_STOCK',
        data: {
          items: outOfStockItems
        }
      })
    }

    // Calculate total
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (Number(item.price) * item.quantity)
    }, 0)
    
    // Calculate shipping fee based on address
    const shippingResult = calculateShippingFee(address, subtotal)
    const shippingFee = shippingResult.fee
    
    const total = subtotal + shippingFee - validatedDiscount

    // Determine initial status based on payment method
    // COD: pending (chờ xử lý), Bank transfer: awaiting_payment (chờ thanh toán)
    const initialStatus = paymentMethod === 'bank_transfer' ? 'awaiting_payment' : 'pending'

    // Create order (Requirements: 4.1, 4.2, 4.3)
    const orderResult = await client.query<{ id: string }>(
      `INSERT INTO orders (id, user_id, total, status, shipping_address, payment_method, recipient_name, phone, note, discount_amount, promotion_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [userId, total, initialStatus, address, paymentMethod, recipientName, phone, note || null, validatedDiscount, promotionId || null]
    )

    const orderId = orderResult.rows[0].id

    // Create order items and decrease stock (Requirements: 4.2, 4.5)
    for (const item of cartItems) {
      // Insert order item
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      )

      // Decrease product stock
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      )
    }

    // Clear user's cart (Requirement 4.4)
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId])

    // Update promotion usage count if promotion was applied
    if (promotionId && validatedDiscount > 0) {
      await client.query(
        `UPDATE promotions SET used_count = used_count + 1 WHERE id = $1`,
        [promotionId]
      )
      // Record promotion usage
      await client.query(
        `INSERT INTO promotion_usage (id, promotion_id, user_id, order_id, discount_amount)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [promotionId, userId, orderId, validatedDiscount]
      )
    }

    // Commit transaction
    await client.query('COMMIT')

    // Send order confirmation email (Requirement 5.4)
    // Email is sent asynchronously to not block the response
    const orderEmailData: OrderEmailData = {
      orderId,
      recipientName,
      phone,
      shippingAddress: address,
      paymentMethod: paymentMethod as 'cod' | 'bank_transfer',
      items: cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price)
      })),
      subtotal,
      shippingFee,
      discount: validatedDiscount,
      total,
      note: note || undefined
    }

    // Fire and forget - don't wait for email to complete
    sendOrderConfirmationEmail(userEmail, orderEmailData).catch(err => {
      console.error('Failed to send order confirmation email:', err)
    })

    // Store idempotency key for duplicate prevention (Requirement 6.4)
    if (idempotencyKey) {
      storeIdempotencyKey(userId, idempotencyKey, orderId, total, initialStatus)
    }

    res.status(201).json({
      success: true,
      data: {
        orderId,
        total,
        status: initialStatus
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create order error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  } finally {
    client.release()
  }
})

export default router
