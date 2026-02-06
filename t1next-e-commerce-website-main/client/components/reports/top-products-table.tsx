"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatPrice } from "@/lib/utils"
import { Trophy, Package } from "lucide-react"

export interface TopProduct {
  rank: number
  productId: string
  name: string
  image: string | null
  totalQuantity: number
  totalRevenue: number
  orderCount: number
}

interface TopProductsTableProps {
  products: TopProduct[]
  isLoading?: boolean
  limit?: number
  className?: string
}

function getRankBadgeStyle(rank: number) {
  switch (rank) {
    case 1:
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    case 2:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    case 3:
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export function TopProductsTable({
  products,
  isLoading,
  limit = 10,
  className,
}: TopProductsTableProps) {
  const displayProducts = products.slice(0, limit)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top {limit} sản phẩm bán chạy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>Chưa có dữ liệu sản phẩm</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">Hạng</div>
              <div className="col-span-5">Sản phẩm</div>
              <div className="col-span-2 text-right">SL bán</div>
              <div className="col-span-2 text-right">Đơn hàng</div>
              <div className="col-span-2 text-right">Doanh thu</div>
            </div>

            {/* Rows */}
            {displayProducts.map((product) => (
              <div
                key={product.productId}
                className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Rank */}
                <div className="col-span-2 md:col-span-1">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                      getRankBadgeStyle(product.rank)
                    )}
                  >
                    {product.rank}
                  </span>
                </div>

                {/* Product info */}
                <div className="col-span-10 md:col-span-5 flex items-center gap-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-medium text-sm line-clamp-2">
                    {product.name}
                  </span>
                </div>

                {/* Mobile: Stats in a row */}
                <div className="col-span-12 md:hidden grid grid-cols-3 gap-2 text-sm pl-11">
                  <div>
                    <span className="text-muted-foreground">SL: </span>
                    <span className="font-medium">{product.totalQuantity.toLocaleString("vi-VN")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Đơn: </span>
                    <span className="font-medium">{product.orderCount.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-primary">
                      {formatPrice(product.totalRevenue)}
                    </span>
                  </div>
                </div>

                {/* Desktop: Stats columns */}
                <div className="hidden md:block col-span-2 text-right text-sm">
                  {product.totalQuantity.toLocaleString("vi-VN")}
                </div>
                <div className="hidden md:block col-span-2 text-right text-sm">
                  {product.orderCount.toLocaleString("vi-VN")}
                </div>
                <div className="hidden md:block col-span-2 text-right text-sm font-medium text-primary">
                  {formatPrice(product.totalRevenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
