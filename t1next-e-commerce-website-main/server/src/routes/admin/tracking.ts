import { Router } from 'express'
import { query, queryOne } from '../../db/index.js'
import { emitToUser } from '../../socket/index.js'

const router = Router()

// Supported shipping carriers
const SHIPPING_CARRIERS = [
  { id: 'ghn', name: 'Giao Hàng Nhanh', trackingUrl: 'https://donhang.ghn.vn/?order_code=' },
  { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm', trackingUrl: 'https://i.ghtk.vn/' },
  { id: 'viettel', name: 'Viettel Post', trackingUrl: 'https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/' },
  { id: 'vnpost', name: 'Vietnam Post', trackingUrl: 'https://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=' },
  { id: 'jt', name: 'J&T Express', trackingUrl: 'https://jtexpress.vn/vi/tracking?billcodes=' },
  { id: 'ninja', name: 'Ninja Van', trackingUrl: 'https://www.ninjavan.co/vi-vn/tracking?id=' },
  { id: 'best', name: 'BEST Express', trackingUrl: 'https://best-inc.vn/track?bills=' },
  { id: 'other', name: 'Khác', trackingUrl: '' },
]

// GET /api/admin/tracking/carriers - Get list of shipping carriers
router.get('/carriers', (req, res) => {
  res.json({ success: true, data: SHIPPING_CARRIERS })
})

// PUT /api/admin/tracking/:orderId - Update tracking info
router.put('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const { trackingCode, shippingCarrier } = req.body

    if (!trackingCode) {
      return res.status(400).json({ success: false, error: 'Mã vận đơn là bắt buộc' })
    }

    // Check order exists
    const order = await queryOne<{ id: string; user_id: string; status: string }>(
      'SELECT id, user_id, status FROM orders WHERE id = $1',
      [orderId]
    )

    if (!order) {
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    // Update tracking info
    await query(
      `UPDATE orders SET tracking_code = $1, shipping_carrier = $2 WHERE id = $3`,
      [trackingCode, shippingCarrier || null, orderId]
    )

    // Get carrier info for tracking URL
    const carrier = SHIPPING_CARRIERS.find(c => c.id === shippingCarrier)
    const trackingUrl = carrier?.trackingUrl ? `${carrier.trackingUrl}${trackingCode}` : null

    // Notify user via socket
    if (order.user_id) {
      emitToUser(order.user_id, 'order:tracking_updated', {
        orderId,
        trackingCode,
        shippingCarrier,
        carrierName: carrier?.name || shippingCarrier,
        trackingUrl,
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      data: {
        orderId,
        trackingCode,
        shippingCarrier,
        trackingUrl
      },
      message: 'Cập nhật mã vận đơn thành công'
    })
  } catch (error) {
    console.error('Update tracking error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

// GET /api/admin/tracking/:orderId - Get tracking info
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await queryOne<{
      id: string
      tracking_code: string | null
      shipping_carrier: string | null
      status: string
    }>(
      'SELECT id, tracking_code, shipping_carrier, status FROM orders WHERE id = $1',
      [orderId]
    )

    if (!order) {
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    const carrier = SHIPPING_CARRIERS.find(c => c.id === order.shipping_carrier)
    const trackingUrl = carrier?.trackingUrl && order.tracking_code 
      ? `${carrier.trackingUrl}${order.tracking_code}` 
      : null

    res.json({
      success: true,
      data: {
        orderId: order.id,
        trackingCode: order.tracking_code,
        shippingCarrier: order.shipping_carrier,
        carrierName: carrier?.name || order.shipping_carrier,
        trackingUrl,
        status: order.status
      }
    })
  } catch (error) {
    console.error('Get tracking error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

export default router
