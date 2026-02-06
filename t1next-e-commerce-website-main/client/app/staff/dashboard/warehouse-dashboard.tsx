"use client"

/**
 * Warehouse Dashboard
 * Dashboard riêng cho nhân viên kho
 */

import { useState, useEffect } from "react"
import { 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  AlertTriangle,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface InventorySummary {
  totalProducts: number
  totalStock: number
  lowStockCount: number
  outOfStockCount: number
  today: {
    import: { quantity: number; count: number }
    export: { quantity: number; count: number }
  }
  week: {
    import: { quantity: number; count: number }
    export: { quantity: number; count: number }
  }
}

interface LowStockProduct {
  id: string
  name: string
  stock: number
  brand: string
  category_name: string
}

export default function WarehouseDashboard() {
  const { toast } = useToast()
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [summaryRes, lowStockRes] = await Promise.all([
          api.getInventorySummary(),
          api.getLowStockProducts()
        ])
        
        if (summaryRes.data) setSummary(summaryRes.data)
        if (lowStockRes.data) setLowStockProducts(lowStockRes.data.slice(0, 8))
      } catch {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu thống kê",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Kho</h2>
        <p className="text-muted-foreground">Tổng quan tình trạng kho hàng</p>
      </div>

      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng sản phẩm
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Tổng tồn: {summary.totalStock.toLocaleString()} SP
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Nhập kho hôm nay
                </CardTitle>
                <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  +{summary.today.import.quantity}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.today.import.count} phiếu nhập
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Xuất kho hôm nay
                </CardTitle>
                <ArrowUpFromLine className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  -{summary.today.export.quantity}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.today.export.count} phiếu xuất
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cảnh báo tồn kho
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {summary.lowStockCount + summary.outOfStockCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.outOfStockCount} hết, {summary.lowStockCount} sắp hết
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Nhập kho tuần này
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  +{summary.week.import.quantity}
                </div>
                <p className="text-sm text-muted-foreground">
                  {summary.week.import.count} phiếu nhập trong 7 ngày qua
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  Xuất kho tuần này
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  -{summary.week.export.quantity}
                </div>
                <p className="text-sm text-muted-foreground">
                  {summary.week.export.count} phiếu xuất trong 7 ngày qua
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Sản phẩm sắp hết hàng
          </CardTitle>
          <Link href="/staff/stock?lowStock=true">
            <Button variant="outline" size="sm">Xem tất cả</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Không có sản phẩm nào sắp hết hàng
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.brand} • {product.category_name}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {product.stock === 0 ? "Hết hàng" : `Còn ${product.stock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
