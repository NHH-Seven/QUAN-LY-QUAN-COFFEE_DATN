import { Router, Response } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { getVapidPublicKey, isPushConfigured, PushSubscriptionData } from '../services/push.service.js'

const router = Router()

/**
 * GET /api/push/vapid-key
 * Get VAPID public key for client subscription (no auth required)
 */
router.get('/vapid-key', (_req, res: Response) => {
  if (!isPushConfigured()) {
    return res.status(503).json({ 
      success: false, 
      error: 'Push notifications not configured',
      message: 'VAPID keys are not set up on the server'
    })
  }
  res.json({ 
    success: true, 
    publicKey: getVapidPublicKey() 
  })
})

// Protected routes require authentication
router.use(authMiddleware)

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { endpoint, keys } = req.body as PushSubscriptionData

    // Validate subscription data
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid subscription data',
        message: 'Missing required fields: endpoint, keys.p256dh, keys.auth'
      })
    }

    // Validate endpoint URL format
    try {
      new URL(endpoint)
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid endpoint URL'
      })
    }

    // Check if subscription already exists for this endpoint
    const existing = await queryOne<{ id: string; user_id: string }>(
      'SELECT id, user_id FROM push_subscriptions WHERE endpoint = $1',
      [endpoint]
    )

    if (existing) {
      // Update existing subscription (may be from different user or same user re-subscribing)
      await query(
        `UPDATE push_subscriptions 
         SET user_id = $1, p256dh = $2, auth = $3, created_at = NOW()
         WHERE endpoint = $4`,
        [userId, keys.p256dh, keys.auth, endpoint]
      )
      
      res.json({ 
        success: true, 
        message: 'Đã cập nhật đăng ký thông báo',
        updated: true
      })
    } else {
      // Create new subscription
      await query(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [userId, endpoint, keys.p256dh, keys.auth]
      )

      res.json({ 
        success: true, 
        message: 'Đã đăng ký nhận thông báo',
        created: true
      })
    }
  } catch (error) {
    console.error('Push subscribe error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi đăng ký thông báo' 
    })
  }
})

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { endpoint } = req.body

    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        error: 'Endpoint is required' 
      })
    }

    const result = await query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2 RETURNING id',
      [endpoint, userId]
    )

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      })
    }

    res.json({ 
      success: true, 
      message: 'Đã hủy đăng ký thông báo' 
    })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi hủy đăng ký' 
    })
  }
})

/**
 * GET /api/push/status
 * Check if user has active push subscription
 */
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const subscriptions = await query<{ id: string; endpoint: string; created_at: string }>(
      'SELECT id, endpoint, created_at FROM push_subscriptions WHERE user_id = $1',
      [userId]
    )

    res.json({ 
      success: true, 
      isSubscribed: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
      pushConfigured: isPushConfigured(),
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        endpoint: s.endpoint.substring(0, 50) + '...', // Truncate for privacy
        createdAt: s.created_at
      }))
    })
  } catch (error) {
    console.error('Push status error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi kiểm tra trạng thái' 
    })
  }
})

/**
 * DELETE /api/push/unsubscribe-all
 * Unsubscribe all devices for current user
 */
router.delete('/unsubscribe-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const result = await query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 RETURNING id',
      [userId]
    )

    res.json({ 
      success: true, 
      message: `Đã hủy ${result.length} đăng ký thông báo`,
      deletedCount: result.length
    })
  } catch (error) {
    console.error('Push unsubscribe all error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi hủy đăng ký' 
    })
  }
})

export default router
