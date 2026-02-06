"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

interface SubscriptionStatus {
  isSubscribed: boolean
  pushConfigured: boolean
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
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

export function NotificationSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushConfigured, setPushConfigured] = useState(false)
  const { toast } = useToast()

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setPushSupported(supported)
  }, [])

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/notifications/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data: { success: boolean } & SubscriptionStatus = await response.json()
      
      if (data.success) {
        setIsSubscribed(data.isSubscribed)
        setPushConfigured(data.pushConfigured)
      }
    } catch (error) {
      console.error("Failed to check subscription status:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  const subscribeToPush = async () => {
    try {
      setIsToggling(true)

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast({
          title: "Không thể bật thông báo",
          description: "Vui lòng cho phép thông báo trong cài đặt trình duyệt",
          variant: "destructive"
        })
        return
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Get VAPID public key from server if not in env
      let vapidKey = VAPID_PUBLIC_KEY
      if (!vapidKey) {
        const keyResponse = await fetch(`${API_URL}/notifications/vapid-public-key`)
        const keyData = await keyResponse.json()
        if (keyData.success) {
          vapidKey = keyData.publicKey
        }
      }

      if (!vapidKey) {
        toast({
          title: "Lỗi cấu hình",
          description: "Push notifications chưa được cấu hình",
          variant: "destructive"
        })
        return
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      // Send subscription to server
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        setIsSubscribed(true)
        toast({ title: "Đã bật thông báo đẩy" })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Subscribe error:", error)
      toast({
        title: "Lỗi",
        description: "Không thể đăng ký thông báo",
        variant: "destructive"
      })
    } finally {
      setIsToggling(false)
    }
  }

  const unsubscribeFromPush = async () => {
    try {
      setIsToggling(true)

      // Get current subscription
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()

        // Remove from server
        const token = localStorage.getItem("token")
        await fetch(`${API_URL}/notifications/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        })
      }

      setIsSubscribed(false)
      toast({ title: "Đã tắt thông báo đẩy" })
    } catch (error) {
      console.error("Unsubscribe error:", error)
      toast({
        title: "Lỗi",
        description: "Không thể hủy đăng ký thông báo",
        variant: "destructive"
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribeToPush()
    } else {
      await unsubscribeFromPush()
    }
  }

  if (!pushSupported) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">Thông báo đẩy không được hỗ trợ</p>
          <p className="text-sm text-muted-foreground">
            Trình duyệt của bạn không hỗ trợ thông báo đẩy
          </p>
        </div>
      </div>
    )
  }

  if (!pushConfigured && !isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">Thông báo đẩy chưa được cấu hình</p>
          <p className="text-sm text-muted-foreground">
            Tính năng này đang được thiết lập
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5" />
          <div>
            <Label htmlFor="push-notifications" className="text-base font-medium">
              Thông báo đẩy
            </Label>
            <p className="text-sm text-muted-foreground">
              Nhận thông báo về giảm giá sản phẩm yêu thích
            </p>
          </div>
        </div>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        )}
      </div>

      {isSubscribed && (
        <div className="pl-8 text-sm text-muted-foreground">
          <p>✓ Bạn sẽ nhận thông báo khi:</p>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>Sản phẩm trong danh sách yêu thích được giảm giá</li>
            <li>Có khuyến mãi đặc biệt</li>
            <li>Đơn hàng được cập nhật trạng thái</li>
          </ul>
        </div>
      )}
    </div>
  )
}
