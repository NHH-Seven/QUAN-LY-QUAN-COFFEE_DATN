import { Router, Request, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const items = await query<{
      id: string
      product_id: string
      created_at: string
      name: string
      slug: string
      price: string
      original_price: string | null
      images: string[]
      brand: string | null
      stock: number
      rating: string
      discount: number
    }>(
      `SELECT w.id, w.product_id, w.created_at,
              p.name, p.slug, p.price, p.original_price, p.images, p.brand, p.stock, p.rating, p.discount
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    )

    const wishlist = items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      created_at: item.created_at,
      product: {
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        original_price: item.original_price,
        images: item.images,
        brand: item.brand,
        stock: item.stock,
        rating: item.rating,
        discount: item.discount,
      }
    }))

    res.json({ success: true, data: wishlist })
  } catch (error) {
    console.error('Get wishlist error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * POST /api/wishlist
 * Add product to wishlist
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' })
    }

    // Check if product exists
    const product = await queryOne<{ id: string }>('SELECT id FROM products WHERE id = $1', [productId])
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }

    // Check if already in wishlist
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    )

    if (existing) {
      return res.status(400).json({ success: false, error: 'Product already in wishlist' })
    }

    // Add to wishlist
    const result = await queryOne<{ id: string }>(
      `INSERT INTO wishlist (id, user_id, product_id) 
       VALUES (gen_random_uuid(), $1, $2) 
       RETURNING id`,
      [userId, productId]
    )

    res.status(201).json({ 
      success: true, 
      data: { id: result?.id },
      message: 'Đã thêm vào danh sách yêu thích'
    })
  } catch (error) {
    console.error('Add to wishlist error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * DELETE /api/wishlist/:productId
 * Remove product from wishlist
 */
router.delete('/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { productId } = req.params

    const result = await queryOne<{ id: string }>(
      'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Product not in wishlist' })
    }

    res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' })
  } catch (error) {
    console.error('Remove from wishlist error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/wishlist/check/:productId
 * Check if product is in wishlist
 */
router.get('/check/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { productId } = req.params

    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    )

    res.json({ success: true, data: { inWishlist: !!existing } })
  } catch (error) {
    console.error('Check wishlist error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
