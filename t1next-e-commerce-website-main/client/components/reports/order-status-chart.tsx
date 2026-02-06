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
import { PieChart as PieChartIcon } from "lucide-react"

export interface OrderStatusData {
  status: string
  name: string
  color: string
  totalOrders: number
  totalRevenue: number
}

interface OrderStatusChartProps {
  data: OrderStatusData[]
  className?: string
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ"

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: OrderStatusData & { percentage: number }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-medium">{data.name}</span>
      </div>
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
    payload: OrderStatusData & { percentage: number }
  }>
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
          <span className="font-medium">({entry.payload.totalOrders})</span>
        </div>
      ))}
    </div>
  )
}

export function OrderStatusChart({ data, className }: OrderStatusChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.totalOrders, 0)
    return data
      .filter((item) => item.totalOrders > 0)
      .map((item) => ({
        ...item,
        percentage: total > 0 ? (item.totalOrders / total) * 100 : 0,
      }))
  }, [data])

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Trạng thái đơn hàng
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
          <PieChartIcon className="h-5 w-5" />
          Trạng thái đơn hàng
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
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
