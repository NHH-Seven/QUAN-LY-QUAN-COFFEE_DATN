import { Router } from 'express'
import { query, queryOne } from '../../db/index.js'
import type { Product } from '../../types/index.js'
import { invalidateProductCache } from '../../services/cache.service.js'

const router = Router()

interface AdminProduct extends Product {
  category_name: string | null
  category_slug: string | null
}

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/admin/products - Paginated, searchable product list
router.get('/', async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      search, 
      category,
      sort = 'created_at',
      order = 'desc'
    } = req.query

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock >= 0
    `
    const params: unknown[] = []
    let paramIndex = 1

    // Search filter
    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    // Category filter
    if (category) {
      sql += ` AND c.slug = $${paramIndex}`
      params.push(category)
      paramIndex++
    }


    // Sorting
    const allowedSortFields = ['name', 'price', 'stock', 'created_at', 'rating']
    const sortField = allowedSortFields.includes(sort as string) ? sort : 'created_at'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
    sql += ` ORDER BY p.${sortField} ${sortOrder}`

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    // Get total count
    const countSql = sql
      .replace(/SELECT p\.\*, c\.name as category_name, c\.slug as category_slug/, 'SELECT COUNT(*)')
      .replace(/ORDER BY.*$/, '')
    
    const countResult = await query<{ count: string }>(countSql, params)
    const total = parseInt(countResult[0]?.count || '0', 10)

    // Add pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limitNum, offset)

    const products = await query<AdminProduct>(sql, params)

    // Transform to include category object and convert price to number
    const transformedProducts = products.map(p => ({
      ...p,
      price: Number(p.price),
      original_price: p.original_price ? Number(p.original_price) : null,
      rating: Number(p.rating),
      category: p.category_id ? { 
        id: p.category_id, 
        name: p.category_name, 
        slug: p.category_slug 
      } : null
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
    console.error('Get admin products error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/admin/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const product = await queryOne<AdminProduct>(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.stock >= 0`,
      [id]
    )

    if (!product) {
      return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' })
    }

    // Transform to include category object
    const transformedProduct = {
      ...product,
      category: product.category_id ? {
        id: product.category_id,
        name: product.category_name,
        slug: product.category_slug
      } : null
    }

    res.json({ success: true, data: transformedProduct })
  } catch (error) {
    console.error('Get admin product error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

interface CreateProductBody {
  name: string
  description?: string
  price: number
  original_price?: number
  images?: string[]
  category_id: string
  brand?: string
  specs?: Record<string, string>
  stock?: number
  is_new?: boolean
  is_featured?: boolean
  discount?: number
}

// POST /api/admin/products - Create new product
router.post('/', async (req, res) => {
  try {
    const body: CreateProductBody = req.body

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Tên sản phẩm là bắt buộc' })
    }

    if (body.price === undefined || typeof body.price !== 'number' || body.price < 0) {
      return res.status(400).json({ success: false, error: 'Giá sản phẩm không hợp lệ' })
    }

    if (!body.category_id || typeof body.category_id !== 'string') {
      return res.status(400).json({ success: false, error: 'Danh mục là bắt buộc' })
    }

    // Check category exists
    const category = await queryOne<{ id: string }>('SELECT id FROM categories WHERE id = $1', [body.category_id])
    if (!category) {
      return res.status(400).json({ success: false, error: 'Danh mục không tồn tại' })
    }

    // Generate unique slug
    let slug = generateSlug(body.name)
    const existingSlug = await queryOne<{ id: string }>('SELECT id FROM products WHERE slug = $1', [slug])
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const product = await queryOne<Product>(
      `INSERT INTO products (
        name, slug, description, price, original_price, images, 
        category_id, brand, specs, stock, is_new, is_featured, discount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        body.name.trim(),
        slug,
        body.description || '',
        body.price,
        body.original_price || null,
        JSON.stringify(body.images || []),
        body.category_id,
        body.brand || '',
        JSON.stringify(body.specs || {}),
        body.stock ?? 0,
        body.is_new ?? false,
        body.is_featured ?? false,
        body.discount ?? 0
      ]
    )

    // Invalidate product cache
    await invalidateProductCache()

    res.status(201).json({ success: true, data: product })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})


interface UpdateProductBody {
  name?: string
  description?: string
  price?: number
  original_price?: number
  images?: string[]
  category_id?: string
  brand?: string
  specs?: Record<string, string>
  stock?: number
  is_new?: boolean
  is_featured?: boolean
  discount?: number
}

// PUT /api/admin/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const body: UpdateProductBody = req.body

    // Check product exists
    const existingProduct = await queryOne<Product>('SELECT * FROM products WHERE id = $1', [id])
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' })
    }

    // Validate category if provided
    if (body.category_id) {
      const category = await queryOne<{ id: string }>('SELECT id FROM categories WHERE id = $1', [body.category_id])
      if (!category) {
        return res.status(400).json({ success: false, error: 'Danh mục không tồn tại' })
      }
    }

    // Validate price if provided
    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return res.status(400).json({ success: false, error: 'Giá sản phẩm không hợp lệ' })
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(body.name.trim())
      
      // Update slug if name changes
      let newSlug = generateSlug(body.name)
      const existingSlug = await queryOne<{ id: string }>(
        'SELECT id FROM products WHERE slug = $1 AND id != $2', 
        [newSlug, id]
      )
      if (existingSlug) {
        newSlug = `${newSlug}-${Date.now()}`
      }
      updates.push(`slug = $${paramIndex++}`)
      params.push(newSlug)
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      params.push(body.description)
    }

    if (body.price !== undefined) {
      updates.push(`price = $${paramIndex++}`)
      params.push(body.price)
    }

    if (body.original_price !== undefined) {
      updates.push(`original_price = $${paramIndex++}`)
      params.push(body.original_price)
    }

    if (body.images !== undefined) {
      updates.push(`images = $${paramIndex++}`)
      params.push(JSON.stringify(body.images))
    }

    if (body.category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`)
      params.push(body.category_id)
    }

    if (body.brand !== undefined) {
      updates.push(`brand = $${paramIndex++}`)
      params.push(body.brand)
    }

    if (body.specs !== undefined) {
      updates.push(`specs = $${paramIndex++}`)
      params.push(JSON.stringify(body.specs))
    }

    if (body.stock !== undefined) {
      updates.push(`stock = $${paramIndex++}`)
      params.push(body.stock)
    }

    if (body.is_new !== undefined) {
      updates.push(`is_new = $${paramIndex++}`)
      params.push(body.is_new)
    }

    if (body.is_featured !== undefined) {
      updates.push(`is_featured = $${paramIndex++}`)
      params.push(body.is_featured)
    }

    if (body.discount !== undefined) {
      updates.push(`discount = $${paramIndex++}`)
      params.push(body.discount)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có dữ liệu để cập nhật' })
    }

    params.push(id)
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`
    
    const product = await queryOne<Product>(sql, params)

    // Invalidate product cache (including the old slug if it changed)
    await invalidateProductCache(existingProduct.slug)
    if (body.name !== undefined && product?.slug && product.slug !== existingProduct.slug) {
      await invalidateProductCache(product.slug)
    }

    res.json({ success: true, data: product })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// DELETE /api/admin/products/:id - Soft delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check product exists
    const existingProduct = await queryOne<Product>('SELECT * FROM products WHERE id = $1', [id])
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' })
    }

    // Soft delete by setting stock to -1 and adding deleted prefix to slug
    // This preserves the product data for order history while hiding it from listings
    const deletedSlug = `deleted-${Date.now()}-${existingProduct.slug}`
    
    await queryOne(
      `UPDATE products SET 
        stock = -1, 
        slug = $1,
        is_featured = false,
        is_new = false
      WHERE id = $2`,
      [deletedSlug, id]
    )

    // Invalidate product cache
    await invalidateProductCache(existingProduct.slug)

    res.json({ success: true, message: 'Sản phẩm đã được xóa' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
