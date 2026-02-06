"use client"

import { CheckCircle, Clock, Package, Truck, Home, XCircle, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrderTimelineProps {
  status: string
  paymentMethod: string
  createdAt: string
}

interface TimelineStep {
  key: string
  label: string
  icon: React.ElementType
  description: string
}

const TIMELINE_STEPS: TimelineStep[] = [
  { key: "pending", label: "Đặt hàng", icon: Clock, description: "Đơn hàng đã được tạo" },
  { key: "confirmed", label: "Xác nhận", icon: CheckCircle, description: "Đơn hàng đã được xác nhận" },
  { key: "shipping", label: "Đang giao", icon: Truck, description: "Đơn hàng đang được vận chuyển" },
  { key: "delivered", label: "Hoàn thành", icon: Home, description: "Đơn hàng đã giao thành công" },
]

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  awaiting_payment: 0,
  confirmed: 1,
  shipping: 2,
  delivered: 3,
  cancelled: -1,
}

export function OrderTimeline({ status, paymentMethod, createdAt }: OrderTimelineProps) {
  const currentStep = STATUS_ORDER[status] ?? 0
  const isCancelled = status === "cancelled"

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isCancelled) {
    return (
      <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="font-medium text-destructive">Đơn hàng đã bị hủy</p>
          <p className="text-sm text-muted-foreground">
            Đơn hàng này đã bị hủy. Vui lòng liên hệ hỗ trợ nếu cần thêm thông tin.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Timeline header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Ngày đặt: {formatDate(createdAt)}</span>
        {status === "awaiting_payment" && (
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
            <CreditCard className="h-4 w-4" />
            Chờ thanh toán
          </span>
        )}
      </div>

      {/* Timeline steps */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / (TIMELINE_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index <= currentStep
            const isCurrent = index === currentStep
            const StepIcon = step.icon

            return (
              <div key={step.key} className="flex flex-col items-center">
                {/* Icon circle */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                >
                  <StepIcon className="h-5 w-5" />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center",
                    isCompleted ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>

                {/* Description (only show for current step on mobile, all on desktop) */}
                <span
                  className={cn(
                    "mt-1 text-xs text-center max-w-[80px] hidden sm:block",
                    isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.description}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current status message */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm">
          {status === "pending" && "Đơn hàng của bạn đang chờ xác nhận từ cửa hàng."}
          {status === "awaiting_payment" && "Vui lòng thanh toán để đơn hàng được xử lý."}
          {status === "confirmed" && "Đơn hàng đã được xác nhận và đang chuẩn bị hàng."}
          {status === "shipping" && "Đơn hàng đang trên đường giao đến bạn."}
          {status === "delivered" && "Đơn hàng đã được giao thành công. Cảm ơn bạn đã đặt hàng!"}
        </p>
      </div>
    </div>
  )
}
