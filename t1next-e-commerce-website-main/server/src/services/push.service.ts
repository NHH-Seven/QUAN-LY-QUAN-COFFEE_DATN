import webpush from 'web-push'
import { config } from '../config/index.js'
import { query } from '../db/index.js'

// Initialize web-push with VAPID keys
if (config.vapid.publicKey && config.vapid.privateKey) {
  webpush.setVapidDetails(
    config.vapid.subject,
    config.vapid.publicKey,
    config.vapid.privateKey
  )
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

interface DbPushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

// Order status display names in Vietnamese
const ORDER_STATUS_NAMES: Record<string, string> = {
  pending: 'Chờ xác nhận',
  awaiting_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy'
}

// Order status icons
const ORDER_STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  awaiting_payment: '💳',
  confirmed: '✅',
  shipping: '🚚',
  delivered: '📦',
  cancelled: '❌'
}

/**
 * Send push notification to a single subscription
 * Returns true if successful, false if subscription is expired/invalid
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!isPushConfigured()) {
    console.warn('Push notifications not configured, skipping')
    return false
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    )
    return true
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number; message?: string }
    
    // Handle 410 Gone - subscription expired or unsubscribed
    if (webPushError.statusCode === 410) {
      console.log('Push subscription expired or unsubscribed:', subscription.endpoint.substring(0, 50))
      return false
    }
    
    // Handle 404 Not Found - subscription no longer valid
    if (webPushError.statusCode === 404) {
      console.log('Push subscription not found:', subscription.endpoint.substring(0, 50))
      return false
    }

    console.error('Push notification error:', webPushError.message || error)
    throw error
  }
}

/**
 * Send push notification to a specific user (all their subscriptions)
 * Automatically removes expired subscriptions
 */
export async function sendToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; removed: number }> {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, removed: 0 }
  }

  const subscriptions = await query<DbPushSubscription>(
    'SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
    [userId]
  )

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, removed: 0 }
  }

  const expiredIds: string[] = []
  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      const success = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      
      if (success) {
        sent++
      } else {
        // Subscription expired, mark for removal
        expiredIds.push(sub.id)
      }
    } catch {
      failed++
    }
  }

  // Remove expired subscriptions
  if (expiredIds.length > 0) {
    await query(
      'DELETE FROM push_subscriptions WHERE id = ANY($1)',
      [expiredIds]
    )
  }

  return { sent, failed, removed: expiredIds.length }
}

/**
 * Send push notification to all subscribed users
 * Automatically removes expired subscriptions
 */
export async function sendToAll(
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; removed: number }> {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0, removed: 0 }
  }

  const subscriptions = await query<DbPushSubscription>(
    'SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions'
  )

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, removed: 0 }
  }

  const expiredIds: string[] = []
  let sent = 0
  let failed = 0

  // Process in batches to avoid overwhelming the server
  const batchSize = 50
  for (let i = 0; i < subscriptions.length; i += batchSize) {
    const batch = subscriptions.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (sub) => {
        try {
          const success = await sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
          
          if (success) {
            sent++
          } else {
            expiredIds.push(sub.id)
          }
        } catch {
          failed++
        }
      })
    )
  }

  // Remove expired subscriptions
  if (expiredIds.length > 0) {
    await query(
      'DELETE FROM push_subscriptions WHERE id = ANY($1)',
      [expiredIds]
    )
  }

  return { sent, failed, removed: expiredIds.length }
}

/**
 * Send order status update notification to user
 */
export async function notifyOrderStatus(
  userId: string,
  orderId: string,
  status: string,
  orderTotal?: number
): Promise<{ sent: number; failed: number; removed: number }> {
  const statusName = ORDER_STATUS_NAMES[status] || status
  const statusIcon = ORDER_STATUS_ICONS[status] || '📋'
  
  let body = `Đơn hàng #${orderId.substring(0, 8)} ${statusName.toLowerCase()}`
  if (orderTotal && status === 'confirmed') {
    body += ` - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderTotal)}`
  }

  const payload: PushNotificationPayload = {
    title: `${statusIcon} ${statusName}`,
    body,
    icon: '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
    url: `/profile?tab=orders&order=${orderId}`,
    tag: `order-${orderId}`,
    data: {
      type: 'order_status',
      orderId,
      status
    }
  }

  return sendToUser(userId, payload)
}

/**
 * Send flash sale notification to all subscribed users
 */
export async function notifyFlashSale(
  title: string,
  description: string,
  productIds?: string[]
): Promise<{ sent: number; failed: number; removed: number }> {
  const payload: PushNotificationPayload = {
    title: `🔥 ${title}`,
    body: description,
    icon: '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
    url: '/?flash-sale=true',
    tag: 'flash-sale',
    data: {
      type: 'flash_sale',
      productIds
    }
  }

  return sendToAll(payload)
}

/**
 * Send wishlist item on sale notification to user
 */
export async function notifyWishlistSale(
  userId: string,
  productName: string,
  productSlug: string,
  discountPercent: number
): Promise<{ sent: number; failed: number; removed: number }> {
  const payload: PushNotificationPayload = {
    title: '💝 Sản phẩm yêu thích đang giảm giá!',
    body: `${productName} giảm ${discountPercent}%`,
    icon: '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
    url: `/product/${productSlug}`,
    tag: `wishlist-sale-${productSlug}`,
    data: {
      type: 'wishlist_sale',
      productSlug,
      discountPercent
    }
  }

  return sendToUser(userId, payload)
}

/**
 * Send stock alert notification to warehouse/admin staff
 */
export async function notifyStockAlert(
  staffUserIds: string[],
  productName: string,
  currentStock: number,
  threshold: number
): Promise<{ totalSent: number; totalFailed: number; totalRemoved: number }> {
  const isOutOfStock = currentStock <= 0
  
  const payload: PushNotificationPayload = {
    title: isOutOfStock ? '🚨 Hết hàng' : '⚠️ Sắp hết hàng',
    body: isOutOfStock 
      ? `${productName} đã hết hàng!`
      : `${productName} chỉ còn ${currentStock} sản phẩm (ngưỡng: ${threshold})`,
    icon: '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
    url: '/staff/stock-alerts',
    tag: 'stock-alert',
    data: {
      type: 'stock_alert',
      productName,
      currentStock,
      threshold
    }
  }

  let totalSent = 0
  let totalFailed = 0
  let totalRemoved = 0

  for (const userId of staffUserIds) {
    const result = await sendToUser(userId, payload)
    totalSent += result.sent
    totalFailed += result.failed
    totalRemoved += result.removed
  }

  return { totalSent, totalFailed, totalRemoved }
}

/**
 * Get VAPID public key for client subscription
 */
export function getVapidPublicKey(): string {
  return config.vapid.publicKey
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(config.vapid.publicKey && config.vapid.privateKey)
}

/**
 * Remove expired subscription by endpoint
 */
export async function removeExpiredSubscription(endpoint: string): Promise<void> {
  await query(
    'DELETE FROM push_subscriptions WHERE endpoint = $1',
    [endpoint]
  )
}
