import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware, staffMiddleware, AuthRequest } from '../middleware/auth.js'
import { sendPushNotification, getVapidPublicKey, isPushConfigured, PushSubscriptionData } from '../services/push.service.js'
import { checkAndNotifyWishlistSales, checkUserWishlistSales } from '../services/wishlist-sale.service.js'

const router = Router()

/**
 * GET /api/notifications/vapid-public-key
 * Get VAPID public key for client subscription (no auth required)
 */
router.get('/vapid-public-key', (_req, res: Response) => {
  if (!isPushConfigured()) {
    return res.status(503).json({ 
      success: false, 
      error: 'Push notifications not configured' 
    })
  }
  res.json({ success: true, publicKey: getVapidPublicKey() })
})

router.use(authMiddleware)

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { endpoint, keys } = req.body as PushSubscriptionData

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid subscription data' 
      })
    }

    // Check if subscription already exists
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM push_subscriptions WHERE endpoint = $1',
      [endpoint]
    )

    if (existing) {
      // Update existing subscription
      await query(
        `UPDATE push_subscriptions 
         SET user_id = $1, p256dh = $2, auth = $3, created_at = NOW()
         WHERE endpoint = $4`,
        [userId, keys.p256dh, keys.auth, endpoint]
      )
    } else {
      // Create new subscription
      await query(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [userId, endpoint, keys.p256dh, keys.auth]
      )
    }

    res.json({ success: true, message: 'Đã đăng ký nhận thông báo' })
  } catch (error) {
    console.error('Subscribe error:', error)
    res.status(500).json({ success: false, error: 'Lỗi đăng ký thông báo' })
  }
})

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { endpoint } = req.body

    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        error: 'Endpoint is required' 
      })
    }

    await query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, userId]
    )

    res.json({ success: true, message: 'Đã hủy đăng ký thông báo' })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    res.status(500).json({ success: false, error: 'Lỗi hủy đăng ký' })
  }
})

/**
 * GET /api/notifications/subscription-status
 * Check if user has active push subscription
 */
router.get('/subscription-status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const subscription = await queryOne<{ id: string }>(
      'SELECT id FROM push_subscriptions WHERE user_id = $1 LIMIT 1',
      [userId]
    )

    res.json({ 
      success: true, 
      isSubscribed: !!subscription,
      pushConfigured: isPushConfigured()
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    res.status(500).json({ success: false, error: 'Lỗi kiểm tra trạng thái' })
  }
})

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { limit = '20', unreadOnly = 'false' } = req.query

    let whereClause = 'WHERE user_id = $1'
    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = false'
    }

    const notifications = await query<{
      id: string
      type: string
      title: string
      message: string
      data: unknown
      is_read: boolean
      created_at: string
    }>(
      `SELECT id, type, title, message, data, is_read, created_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, parseInt(limit as string)]
    )

    res.json({
      success: true,
      data: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: n.is_read,
        createdAt: n.created_at
      }))
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ success: false, error: 'Lỗi lấy thông báo' })
  }
})

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    )

    res.json({
      success: true,
      count: parseInt(result?.count || '0')
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ success: false, error: 'Lỗi đếm thông báo' })
  }
})

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ success: false, error: 'Lỗi đánh dấu đã đọc' })
  }
})

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ success: false, error: 'Lỗi đánh dấu đã đọc' })
  }
})

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ success: false, error: 'Lỗi xóa thông báo' })
  }
})

/**
 * POST /api/notifications/send-stock-alerts
 * Trigger sending stock alert notifications (staff only)
 */
router.post('/send-stock-alerts', staffMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    await sendStockAlertNotifications()
    res.json({ success: true, message: 'Đã gửi thông báo cảnh báo tồn kho' })
  } catch (error) {
    console.error('Send stock alerts error:', error)
    res.status(500).json({ success: false, error: 'Lỗi gửi thông báo' })
  }
})

/**
 * GET /api/notifications/wishlist-sales
 * Get user's wishlist items that are on sale
 */
router.get('/wishlist-sales', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const saleItems = await checkUserWishlistSales(userId)
    
    res.json({ 
      success: true, 
      data: saleItems,
      count: saleItems.length
    })
  } catch (error) {
    console.error('Get wishlist sales error:', error)
    res.status(500).json({ success: false, error: 'Lỗi kiểm tra giảm giá' })
  }
})

/**
 * POST /api/notifications/check-wishlist-sales
 * Trigger checking all wishlist sales (staff only)
 */
router.post('/check-wishlist-sales', staffMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await checkAndNotifyWishlistSales()
    res.json({ 
      success: true, 
      message: `Đã gửi ${result.sent} thông báo, bỏ qua ${result.skipped}`,
      ...result
    })
  } catch (error) {
    console.error('Check wishlist sales error:', error)
    res.status(500).json({ success: false, error: 'Lỗi kiểm tra giảm giá' })
  }
})

export default router

/**
 * Helper function to create notification (used by other modules)
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: unknown
) {
  try {
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message, data)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    )
  } catch (error) {
    console.error('Create notification error:', error)
  }
}

/**
 * Create notification and send push notification
 */
export async function createAndPushNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  url?: string,
  data?: unknown
) {
  try {
    // Create in-app notification
    await createNotification(userId, type, title, message, data)

    // Get user's push subscriptions
    const subscriptions = await query<{
      id: string
      endpoint: string
      p256dh: string
      auth: string
    }>(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    )

    // Send push to all subscriptions
    const expiredSubscriptions: string[] = []
    
    for (const sub of subscriptions) {
      try {
        const success = await sendPushNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          { title, body: message, url, data: data as Record<string, unknown> }
        )
        if (!success) {
          expiredSubscriptions.push(sub.id)
        }
      } catch {
        // Individual push failure, continue with others
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await query(
        'DELETE FROM push_subscriptions WHERE id = ANY($1)',
        [expiredSubscriptions]
      )
    }
  } catch (error) {
    console.error('Create and push notification error:', error)
  }
}

/**
 * Send stock alert notifications to warehouse staff
 */
export async function sendStockAlertNotifications() {
  try {
    // Get warehouse and admin users
    const staffUsers = await query<{ id: string }>(
      "SELECT id FROM users WHERE role IN ('admin', 'warehouse') AND is_active = true"
    )

    if (staffUsers.length === 0) return

    // Get products with low stock
    const lowStockProducts = await query<{
      id: string
      name: string
      stock: number
      available: string
      threshold: number
    }>(
      `SELECT 
        p.id, p.name, p.stock, p.low_stock_threshold as threshold,
        (p.stock - COALESCE(reserved.quantity, 0)) as available
       FROM products p
       LEFT JOIN (
         SELECT product_id, SUM(quantity) as quantity
         FROM cart_items
         GROUP BY product_id
       ) reserved ON reserved.product_id = p.id
       WHERE (p.stock - COALESCE(reserved.quantity, 0)) <= p.low_stock_threshold
       ORDER BY (p.stock - COALESCE(reserved.quantity, 0)) ASC
       LIMIT 10`
    )

    if (lowStockProducts.length === 0) return

    // Create notifications for each staff
    for (const user of staffUsers) {
      for (const product of lowStockProducts) {
        const available = parseInt(product.available)
        const isOutOfStock = available <= 0

        // Check if notification already exists (avoid duplicates)
        const existing = await queryOne<{ id: string }>(
          `SELECT id FROM notifications 
           WHERE user_id = $1 AND type = 'stock_alert' AND data->>'productId' = $2
           AND created_at > NOW() - INTERVAL '24 hours'`,
          [user.id, product.id]
        )

        if (existing) continue

        await createNotification(
          user.id,
          'stock_alert',
          isOutOfStock ? '🚨 Hết hàng' : '⚠️ Sắp hết hàng',
          isOutOfStock 
            ? `${product.name} đã hết hàng!`
            : `${product.name} chỉ còn ${available} sản phẩm`,
          { productId: product.id, stock: product.stock, available, threshold: product.threshold }
        )
      }
    }
  } catch (error) {
    console.error('Send stock alert notifications error:', error)
  }
}
