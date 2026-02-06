"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

export interface PaymentMethodData {
  method: string
  name: string
  totalOrders: number
  totalRevenue: number
  percentage: number
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[]
  className?: string
}

// Colors for payment methods
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ"

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: PaymentMethodData
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{data.name}</p>
      <div className="space-y-1 text-muted-foreground">
        <p>Số đơn: <span className="font-medium text-foreground">{data.totalOrders}</span></p>
        <p>Tỷ lệ: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span></p>
        <p>Doanh thu: <span className="font-medium text-foreground">{formatPrice(data.totalRevenue)}</span></p>
      </div>
    </div>
  )
}

interface CustomLegendProps {
  payload?: Array<{
    value: string
    color: string
    payload: PaymentMethodData
  }>
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
          <span className="font-medium">{entry.payload.percentage.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export function PaymentMethodChart({ data, className }: PaymentMethodChartProps) {
  const chartData = useMemo(() => {
    return data.filter((item) => item.totalOrders > 0)
  }, [data])

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Phương thức thanh toán
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
          <CreditCard className="h-5 w-5" />
          Phương thức thanh toán
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="totalOrders"
                nameKey="name"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
