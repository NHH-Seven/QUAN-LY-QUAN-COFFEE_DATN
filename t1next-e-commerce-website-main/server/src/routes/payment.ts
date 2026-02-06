import { Router } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const VIETQR_CLIENT_ID = process.env.VIETQR_CLIENT_ID
const VIETQR_API_KEY = process.env.VIETQR_API_KEY
const VIETQR_BANK_CODE = process.env.VIETQR_BANK_CODE || 'MB'
const VIETQR_BANK_ACCOUNT = process.env.VIETQR_BANK_ACCOUNT
const VIETQR_ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || 'NHH-COFFEE'

// Generate VietQR code for an order
router.get('/qr/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params
    
    // Get order details
    const order = await queryOne<{ id: string; total: number; user_id: string; status: string }>(
      'SELECT id, total, user_id, status FROM orders WHERE id = $1',
      [orderId]
    )

    if (!order) {
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    // Check if user owns this order
    if (order.user_id !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập' })
    }

    // Generate QR content - format: DH{orderId short}
    const orderCode = `DH${orderId.slice(0, 8).toUpperCase()}`
    const amount = Math.round(Number(order.total))

    // Use VietQR Quick Link (free, no API key needed)
    const qrUrl = `https://img.vietqr.io/image/${VIETQR_BANK_CODE}-${VIETQR_BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${orderCode}&accountName=${encodeURIComponent(VIETQR_ACCOUNT_NAME)}`

    res.json({
      success: true,
      data: {
        qrUrl,
        bankCode: VIETQR_BANK_CODE,
        bankAccount: VIETQR_BANK_ACCOUNT,
        accountName: VIETQR_ACCOUNT_NAME,
        amount,
        content: orderCode,
        orderId: order.id
      }
    })
  } catch (error) {
    console.error('Generate QR error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})


// VietQR Callback - receives payment notification
// This endpoint is called by VietQR when a payment is received
router.post('/vietqr/callback', async (req, res) => {
  try {
    console.log('VietQR Callback received:', JSON.stringify(req.body, null, 2))
    
    const { content, amount, transType, bankAccount } = req.body

    // Validate callback
    if (!content || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Only process credit transactions (money in)
    if (transType !== 'C') {
      return res.json({ success: true, message: 'Ignored debit transaction' })
    }

    // Extract order ID from content (format: DH{orderId})
    const orderCodeMatch = content.match(/DH([A-Z0-9]+)/i)
    if (!orderCodeMatch) {
      console.log('No order code found in content:', content)
      return res.json({ success: true, message: 'No order code found' })
    }

    const orderCodePrefix = orderCodeMatch[1].toLowerCase()
    
    // Find order by ID prefix
    const order = await queryOne<{ id: string; total: number; status: string }>(
      `SELECT id, total, status FROM orders WHERE LOWER(SUBSTRING(id, 1, 8)) = $1`,
      [orderCodePrefix]
    )

    if (!order) {
      console.log('Order not found for code:', orderCodePrefix)
      return res.json({ success: true, message: 'Order not found' })
    }

    // Check if already paid/confirmed
    if (order.status === 'confirmed' || order.status === 'shipping' || order.status === 'delivered') {
      return res.json({ success: true, message: 'Order already paid' })
    }

    // Only process orders that are awaiting payment or pending
    if (order.status !== 'awaiting_payment' && order.status !== 'pending') {
      return res.json({ success: true, message: 'Order not awaiting payment' })
    }

    // Verify amount (allow small difference for rounding)
    const expectedAmount = Math.round(Number(order.total))
    const receivedAmount = Number(amount)
    
    if (Math.abs(expectedAmount - receivedAmount) > 1000) {
      console.log(`Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`)
      // Still update but log the discrepancy
    }

    // Update order status to confirmed (paid)
    await query(
      `UPDATE orders SET status = 'confirmed' WHERE id = $1`,
      [order.id]
    )

    console.log(`Order ${order.id} marked as confirmed (paid)`)

    res.json({ success: true, message: 'Payment confirmed' })
  } catch (error) {
    console.error('VietQR callback error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Check payment status for an order
router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params
    
    const order = await queryOne<{ id: string; status: string; user_id: string }>(
      'SELECT id, status, user_id FROM orders WHERE id = $1',
      [orderId]
    )

    if (!order) {
      return res.status(404).json({ success: false, error: 'Đơn hàng không tồn tại' })
    }

    if (order.user_id !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập' })
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        isPaid: order.status === 'confirmed' || order.status === 'shipping' || order.status === 'delivered'
      }
    })
  } catch (error) {
    console.error('Check payment status error:', error)
    res.status(500).json({ success: false, error: 'Đã có lỗi xảy ra' })
  }
})

export default router
