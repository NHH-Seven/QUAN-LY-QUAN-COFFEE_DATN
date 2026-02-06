import { Router } from 'express'
import { query, queryOne } from '../../db/index.js'
import type { Category } from '../../types/index.js'
import { invalidateCategoryCache } from '../../services/cache.service.js'

const router = Router()

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

// GET /api/admin/categories - Get all categories with product count
router.get('/', async (req, res) => {
  try {
    const categories = await query<Category>(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.stock >= 0) as product_count
       FROM categories c 
       ORDER BY c.name`
    )
    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('Get admin categories error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

interface CreateCategoryBody {
  name: string
  slug?: string
  icon?: string
  description?: string
}

// POST /api/admin/categories - Create new category
router.post('/', async (req, res) => {
  try {
    const body: CreateCategoryBody = req.body

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Tên danh mục là bắt buộc' })
    }

    // Generate or use provided slug
    const slug = body.slug?.trim() || generateSlug(body.name)

    // Check unique slug
    const existingSlug = await queryOne<{ id: string }>(
      'SELECT id FROM categories WHERE slug = $1',
      [slug]
    )
    if (existingSlug) {
      return res.status(400).json({ success: false, error: 'Slug danh mục đã tồn tại' })
    }

    const category = await queryOne<Category>(
      `INSERT INTO categories (name, slug, icon, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [body.name.trim(), slug, body.icon || null, body.description || null]
    )

    // Invalidate category cache
    await invalidateCategoryCache()

    res.status(201).json({ success: true, data: category })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

interface UpdateCategoryBody {
  name?: string
  slug?: string
  icon?: string
  description?: string
}


// PUT /api/admin/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const body: UpdateCategoryBody = req.body

    // Check category exists
    const existingCategory = await queryOne<Category>(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    )
    if (!existingCategory) {
      return res.status(404).json({ success: false, error: 'Danh mục không tồn tại' })
    }

    // Build update query dynamically
    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return res.status(400).json({ success: false, error: 'Tên danh mục không hợp lệ' })
      }
      updates.push(`name = $${paramIndex++}`)
      params.push(body.name.trim())
    }

    if (body.slug !== undefined) {
      if (typeof body.slug !== 'string' || body.slug.trim() === '') {
        return res.status(400).json({ success: false, error: 'Slug không hợp lệ' })
      }
      // Check unique slug (excluding current category)
      const existingSlug = await queryOne<{ id: string }>(
        'SELECT id FROM categories WHERE slug = $1 AND id != $2',
        [body.slug.trim(), id]
      )
      if (existingSlug) {
        return res.status(400).json({ success: false, error: 'Slug danh mục đã tồn tại' })
      }
      updates.push(`slug = $${paramIndex++}`)
      params.push(body.slug.trim())
    }

    if (body.icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`)
      params.push(body.icon || null)
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      params.push(body.description || null)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có dữ liệu để cập nhật' })
    }

    params.push(id)
    const sql = `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`

    const category = await queryOne<Category>(sql, params)

    // Invalidate category cache
    await invalidateCategoryCache(existingCategory.slug)
    if (body.slug && body.slug !== existingCategory.slug) {
      await invalidateCategoryCache(body.slug)
    }

    res.json({ success: true, data: category })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// DELETE /api/admin/categories/:id - Delete category (only if no products assigned)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check category exists
    const existingCategory = await queryOne<Category>(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    )
    if (!existingCategory) {
      return res.status(404).json({ success: false, error: 'Danh mục không tồn tại' })
    }

    // Check if any products are assigned to this category
    const productCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND stock >= 0',
      [id]
    )
    
    if (productCount && parseInt(productCount.count, 10) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Không thể xóa danh mục có sản phẩm' 
      })
    }

    // Delete the category
    await queryOne('DELETE FROM categories WHERE id = $1', [id])

    // Invalidate category cache
    await invalidateCategoryCache(existingCategory.slug)

    res.json({ success: true, message: 'Danh mục đã được xóa' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
