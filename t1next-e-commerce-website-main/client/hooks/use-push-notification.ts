'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface PushSubscriptionStatus {
  isSubscribed: boolean
  subscriptionCount: number
  pushConfigured: boolean
}

interface UsePushNotificationReturn {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  permission: NotificationPermission | null
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  checkStatus: () => Promise<void>
}

/**
 * Convert a base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * Hook for managing push notifications
 */
export function usePushNotification(): UsePushNotificationReturn {
  const { user, token } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }
  }, [])

  // Check subscription status when user logs in
  const checkStatus = useCallback(async () => {
    if (!user || !token || !isSupported) return

    try {
      const response = await fetch(`${API_URL}/push/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data: { success: boolean; data?: PushSubscriptionStatus } & PushSubscriptionStatus = await response.json()
        setIsSubscribed(data.isSubscribed || data.data?.isSubscribed || false)
      }
    } catch (err) {
      console.error('Failed to check push status:', err)
    }
  }, [user, token, isSupported])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user || !token) {
      setError('Push notifications not supported or user not logged in')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setError('Notification permission denied')
        return false
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Get VAPID public key from server
      const vapidResponse = await fetch(`${API_URL}/push/vapid-key`)
      const vapidData = await vapidResponse.json()

      if (!vapidData.success || !vapidData.publicKey) {
        setError('Push notifications not configured on server')
        return false
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
      })

      // Get subscription keys
      const p256dhKey = subscription.getKey('p256dh')
      const authKey = subscription.getKey('auth')

      if (!p256dhKey || !authKey) {
        setError('Failed to get subscription keys')
        return false
      }

      // Send subscription to server
      const response = await fetch(`${API_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dhKey),
            auth: arrayBufferToBase64(authKey)
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setIsSubscribed(true)
        return true
      } else {
        setError(result.error || 'Failed to subscribe')
        return false
      }
    } catch (err) {
      console.error('Push subscription error:', err)
      setError(err instanceof Error ? err.message : 'Failed to subscribe')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, user, token])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user || !token) {
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Remove from server
        await fetch(`${API_URL}/push/unsubscribe`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        })
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('Push unsubscribe error:', err)
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, user, token])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscribe,
    unsubscribe,
    checkStatus
  }
}
