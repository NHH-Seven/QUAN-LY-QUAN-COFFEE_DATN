import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { staffMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js'
import ExcelJS from 'exceljs'

const router = Router()

// Staff can view, admin can configure
router.use(staffMiddleware)

/**
 * GET /api/stock-alerts
 * Get all products with low stock alerts
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { filter = 'all', page = '1', limit = '20' } = req.query
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string)

    // Calculate available stock = current stock - reserved in carts
    let whereClause = ''
    if (filter === 'low') {
      whereClause = 'WHERE (p.stock - COALESCE(reserved.quantity, 0)) <= p.low_stock_threshold AND (p.stock - COALESCE(reserved.quantity, 0)) > 0'
    } else if (filter === 'out') {
      whereClause = 'WHERE (p.stock - COALESCE(reserved.quantity, 0)) <= 0'
    } else {
      whereClause = 'WHERE (p.stock - COALESCE(reserved.quantity, 0)) <= p.low_stock_threshold'
    }

    const products = await query<{
      id: string
      name: string
      slug: string
      images: string[]
      stock: number
      reserved_quantity: string
      available_stock: string
      low_stock_threshold: number
      category_name: string | null
      price: string
    }>(
      `SELECT 
        p.id, p.name, p.slug, p.images, p.stock, p.low_stock_threshold, p.price,
        COALESCE(reserved.quantity, 0) as reserved_quantity,
        (p.stock - COALESCE(reserved.quantity, 0)) as available_stock,
        c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN (
         SELECT product_id, SUM(quantity) as quantity
         FROM cart_items
         GROUP BY product_id
       ) reserved ON reserved.product_id = p.id
       ${whereClause}
       ORDER BY (p.stock - COALESCE(reserved.quantity, 0)) ASC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit as string), offset]
    )

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM products p
       LEFT JOIN (
         SELECT product_id, SUM(quantity) as quantity
         FROM cart_items
         GROUP BY product_id
       ) reserved ON reserved.product_id = p.id
       ${whereClause}`
    )

    // Get summary counts
    const summary = await queryOne<{
      total_low: string
      total_out: string
    }>(
      `SELECT 
        COUNT(*) FILTER (WHERE (p.stock - COALESCE(reserved.quantity, 0)) <= p.low_stock_threshold AND (p.stock - COALESCE(reserved.quantity, 0)) > 0) as total_low,
        COUNT(*) FILTER (WHERE (p.stock - COALESCE(reserved.quantity, 0)) <= 0) as total_out
       FROM products p
       LEFT JOIN (
         SELECT product_id, SUM(quantity) as quantity
         FROM cart_items
         GROUP BY product_id
       ) reserved ON reserved.product_id = p.id`
    )

    res.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images?.[0] || null,
        stock: p.stock,
        reservedQuantity: parseInt(p.reserved_quantity),
        availableStock: parseInt(p.available_stock),
        threshold: p.low_stock_threshold,
        categoryName: p.category_name,
        price: parseFloat(p.price),
        status: parseInt(p.available_stock) <= 0 ? 'out_of_stock' : 'low_stock',
        suggestedReorder: Math.max(0, p.low_stock_threshold * 2 - p.stock)
      })),
      summary: {
        lowStock: parseInt(summary?.total_low || '0'),
        outOfStock: parseInt(summary?.total_out || '0'),
        total: parseInt(summary?.total_low || '0') + parseInt(summary?.total_out || '0')
      },
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(countResult?.count || '0')
      }
    })
  } catch (error) {
    console.error('Stock alerts error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy cảnh báo tồn kho' })
  }
})

/**
 * GET /api/stock-alerts/count
 * Get count of low stock alerts (for badge)
 */
router.get('/count', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM products p
       LEFT JOIN (
         SELECT product_id, SUM(quantity) as quantity
         FROM cart_items
         GROUP BY product_id
       ) reserved ON reserved.product_id = p.id
       WHERE (p.stock - COALESCE(reserved.quantity, 0)) <= p.low_stock_threshold`
    )

    res.json({
      success: true,
      count: parseInt(result?.count || '0')
    })
  } catch (error) {
    console.error('Stock alert count error:', error)
    res.status(500).json({ success: false, error: 'Lỗi đếm cảnh báo' })
  }
})

/**
 * PUT /api/stock-alerts/threshold/:productId
 * Update threshold for a specific product (admin only)
 */
router.put('/threshold/:productId', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params
    const { threshold } = req.body

    if (typeof threshold !== 'number' || threshold < 0) {
      return res.status(400).json({ success: false, error: 'Ngưỡng không hợp lệ' })
    }

    await query(
      'UPDATE products SET low_stock_threshold = $1 WHERE id = $2',
      [threshold, productId]
    )

    res.json({ success: true, message: 'Đã cập nhật ngưỡng cảnh báo' })
  } catch (error) {
    console.error('Update threshold error:', error)
    res.status(500).json({ success: false, error: 'Lỗi cập nhật ngưỡng' })
  }
})

/**
 * PUT /api/stock-alerts/threshold-bulk
 * Update threshold for multiple products or category (admin only)
 */
router.put('/threshold-bulk', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, threshold } = req.body

    if (typeof threshold !== 'number' || threshold < 0) {
      return res.status(400).json({ success: false, error: 'Ngưỡng không hợp lệ' })
    }

    if (categoryId) {
      await query(
        'UPDATE products SET low_stock_threshold = $1 WHERE category_id = $2',
        [threshold, categoryId]
      )
    } else {
      await query(
        'UPDATE products SET low_stock_threshold = $1',
        [threshold]
      )
    }

    res.json({ success: true, message: 'Đã cập nhật ngưỡng cảnh báo' })
  } catch (error) {
    console.error('Bulk update threshold error:', error)
    res.status(500).json({ success: false, error: 'Lỗi cập nhật ngưỡng' })
  }
})

/**
 * GET /api/stock-alerts/available/:productId
 * Get available stock for a specific product
 */
router.get('/available/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params

    const result = await queryOne<{
      stock: number
      reserved: string
      available: string
      threshold: number
    }>(
      `SELECT 
        p.stock,
        COALESCE(SUM(ci.quantity), 0) as reserved,
        (p.stock - COALESCE(SUM(ci.quantity), 0)) as available,
        p.low_stock_threshold as threshold
       FROM products p
       LEFT JOIN cart_items ci ON ci.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [productId]
    )

    if (!result) {
      return res.status(404).json({ success: false, error: 'Sản phẩm không tồn tại' })
    }

    res.json({
      success: true,
      data: {
        stock: result.stock,
        reserved: parseInt(result.reserved),
        available: parseInt(result.available),
        threshold: result.threshold,
        isLowStock: parseInt(result.available) <= result.threshold,
        isOutOfStock: parseInt(result.available) <= 0
      }
    })
  } catch (error) {
    console.error('Get available stock error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy tồn kho khả dụng' })
  }
})

/**
 * GET /api/stock-alerts/turnover
 * Get products with highest turnover rate (most sold in last 30 days)
 */
router.get('/turnover', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10' } = req.query

    const products = await query<{
      id: string
      name: string
      images: string[]
      stock: number
      category_name: string | null
      total_sold: string
      order_count: string
      avg_daily_sales: string
      days_until_stockout: string
    }>(
      `SELECT 
        p.id, p.name, p.images, p.stock,
        c.name as category_name,
        COALESCE(sales.total_sold, 0) as total_sold,
        COALESCE(sales.order_count, 0) as order_count,
        ROUND(COALESCE(sales.total_sold, 0)::numeric / 30, 2) as avg_daily_sales,
        CASE 
          WHEN COALESCE(sales.total_sold, 0) = 0 THEN 999
          ELSE ROUND(p.stock::numeric / (COALESCE(sales.total_sold, 0)::numeric / 30), 1)
        END as days_until_stockout
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN (
         SELECT oi.product_id, SUM(oi.quantity) as total_sold, COUNT(DISTINCT oi.order_id) as order_count
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= NOW() - INTERVAL '30 days'
           AND o.status NOT IN ('cancelled')
         GROUP BY oi.product_id
       ) sales ON sales.product_id = p.id
       WHERE COALESCE(sales.total_sold, 0) > 0
       ORDER BY sales.total_sold DESC
       LIMIT $1`,
      [parseInt(limit as string)]
    )

    res.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        image: p.images?.[0] || null,
        stock: p.stock,
        categoryName: p.category_name,
        totalSold: parseInt(p.total_sold),
        orderCount: parseInt(p.order_count),
        avgDailySales: parseFloat(p.avg_daily_sales),
        daysUntilStockout: parseFloat(p.days_until_stockout)
      }))
    })
  } catch (error) {
    console.error('Get turnover error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy dữ liệu turnover' })
  }
})

/**
 * GET /api/stock-alerts/slow-moving
 * Get products with no sales in last 30 days
 */
router.get('/slow-moving', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '20' } = req.query

    const products = await query<{
      id: string
      name: string
      images: string[]
      stock: number
      price: string
      category_name: string | null
      last_sold_at: string | null
      days_since_last_sale: string | null
      stock_value: string
    }>(
      `SELECT 
        p.id, p.name, p.images, p.stock, p.price,
        c.name as category_name,
        last_sale.last_sold_at,
        EXTRACT(DAY FROM NOW() - last_sale.last_sold_at)::int as days_since_last_sale,
        (p.stock * p.price) as stock_value
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN (
         SELECT oi.product_id, MAX(o.created_at) as last_sold_at
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.status NOT IN ('cancelled')
         GROUP BY oi.product_id
       ) last_sale ON last_sale.product_id = p.id
       WHERE p.stock > 0
         AND (last_sale.last_sold_at IS NULL OR last_sale.last_sold_at < NOW() - INTERVAL '30 days')
       ORDER BY p.stock * p.price DESC
       LIMIT $1`,
      [parseInt(limit as string)]
    )

    res.json({
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        image: p.images?.[0] || null,
        stock: p.stock,
        price: parseFloat(p.price),
        categoryName: p.category_name,
        lastSoldAt: p.last_sold_at,
        daysSinceLastSale: p.days_since_last_sale ? parseInt(p.days_since_last_sale) : null,
        stockValue: parseFloat(p.stock_value)
      }))
    })
  } catch (error) {
    console.error('Get slow-moving error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy dữ liệu slow-moving' })
  }
})

/**
 * GET /api/stock-alerts/export
 * Export stock report to Excel
 */
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    // Get all products with stock info
    const products = await query<{
      id: string
      name: string
      stock: number
      low_stock_threshold: number
      price: string
      category_name: string | null
      reserved: string
      available: string
      total_sold_30d: string
      last_sold_at: string | null
    }>(
      `SELECT 
        p.id, p.name, p.stock, p.low_stock_threshold, p.price,
        c.name as category_name,
        COALESCE(reserved.quantity, 0) as reserved,
        (p.stock - COALESCE(reserved.quantity, 0)) as available,
        COALESCE(sales.total_sold, 0) as total_sold_30d,
        last_sale.last_sold_at
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN (
         SELECT product_id, SUM(quantity) as quantity
         FROM cart_items
         GROUP BY product_id
       ) reserved ON reserved.product_id = p.id
       LEFT JOIN (
         SELECT oi.product_id, SUM(oi.quantity) as total_sold
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= NOW() - INTERVAL '30 days'
           AND o.status NOT IN ('cancelled')
         GROUP BY oi.product_id
       ) sales ON sales.product_id = p.id
       LEFT JOIN (
         SELECT oi.product_id, MAX(o.created_at) as last_sold_at
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.status NOT IN ('cancelled')
         GROUP BY oi.product_id
       ) last_sale ON last_sale.product_id = p.id
       ORDER BY p.name`
    )

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Stock Alert System'
    workbook.created = new Date()

    // Sheet 1: Tổng quan tồn kho
    const overviewSheet = workbook.addWorksheet('Tổng quan tồn kho')
    overviewSheet.columns = [
      { header: 'Tên sản phẩm', key: 'name', width: 40 },
      { header: 'Danh mục', key: 'category', width: 20 },
      { header: 'Tồn kho', key: 'stock', width: 12 },
      { header: 'Đang giữ', key: 'reserved', width: 12 },
      { header: 'Khả dụng', key: 'available', width: 12 },
      { header: 'Ngưỡng', key: 'threshold', width: 12 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Giá', key: 'price', width: 15 },
      { header: 'Giá trị tồn', key: 'stockValue', width: 18 },
      { header: 'Bán 30 ngày', key: 'sold30d', width: 15 },
      { header: 'Lần bán cuối', key: 'lastSold', width: 18 },
    ]

    // Style header
    overviewSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    overviewSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    }

    products.forEach(p => {
      const available = parseInt(p.available)
      const status = available <= 0 ? 'Hết hàng' : available <= p.low_stock_threshold ? 'Sắp hết' : 'Bình thường'
      
      overviewSheet.addRow({
        name: p.name,
        category: p.category_name || 'Chưa phân loại',
        stock: p.stock,
        reserved: parseInt(p.reserved),
        available: available,
        threshold: p.low_stock_threshold,
        status: status,
        price: parseFloat(p.price),
        stockValue: p.stock * parseFloat(p.price),
        sold30d: parseInt(p.total_sold_30d),
        lastSold: p.last_sold_at ? new Date(p.last_sold_at).toLocaleDateString('vi-VN') : 'Chưa bán'
      })
    })

    // Format currency columns
    overviewSheet.getColumn('price').numFmt = '#,##0"đ"'
    overviewSheet.getColumn('stockValue').numFmt = '#,##0"đ"'

    // Sheet 2: Cảnh báo tồn kho
    const alertSheet = workbook.addWorksheet('Cảnh báo')
    alertSheet.columns = [
      { header: 'Tên sản phẩm', key: 'name', width: 40 },
      { header: 'Danh mục', key: 'category', width: 20 },
      { header: 'Tồn kho', key: 'stock', width: 12 },
      { header: 'Khả dụng', key: 'available', width: 12 },
      { header: 'Ngưỡng', key: 'threshold', width: 12 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Đề xuất nhập', key: 'reorder', width: 15 },
    ]

    alertSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    alertSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC2626' }
    }

    products.filter(p => parseInt(p.available) <= p.low_stock_threshold).forEach(p => {
      const available = parseInt(p.available)
      alertSheet.addRow({
        name: p.name,
        category: p.category_name || 'Chưa phân loại',
        stock: p.stock,
        available: available,
        threshold: p.low_stock_threshold,
        status: available <= 0 ? 'Hết hàng' : 'Sắp hết',
        reorder: Math.max(0, p.low_stock_threshold * 2 - p.stock)
      })
    })

    // Sheet 3: Slow-moving
    const slowSheet = workbook.addWorksheet('Hàng chậm bán')
    slowSheet.columns = [
      { header: 'Tên sản phẩm', key: 'name', width: 40 },
      { header: 'Danh mục', key: 'category', width: 20 },
      { header: 'Tồn kho', key: 'stock', width: 12 },
      { header: 'Giá', key: 'price', width: 15 },
      { header: 'Giá trị tồn', key: 'stockValue', width: 18 },
      { header: 'Lần bán cuối', key: 'lastSold', width: 18 },
      { header: 'Số ngày', key: 'days', width: 12 },
    ]

    slowSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    slowSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF59E0B' }
    }

    products
      .filter(p => p.stock > 0 && (!p.last_sold_at || new Date(p.last_sold_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
      .sort((a, b) => (b.stock * parseFloat(b.price)) - (a.stock * parseFloat(a.price)))
      .forEach(p => {
        const daysSince = p.last_sold_at 
          ? Math.floor((Date.now() - new Date(p.last_sold_at).getTime()) / (24 * 60 * 60 * 1000))
          : null
        
        slowSheet.addRow({
          name: p.name,
          category: p.category_name || 'Chưa phân loại',
          stock: p.stock,
          price: parseFloat(p.price),
          stockValue: p.stock * parseFloat(p.price),
          lastSold: p.last_sold_at ? new Date(p.last_sold_at).toLocaleDateString('vi-VN') : 'Chưa bán',
          days: daysSince ?? 'N/A'
        })
      })

    slowSheet.getColumn('price').numFmt = '#,##0"đ"'
    slowSheet.getColumn('stockValue').numFmt = '#,##0"đ"'

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=bao-cao-ton-kho-${new Date().toISOString().split('T')[0]}.xlsx`)
    res.send(buffer)
  } catch (error) {
    console.error('Export stock report error:', error)
    res.status(500).json({ success: false, error: 'Lỗi xuất báo cáo' })
  }
})

export default router
