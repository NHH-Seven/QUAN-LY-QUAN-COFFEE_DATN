"use client"

/**
 * Admin Order Detail Page
 * Hiển thị chi tiết đơn hàng: customer info, items, status update
 * Requirements: 4.2, 4.3
 */

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, User, MapPin, CreditCard, Package } from "lucide-react"
import { api, AdminOrderDetail, OrderItem } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import {
  OrderStatusBadge,
  getNextStatuses,
  getAllStatusOptions,
  OrderStatus,
} from "@/components/admin"
import { OrderNotes } from "@/components/staff/order-notes"

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

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const orderId = params.id as string

  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)


  // Fetch order detail
  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.getAdminOrder(orderId)
      if (res.data) {
        setOrder(res.data)
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể tải đơn hàng",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [orderId, toast])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Update order status
  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return

    try {
      setIsUpdating(true)
      await api.updateAdminOrderStatus(orderId, newStatus)
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái đơn hàng thành công",
        variant: "success"
      })
      fetchOrder()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  // Not found
  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/staff/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Đơn hàng không tồn tại</p>
        </div>
      </div>
    )
  }

  const nextStatuses = getNextStatuses(order.status as OrderStatus)
  const allStatuses = getAllStatusOptions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/staff/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Đơn hàng #{order.id.slice(0, 8)}
            </h2>
            <p className="text-muted-foreground">
              Đặt lúc {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status as OrderStatus} />
          {nextStatuses.length > 0 && (
            <Select
              value=""
              onValueChange={handleStatusUpdate}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cập nhật trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {nextStatuses.map((status) => {
                  const statusInfo = allStatuses.find((s) => s.value === status)
                  return (
                    <SelectItem key={status} value={status}>
                      {statusInfo?.label || status}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>


      {/* Customer & Order Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Họ tên</p>
              <p className="font-medium">{order.user_name || "Khách"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.user_email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số điện thoại</p>
              <p className="font-medium">{order.user_phone || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Giao hàng & Thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Địa chỉ giao hàng</p>
              <p className="font-medium">{order.shipping_address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phương thức thanh toán</p>
              <p className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {order.payment_method === "cod"
                  ? "Thanh toán khi nhận hàng (COD)"
                  : order.payment_method === "bank_transfer"
                  ? "Chuyển khoản ngân hàng"
                  : order.payment_method}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Sản phẩm ({order.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                  {item.images?.[0] ? (
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-1">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price)} x {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Order Total */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Notes - Internal staff notes */}
      <OrderNotes orderId={orderId} />
    </div>
  )
}
