import { Router } from 'express'
import { pool, query, queryOne } from '../../db/index.js'
import type { Product } from '../../types/index.js'

const router = Router()

interface StockTransaction {
  id: string
  product_id: string
  user_id: string
  type: string
  quantity: number
  reason: string | null
  reference: string | null
  stock_before: number
  stock_after: number
  created_at: Date
  product_name?: string
  user_name?: string
}

// GET /api/warehouse/stock - Danh sách sản phẩm với tồn kho
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', search, lowStock } = req.query

    let sql = `
      SELECT p.id, p.name, p.slug, p.images, p.stock, p.brand,
             c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock >= 0
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (lowStock === 'true') {
      sql += ` AND p.stock < 10`
    }

    sql += ` ORDER BY p.stock ASC, p.name ASC`

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    // Get total
    const countSql = sql.replace(/SELECT p\.id.*?FROM products p/, 'SELECT COUNT(*) FROM products p').replace(/ORDER BY.*$/, '')
    const countResult = await query<{ count: string }>(countSql, params)
    const total = parseInt(countResult[0]?.count || '0', 10)

    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limitNum, offset)

    const products = await query(sql, params)

    res.json({
      success: true,
      data: products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (error) {
    console.error('Get stock list error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})


// POST /api/warehouse/stock/import - Nhập kho
router.post('/import', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { productId, quantity, reason, reference } = req.body
    const userId = req.user?.userId

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sản phẩm và số lượng là bắt buộc' 
      })
    }

    await client.query('BEGIN')

    // Get current stock
    const productResult = await client.query<Product>(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    )

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' })
    }

    const product = productResult.rows[0]
    const stockBefore = product.stock
    const stockAfter = stockBefore + quantity

    // Update stock
    await client.query(
      'UPDATE products SET stock = $1 WHERE id = $2',
      [stockAfter, productId]
    )

    // Create transaction record
    const transactionResult = await client.query<StockTransaction>(
      `INSERT INTO stock_transactions 
        (id, product_id, user_id, type, quantity, reason, reference, stock_before, stock_after)
       VALUES (gen_random_uuid(), $1, $2, 'import', $3, $4, $5, $6, $7)
       RETURNING *`,
      [productId, userId, quantity, reason || null, reference || null, stockBefore, stockAfter]
    )

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      data: transactionResult.rows[0],
      message: `Đã nhập ${quantity} sản phẩm. Tồn kho: ${stockBefore} → ${stockAfter}`
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Import stock error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// POST /api/warehouse/stock/export - Xuất kho
router.post('/export', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { productId, quantity, reason, reference } = req.body
    const userId = req.user?.userId

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sản phẩm và số lượng là bắt buộc' 
      })
    }

    await client.query('BEGIN')

    // Get current stock
    const productResult = await client.query<Product>(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    )

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' })
    }

    const product = productResult.rows[0]
    const stockBefore = product.stock

    if (stockBefore < quantity) {
      await client.query('ROLLBACK')
      return res.status(400).json({ 
        success: false, 
        error: `Không đủ hàng trong kho. Tồn kho hiện tại: ${stockBefore}` 
      })
    }

    const stockAfter = stockBefore - quantity

    // Update stock
    await client.query(
      'UPDATE products SET stock = $1 WHERE id = $2',
      [stockAfter, productId]
    )

    // Create transaction record
    const transactionResult = await client.query<StockTransaction>(
      `INSERT INTO stock_transactions 
        (id, product_id, user_id, type, quantity, reason, reference, stock_before, stock_after)
       VALUES (gen_random_uuid(), $1, $2, 'export', $3, $4, $5, $6, $7)
       RETURNING *`,
      [productId, userId, quantity, reason || null, reference || null, stockBefore, stockAfter]
    )

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      data: transactionResult.rows[0],
      message: `Đã xuất ${quantity} sản phẩm. Tồn kho: ${stockBefore} → ${stockAfter}`
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Export stock error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// POST /api/warehouse/stock/adjust - Điều chỉnh tồn kho (kiểm kê)
router.post('/adjust', async (req, res) => {
  const client = await pool.connect()
  
  try {
    const { productId, newStock, reason } = req.body
    const userId = req.user?.userId

    if (!productId || newStock === undefined || newStock < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sản phẩm và số lượng mới là bắt buộc' 
      })
    }

    await client.query('BEGIN')

    // Get current stock
    const productResult = await client.query<Product>(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    )

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' })
    }

    const product = productResult.rows[0]
    const stockBefore = product.stock
    const difference = newStock - stockBefore

    // Update stock
    await client.query(
      'UPDATE products SET stock = $1 WHERE id = $2',
      [newStock, productId]
    )

    // Create transaction record
    const transactionResult = await client.query<StockTransaction>(
      `INSERT INTO stock_transactions 
        (id, product_id, user_id, type, quantity, reason, reference, stock_before, stock_after)
       VALUES (gen_random_uuid(), $1, $2, 'adjust', $3, $4, NULL, $5, $6)
       RETURNING *`,
      [productId, userId, Math.abs(difference), reason || 'Kiểm kê điều chỉnh', stockBefore, newStock]
    )

    await client.query('COMMIT')

    res.status(201).json({
      success: true,
      data: transactionResult.rows[0],
      message: `Đã điều chỉnh tồn kho: ${stockBefore} → ${newStock} (${difference >= 0 ? '+' : ''}${difference})`
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Adjust stock error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// GET /api/warehouse/stock/history - Lịch sử xuất nhập kho
router.get('/history', async (req, res) => {
  try {
    const { page = '1', limit = '20', productId, type, from, to } = req.query

    let sql = `
      SELECT st.*, p.name as product_name, u.name as user_name
      FROM stock_transactions st
      LEFT JOIN products p ON st.product_id = p.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (productId) {
      sql += ` AND st.product_id = $${paramIndex}`
      params.push(productId)
      paramIndex++
    }

    if (type) {
      sql += ` AND st.type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    if (from) {
      sql += ` AND st.created_at >= $${paramIndex}`
      params.push(from)
      paramIndex++
    }

    if (to) {
      sql += ` AND st.created_at <= $${paramIndex}`
      params.push(to)
      paramIndex++
    }

    sql += ` ORDER BY st.created_at DESC`

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    // Get total
    const countSql = sql.replace(/SELECT st\.\*.*?FROM stock_transactions st/, 'SELECT COUNT(*) FROM stock_transactions st').replace(/ORDER BY.*$/, '')
    const countResult = await query<{ count: string }>(countSql, params)
    const total = parseInt(countResult[0]?.count || '0', 10)

    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limitNum, offset)

    const transactions = await query<StockTransaction>(sql, params)

    res.json({
      success: true,
      data: transactions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    })
  } catch (error) {
    console.error('Get stock history error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
