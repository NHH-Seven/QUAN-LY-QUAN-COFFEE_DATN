"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export interface CategoryRevenueData {
  categoryId: string
  name: string
  totalQuantity: number
  totalRevenue: number
  productCount: number
  percentage: number
}

interface CategoryRevenueChartProps {
  data: CategoryRevenueData[]
  className?: string
}

// Colors for categories
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
]

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

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: CategoryRevenueData
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{data.name}</p>
      <div className="space-y-1 text-muted-foreground">
        <p>Doanh thu: <span className="font-medium text-foreground">{formatFullPrice(data.totalRevenue)}</span></p>
        <p>Tỷ lệ: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span></p>
        <p>Số lượng bán: <span className="font-medium text-foreground">{data.totalQuantity}</span></p>
        <p>Số sản phẩm: <span className="font-medium text-foreground">{data.productCount}</span></p>
      </div>
    </div>
  )
}

export function CategoryRevenueChart({ data, className }: CategoryRevenueChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((item) => item.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10) // Limit to top 10 categories
  }, [data])

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Doanh thu theo danh mục
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
          <BarChart3 className="h-5 w-5" />
          Doanh thu theo danh mục
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatPrice}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
