"use client"

import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { Button } from "@/components/ui/button"
import { Clock, Trash2, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

function formatPrice(price: number) {
  if (typeof price !== "number" || isNaN(price)) return "N/A"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

export function RecentlyViewedSection() {
  const { products, isLoaded, clearAll } = useRecentlyViewed()

  if (!isLoaded || products.length === 0) {
    return null
  }

  return (
    <section className="py-8 sm:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Sản phẩm đã xem</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAll}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Xóa tất cả</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, 5).map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.slug}`}
              className="group"
            >
              <div className="bg-background rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square relative bg-muted">
                  <Image
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                  {product.original_price && product.original_price > product.price && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      -{Math.round((1 - product.price / product.original_price) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {products.length > 5 && (
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/profile/recently-viewed">
                Xem tất cả ({products.length})
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
