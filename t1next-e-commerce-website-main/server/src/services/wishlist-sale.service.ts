import { query } from '../db/index.js'
import { createAndPushNotification } from '../routes/notifications.js'
import { config } from '../config/index.js'

/**
 * Wishlist Sale Detection Service
 * 
 * Checks wishlist items for discounts and triggers notifications
 * when items go on sale.
 * 
 * **Validates: Requirements 3.3**
 */

interface WishlistSaleItem {
  userId: string
  productId: string
  productName: string
  productSlug: string
  discount: number
  price: string
  originalPrice: string | null
}

/**
 * Check if a product is on sale
 * A product is considered "on sale" if discount > 0
 */
export function isProductOnSale(discount: number): boolean {
  return discount > 0
}

/**
 * Calculate sale price from original price and discount
 */
export function calculateSalePrice(originalPrice: number, discount: number): number {
  if (discount <= 0 || discount > 100) return originalPrice
  return originalPrice * (1 - discount / 100)
}

/**
 * Get all wishlist items that are currently on sale
 */
export async function getWishlistItemsOnSale(): Promise<WishlistSaleItem[]> {
  const items = await query<{
    user_id: string
    product_id: string
    product_name: string
    product_slug: string
    discount: number
    price: string
    original_price: string | null
  }>(
    `SELECT 
      w.user_id,
      w.product_id,
      p.name as product_name,
      p.slug as product_slug,
      p.discount,
      p.price,
      p.original_price
     FROM wishlist w
     JOIN products p ON w.product_id = p.id
     WHERE p.discount > 0`
  )

  return items.map(item => ({
    userId: item.user_id,
    productId: item.product_id,
    productName: item.product_name,
    productSlug: item.product_slug,
    discount: item.discount,
    price: item.price,
    originalPrice: item.original_price
  }))
}

/**
 * Check if notification was already sent for this product sale
 * (within last 24 hours to avoid spam)
 */
async function wasNotificationSent(userId: string, productId: string): Promise<boolean> {
  const existing = await query<{ id: string }>(
    `SELECT id FROM notifications 
     WHERE user_id = $1 
     AND type = 'wishlist_sale' 
     AND data->>'productId' = $2
     AND created_at > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [userId, productId]
  )
  return existing.length > 0
}

/**
 * Send sale notification for a wishlist item
 */
export async function sendWishlistSaleNotification(item: WishlistSaleItem): Promise<boolean> {
  try {
    // Check if already notified
    const alreadySent = await wasNotificationSent(item.userId, item.productId)
    if (alreadySent) {
      return false
    }

    const productUrl = `${config.clientUrl}/product/${item.productSlug}`
    
    await createAndPushNotification(
      item.userId,
      'wishlist_sale',
      '🔥 Sản phẩm yêu thích đang giảm giá!',
      `${item.productName} đang giảm ${item.discount}%! Đừng bỏ lỡ cơ hội này.`,
      productUrl,
      {
        productId: item.productId,
        productSlug: item.productSlug,
        productName: item.productName,
        discount: item.discount
      }
    )

    return true
  } catch (error) {
    console.error('Send wishlist sale notification error:', error)
    return false
  }
}

/**
 * Check all wishlist items and send notifications for items on sale
 * This should be called periodically (e.g., every hour)
 */
export async function checkAndNotifyWishlistSales(): Promise<{ sent: number; skipped: number }> {
  let sent = 0
  let skipped = 0

  try {
    const saleItems = await getWishlistItemsOnSale()

    for (const item of saleItems) {
      const wasSent = await sendWishlistSaleNotification(item)
      if (wasSent) {
        sent++
      } else {
        skipped++
      }
    }

    console.log(`Wishlist sale check: ${sent} notifications sent, ${skipped} skipped`)
  } catch (error) {
    console.error('Check wishlist sales error:', error)
  }

  return { sent, skipped }
}

/**
 * Check specific user's wishlist for sales
 * Useful when user logs in or views wishlist
 */
export async function checkUserWishlistSales(userId: string): Promise<WishlistSaleItem[]> {
  const items = await query<{
    product_id: string
    product_name: string
    product_slug: string
    discount: number
    price: string
    original_price: string | null
  }>(
    `SELECT 
      w.product_id,
      p.name as product_name,
      p.slug as product_slug,
      p.discount,
      p.price,
      p.original_price
     FROM wishlist w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id = $1 AND p.discount > 0`,
    [userId]
  )

  return items.map(item => ({
    userId,
    productId: item.product_id,
    productName: item.product_name,
    productSlug: item.product_slug,
    discount: item.discount,
    price: item.price,
    originalPrice: item.original_price
  }))
}
