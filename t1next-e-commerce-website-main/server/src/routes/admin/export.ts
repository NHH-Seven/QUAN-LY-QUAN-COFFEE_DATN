import { Router, Response } from 'express'
import { query } from '../../db/index.js'
import { AuthRequest, adminMiddleware } from '../../middleware/auth.js'

const router = Router()
router.use(adminMiddleware)

// GET /api/admin/export/orders - Export orders to CSV
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, status } = req.query
    
    let sql = `
      SELECT 
        o.id, o.status, o.total, o.payment_method, o.shipping_address,
        o.recipient_name, o.phone, o.created_at,
        u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (from) {
      sql += ` AND o.created_at >= $${paramIndex++}`
      params.push(from)
    }
    if (to) {
      sql += ` AND o.created_at <= $${paramIndex++}`
      params.push(to)
    }
    if (status) {
      sql += ` AND o.status = $${paramIndex++}`
      params.push(status)
    }
    sql += ' ORDER BY o.created_at DESC'

    const orders = await query(sql, params)

    // Generate CSV
    const headers = ['Mã đơn', 'Trạng thái', 'Tổng tiền', 'Thanh toán', 'Khách hàng', 'Email', 'SĐT', 'Địa chỉ', 'Ngày đặt']
    const statusMap: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    }
    const paymentMap: Record<string, string> = {
      cod: 'COD',
      bank_transfer: 'Chuyển khoản'
    }

    let csv = '\uFEFF' + headers.join(',') + '\n' // BOM for Excel UTF-8
    orders.forEach((o: any) => {
      csv += [
        o.id.slice(0, 8).toUpperCase(),
        statusMap[o.status] || o.status,
        o.total,
        paymentMap[o.payment_method] || o.payment_method,
        `"${o.recipient_name || o.user_name || ''}"`,
        o.user_email || '',
        o.phone || '',
        `"${(o.shipping_address || '').replace(/"/g, '""')}"`,
        new Date(o.created_at).toLocaleString('vi-VN')
      ].join(',') + '\n'
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (error) {
    console.error('Export orders error:', error)
    res.status(500).json({ success: false, error: 'Lỗi xuất báo cáo' })
  }
})

// GET /api/admin/export/revenue - Export revenue report
router.get('/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query
    
    let sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM orders
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (from) {
      sql += ` AND created_at >= $${paramIndex++}`
      params.push(from)
    }
    if (to) {
      sql += ` AND created_at <= $${paramIndex++}`
      params.push(to)
    }
    sql += ' GROUP BY DATE(created_at) ORDER BY date DESC'

    const data = await query(sql, params)

    const headers = ['Ngày', 'Số đơn', 'Doanh thu', 'Đơn hủy']
    let csv = '\uFEFF' + headers.join(',') + '\n'
    data.forEach((row: any) => {
      csv += [
        new Date(row.date).toLocaleDateString('vi-VN'),
        row.order_count,
        row.revenue,
        row.cancelled_count
      ].join(',') + '\n'
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=revenue_${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (error) {
    console.error('Export revenue error:', error)
    res.status(500).json({ success: false, error: 'Lỗi xuất báo cáo' })
  }
})

// GET /api/admin/export/products - Export products
router.get('/products', async (req: AuthRequest, res: Response) => {
  try {
    const products = await query(`
      SELECT p.id, p.name, p.slug, p.price, p.original_price, p.stock, p.sold, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `)

    const headers = ['ID', 'Tên sản phẩm', 'Slug', 'Giá bán', 'Giá gốc', 'Tồn kho', 'Đã bán', 'Danh mục']
    let csv = '\uFEFF' + headers.join(',') + '\n'
    products.forEach((p: any) => {
      csv += [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.slug,
        p.price,
        p.original_price || '',
        p.stock,
        p.sold || 0,
        `"${p.category || ''}"`
      ].join(',') + '\n'
    })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=products_${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (error) {
    console.error('Export products error:', error)
    res.status(500).json({ success: false, error: 'Lỗi xuất báo cáo' })
  }
})

export default router
