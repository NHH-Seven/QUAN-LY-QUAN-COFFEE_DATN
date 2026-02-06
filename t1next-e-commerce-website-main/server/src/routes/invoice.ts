import { Router } from 'express'
import { queryOne, query } from '../db/index.js'
import { authMiddleware, staffMiddleware } from '../middleware/auth.js'

const router = Router()

interface OrderDetail {
  id: string
  recipient_name: string
  phone: string
  shipping_address: string
  payment_method: string
  status: string
  total: string
  discount_amount: string | null
  shipping_fee: string | null
  note: string | null
  created_at: Date
  user_email: string | null
  tracking_code: string | null
  shipping_carrier: string | null
}

interface OrderItem {
  name: string
  quantity: number
  price: string
}

// GET /api/invoice/:orderId - Get invoice data for PDF generation
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role

    // Get order
    let order: OrderDetail | null
    
    // Staff can view any order, users can only view their own
    if (userRole === 'admin' || userRole === 'sales' || userRole === 'warehouse') {
      order = await queryOne<OrderDetail>(
        `SELECT o.*, u.email as user_email
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`,
        [orderId]
      )
    } else {
      order = await queryOne<OrderDetail>(
        `SELECT o.*, u.email as user_email
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = $1 AND o.user_id = $2`,
        [orderId, userId]
      )
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    // Get order items
    const items = await query<OrderItem>(
      `SELECT p.name, oi.quantity, oi.price
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    )

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
    const discount = Number(order.discount_amount) || 0
    const shippingFee = Number(order.shipping_fee) || 0
    const total = Number(order.total)

    // Format invoice data
    const invoiceData = {
      invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}`,
      orderId: order.id,
      createdAt: order.created_at,
      
      // Customer info
      customer: {
        name: order.recipient_name,
        phone: order.phone,
        email: order.user_email,
        address: order.shipping_address
      },
      
      // Order info
      paymentMethod: order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng',
      status: order.status,
      note: order.note,
      
      // Shipping info
      tracking: order.tracking_code ? {
        code: order.tracking_code,
        carrier: order.shipping_carrier
      } : null,
      
      // Items
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.price) * item.quantity
      })),
      
      // Totals
      subtotal,
      shippingFee,
      discount,
      total,
      
      // Company info (can be configured)
      company: {
        name: 'TechShop',
        address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
        phone: '1900 1234',
        email: 'support@techshop.vn',
        taxId: '0123456789'
      }
    }

    res.json({ success: true, data: invoiceData })
  } catch (error) {
    console.error('Get invoice error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

// GET /api/invoice/:orderId/html - Get invoice as HTML (for printing)
router.get('/:orderId/html', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role

    // Get order (same logic as above)
    let order: OrderDetail | null
    
    if (userRole === 'admin' || userRole === 'sales' || userRole === 'warehouse') {
      order = await queryOne<OrderDetail>(
        `SELECT o.*, u.email as user_email
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`,
        [orderId]
      )
    } else {
      order = await queryOne<OrderDetail>(
        `SELECT o.*, u.email as user_email
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.id = $1 AND o.user_id = $2`,
        [orderId, userId]
      )
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    const items = await query<OrderItem>(
      `SELECT p.name, oi.quantity, oi.price
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    )

    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
    const discount = Number(order.discount_amount) || 0
    const shippingFee = Number(order.shipping_fee) || 0
    const total = Number(order.total)

    const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    const formatDate = (date: Date) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hóa đơn #${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #333; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
    .company h1 { font-size: 24px; color: #2563eb; margin-bottom: 5px; }
    .company p { color: #666; font-size: 12px; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 20px; color: #333; margin-bottom: 5px; }
    .invoice-info p { color: #666; font-size: 12px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: 600; color: #666; margin-bottom: 10px; text-transform: uppercase; }
    .customer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-block p { margin-bottom: 5px; }
    .info-block strong { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals tr td { padding: 8px 12px; }
    .totals .total-row { font-size: 16px; font-weight: 600; background: #f8f9fa; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { padding: 0; }
      .invoice { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="company">
        <h1>TechShop</h1>
        <p>123 Nguyễn Văn Linh, Quận 7, TP.HCM</p>
        <p>Hotline: 1900 1234 | Email: support@techshop.vn</p>
        <p>MST: 0123456789</p>
      </div>
      <div class="invoice-info">
        <h2>HÓA ĐƠN</h2>
        <p><strong>Số:</strong> INV-${order.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>Ngày:</strong> ${formatDate(order.created_at)}</p>
        <p><strong>Mã đơn:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Thông tin khách hàng</div>
      <div class="customer-info">
        <div class="info-block">
          <p><strong>Người nhận:</strong> ${order.recipient_name}</p>
          <p><strong>Điện thoại:</strong> ${order.phone}</p>
          ${order.user_email ? `<p><strong>Email:</strong> ${order.user_email}</p>` : ''}
        </div>
        <div class="info-block">
          <p><strong>Địa chỉ:</strong> ${order.shipping_address}</p>
          <p><strong>Thanh toán:</strong> ${order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
          ${order.tracking_code ? `<p><strong>Mã vận đơn:</strong> ${order.tracking_code}</p>` : ''}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Chi tiết đơn hàng</div>
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Sản phẩm</th>
            <th class="text-right">Đơn giá</th>
            <th class="text-right">SL</th>
            <th class="text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${item.name}</td>
            <td class="text-right">${formatPrice(Number(item.price))}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatPrice(Number(item.price) * item.quantity)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>

      <table class="totals">
        <tr>
          <td>Tạm tính:</td>
          <td class="text-right">${formatPrice(subtotal)}</td>
        </tr>
        <tr>
          <td>Phí vận chuyển:</td>
          <td class="text-right">${formatPrice(shippingFee)}</td>
        </tr>
        ${discount > 0 ? `
        <tr>
          <td>Giảm giá:</td>
          <td class="text-right">-${formatPrice(discount)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td>Tổng cộng:</td>
          <td class="text-right">${formatPrice(total)}</td>
        </tr>
      </table>
    </div>

    ${order.note ? `
    <div class="section">
      <div class="section-title">Ghi chú</div>
      <p>${order.note}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Cảm ơn quý khách đã mua hàng tại TechShop!</p>
      <p>Mọi thắc mắc xin liên hệ: 1900 1234 hoặc support@techshop.vn</p>
    </div>
  </div>
</body>
</html>
    `

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (error) {
    console.error('Get invoice HTML error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

export default router
