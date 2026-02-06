import { Router } from 'express'
import { query, queryOne } from '../db/index.js'
import type { Product, Category } from '../types/index.js'
import { 
  getCacheService, 
  CACHE_KEYS, 
  CACHE_TTL 
} from '../services/cache.service.js'

const router = Router()

// Sync review counts from actual reviews
router.post('/sync-reviews', async (req, res) => {
  try {
    await query(`
      UPDATE products p 
      SET review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id),
          rating = COALESCE((SELECT AVG(r.rating)::numeric(2,1) FROM reviews r WHERE r.product_id = p.id), 0)
    `, [])
    res.json({ success: true, message: 'Đã đồng bộ review count' })
  } catch (error) {
    console.error('Sync reviews error:', error)
    res.status(500).json({ success: false, error: 'Lỗi đồng bộ' })
  }
})

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, brand, search, featured, isNew, new: newParam, minPrice, maxPrice, sort, page = '1', limit = '12' } = req.query

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock >= 0
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (category) {
      sql += ` AND c.slug = $${paramIndex++}`
      params.push(category)
    }

    if (brand) {
      sql += ` AND p.brand = $${paramIndex++}`
      params.push(brand)
    }

    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (featured === 'true') {
      sql += ` AND p.is_featured = true`
    }

    if (isNew === 'true' || newParam === 'true') {
      sql += ` AND p.is_new = true`
    }

    if (minPrice) {
      sql += ` AND p.price >= $${paramIndex++}`
      params.push(Number(minPrice))
    }

    if (maxPrice) {
      sql += ` AND p.price <= $${paramIndex++}`
      params.push(Number(maxPrice))
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY p.price ASC'
        break
      case 'price_desc':
        sql += ' ORDER BY p.price DESC'
        break
      case 'newest':
        sql += ' ORDER BY p.created_at DESC'
        break
      case 'rating':
        sql += ' ORDER BY p.rating DESC'
        break
      case 'bestseller':
        sql += ' ORDER BY p.review_count DESC, p.rating DESC'
        break
      default:
        sql += ' ORDER BY p.created_at DESC'
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    // Get total count
    const countSql = sql.replace(/SELECT p\.\*, c\.name as category_name, c\.slug as category_slug/, 'SELECT COUNT(*)')
      .replace(/ORDER BY.*$/, '')
    const countResult = await query<{ count: string }>(countSql, params)
    const total = parseInt(countResult[0]?.count || '0', 10)

    // Add pagination
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limitNum, offset)

    const products = await query<Product & { category_name: string; category_slug: string }>(sql, params)

    // Transform to include category object
    const transformedProducts = products.map(p => ({
      ...p,
      category: { id: p.category_id, name: p.category_name, slug: p.category_slug }
    }))

    res.json({
      success: true,
      data: transformedProducts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await query<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_featured = true AND p.stock >= 0
       ORDER BY p.created_at DESC
       LIMIT 8`
    )

    const transformedProducts = products.map(p => ({
      ...p,
      category: { id: p.category_id, name: p.category_name, slug: p.category_slug }
    }))

    res.json({ success: true, data: transformedProducts })
  } catch (error) {
    console.error('Get featured products error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get new products
router.get('/new', async (req, res) => {
  try {
    const products = await query<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_new = true AND p.stock >= 0
       ORDER BY p.created_at DESC
       LIMIT 8`
    )

    const transformedProducts = products.map(p => ({
      ...p,
      category: { id: p.category_id, name: p.category_name, slug: p.category_slug }
    }))

    res.json({ success: true, data: transformedProducts })
  } catch (error) {
    console.error('Get new products error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get flash sale products (discounted products with today's sold count)
router.get('/flash-sale', async (req, res) => {
  try {
    const limit = Math.min(12, parseInt(req.query.limit as string) || 6)
    
    // Get products with discount > 0, including today's sold count
    const products = await query<Product & { 
      category_name: string
      category_slug: string
      sold_today: string
    }>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
        COALESCE(
          (SELECT SUM(oi.quantity) 
           FROM order_items oi 
           JOIN orders o ON oi.order_id = o.id 
           WHERE oi.product_id = p.id 
           AND o.created_at >= CURRENT_DATE
           AND o.status NOT IN ('cancelled')
          ), 0
        ) as sold_today
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.discount > 0 AND p.stock >= 0
       ORDER BY p.discount DESC, sold_today DESC
       LIMIT $1`,
      [limit]
    )

    const transformedProducts = products.map(p => ({
      ...p,
      price: Number(p.price),
      original_price: p.original_price ? Number(p.original_price) : null,
      rating: Number(p.rating),
      sold_today: parseInt(p.sold_today) || 0,
      // Flash sale stock limit (e.g., 50 units per product for flash sale)
      flash_sale_stock: 50,
      category: { id: p.category_id, name: p.category_name, slug: p.category_slug }
    }))

    res.json({ success: true, data: transformedProducts })
  } catch (error) {
    console.error('Get flash sale products error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get product by ID (returns full product data)
router.get('/by-id/:id', async (req, res) => {
  try {
    const product = await queryOne<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [req.params.id]
    )

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }

    const transformedProduct = {
      ...product,
      price: Number(product.price),
      original_price: product.original_price ? Number(product.original_price) : null,
      rating: Number(product.rating),
      category: { id: product.category_id, name: product.category_name, slug: product.category_slug }
    }

    res.json({ success: true, data: transformedProduct })
  } catch (error) {
    console.error('Get product by ID error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get product by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const cache = getCacheService()
    const cacheKey = CACHE_KEYS.PRODUCT_DETAIL(slug)

    // Try to get from cache first
    const cachedProduct = await cache.get<Product & { category: { id: string; name: string; slug: string } }>(cacheKey)
    if (cachedProduct) {
      return res.json({ success: true, data: cachedProduct })
    }

    const product = await queryOne<Product & { category_name: string; category_slug: string }>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1 AND p.stock >= 0`,
      [slug]
    )

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' })
    }

    const transformedProduct = {
      ...product,
      category: { id: product.category_id, name: product.category_name, slug: product.category_slug }
    }

    // Cache the product detail
    await cache.set(cacheKey, transformedProduct, CACHE_TTL.PRODUCT_DETAIL)

    res.json({ success: true, data: transformedProduct })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
