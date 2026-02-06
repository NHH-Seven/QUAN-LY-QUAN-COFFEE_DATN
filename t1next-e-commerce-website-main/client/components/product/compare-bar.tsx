"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { GitCompareArrows, X, Trash2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCompare, MAX_COMPARE_ITEMS } from "@/contexts/compare-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ProductPreview {
  id: string
  name: string
  slug: string
  images: string[]
}

/**
 * CompareBar floating component
 * Shows compare count, product previews, and quick actions
 * Fixed at bottom of screen when products are in compare list
 */
export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, compareCount } = useCompare()
  const [products, setProducts] = useState<ProductPreview[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch product previews when compare list changes
  useEffect(() => {
    async function fetchProducts() {
      if (compareList.length === 0) {
        setProducts([])
        return
      }

      setIsLoading(true)
      try {
        // Fetch each product's basic info
        const productPromises = compareList.map(async (id) => {
          try {
            const response = await api.getProductById(id)
            if (response.success && response.data) {
              return {
                id: response.data.id,
                name: response.data.name,
                slug: response.data.slug,
                images: response.data.images || [],
              }
            }
            return null
          } catch {
            return null
          }
        })

        const results = await Promise.all(productPromises)
        setProducts(results.filter((p): p is ProductPreview => p !== null))
      } catch (error) {
        console.error("Failed to fetch compare products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [compareList])

  // Don't render if no products in compare list
  if (compareCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg transition-all duration-300",
        isExpanded ? "h-auto" : "h-14"
      )}
    >
      <div className="max-w-[90%] mx-auto">
      {/* Collapsed bar */}
      <div
        className="flex items-center justify-between h-14 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {compareCount}
            </span>
          </div>
          <span className="font-medium text-sm">
            So sánh ({compareCount}/{MAX_COMPARE_ITEMS})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              clearCompare()
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Xóa tất cả
          </Button>
          
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href="/compare">
              So sánh ngay
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Expanded content with product previews */}
      {isExpanded && (
        <div className="pb-4 border-t">
          <div className="flex items-center gap-4 py-4 overflow-x-auto">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: compareCount }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-24 h-24 bg-muted animate-pulse rounded-lg"
                />
              ))
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="relative flex-shrink-0 group"
                >
                  <Link href={`/product/${product.slug}`}>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border bg-muted">
                      <Image
                        src={product.images[0] || "/placeholder.svg"}
                        alt={product.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-1 text-xs text-center line-clamp-2 w-20 sm:w-24">
                      {product.name}
                    </p>
                  </Link>
                  
                  {/* Remove button */}
                  <button
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeFromCompare(product.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}

            {/* Empty slots */}
            {Array.from({ length: MAX_COMPARE_ITEMS - compareCount }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
              >
                <span className="text-xs text-muted-foreground">Trống</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
