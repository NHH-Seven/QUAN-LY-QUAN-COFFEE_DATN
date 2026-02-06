import { Router } from 'express'
import { query } from '../../db/index.js'

const router = Router()

// GET /api/warehouse/inventory/summary - Tổng quan tồn kho
router.get('/summary', async (req, res) => {
  try {
    // Tổng số sản phẩm và tồn kho
    const summaryResult = await query<{
      total_products: string
      total_stock: string
      low_stock_count: string
      out_of_stock_count: string
    }>(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock), 0) as total_stock,
        COUNT(CASE WHEN stock > 0 AND stock < 10 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_count
      FROM products
      WHERE stock >= 0
    `)

    // Thống kê xuất nhập trong ngày
    const todayResult = await query<{
      type: string
      total_quantity: string
      transaction_count: string
    }>(`
      SELECT 
        type,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COUNT(*) as transaction_count
      FROM stock_transactions
      WHERE created_at >= CURRENT_DATE
      GROUP BY type
    `)

    // Thống kê xuất nhập trong tuần
    const weekResult = await query<{
      type: string
      total_quantity: string
      transaction_count: string
    }>(`
      SELECT 
        type,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COUNT(*) as transaction_count
      FROM stock_transactions
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY type
    `)

    const summary = summaryResult[0]
    
    const todayStats = {
      import: { quantity: 0, count: 0 },
      export: { quantity: 0, count: 0 },
      adjust: { quantity: 0, count: 0 }
    }
    
    todayResult.forEach(row => {
      const type = row.type as keyof typeof todayStats
      if (todayStats[type]) {
        todayStats[type] = {
          quantity: parseInt(row.total_quantity, 10),
          count: parseInt(row.transaction_count, 10)
        }
      }
    })

    const weekStats = {
      import: { quantity: 0, count: 0 },
      export: { quantity: 0, count: 0 },
      adjust: { quantity: 0, count: 0 }
    }
    
    weekResult.forEach(row => {
      const type = row.type as keyof typeof weekStats
      if (weekStats[type]) {
        weekStats[type] = {
          quantity: parseInt(row.total_quantity, 10),
          count: parseInt(row.transaction_count, 10)
        }
      }
    })

    res.json({
      success: true,
      data: {
        totalProducts: parseInt(summary?.total_products || '0', 10),
        totalStock: parseInt(summary?.total_stock || '0', 10),
        lowStockCount: parseInt(summary?.low_stock_count || '0', 10),
        outOfStockCount: parseInt(summary?.out_of_stock_count || '0', 10),
        today: todayStats,
        week: weekStats
      }
    })
  } catch (error) {
    console.error('Get inventory summary error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/warehouse/inventory/low-stock - Sản phẩm sắp hết hàng
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold = '10' } = req.query
    const thresholdNum = parseInt(threshold as string, 10)

    const products = await query(`
      SELECT p.id, p.name, p.slug, p.images, p.stock, p.brand,
             c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock >= 0 AND p.stock < $1
      ORDER BY p.stock ASC
      LIMIT 50
    `, [thresholdNum])

    res.json({
      success: true,
      data: products
    })
  } catch (error) {
    console.error('Get low stock products error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/warehouse/inventory/report - Báo cáo tồn kho theo danh mục
router.get('/report', async (req, res) => {
  try {
    const report = await query(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.stock), 0) as total_stock,
        COALESCE(SUM(p.stock * p.price), 0) as total_value,
        COUNT(CASE WHEN p.stock < 10 THEN 1 END) as low_stock_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.stock >= 0
      GROUP BY c.id, c.name
      ORDER BY c.name
    `)

    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Get inventory report error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
