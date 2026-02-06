import { Router, Response } from 'express'
import multer from 'multer'
import { query, queryOne } from '../../db/index.js'
import { staffMiddleware, AuthRequest } from '../../middleware/auth.js'

const router = Router()
router.use(staffMiddleware)

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

interface ImportProduct {
  name: string
  slug?: string
  price: number
  original_price?: number
  description?: string
  brand?: string
  stock?: number
  category_name?: string
  images?: string
}

// POST /api/admin/import/products - Import products from JSON
router.post('/products', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Vui lòng upload file' })
    }

    let products: ImportProduct[]
    try {
      const content = req.file.buffer.toString('utf-8')
      products = JSON.parse(content)
      if (!Array.isArray(products)) {
        throw new Error('Invalid format')
      }
    } catch {
      return res.status(400).json({ success: false, error: 'File không hợp lệ. Vui lòng upload file JSON' })
    }

    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (const p of products) {
      try {
        if (!p.name || !p.price) {
          errors.push(`Thiếu name hoặc price: ${p.name || 'unknown'}`)
          failed++
          continue
        }

        // Generate slug if not provided
        const slug = p.slug || p.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

        // Find category by name
        let categoryId = null
        if (p.category_name) {
          const cat = await queryOne<{ id: string }>(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
            [p.category_name]
          )
          categoryId = cat?.id
        }

        // Parse images
        const images = p.images ? p.images.split(',').map(s => s.trim()) : []

        await query(
          `INSERT INTO products (name, slug, price, original_price, description, brand, stock, category_id, images)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (slug) DO UPDATE SET
             price = EXCLUDED.price,
             original_price = EXCLUDED.original_price,
             stock = EXCLUDED.stock`,
          [p.name, slug, p.price, p.original_price || p.price, p.description || '', p.brand || '', p.stock || 0, categoryId, images]
        )
        imported++
      } catch (err) {
        errors.push(`Lỗi import: ${p.name}`)
        failed++
      }
    }

    res.json({
      success: true,
      data: { imported, failed, total: products.length },
      errors: errors.slice(0, 10) // Return first 10 errors
    })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/admin/import/template - Download template
router.get('/template', (req: AuthRequest, res: Response) => {
  const template = [
    {
      name: "iPhone 15 Pro Max",
      price: 29990000,
      original_price: 34990000,
      description: "Mô tả sản phẩm",
      brand: "Apple",
      stock: 100,
      category_name: "Điện thoại",
      images: "https://example.com/img1.jpg,https://example.com/img2.jpg"
    }
  ]
  res.json(template)
})

export default router
