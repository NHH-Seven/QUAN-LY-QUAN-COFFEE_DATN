"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export interface RevenueChartData {
  date: string
  revenue: number
  orders: number
  items: number
}

interface RevenueChartProps {
  data: RevenueChartData[]
  groupBy?: "day" | "week" | "month"
  className?: string
}

const formatPrice = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`
  }
  return value.toString()
}

const formatFullPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ"

function formatDateLabel(date: string, groupBy: "day" | "week" | "month"): string {
  switch (groupBy) {
    case "day":
      // Format: "2024-01-15" -> "15/01"
      const parts = date.split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`
      }
      return date
    case "week":
      // Format: "2024-03" (ISO week) -> "T3"
      const weekMatch = date.match(/-(\d+)$/)
      return weekMatch ? `T${parseInt(weekMatch[1])}` : date
    case "month":
      // Format: "2024-01" -> "01/24"
      const monthParts = date.split("-")
      if (monthParts.length >= 2) {
        return `${monthParts[1]}/${monthParts[0].slice(2)}`
      }
      return date
    default:
      return date
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.dataKey === "revenue" ? "Doanh thu:" : "Đơn hàng:"}
          </span>
          <span className="font-medium">
            {entry.dataKey === "revenue"
              ? formatFullPrice(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({
  data,
  groupBy = "day",
  className,
}: RevenueChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      revenue: item.revenue ?? 0,
      orders: item.orders ?? 0,
      items: item.items ?? 0,
      label: formatDateLabel(item.date, groupBy),
    }))
  }, [data, groupBy])

  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Biểu đồ doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chưa có dữ liệu
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Biểu đồ doanh thu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatPrice}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) =>
                  value === "revenue" ? "Doanh thu" : "Đơn hàng"
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
