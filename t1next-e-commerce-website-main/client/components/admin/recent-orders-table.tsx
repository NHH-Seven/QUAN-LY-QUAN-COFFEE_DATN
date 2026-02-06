"use client"

import Link from "next/link"
import { RecentOrder } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface RecentOrdersTableProps {
  orders: RecentOrder[]
}

/**
 * Format số tiền VND
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

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
 * Map status sang tiếng Việt và variant
 */
function getStatusInfo(status: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Chờ xác nhận", variant: "outline" },
    confirmed: { label: "Đã xác nhận", variant: "secondary" },
    shipping: { label: "Đang giao", variant: "default" },
    delivered: { label: "Đã giao", variant: "default" },
    cancelled: { label: "Đã hủy", variant: "destructive" },
  }
  return statusMap[status] || { label: status, variant: "outline" }
}

/**
 * RecentOrdersTable component hiển thị 10 đơn hàng gần nhất
 * Requirements: 2.5
 */
export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (!orders.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng gần đây</CardTitle>
          <CardDescription>Chưa có đơn hàng nào</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn hàng gần đây</CardTitle>
        <CardDescription>10 đơn hàng mới nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Mã đơn</th>
                <th className="text-left py-3 px-2 font-medium">Khách hàng</th>
                <th className="text-left py-3 px-2 font-medium">Tổng tiền</th>
                <th className="text-left py-3 px-2 font-medium">Trạng thái</th>
                <th className="text-left py-3 px-2 font-medium">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status)
                return (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <Link
                        href={`/staff/orders/${order.id}`}
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium">{order.user_name || "Khách"}</div>
                        <div className="text-muted-foreground text-xs">
                          {order.user_email || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
