"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatPrice } from "@/lib/utils"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react"

export interface ReportSummary {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  avgOrderValue: number
  revenueGrowth: number
  prevRevenue: number
}

interface ReportSummaryCardsProps {
  summary: ReportSummary | null
  isLoading?: boolean
  className?: string
}

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  variant?: "default" | "primary" | "success" | "warning"
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
}

function SummaryCard({
  title,
  value,
  icon,
  trend,
  description,
  variant = "default",
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("rounded-lg p-2", variantStyles[variant])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium mr-1",
                  trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.isPositive ? "+" : ""}
                {trend.value.toFixed(1)}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  )
}

export function ReportSummaryCards({
  summary,
  isLoading,
  className,
}: ReportSummaryCardsProps) {
  const cards = useMemo(() => {
    if (!summary) return []

    return [
      {
        title: "Tổng doanh thu",
        value: formatPrice(summary.totalRevenue),
        icon: <DollarSign className="h-4 w-4" />,
        variant: "primary" as const,
        trend: {
          value: summary.revenueGrowth,
          isPositive: summary.revenueGrowth >= 0,
        },
        description: "so với kỳ trước",
      },
      {
        title: "Tổng đơn hàng",
        value: summary.totalOrders.toLocaleString("vi-VN"),
        icon: <ShoppingCart className="h-4 w-4" />,
        variant: "success" as const,
        description: `${summary.totalItems.toLocaleString("vi-VN")} sản phẩm`,
      },
      {
        title: "Giá trị TB/đơn",
        value: formatPrice(summary.avgOrderValue),
        icon: <Calculator className="h-4 w-4" />,
        variant: "warning" as const,
        description: "trung bình mỗi đơn",
      },
      {
        title: "Doanh thu kỳ trước",
        value: formatPrice(summary.prevRevenue),
        icon: <TrendingUp className="h-4 w-4" />,
        variant: "default" as const,
        description: "để so sánh",
      },
    ]
  }, [summary])

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center h-24 text-muted-foreground">
            Chưa có dữ liệu báo cáo
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  )
}
