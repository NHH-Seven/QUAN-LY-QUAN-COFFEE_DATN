"use client"

/**
 * Admin Orders Page
 * Quản lý đơn hàng với DataTable, filter by status/date, pagination
 * Requirements: 4.1, 7.5
 */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Eye, Calendar } from "lucide-react"
import { api, AdminOrder } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { OrderStatusBadge, getAllStatusOptions, OrderStatus } from "@/components/admin"
import { initSocket, getSocket, joinRoom } from "@/lib/socket"
import { toast as sonnerToast } from "sonner"

/**
 * Format ngày giờ
 */
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

/**
 * Format date for input
 */
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)


  // Filters from URL
  const page = Number(searchParams.get("page")) || 1
  const status = searchParams.get("status") || ""
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""
  const sort = searchParams.get("sort") || "created_at"
  const order = (searchParams.get("order") as "asc" | "desc") || "desc"

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.getAdminOrders({
        page,
        limit: 10,
        status,
        from,
        to,
        sort,
        order,
      })

      setOrders(res.data || [])
      setTotal(res.total || 0)
      setTotalPages(res.totalPages || 0)
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể tải dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, status, from, to, sort, order, toast])

  useEffect(() => {
    fetchOrders()
    
    // Initialize socket connection for real-time updates
    const token = localStorage.getItem('token')
    if (token) {
      const socket = initSocket(token)
      
      // Join staff room for order notifications
      joinRoom('staff')
      console.log('📦 Orders page: Joined staff room')
      
      // Listen for new orders from tables
      socket.on('order:new', (data: any) => {
        console.log('🔔 Orders page: New order received:', data)
        sonnerToast.success(`Đơn hàng mới từ bàn ${data.tableNumber}`, {
          description: `Tổng tiền: ${formatPrice(data.total)}đ`
        })
        fetchOrders() // Refresh orders list
      })
      
      // Listen for order updates
      socket.on('order:updated', () => {
        console.log('🔔 Orders page: Order updated')
        fetchOrders()
      })
    }
    
    return () => {
      const socket = getSocket()
      if (socket) {
        socket.off('order:new')
        socket.off('order:updated')
      }
    }
  }, [fetchOrders])

  // Update URL params
  const updateFilters = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })
    router.push(`/staff/orders?${params.toString()}`)
  }

  // Clear all filters
  const clearFilters = () => {
    router.push("/staff/orders")
  }

  const statusOptions = getAllStatusOptions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Đơn hàng</h2>
        <p className="text-muted-foreground">
          Quản lý danh sách đơn hàng ({total} đơn hàng)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <Select
          value={status || "all"}
          onValueChange={(value) =>
            updateFilters({ status: value === "all" ? "" : value, page: 1 })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={from}
            onChange={(e) => updateFilters({ from: e.target.value, page: 1 })}
            className="w-[150px]"
            placeholder="Từ ngày"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => updateFilters({ to: e.target.value, page: 1 })}
            className="w-[150px]"
            placeholder="Đến ngày"
          />
        </div>

        <Select
          value={`${sort}-${order}`}
          onValueChange={(value) => {
            const [newSort, newOrder] = value.split("-")
            updateFilters({ sort: newSort, order: newOrder })
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Mới nhất</SelectItem>
            <SelectItem value="created_at-asc">Cũ nhất</SelectItem>
            <SelectItem value="total-desc">Giá trị cao → thấp</SelectItem>
            <SelectItem value="total-asc">Giá trị thấp → cao</SelectItem>
          </SelectContent>
        </Select>

        {(status || from || to) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>


      {/* Orders Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Mã đơn</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Khách hàng</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng tiền</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Số SP</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ngày đặt</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-24 animate-pulse rounded bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-8 w-16 animate-pulse rounded bg-muted ml-auto" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((orderItem) => (
                  <tr
                    key={orderItem.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/staff/orders/${orderItem.id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {orderItem.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {orderItem.user_name || "Khách"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {orderItem.user_email || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(orderItem.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {orderItem.items_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <OrderStatusBadge status={orderItem.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(orderItem.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/staff/orders/${orderItem.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: page - 1 })}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: page + 1 })}
                disabled={page >= totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
