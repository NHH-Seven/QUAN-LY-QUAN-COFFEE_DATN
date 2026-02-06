"use client"

import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Clock, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

function formatPrice(price: number) {
  if (typeof price !== "number" || isNaN(price)) return "N/A"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

export function RecentlyViewed() {
  const { products, isLoaded, removeProduct, clearAll } = useRecentlyViewed()

  if (!isLoaded || products.length === 0) {
    return null
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Sản phẩm đã xem</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearAll}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Xóa tất cả
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="relative flex-shrink-0 w-[140px] sm:w-[160px] group"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeProduct(product.id)}
            >
              <X className="h-3 w-3" />
            </Button>
            
            <Link href={`/product/${product.slug}`}>
              <div className="aspect-square relative rounded-lg overflow-hidden bg-muted mb-2">
                <Image
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                  sizes="160px"
                />
              </div>
              <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="mt-1">
                <span className="text-sm font-semibold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="ml-2 text-xs text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </Card>
  )
}
