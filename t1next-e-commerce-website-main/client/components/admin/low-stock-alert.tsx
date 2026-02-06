"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { LowStockProduct } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface LowStockAlertProps {
  products: LowStockProduct[]
}

/**
 * LowStockAlert component hiển thị sản phẩm sắp hết hàng (stock < 10)
 * Requirements: 2.6
 */
export function LowStockAlert({ products }: LowStockAlertProps) {
  if (!products.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sản phẩm sắp hết hàng
          </CardTitle>
          <CardDescription>Không có sản phẩm nào sắp hết hàng</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Sản phẩm sắp hết hàng
        </CardTitle>
        <CardDescription>
          {products.length} sản phẩm có tồn kho dưới 10
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="min-w-0">
                  <Link
                    href={`/staff/products/${product.id}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    /{product.slug}
                  </p>
                </div>
              </div>
              <Badge
                variant={product.stock === 0 ? "destructive" : "outline"}
                className="shrink-0"
              >
                {product.stock === 0 ? "Hết hàng" : `Còn ${product.stock}`}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
