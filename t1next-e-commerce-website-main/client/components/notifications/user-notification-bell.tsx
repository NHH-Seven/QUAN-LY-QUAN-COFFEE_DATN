"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, Package, Tag, ShoppingBag, Truck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface NotificationData {
  productId?: string
  productSlug?: string
  productName?: string
  discount?: number
  orderId?: string
  orderStatus?: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: NotificationData | null
  isRead: boolean
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export function UserNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const [notifRes, countRes] = await Promise.all([
        fetch(`${API_URL}/notifications?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const notifData = await notifRes.json()
      const countData = await countRes.json()

      if (notifData.success) setNotifications(notifData.data)
      if (countData.success) setUnreadCount(countData.count)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Silently fail
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      markAsRead(notif.id)
    }
    
    setOpen(false)
    
    if (notif.data?.orderId) {
      router.push(`/checkout/success/${notif.data.orderId}`)
    } else if (notif.data?.productSlug) {
      router.push(`/product/${notif.data.productSlug}`)
    } else if (notif.data?.productId) {
      // Fallback: fetch product slug from API
      try {
        const res = await fetch(`${API_URL}/products/by-id/${notif.data.productId}`)
        const data = await res.json()
        if (data.success && data.data?.slug) {
          router.push(`/product/${data.data.slug}`)
        }
      } catch {
        // Silently fail
      }
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "wishlist_sale":
        return <Tag className="h-4 w-4 text-green-500" />
      case "order":
      case "order_status":
        return <ShoppingBag className="h-4 w-4 text-blue-500" />
      case "shipping":
        return <Truck className="h-4 w-4 text-orange-500" />
      default:
        return <Package className="h-4 w-4 text-primary" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 hidden sm:flex">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Thông báo</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Đọc tất cả
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Không có thông báo
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer ${!notif.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.type === 'wishlist_sale' && notif.data?.discount && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Giảm {notif.data.discount}%
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t">
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
              Xem tất cả thông báo
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
