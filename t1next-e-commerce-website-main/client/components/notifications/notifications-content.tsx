"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Check, Package, AlertTriangle, Tag, ShoppingBag, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface NotificationData {
  productId?: string
  productSlug?: string
  productName?: string
  discount?: number
  stock?: number
  orderId?: string
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

export function NotificationsContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${API_URL}/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
      }
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải thông báo", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/notifications")
      return
    }
    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [authLoading, isAuthenticated, router, fetchNotifications])

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
    } catch {
      toast({ title: "Lỗi", variant: "destructive" })
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
      toast({ title: "Đã đánh dấu tất cả là đã đọc" })
    } catch {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "stock_alert":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "wishlist_sale":
        return <Tag className="h-5 w-5 text-green-500" />
      case "order":
      case "order_status":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />
      default:
        return <Package className="h-5 w-5 text-primary" />
    }
  }

  const getNotificationLink = (notif: Notification): string | null => {
    if (notif.data?.orderId) {
      return `/checkout/success/${notif.data.orderId}`
    }
    if (notif.data?.productSlug) {
      return `/product/${notif.data.productSlug}`
    }
    return null
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      markAsRead(notif.id)
    }
    
    // If has direct link, use it
    const link = getNotificationLink(notif)
    if (link) {
      router.push(link)
      return
    }
    
    // Fallback: fetch product slug from API
    if (notif.data?.productId) {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/products/by-id/${notif.data.productId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const data = await res.json()
        if (data.success && data.data?.slug) {
          router.push(`/product/${data.data.slug}`)
        }
      } catch {
        // Silently fail
      }
    }
  }

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (authLoading || isLoading) {
    return <NotificationsSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Thông báo</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} chưa đọc</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Đọc tất cả
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tất cả ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {filter === "unread" ? "Không có thông báo chưa đọc" : "Không có thông báo nào"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notif) => {
                const link = getNotificationLink(notif)
                
                return (
                  <Card 
                    key={notif.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notif.isRead ? "border-primary/50 bg-primary/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-medium ${!notif.isRead ? "text-primary" : ""}`}>
                                {notif.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notif.message}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-2">
                            {notif.type === 'wishlist_sale' && notif.data?.discount && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Giảm {notif.data.discount}%
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notif.createdAt), { 
                                addSuffix: true, 
                                locale: vi 
                              })}
                            </span>
                            {link && (
                              <span className="text-xs text-primary">Xem chi tiết →</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-10 w-64 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
