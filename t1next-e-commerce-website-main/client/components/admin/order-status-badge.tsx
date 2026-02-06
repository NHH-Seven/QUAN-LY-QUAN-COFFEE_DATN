"use client"

/**
 * OrderStatusBadge component
 * Hiển thị trạng thái đơn hàng với màu sắc tương ứng
 * Requirements: 4.5
 */

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  XCircle,
  CreditCard
} from "lucide-react"

export type OrderStatus = "pending" | "awaiting_payment" | "confirmed" | "shipping" | "delivered" | "cancelled"

interface OrderStatusBadgeProps {
  status: OrderStatus
  showIcon?: boolean
  className?: string
}

interface StatusConfig {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  icon: React.ComponentType<{ className?: string }>
  className?: string
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: "Chờ xác nhận",
    variant: "outline",
    icon: Clock,
    className: "border-yellow-500 text-yellow-600 dark:text-yellow-400",
  },
  awaiting_payment: {
    label: "Chờ thanh toán",
    variant: "outline",
    icon: CreditCard,
    className: "border-purple-500 text-purple-600 dark:text-purple-400",
  },
  confirmed: {
    label: "Đã xác nhận",
    variant: "secondary",
    icon: CheckCircle,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  shipping: {
    label: "Đang giao",
    variant: "default",
    icon: Truck,
    className: "bg-orange-500 text-white",
  },
  delivered: {
    label: "Đã giao",
    variant: "default",
    icon: Package,
    className: "bg-green-500 text-white",
  },
  cancelled: {
    label: "Đã hủy",
    variant: "destructive",
    icon: XCircle,
  },
}

export function OrderStatusBadge({ 
  status, 
  showIcon = true, 
  className 
}: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}

/**
 * Get next valid statuses for a given status
 * Used for status update dropdown
 */
export function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    awaiting_payment: ["confirmed", "cancelled"],
    confirmed: ["shipping", "cancelled"],
    shipping: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
  }
  return transitions[currentStatus] || []
}

/**
 * Get all status options for filtering
 */
export function getAllStatusOptions(): { value: OrderStatus; label: string }[] {
  return Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value: value as OrderStatus,
    label: config.label,
  }))
}
