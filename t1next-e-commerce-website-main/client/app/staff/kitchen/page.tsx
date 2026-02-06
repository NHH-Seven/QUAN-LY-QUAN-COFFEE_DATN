"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Coffee, Clock, Check, ChefHat, Bell, 
  Play, CheckCircle, RefreshCw, Volume2
} from "lucide-react"
import { toast } from "sonner"
import { initSocket, getSocket, joinRoom, disconnectSocket } from "@/lib/socket"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface OrderItem {
  id: string
  table_order_id: string
  order_number: string
  table_number: string
  product_name: string
  product_image: string | null
  quantity: number
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

interface Stats {
  pending: number
  preparing: number
  ready: number
  served: number
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Chờ pha chế", color: "text-yellow-600", bgColor: "bg-yellow-100 border-yellow-300" },
  preparing: { label: "Đang pha chế", color: "text-blue-600", bgColor: "bg-blue-100 border-blue-300" },
  ready: { label: "Sẵn sàng", color: "text-green-600", bgColor: "bg-green-100 border-green-300" },
  served: { label: "Đã phục vụ", color: "text-gray-600", bgColor: "bg-gray-100 border-gray-300" },
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function getWaitTime(dateStr: string) {
  const created = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60)
  if (diff < 1) return "Vừa xong"
  if (diff < 60) return `${diff} phút`
  return `${Math.floor(diff / 60)}h ${diff % 60}p`
}

export default function KitchenPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [items, setItems] = useState<OrderItem[]>([])
  const [readyItems, setReadyItems] = useState<OrderItem[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, preparing: 0, ready: 0, served: 0 })
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const [ordersRes, readyRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/kitchen/orders`, { credentials: "include", headers }),
        fetch(`${API_URL}/kitchen/ready-items`, { credentials: "include", headers }),
        fetch(`${API_URL}/kitchen/stats`, { credentials: "include", headers }),
      ])

      const ordersData = await ordersRes.json()
      const readyData = await readyRes.json()
      const statsData = await statsRes.json()

      if (ordersData.success) {
        setItems(ordersData.data)
      }
      if (readyData.success) setReadyItems(readyData.data)
      if (statsData.success) setStats(statsData.data)
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (user && !["admin", "sales", "warehouse"].includes(user.role)) {
      router.push("/")
      return
    }
    
    // Initialize socket connection
    const token = localStorage.getItem('token')
    if (token) {
      console.log('🍳 Kitchen page: Initializing socket...')
      const socket = initSocket(token)
      
      // Wait for connection before joining room
      if (socket.connected) {
        joinRoom('kitchen')
        console.log('🍳 Kitchen page: Socket already connected, joined kitchen room')
      } else {
        socket.once('connect', () => {
          joinRoom('kitchen')
          console.log('🍳 Kitchen page: Socket connected, joined kitchen room')
        })
      }
      
      // Setup real-time listeners
      socket.on('kitchen:new-item', (data: any) => {
        console.log('🔔 Kitchen page: New kitchen item received:', data)
        // Play sound
        if (soundEnabled) {
          const audio = new Audio("/notification.mp3")
          audio.play().catch(() => {})
        }
        toast.info(`Món mới: ${data.product_name} - Bàn ${data.table_number}`)
        fetchData() // Refresh data
      })
      
      socket.on('kitchen:item-updated', () => {
        console.log('🔔 Kitchen page: Item updated')
        fetchData() // Refresh when item status changes
      })
    } else {
      console.error('❌ Kitchen page: No token found')
    }
    
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5s
    
    return () => {
      clearInterval(interval)
      // Cleanup socket listeners
      const socket = getSocket()
      if (socket) {
        socket.off('kitchen:new-item')
        socket.off('kitchen:item-updated')
      }
    }
  }, [authLoading, isAuthenticated, user, router, fetchData, soundEnabled])

  const handleStartPreparing = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/kitchen/items/${id}/start`, {
        method: "PUT",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Lỗi cập nhật")
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/kitchen/items/${id}/complete`, {
        method: "PUT",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Lỗi cập nhật")
    }
  }

  const handleServe = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/kitchen/items/${id}/serve`, {
        method: "PUT",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Lỗi cập nhật")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const pendingItems = items.filter(i => i.status === "pending")
  const preparingItems = items.filter(i => i.status === "preparing")

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Màn hình pha chế</h1>
              <p className="text-sm text-gray-400">Kitchen Display System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                <Clock className="h-4 w-4" />
                <span>{stats.pending} chờ</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                <Coffee className="h-4 w-4" />
                <span>{stats.preparing} đang làm</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                <Bell className="h-4 w-4" />
                <span>{stats.ready} sẵn sàng</span>
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? "text-green-400" : "text-gray-500"}>
              <Volume2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 mb-6">
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-600">
              <Clock className="mr-2 h-4 w-4" />
              Chờ pha chế ({pendingItems.length})
            </TabsTrigger>
            <TabsTrigger value="preparing" className="data-[state=active]:bg-blue-600">
              <Coffee className="mr-2 h-4 w-4" />
              Đang pha chế ({preparingItems.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="data-[state=active]:bg-green-600">
              <Bell className="mr-2 h-4 w-4" />
              Sẵn sàng ({readyItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Items */}
          <TabsContent value="pending">
            {pendingItems.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Coffee className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Không có món nào đang chờ</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {pendingItems.map((item) => (
                  <Card key={item.id} className="bg-yellow-900/30 border-yellow-600/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-yellow-600 px-3 py-2 flex items-center justify-between">
                        <span className="font-bold">Bàn {item.table_number}</span>
                        <Badge variant="outline" className="bg-white/20 text-white border-0">
                          #{item.order_number?.slice(-4)}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-3 mb-3">
                          {item.product_image ? (
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                              <Image src={item.product_image} alt="" fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                              <Coffee className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{item.product_name}</h3>
                            <p className="text-2xl font-bold text-yellow-400">x{item.quantity}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-yellow-300 bg-yellow-900/50 rounded px-2 py-1 mb-3">
                            📝 {item.notes}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <span>{formatTime(item.created_at)}</span>
                          <span className="text-yellow-400">{getWaitTime(item.created_at)}</span>
                        </div>
                        <Button className="w-full bg-yellow-600 hover:bg-yellow-700" onClick={() => handleStartPreparing(item.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Bắt đầu pha chế
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Preparing Items */}
          <TabsContent value="preparing">
            {preparingItems.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Coffee className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Không có món nào đang pha chế</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {preparingItems.map((item) => (
                  <Card key={item.id} className="bg-blue-900/30 border-blue-600/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-blue-600 px-3 py-2 flex items-center justify-between">
                        <span className="font-bold">Bàn {item.table_number}</span>
                        <Badge variant="outline" className="bg-white/20 text-white border-0">
                          #{item.order_number?.slice(-4)}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-3 mb-3">
                          {item.product_image ? (
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                              <Image src={item.product_image} alt="" fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                              <Coffee className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{item.product_name}</h3>
                            <p className="text-2xl font-bold text-blue-400">x{item.quantity}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-blue-300 bg-blue-900/50 rounded px-2 py-1 mb-3">
                            📝 {item.notes}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <span>{formatTime(item.created_at)}</span>
                          <span className="text-blue-400">{getWaitTime(item.created_at)}</span>
                        </div>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleComplete(item.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Hoàn thành
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ready Items */}
          <TabsContent value="ready">
            {readyItems.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Không có món nào sẵn sàng</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {readyItems.map((item) => (
                  <Card key={item.id} className="bg-green-900/30 border-green-600/50 overflow-hidden animate-pulse">
                    <CardContent className="p-0">
                      <div className="bg-green-600 px-3 py-2 flex items-center justify-between">
                        <span className="font-bold">Bàn {item.table_number}</span>
                        <Badge variant="outline" className="bg-white/20 text-white border-0">
                          #{item.order_number?.slice(-4)}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-3 mb-3">
                          {item.product_image ? (
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                              <Image src={item.product_image} alt="" fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                              <Coffee className="h-8 w-8 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{item.product_name}</h3>
                            <p className="text-2xl font-bold text-green-400">x{item.quantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
                          <Bell className="h-5 w-5 animate-bounce" />
                          <span className="font-semibold">Sẵn sàng phục vụ!</span>
                        </div>
                        <Button className="w-full bg-gray-600 hover:bg-gray-700" onClick={() => handleServe(item.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Đã đưa cho khách
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
