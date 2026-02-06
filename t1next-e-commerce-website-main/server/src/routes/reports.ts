import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { staffMiddleware, AuthRequest } from '../middleware/auth.js'
import ExcelJS from 'exceljs'

const router = Router()

router.use(staffMiddleware)

/**
 * Parse filter parameters from query string
 */
function parseFilters(queryParams: Record<string, unknown>) {
  const categories = queryParams.categories 
    ? (queryParams.categories as string).split(',').filter(Boolean)
    : []
  const statuses = queryParams.statuses 
    ? (queryParams.statuses as string).split(',').filter(Boolean)
    : []
  const paymentMethods = queryParams.paymentMethods 
    ? (queryParams.paymentMethods as string).split(',').filter(Boolean)
    : []
  
  return { categories, statuses, paymentMethods }
}

/**
 * Build WHERE clause conditions for filters
 */
function buildFilterConditions(
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] },
  params: unknown[],
  options: { excludeCancelled?: boolean; tableAlias?: string } = {}
): { conditions: string[]; params: unknown[] } {
  const { excludeCancelled = true, tableAlias = '' } = options
  const prefix = tableAlias ? `${tableAlias}.` : ''
  const conditions: string[] = []
  const newParams = [...params]

  if (excludeCancelled && filters.statuses.length === 0) {
    conditions.push(`${prefix}status NOT IN ('cancelled')`)
  }

  if (filters.statuses.length > 0) {
    const placeholders = filters.statuses.map((_, i) => `$${newParams.length + i + 1}`).join(', ')
    conditions.push(`${prefix}status IN (${placeholders})`)
    newParams.push(...filters.statuses)
  }

  if (filters.paymentMethods.length > 0) {
    const placeholders = filters.paymentMethods.map((_, i) => `$${newParams.length + i + 1}`).join(', ')
    conditions.push(`${prefix}payment_method IN (${placeholders})`)
    newParams.push(...filters.paymentMethods)
  }

  return { conditions, params: newParams }
}

/**
 * Build category filter subquery
 */
function buildCategoryFilter(categories: string[], params: unknown[], tableAlias: string = 'orders'): { subquery: string; params: unknown[] } {
  if (categories.length === 0) {
    return { subquery: '', params }
  }
  
  const newParams = [...params]
  const placeholders = categories.map((_, i) => `$${newParams.length + i + 1}`).join(', ')
  newParams.push(...categories)
  
  const subquery = `${tableAlias}.id IN (
    SELECT DISTINCT oi.order_id 
    FROM order_items oi 
    JOIN products p ON p.id = oi.product_id 
    WHERE p.category_id IN (${placeholders})
  )`
  
  return { subquery, params: newParams }
}

/**
 * GET /api/reports/revenue
 * Báo cáo doanh thu theo khoảng thời gian
 */
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, groupBy = 'day' } = req.query
    const filters = parseFilters(req.query as Record<string, unknown>)
    
    // Default: 30 ngày gần nhất
    const endDate = to ? new Date(to as string) : new Date()
    const startDate = from ? new Date(from as string) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    let groupByClause: string
    
    switch (groupBy) {
      case 'month':
        groupByClause = "TO_CHAR(o.created_at, 'YYYY-MM')"
        break
      case 'week':
        groupByClause = "TO_CHAR(o.created_at, 'IYYY-IW')"
        break
      default: // day
        groupByClause = "TO_CHAR(o.created_at, 'YYYY-MM-DD')"
    }

    // Build base params and conditions
    let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
    let whereConditions = ['o.created_at >= $1', 'o.created_at <= $2']
    
    // Add filter conditions
    const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o' })
    baseParams = filterParams
    whereConditions = [...whereConditions, ...filterConditions]
    
    // Add category filter for products
    let categoryJoin = ''
    if (filters.categories.length > 0) {
      const placeholders = filters.categories.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
      categoryJoin = `JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id AND p.category_id IN (${placeholders})`
      baseParams.push(...filters.categories)
    }
    
    const whereClause = whereConditions.join(' AND ')

    // Doanh thu theo thời gian - khi có category filter, chỉ tính doanh thu từ sản phẩm thuộc danh mục
    let revenueQuery: string
    if (filters.categories.length > 0) {
      revenueQuery = `SELECT 
        ${groupByClause} as date,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(oi.quantity), 0) as items
       FROM orders o
       ${categoryJoin}
       WHERE ${whereClause}
       GROUP BY ${groupByClause}
       ORDER BY date ASC`
    } else {
      revenueQuery = `SELECT 
        ${groupByClause} as date,
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(*) as orders,
        COALESCE(SUM((SELECT SUM(quantity) FROM order_items WHERE order_id = o.id)), 0) as items
       FROM orders o
       WHERE ${whereClause}
       GROUP BY ${groupByClause}
       ORDER BY date ASC`
    }

    const revenueByTime = await query<{ date: string; revenue: string; orders: string; items: string }>(
      revenueQuery,
      baseParams
    )

    // Tổng hợp - khi có category filter, chỉ tính doanh thu từ sản phẩm thuộc danh mục
    let summaryQuery: string
    if (filters.categories.length > 0) {
      summaryQuery = `SELECT 
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(oi.quantity), 0) as total_items,
        COALESCE(SUM(oi.quantity * oi.price) / NULLIF(COUNT(DISTINCT o.id), 0), 0) as avg_order_value
       FROM orders o
       ${categoryJoin}
       WHERE ${whereClause}`
    } else {
      summaryQuery = `SELECT 
        COALESCE(SUM(o.total), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(SUM((SELECT SUM(quantity) FROM order_items WHERE order_id = o.id)), 0) as total_items,
        COALESCE(AVG(o.total), 0) as avg_order_value
       FROM orders o
       WHERE ${whereClause}`
    }

    const summary = await queryOne<{ 
      total_revenue: string
      total_orders: string
      total_items: string
      avg_order_value: string
    }>(summaryQuery, baseParams)

    // So sánh với kỳ trước (with same filters for fair comparison)
    const periodLength = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodLength)
    const prevEndDate = new Date(startDate.getTime() - 1)

    // Build prev period params with same filters
    let prevParams: unknown[] = [prevStartDate.toISOString(), prevEndDate.toISOString()]
    let prevWhereConditions = ['o.created_at >= $1', 'o.created_at <= $2']
    
    const { conditions: prevFilterConditions, params: prevFilterParams } = buildFilterConditions(filters, prevParams, { tableAlias: 'o' })
    prevParams = prevFilterParams
    prevWhereConditions = [...prevWhereConditions, ...prevFilterConditions]
    
    // Add category filter for prev period
    let prevCategoryJoin = ''
    if (filters.categories.length > 0) {
      const placeholders = filters.categories.map((_, i) => `$${prevParams.length + i + 1}`).join(', ')
      prevCategoryJoin = `JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id AND p.category_id IN (${placeholders})`
      prevParams.push(...filters.categories)
    }
    
    const prevWhereClause = prevWhereConditions.join(' AND ')

    let prevSummaryQuery: string
    if (filters.categories.length > 0) {
      prevSummaryQuery = `SELECT 
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
        COUNT(DISTINCT o.id) as total_orders
       FROM orders o
       ${prevCategoryJoin}
       WHERE ${prevWhereClause}`
    } else {
      prevSummaryQuery = `SELECT 
        COALESCE(SUM(o.total), 0) as total_revenue,
        COUNT(*) as total_orders
       FROM orders o
       WHERE ${prevWhereClause}`
    }

    const prevSummary = await queryOne<{ total_revenue: string; total_orders: string }>(
      prevSummaryQuery,
      prevParams
    )

    const currentRevenue = parseFloat(summary?.total_revenue || '0')
    const prevRevenue = parseFloat(prevSummary?.total_revenue || '0')
    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0

    res.json({
      success: true,
      data: {
        chart: revenueByTime.map(r => ({
          date: r.date,
          revenue: parseFloat(r.revenue),
          orders: parseInt(r.orders),
          items: parseInt(r.items)
        })),
        summary: {
          totalRevenue: currentRevenue,
          totalOrders: parseInt(summary?.total_orders || '0'),
          totalItems: parseInt(summary?.total_items || '0'),
          avgOrderValue: parseFloat(summary?.avg_order_value || '0'),
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          prevRevenue
        },
        period: { from: startDate.toISOString(), to: endDate.toISOString(), groupBy },
        filters: {
          categories: filters.categories,
          statuses: filters.statuses,
          paymentMethods: filters.paymentMethods
        }
      }
    })
  } catch (error) {
    console.error('Revenue report error:', error)
    res.status(500).json({ success: false, error: 'Lỗi tạo báo cáo' })
  }
})

/**
 * GET /api/reports/top-products
 * Top sản phẩm bán chạy
 */
router.get('/top-products', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, limit = '10' } = req.query
    const filters = parseFilters(req.query as Record<string, unknown>)
    
    const endDate = to ? new Date(to as string) : new Date()
    const startDate = from ? new Date(from as string) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Build base params and conditions
    let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
    let whereConditions = ['o.created_at >= $1', 'o.created_at <= $2']
    
    // Add filter conditions
    const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o' })
    baseParams = filterParams
    whereConditions = [...whereConditions, ...filterConditions]
    
    // Add category filter (direct on products table)
    if (filters.categories.length > 0) {
      const placeholders = filters.categories.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
      whereConditions.push(`p.category_id IN (${placeholders})`)
      baseParams.push(...filters.categories)
    }
    
    const whereClause = whereConditions.join(' AND ')
    
    // Add limit param
    baseParams.push(parseInt(limit as string))
    const limitParamIndex = baseParams.length

    const products = await query<{
      product_id: string
      name: string
      images: string[]
      total_quantity: string
      total_revenue: string
      order_count: string
    }>(
      `SELECT 
        p.id as product_id,
        p.name,
        p.images,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE ${whereClause}
       GROUP BY p.id, p.name, p.images
       ORDER BY total_quantity DESC
       LIMIT $${limitParamIndex}`,
      baseParams
    )

    res.json({
      success: true,
      data: products.map((p, index) => ({
        rank: index + 1,
        productId: p.product_id,
        name: p.name,
        image: p.images?.[0] || null,
        totalQuantity: parseInt(p.total_quantity),
        totalRevenue: parseFloat(p.total_revenue),
        orderCount: parseInt(p.order_count)
      })),
      filters: {
        categories: filters.categories,
        statuses: filters.statuses,
        paymentMethods: filters.paymentMethods
      }
    })
  } catch (error) {
    console.error('Top products report error:', error)
    res.status(500).json({ success: false, error: 'Lỗi tạo báo cáo' })
  }
})

/**
 * GET /api/reports/top-categories
 * Doanh thu theo danh mục
 */
router.get('/top-categories', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query
    const filters = parseFilters(req.query as Record<string, unknown>)
    
    const endDate = to ? new Date(to as string) : new Date()
    const startDate = from ? new Date(from as string) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Build base params and conditions for the order join
    let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
    let orderConditions = ['o.created_at >= $1', 'o.created_at <= $2']
    
    // Add filter conditions
    const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o' })
    baseParams = filterParams
    orderConditions = [...orderConditions, ...filterConditions]
    
    const orderConditionClause = orderConditions.join(' AND ')

    // Build WHERE clause for category filter (to filter which categories are returned)
    let categoryWhereClause = ''
    if (filters.categories.length > 0) {
      const placeholders = filters.categories.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
      categoryWhereClause = `WHERE c.id IN (${placeholders})`
      baseParams.push(...filters.categories)
    }

    const categories = await query<{
      category_id: string
      category_name: string
      total_quantity: string
      total_revenue: string
      product_count: string
    }>(
      `SELECT 
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(CASE WHEN ${orderConditionClause} THEN oi.quantity ELSE 0 END), 0) as total_quantity,
        COALESCE(SUM(CASE WHEN ${orderConditionClause} THEN oi.quantity * oi.price ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN ${orderConditionClause} THEN p.id END) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id
       ${categoryWhereClause}
       GROUP BY c.id, c.name
       ORDER BY total_revenue DESC`,
      baseParams
    )

    const totalRevenue = categories.reduce((sum, c) => sum + parseFloat(c.total_revenue), 0)

    res.json({
      success: true,
      data: categories.map(c => ({
        categoryId: c.category_id,
        name: c.category_name,
        totalQuantity: parseInt(c.total_quantity),
        totalRevenue: parseFloat(c.total_revenue),
        productCount: parseInt(c.product_count),
        percentage: totalRevenue > 0 ? Math.round((parseFloat(c.total_revenue) / totalRevenue) * 1000) / 10 : 0
      })),
      filters: {
        categories: filters.categories,
        statuses: filters.statuses,
        paymentMethods: filters.paymentMethods
      }
    })
  } catch (error) {
    console.error('Categories report error:', error)
    res.status(500).json({ success: false, error: 'Lỗi tạo báo cáo' })
  }
})

/**
 * GET /api/reports/payment-methods
 * Thống kê theo phương thức thanh toán
 */
router.get('/payment-methods', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query
    const filters = parseFilters(req.query as Record<string, unknown>)
    
    const endDate = to ? new Date(to as string) : new Date()
    const startDate = from ? new Date(from as string) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Build base params and conditions
    let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
    let whereConditions = ['created_at >= $1', 'created_at <= $2']
    
    // Add filter conditions
    const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams)
    baseParams = filterParams
    whereConditions = [...whereConditions, ...filterConditions]
    
    // Add category filter
    const { subquery: categorySubquery, params: categoryParams } = buildCategoryFilter(filters.categories, baseParams)
    if (categorySubquery) {
      baseParams = categoryParams
      whereConditions.push(categorySubquery)
    }
    
    const whereClause = whereConditions.join(' AND ')

    const methods = await query<{
      payment_method: string
      total_orders: string
      total_revenue: string
    }>(
      `SELECT 
        payment_method,
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue
       FROM orders
       WHERE ${whereClause}
       GROUP BY payment_method
       ORDER BY total_revenue DESC`,
      baseParams
    )

    const totalRevenue = methods.reduce((sum, m) => sum + parseFloat(m.total_revenue), 0)

    const methodNames: Record<string, string> = {
      'cash': 'Tiền mặt',
      'card': 'Thẻ',
      'transfer': 'Chuyển khoản',
      'bank_transfer': 'Chuyển khoản',
      'cod': 'COD'
    }

    res.json({
      success: true,
      data: methods.map(m => ({
        method: m.payment_method,
        name: methodNames[m.payment_method] || m.payment_method,
        totalOrders: parseInt(m.total_orders),
        totalRevenue: parseFloat(m.total_revenue),
        percentage: totalRevenue > 0 ? Math.round((parseFloat(m.total_revenue) / totalRevenue) * 1000) / 10 : 0
      })),
      filters: {
        categories: filters.categories,
        statuses: filters.statuses,
        paymentMethods: filters.paymentMethods
      }
    })
  } catch (error) {
    console.error('Payment methods report error:', error)
    res.status(500).json({ success: false, error: 'Lỗi tạo báo cáo' })
  }
})

/**
 * GET /api/reports/order-status
 * Thống kê theo trạng thái đơn hàng
 */
router.get('/order-status', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query
    const filters = parseFilters(req.query as Record<string, unknown>)
    
    const endDate = to ? new Date(to as string) : new Date()
    const startDate = from ? new Date(from as string) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Build base params and conditions
    let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
    let whereConditions = ['created_at >= $1', 'created_at <= $2']
    
    // Add filter conditions (excluding status filter for this endpoint as we want all statuses)
    const filtersWithoutStatus = { ...filters, statuses: [] }
    const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filtersWithoutStatus, baseParams, { excludeCancelled: false })
    baseParams = filterParams
    whereConditions = [...whereConditions, ...filterConditions]
    
    // Add payment method filter
    if (filters.paymentMethods.length > 0) {
      const placeholders = filters.paymentMethods.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
      whereConditions.push(`payment_method IN (${placeholders})`)
      baseParams.push(...filters.paymentMethods)
    }
    
    // Add category filter
    const { subquery: categorySubquery, params: categoryParams } = buildCategoryFilter(filters.categories, baseParams)
    if (categorySubquery) {
      baseParams = categoryParams
      whereConditions.push(categorySubquery)
    }
    
    const whereClause = whereConditions.join(' AND ')

    const statuses = await query<{
      status: string
      total_orders: string
      total_revenue: string
    }>(
      `SELECT 
        status,
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue
       FROM orders
       WHERE ${whereClause}
       GROUP BY status
       ORDER BY total_orders DESC`,
      baseParams
    )

    const statusNames: Record<string, string> = {
      'pending': 'Chờ xử lý',
      'awaiting_payment': 'Chờ thanh toán',
      'confirmed': 'Đã xác nhận',
      'shipping': 'Đang giao',
      'delivered': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    }

    const statusColors: Record<string, string> = {
      'pending': '#f59e0b',
      'awaiting_payment': '#a855f7',
      'confirmed': '#3b82f6',
      'shipping': '#8b5cf6',
      'delivered': '#10b981',
      'cancelled': '#ef4444'
    }

    res.json({
      success: true,
      data: statuses.map(s => ({
        status: s.status,
        name: statusNames[s.status] || s.status,
        color: statusColors[s.status] || '#6b7280',
        totalOrders: parseInt(s.total_orders),
        totalRevenue: parseFloat(s.total_revenue)
      })),
      filters: {
        categories: filters.categories,
        statuses: filters.statuses,
        paymentMethods: filters.paymentMethods
      }
    })
  } catch (error) {
    console.error('Order status report error:', error)
    res.status(500).json({ success: false, error: 'Lỗi tạo báo cáo' })
  }
})

/**
 * GET /api/reports/export
 * Export report data to CSV or XLSX format
 * Supports: revenue, orders, products, categories
 */
router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const { type, from, to, groupBy = 'day', format = 'xlsx' } = req.query
    const filters = parseFilters(req.query as Record<string, unknown>)
    
    // Validate type parameter
    const validTypes = ['revenue', 'orders', 'products', 'categories']
    if (!type || !validTypes.includes(type as string)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Loại báo cáo không hợp lệ. Chọn: revenue, orders, products, categories' 
      })
    }
    
    // Default: 30 ngày gần nhất
    const endDate = to ? new Date(to as string) : new Date()
    const startDate = from ? new Date(from as string) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Định dạng ngày không hợp lệ' 
      })
    }

    const baseFilename = `bao-cao-${type}-${formatDateForFilename(startDate)}-${formatDateForFilename(endDate)}`
    
    // Generate Excel if format is xlsx
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'E-Commerce Report System'
      workbook.created = new Date()
      
      let sheetName: string
      
      switch (type) {
        case 'revenue':
          sheetName = 'Doanh thu'
          await generateRevenueSheet(workbook, sheetName, startDate, endDate, groupBy as string, filters)
          break
        case 'orders':
          sheetName = 'Đơn hàng'
          await generateOrdersSheet(workbook, sheetName, startDate, endDate, filters)
          break
        case 'products':
          sheetName = 'Sản phẩm'
          await generateProductsSheet(workbook, sheetName, startDate, endDate, filters)
          break
        case 'categories':
          sheetName = 'Danh mục'
          await generateCategoriesSheet(workbook, sheetName, startDate, endDate, filters)
          break
        default:
          return res.status(400).json({ success: false, error: 'Loại báo cáo không hợp lệ' })
      }
      
      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.xlsx"`)
      
      // Write to response
      await workbook.xlsx.write(res)
      res.end()
      return
    }

    // Generate CSV (legacy support)
    let csvContent: string
    
    switch (type) {
      case 'revenue':
        csvContent = await generateRevenueCSV(startDate, endDate, groupBy as string, filters)
        break
      case 'orders':
        csvContent = await generateOrdersCSV(startDate, endDate, filters)
        break
      case 'products':
        csvContent = await generateProductsCSV(startDate, endDate, filters)
        break
      case 'categories':
        csvContent = await generateCategoriesCSV(startDate, endDate, filters)
        break
      default:
        return res.status(400).json({ success: false, error: 'Loại báo cáo không hợp lệ' })
    }
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.csv"`)
    
    // Send CSV with BOM for UTF-8 Excel compatibility
    const BOM = '\uFEFF'
    res.send(BOM + csvContent)
    
  } catch (error) {
    console.error('Export report error:', error)
    res.status(500).json({ success: false, error: 'Lỗi xuất báo cáo' })
  }
})

/**
 * Helper: Format date for filename
 */
function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Helper: Escape CSV value
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""'
  const str = String(value)
  return `"${str.replace(/"/g, '""')}"`
}

/**
 * Generate Revenue CSV
 */
async function generateRevenueCSV(
  startDate: Date, 
  endDate: Date, 
  groupBy: string,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
): Promise<string> {
  let groupByClause: string
  
  switch (groupBy) {
    case 'month':
      groupByClause = "TO_CHAR(created_at, 'YYYY-MM')"
      break
    case 'week':
      groupByClause = "TO_CHAR(created_at, 'IYYY-IW')"
      break
    default:
      groupByClause = "TO_CHAR(created_at, 'YYYY-MM-DD')"
  }

  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let whereConditions = ['created_at >= $1', 'created_at <= $2']
  
  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams)
  baseParams = filterParams
  whereConditions = [...whereConditions, ...filterConditions]
  
  const { subquery: categorySubquery, params: categoryParams } = buildCategoryFilter(filters.categories, baseParams)
  if (categorySubquery) {
    baseParams = categoryParams
    whereConditions.push(categorySubquery)
  }
  
  const whereClause = whereConditions.join(' AND ')

  const data = await query<{ date: string; revenue: string; orders: string; items: string }>(
    `SELECT 
      ${groupByClause} as date,
      COALESCE(SUM(total), 0) as revenue,
      COUNT(*) as orders,
      COALESCE(SUM((SELECT SUM(quantity) FROM order_items WHERE order_id = orders.id)), 0) as items
     FROM orders
     WHERE ${whereClause}
     GROUP BY ${groupByClause}
     ORDER BY date ASC`,
    baseParams
  )

  // Build CSV
  const headers = ['Ngày', 'Số đơn', 'Số lượng SP', 'Doanh thu']
  const rows = data.map(row => [
    escapeCSV(row.date),
    escapeCSV(parseInt(row.orders)),
    escapeCSV(parseInt(row.items)),
    escapeCSV(parseFloat(row.revenue))
  ].join(','))

  return [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\n')
}

/**
 * Generate Orders CSV
 */
async function generateOrdersCSV(
  startDate: Date, 
  endDate: Date,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
): Promise<string> {
  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let whereConditions = ['o.created_at >= $1', 'o.created_at <= $2']
  
  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o', excludeCancelled: false })
  baseParams = filterParams
  whereConditions = [...whereConditions, ...filterConditions]
  
  const { subquery: categorySubquery, params: categoryParams } = buildCategoryFilter(filters.categories, baseParams, 'o')
  if (categorySubquery) {
    baseParams = categoryParams
    whereConditions.push(categorySubquery)
  }
  
  const whereClause = whereConditions.join(' AND ')

  const data = await query<{
    id: string
    created_at: string
    customer_name: string
    phone: string
    payment_method: string
    status: string
    total: string
  }>(
    `SELECT 
      o.id,
      o.created_at,
      COALESCE(u.name, o.recipient_name) as customer_name,
      o.phone,
      o.payment_method,
      o.status,
      o.total
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE ${whereClause}
     ORDER BY o.created_at DESC`,
    baseParams
  )

  const statusNames: Record<string, string> = {
    'pending': 'Chờ xử lý',
    'awaiting_payment': 'Chờ thanh toán',
    'confirmed': 'Đã xác nhận',
    'shipping': 'Đang giao',
    'delivered': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  }

  const paymentNames: Record<string, string> = {
    'cash': 'Tiền mặt',
    'card': 'Thẻ',
    'transfer': 'Chuyển khoản',
    'bank_transfer': 'Chuyển khoản',
    'cod': 'COD'
  }

  const headers = ['Mã đơn', 'Ngày tạo', 'Khách hàng', 'SĐT', 'Thanh toán', 'Trạng thái', 'Tổng tiền']
  const rows = data.map(row => [
    escapeCSV(row.id),
    escapeCSV(new Date(row.created_at).toLocaleString('vi-VN').replace(',', '')),
    escapeCSV(row.customer_name || ''),
    escapeCSV(row.phone || ''),
    escapeCSV(paymentNames[row.payment_method] || row.payment_method),
    escapeCSV(statusNames[row.status] || row.status),
    escapeCSV(parseFloat(row.total))
  ].join(','))

  return [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\n')
}

/**
 * Generate Products CSV (Top selling products)
 */
async function generateProductsCSV(
  startDate: Date, 
  endDate: Date,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
): Promise<string> {
  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let whereConditions = ['o.created_at >= $1', 'o.created_at <= $2']
  
  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o' })
  baseParams = filterParams
  whereConditions = [...whereConditions, ...filterConditions]
  
  if (filters.categories.length > 0) {
    const placeholders = filters.categories.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
    whereConditions.push(`p.category_id IN (${placeholders})`)
    baseParams.push(...filters.categories)
  }
  
  const whereClause = whereConditions.join(' AND ')

  const data = await query<{
    product_id: string
    name: string
    category_name: string
    total_quantity: string
    total_revenue: string
    order_count: string
  }>(
    `SELECT 
      p.id as product_id,
      p.name,
      c.name as category_name,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price) as total_revenue,
      COUNT(DISTINCT oi.order_id) as order_count
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     JOIN orders o ON o.id = oi.order_id
     WHERE ${whereClause}
     GROUP BY p.id, p.name, c.name
     ORDER BY total_quantity DESC`,
    baseParams
  )

  const headers = ['Hạng', 'Mã SP', 'Tên sản phẩm', 'Danh mục', 'SL bán', 'Số đơn', 'Doanh thu']
  const rows = data.map((row, index) => [
    escapeCSV(index + 1),
    escapeCSV(row.product_id),
    escapeCSV(row.name),
    escapeCSV(row.category_name || 'Không có'),
    escapeCSV(parseInt(row.total_quantity)),
    escapeCSV(parseInt(row.order_count)),
    escapeCSV(parseFloat(row.total_revenue))
  ].join(','))

  return [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\n')
}

/**
 * Generate Categories CSV
 */
async function generateCategoriesCSV(
  startDate: Date, 
  endDate: Date,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
): Promise<string> {
  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let orderConditions = ['o.created_at >= $1', 'o.created_at <= $2']
  
  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o' })
  baseParams = filterParams
  orderConditions = [...orderConditions, ...filterConditions]
  
  if (filters.categories.length > 0) {
    const placeholders = filters.categories.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
    orderConditions.push(`c.id IN (${placeholders})`)
    baseParams.push(...filters.categories)
  }
  
  const orderConditionClause = orderConditions.join(' AND ')

  const data = await query<{
    category_id: string
    category_name: string
    total_quantity: string
    total_revenue: string
    product_count: string
  }>(
    `SELECT 
      c.id as category_id,
      c.name as category_name,
      COALESCE(SUM(oi.quantity), 0) as total_quantity,
      COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
      COUNT(DISTINCT p.id) as product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     LEFT JOIN order_items oi ON oi.product_id = p.id
     LEFT JOIN orders o ON o.id = oi.order_id AND ${orderConditionClause}
     GROUP BY c.id, c.name
     ORDER BY total_revenue DESC`,
    baseParams
  )

  const totalRevenue = data.reduce((sum, c) => sum + parseFloat(c.total_revenue), 0)

  const headers = ['Mã danh mục', 'Tên danh mục', 'Số SP', 'SL bán', 'Doanh thu', 'Tỷ lệ (%)']
  const rows = data.map(row => {
    const revenue = parseFloat(row.total_revenue)
    const percentage = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0
    return [
      escapeCSV(row.category_id),
      escapeCSV(row.category_name),
      escapeCSV(parseInt(row.product_count)),
      escapeCSV(parseInt(row.total_quantity)),
      escapeCSV(revenue),
      escapeCSV(percentage)
    ].join(',')
  })

  return [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\n')
}

/**
 * Excel Sheet Generators
 */

// Style for header row
function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  }
  row.alignment = { horizontal: 'center', vertical: 'middle' }
  row.height = 25
}

// Style for currency cells
function formatCurrency(worksheet: ExcelJS.Worksheet, colIndex: number) {
  worksheet.getColumn(colIndex).numFmt = '#,##0 "đ"'
}

async function generateRevenueSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  startDate: Date,
  endDate: Date,
  groupBy: string,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
) {
  const worksheet = workbook.addWorksheet(sheetName)
  
  let groupByClause: string
  switch (groupBy) {
    case 'month':
      groupByClause = "TO_CHAR(created_at, 'YYYY-MM')"
      break
    case 'week':
      groupByClause = "TO_CHAR(created_at, 'IYYY-IW')"
      break
    default:
      groupByClause = "TO_CHAR(created_at, 'YYYY-MM-DD')"
  }

  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let whereConditions = ['created_at >= $1', 'created_at <= $2']
  
  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams)
  baseParams = filterParams
  whereConditions = [...whereConditions, ...filterConditions]
  
  const { subquery: categorySubquery, params: categoryParams } = buildCategoryFilter(filters.categories, baseParams)
  if (categorySubquery) {
    baseParams = categoryParams
    whereConditions.push(categorySubquery)
  }
  
  const whereClause = whereConditions.join(' AND ')

  const data = await query<{ date: string; revenue: string; orders: string; items: string }>(
    `SELECT 
      ${groupByClause} as date,
      COALESCE(SUM(total), 0) as revenue,
      COUNT(*) as orders,
      COALESCE(SUM((SELECT SUM(quantity) FROM order_items WHERE order_id = orders.id)), 0) as items
     FROM orders
     WHERE ${whereClause}
     GROUP BY ${groupByClause}
     ORDER BY date ASC`,
    baseParams
  )

  // Set columns
  worksheet.columns = [
    { header: 'Ngày', key: 'date', width: 15 },
    { header: 'Số đơn', key: 'orders', width: 12 },
    { header: 'Số lượng SP', key: 'items', width: 15 },
    { header: 'Doanh thu', key: 'revenue', width: 20 },
  ]

  // Style header
  styleHeaderRow(worksheet.getRow(1))

  // Add data
  data.forEach(row => {
    worksheet.addRow({
      date: row.date,
      orders: parseInt(row.orders),
      items: parseInt(row.items),
      revenue: parseFloat(row.revenue)
    })
  })

  // Format currency column
  formatCurrency(worksheet, 4)
  
  // Auto-fit columns
  worksheet.columns.forEach(col => {
    col.alignment = { horizontal: 'right' }
  })
  worksheet.getColumn(1).alignment = { horizontal: 'left' }
}

async function generateOrdersSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  startDate: Date,
  endDate: Date,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
) {
  const worksheet = workbook.addWorksheet(sheetName)
  
  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let whereConditions = ['o.created_at >= $1', 'o.created_at <= $2']

  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o', excludeCancelled: false })
  baseParams = filterParams
  whereConditions = [...whereConditions, ...filterConditions]
  
  const { subquery: categorySubquery, params: categoryParams } = buildCategoryFilter(filters.categories, baseParams, 'o')
  if (categorySubquery) {
    baseParams = categoryParams
    whereConditions.push(categorySubquery)
  }
  
  const whereClause = whereConditions.join(' AND ')

  const data = await query<{
    id: string
    created_at: string
    customer_name: string
    phone: string
    payment_method: string
    status: string
    total: string
  }>(
    `SELECT 
      o.id,
      o.created_at,
      COALESCE(u.name, o.recipient_name) as customer_name,
      o.phone,
      o.payment_method,
      o.status,
      o.total
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE ${whereClause}
     ORDER BY o.created_at DESC`,
    baseParams
  )

  const statusNames: Record<string, string> = {
    'pending': 'Chờ xử lý',
    'awaiting_payment': 'Chờ thanh toán',
    'confirmed': 'Đã xác nhận',
    'shipping': 'Đang giao',
    'delivered': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  }

  const paymentNames: Record<string, string> = {
    'cash': 'Tiền mặt',
    'card': 'Thẻ',
    'transfer': 'Chuyển khoản',
    'bank_transfer': 'Chuyển khoản',
    'cod': 'COD'
  }

  worksheet.columns = [
    { header: 'Mã đơn', key: 'id', width: 12 },
    { header: 'Ngày tạo', key: 'created_at', width: 20 },
    { header: 'Khách hàng', key: 'customer_name', width: 25 },
    { header: 'SĐT', key: 'phone', width: 15 },
    { header: 'Thanh toán', key: 'payment_method', width: 15 },
    { header: 'Trạng thái', key: 'status', width: 15 },
    { header: 'Tổng tiền', key: 'total', width: 18 },
  ]

  styleHeaderRow(worksheet.getRow(1))

  data.forEach(row => {
    worksheet.addRow({
      id: row.id,
      created_at: new Date(row.created_at),
      customer_name: row.customer_name || '',
      phone: row.phone || '',
      payment_method: paymentNames[row.payment_method] || row.payment_method,
      status: statusNames[row.status] || row.status,
      total: parseFloat(row.total)
    })
  })

  // Format date column
  worksheet.getColumn(2).numFmt = 'dd/mm/yyyy hh:mm'
  formatCurrency(worksheet, 7)
}

async function generateProductsSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  startDate: Date,
  endDate: Date,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
) {
  const worksheet = workbook.addWorksheet(sheetName)
  
  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let whereConditions = ['o.created_at >= $1', 'o.created_at <= $2']
  
  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o' })
  baseParams = filterParams
  whereConditions = [...whereConditions, ...filterConditions]
  
  if (filters.categories.length > 0) {
    const placeholders = filters.categories.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
    whereConditions.push(`p.category_id IN (${placeholders})`)
    baseParams.push(...filters.categories)
  }
  
  const whereClause = whereConditions.join(' AND ')

  const data = await query<{
    product_id: string
    name: string
    category_name: string
    total_quantity: string
    total_revenue: string
    order_count: string
  }>(
    `SELECT 
      p.id as product_id,
      p.name,
      c.name as category_name,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.quantity * oi.price) as total_revenue,
      COUNT(DISTINCT oi.order_id) as order_count
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     JOIN orders o ON o.id = oi.order_id
     WHERE ${whereClause}
     GROUP BY p.id, p.name, c.name
     ORDER BY total_quantity DESC`,
    baseParams
  )

  worksheet.columns = [
    { header: 'Hạng', key: 'rank', width: 8 },
    { header: 'Tên sản phẩm', key: 'name', width: 40 },
    { header: 'Danh mục', key: 'category_name', width: 20 },
    { header: 'SL bán', key: 'total_quantity', width: 12 },
    { header: 'Số đơn', key: 'order_count', width: 12 },
    { header: 'Doanh thu', key: 'total_revenue', width: 20 },
  ]

  styleHeaderRow(worksheet.getRow(1))

  data.forEach((row, index) => {
    worksheet.addRow({
      rank: index + 1,
      name: row.name,
      category_name: row.category_name || 'Không có',
      total_quantity: parseInt(row.total_quantity),
      order_count: parseInt(row.order_count),
      total_revenue: parseFloat(row.total_revenue)
    })
  })

  formatCurrency(worksheet, 6)
}

async function generateCategoriesSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  startDate: Date,
  endDate: Date,
  filters: { categories: string[]; statuses: string[]; paymentMethods: string[] }
) {
  const worksheet = workbook.addWorksheet(sheetName)
  
  let baseParams: unknown[] = [startDate.toISOString(), endDate.toISOString()]
  let orderConditions = ['o.created_at >= $1', 'o.created_at <= $2']
  
  const { conditions: filterConditions, params: filterParams } = buildFilterConditions(filters, baseParams, { tableAlias: 'o' })
  baseParams = filterParams
  orderConditions = [...orderConditions, ...filterConditions]
  
  const orderConditionClause = orderConditions.join(' AND ')
  
  let categoryWhereClause = ''
  if (filters.categories.length > 0) {
    const placeholders = filters.categories.map((_, i) => `$${baseParams.length + i + 1}`).join(', ')
    categoryWhereClause = `WHERE c.id IN (${placeholders})`
    baseParams.push(...filters.categories)
  }

  const data = await query<{
    category_id: string
    category_name: string
    product_count: string
    total_quantity: string
    total_revenue: string
  }>(
    `SELECT 
      c.id as category_id,
      c.name as category_name,
      COUNT(DISTINCT p.id) as product_count,
      COALESCE(SUM(CASE WHEN ${orderConditionClause} THEN oi.quantity ELSE 0 END), 0) as total_quantity,
      COALESCE(SUM(CASE WHEN ${orderConditionClause} THEN oi.quantity * oi.price ELSE 0 END), 0) as total_revenue
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     LEFT JOIN order_items oi ON oi.product_id = p.id
     LEFT JOIN orders o ON o.id = oi.order_id
     ${categoryWhereClause}
     GROUP BY c.id, c.name
     ORDER BY total_revenue DESC`,
    baseParams
  )

  const totalRevenue = data.reduce((sum, c) => sum + parseFloat(c.total_revenue), 0)

  worksheet.columns = [
    { header: 'Danh mục', key: 'category_name', width: 30 },
    { header: 'Số SP', key: 'product_count', width: 12 },
    { header: 'SL bán', key: 'total_quantity', width: 12 },
    { header: 'Doanh thu', key: 'total_revenue', width: 20 },
    { header: 'Tỷ lệ %', key: 'percentage', width: 12 },
  ]

  styleHeaderRow(worksheet.getRow(1))

  data.forEach(row => {
    const revenue = parseFloat(row.total_revenue)
    const percentage = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0
    
    worksheet.addRow({
      category_name: row.category_name,
      product_count: parseInt(row.product_count),
      total_quantity: parseInt(row.total_quantity),
      total_revenue: revenue,
      percentage: percentage
    })
  })

  formatCurrency(worksheet, 4)
  worksheet.getColumn(5).numFmt = '0.0"%"'
}

export default router
