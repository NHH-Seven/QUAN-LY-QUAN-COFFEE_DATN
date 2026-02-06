// Service Worker for Push Notifications - T1Next E-commerce
const SW_VERSION = '1.0.0'

// Cache name for offline support
const CACHE_NAME = 't1next-cache-v1'

// Handle push notifications
self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event received but no data')
    return
  }

  try {
    const payload = event.data.json()
    
    // Build notification options
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/icon-light-32x32.png',
      badge: payload.badge || '/icon-light-32x32.png',
      vibrate: [100, 50, 100],
      data: {
        url: payload.url || '/',
        type: payload.data?.type || 'general',
        timestamp: Date.now(),
        ...payload.data
      },
      tag: payload.tag || 'default',
      renotify: true,
      requireInteraction: payload.data?.type === 'order_status' // Keep order notifications visible
    }

    // Add action buttons based on notification type
    if (payload.data?.type === 'order_status') {
      options.actions = [
        { action: 'view', title: 'Xem đơn hàng' },
        { action: 'dismiss', title: 'Đóng' }
      ]
    } else if (payload.data?.type === 'flash_sale') {
      options.actions = [
        { action: 'view', title: 'Xem ngay' },
        { action: 'dismiss', title: 'Để sau' }
      ]
    } else if (payload.data?.type === 'wishlist_sale') {
      options.actions = [
        { action: 'view', title: 'Mua ngay' },
        { action: 'dismiss', title: 'Đóng' }
      ]
    } else if (payload.data?.type === 'stock_alert') {
      options.actions = [
        { action: 'view', title: 'Kiểm tra kho' },
        { action: 'dismiss', title: 'Đóng' }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(payload.title || 'T1Next', options)
    )
  } catch (error) {
    console.error('Error processing push event:', error)
    
    // Show a generic notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('T1Next', {
        body: 'Bạn có thông báo mới',
        icon: '/icon-light-32x32.png',
        badge: '/icon-light-32x32.png'
      })
    )
  }
})

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  const notification = event.notification
  const action = event.action
  const data = notification.data || {}
  
  notification.close()

  // Handle dismiss action
  if (action === 'dismiss') {
    return
  }

  // Determine URL to open
  let url = data.url || '/'
  
  // Handle specific notification types
  if (data.type === 'order_status' && data.orderId) {
    url = `/profile?tab=orders&order=${data.orderId}`
  } else if (data.type === 'flash_sale') {
    url = '/?flash-sale=true'
  } else if (data.type === 'wishlist_sale' && data.productSlug) {
    url = `/product/${data.productSlug}`
  } else if (data.type === 'stock_alert') {
    url = '/staff/stock-alerts'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Try to find an existing window and navigate it
        for (const client of clientList) {
          if ('focus' in client && 'navigate' in client) {
            return client.focus().then(() => client.navigate(url))
          }
        }
        
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Handle notification close (for analytics)
self.addEventListener('notificationclose', function(event) {
  const data = event.notification.data || {}
  console.log('Notification closed:', {
    tag: event.notification.tag,
    type: data.type,
    timestamp: data.timestamp
  })
})

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log(`Service Worker v${SW_VERSION} installing...`)
  
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log(`Service Worker v${SW_VERSION} activated`)
  
  // Claim all clients immediately
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        )
      })
    ])
  )
})

// Handle push subscription change (when browser refreshes subscription)
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Push subscription changed, re-subscribing...')
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey
    }).then(function(subscription) {
      // Send new subscription to server
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          }
        }),
        credentials: 'include'
      })
    }).catch(function(error) {
      console.error('Failed to re-subscribe:', error)
    })
  )
})

// Message handler for communication with main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION })
  }
})
