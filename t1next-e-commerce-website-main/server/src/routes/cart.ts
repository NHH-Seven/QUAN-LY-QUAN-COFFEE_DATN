import { Router } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import type { CartItem, Product } from '../types/index.js'

const router = Router()

// All cart routes require authentication
router.use(authMiddleware)

// Get cart items
router.get('/', async (req, res) => {
  try {
    const items = await query<CartItem & Product & { category_name: string; category_slug: string }>(
      `SELECT ci.id, ci.quantity, ci.created_at,
              p.id as product_id, p.name, p.slug, p.price, p.original_price, p.images, p.brand, p.stock, p.discount,
              c.name as category_name, c.slug as category_slug
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.user!.userId]
    )

    const cartItems = items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        originalPrice: item.original_price,
        images: item.images,
        brand: item.brand,
        stock: item.stock,
        discount: item.discount,
        category: { name: item.category_name, slug: item.category_slug }
      }
    }))

    res.json({ success: true, data: cartItems })
  } catch (error) {
    console.error('Get cart error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Add item to cart
router.post('/', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' })
    }

    // Check if product exists and calculate available stock
    const product = await queryOne<{ id: string; name: string; stock: number; reserved: string }>(
      `SELECT p.id, p.name, p.stock,
              COALESCE((SELECT SUM(quantity) FROM cart_items WHERE product_id = p.id AND user_id != $2), 0) as reserved
       FROM products p WHERE p.id = $1`,
      [productId, req.user!.userId]
    )
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }

    // Check current quantity in user's cart
    const existingItem = await queryOne<{ quantity: number }>(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user!.userId, productId]
    )
    const currentInCart = existingItem?.quantity || 0
    const totalRequested = currentInCart + quantity
    const availableStock = product.stock - parseInt(product.reserved)

    if (availableStock < totalRequested) {
      return res.status(400).json({ 
        success: false, 
        error: `Không đủ hàng. Chỉ còn ${availableStock} sản phẩm khả dụng`,
        code: 'INSUFFICIENT_STOCK',
        data: { available: availableStock, requested: totalRequested }
      })
    }

    // Upsert cart item
    const item = await queryOne<CartItem>(
      `INSERT INTO cart_items (id, user_id, product_id, quantity)
       VALUES (gen_random_uuid(), $1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [req.user!.userId, productId, quantity]
    )

    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Add to cart error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Update cart item quantity
router.put('/:id', async (req, res) => {
  try {
    const { quantity } = req.body

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ success: false, error: 'Invalid quantity' })
    }

    // Check stock and calculate available
    const cartItem = await queryOne<{ 
      id: string; product_id: string; current_quantity: number; 
      stock: number; name: string; reserved: string 
    }>(
      `SELECT ci.id, ci.product_id, ci.quantity as current_quantity, 
              p.stock, p.name,
              COALESCE((SELECT SUM(quantity) FROM cart_items WHERE product_id = p.id AND user_id != $2), 0) as reserved
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [req.params.id, req.user!.userId]
    )

    if (!cartItem) {
      return res.status(404).json({ success: false, error: 'Cart item not found' })
    }

    const availableStock = cartItem.stock - parseInt(cartItem.reserved)
    if (availableStock < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: `Không đủ hàng. Chỉ còn ${availableStock} sản phẩm khả dụng`,
        code: 'INSUFFICIENT_STOCK',
        data: { available: availableStock, requested: quantity }
      })
    }

    const updated = await queryOne<CartItem>(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, req.params.id, req.user!.userId]
    )

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update cart error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const result = await queryOne<CartItem>(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user!.userId]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Cart item not found' })
    }

    res.json({ success: true, message: 'Item removed from cart' })
  } catch (error) {
    console.error('Remove from cart error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Clear cart
router.delete('/', async (req, res) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user!.userId])
    res.json({ success: true, message: 'Cart cleared' })
  } catch (error) {
    console.error('Clear cart error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
