"use client"

import { useState, useEffect } from "react"
import { History, TrendingUp, TrendingDown, Gift, Clock, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PointsHistoryItem {
  id: string
  points: number
  type: string
  description: string | null
  order_id: string | null
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  earn: { label: "Tích điểm", icon: TrendingUp, color: "text-green-600 bg-green-100" },
  redeem: { label: "Đổi điểm", icon: Gift, color: "text-blue-600 bg-blue-100" },
  expire: { label: "Hết hạn", icon: Clock, color: "text-orange-600 bg-orange-100" },
  adjust: { label: "Điều chỉnh", icon: History, color: "text-gray-600 bg-gray-100" },
}

export function PointsHistory() {
  const [history, setHistory] = useState<PointsHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [page])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/points/history?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        if (page === 1) {
          setHistory(data.data)
        } else {
          setHistory(prev => [...prev, ...data.data])
        }
        setHasMore(page < data.pagination.totalPages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && page === 1) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  if (history.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Chưa có lịch sử điểm thưởng</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((item) => {
        const config = typeConfig[item.type] || typeConfig.adjust
        const Icon = config.icon
        const isPositive = item.points > 0

        return (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{config.label}</span>
                    {item.order_id && (
                      <Badge variant="outline" className="text-xs">
                        #{item.order_id.slice(0, 8).toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description || config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? "+" : ""}{item.points}
              </span>
            </CardContent>
          </Card>
        )
      })}

      {hasMore && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => setPage(p => p + 1)}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xem thêm"}
        </Button>
      )}
    </div>
  )
}
