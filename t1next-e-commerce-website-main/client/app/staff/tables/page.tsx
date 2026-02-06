"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Settings, Plus, Users, Clock, Check, Coffee, 
  Search, Filter, X, Utensils, Calendar
} from "lucide-react"
import { TableDetailPanel } from "./table-detail-panel"
import { TableSettingsDialog } from "./table-settings-dialog"
import { initSocket, getSocket, joinRoom } from "@/lib/socket"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Table {
  id: string
  table_number: string
  area_id: string | null
  area_name: string | null
  capacity: number
  status: "available" | "occupied" | "reserved" | "cleaning"
  current_order_id: string | null
  current_guests: number
  occupied_at: string | null
  reserved_at: string | null
  reserved_for: string | null
}

interface Area {
  id: string
  name: string
  table_count: number
  tables: Table[]
}

interface Stats {
  total: number
  available: number
  occupied: number
  reserved: number
}

const statusConfig = {
  available: { label: "Trống", color: "bg-green-500", icon: Check },
  occupied: { label: "Có khách", color: "bg-orange-500", icon: Users },
  reserved: { label: "Đã đặt", color: "bg-blue-500", icon: Calendar },
}

function formatDuration(startTime: string | null): string {
  if (!startTime) return ""
  const start = new Date(startTime)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  if (hours > 0) return `${hours}h ${minutes}p`
  return `${minutes}p`
}

export default function TablesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [areas, setAreas] = useState<Area[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, occupied: 0, reserved: 0, cleaning: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchTables = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tables/overview`, {
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setAreas(data.data.areas)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error("Fetch tables error:", error)
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
      const socket = initSocket(token)
      
      // Join tables room for real-time updates
      joinRoom('tables')
      console.log('🪑 Tables page: Joined tables room')
      
      // Setup real-time listeners
      socket.on('table:updated', () => {
        console.log('🔔 Tables page: Table updated')
        fetchTables()
      })
      
      socket.on('kitchen:new-item', () => {
        console.log('🔔 Tables page: New order item')
        fetchTables()
      })
    }
    
    fetchTables()
    const interval = setInterval(fetchTables, 30000)
    
    return () => {
      clearInterval(interval)
      const socket = getSocket()
      if (socket) {
        socket.off('table:updated')
        socket.off('kitchen:new-item')
      }
    }
  }, [authLoading, isAuthenticated, user, router, fetchTables])

  const filteredAreas = areas.map(area => ({
    ...area,
    tables: area.tables.filter(table => {
      const matchStatus = filterStatus === "all" || table.status === filterStatus
      const matchSearch = !searchQuery || 
        table.table_number.toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    })
  })).filter(area => area.tables.length > 0)

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isAdmin = user?.role === "admin"

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sơ đồ bàn</h1>
              <p className="text-sm text-muted-foreground">Quản lý trạng thái và bố trí bàn tại cửa hàng</p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="outline" onClick={() => setShowSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt sơ đồ
                </Button>
              )}
              <Button onClick={() => setSelectedTable({ id: "new" } as Table)}>
                <Plus className="mr-2 h-4 w-4" />
                Đặt bàn nhanh
              </Button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="border-b bg-card px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Tất cả <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
              </Button>
              <Button
                variant={filterStatus === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("available")}
                className="text-green-600"
              >
                <Check className="mr-1 h-3 w-3" /> Trống <Badge variant="secondary" className="ml-1">{stats.available}</Badge>
              </Button>
              <Button
                variant={filterStatus === "occupied" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("occupied")}
                className="text-orange-600"
              >
                <Users className="mr-1 h-3 w-3" /> Có khách <Badge variant="secondary" className="ml-1">{stats.occupied}</Badge>
              </Button>
              <Button
                variant={filterStatus === "reserved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("reserved")}
                className="text-blue-600"
              >
                <Calendar className="mr-1 h-3 w-3" /> Đã đặt <Badge variant="secondary" className="ml-1">{stats.reserved}</Badge>
              </Button>
            </div>
            <div className="flex-1" />
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm bàn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAreas.map((area) => (
            <div key={area.id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{area.name}</h2>
                <Badge variant="outline">{area.tables.length} Bàn</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {area.tables.map((table) => {
                  const config = statusConfig[table.status] || statusConfig.available
                  const StatusIcon = config.icon
                  return (
                    <Card
                      key={table.id}
                      className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                        table.status === "occupied" ? "ring-2 ring-orange-500" : ""
                      } ${table.status === "reserved" ? "ring-2 ring-blue-500" : ""}`}
                      onClick={() => setSelectedTable(table)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-lg font-bold">{table.table_number}</span>
                          <div className={`h-3 w-3 rounded-full ${config.color}`} />
                        </div>
                        {table.status === "occupied" && (
                          <>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <Users className="h-3 w-3" />
                              <span>{table.current_guests} Khách</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(table.occupied_at)}</span>
                            </div>
                          </>
                        )}
                        {table.status === "reserved" && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Calendar className="h-3 w-3" />
                            <span>{table.reserved_for || "Đã đặt"}</span>
                          </div>
                        )}
                        {table.status === "available" && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="h-3 w-3" />
                            <span>Trống</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Detail Panel */}
      {selectedTable && (
        <TableDetailPanel
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onUpdate={fetchTables}
          isAdmin={isAdmin}
        />
      )}

      {/* Settings Dialog */}
      {showSettings && (
        <TableSettingsDialog
          open={showSettings}
          onClose={() => setShowSettings(false)}
          onUpdate={fetchTables}
        />
      )}
    </div>
  )
}
