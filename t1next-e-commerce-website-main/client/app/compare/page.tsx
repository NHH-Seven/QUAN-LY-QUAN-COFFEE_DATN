"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Trash2, ShoppingCart, GitCompareArrows } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCompare, MAX_COMPARE_ITEMS } from "@/contexts/compare-context"
import { useCart } from "@/contexts/cart-context"
import { api } from "@/lib/api"
import { formatPrice } from "@/lib/mock-data"
import { SpecsDiff } from "@/components/product/specs-diff"
import type { Product } from "@/lib/types"

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare, compareCount } = useCompare()
  const { addItem, isInCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch products when compare list changes
  useEffect(() => {
    async function fetchProducts() {
      if (compareList.length === 0) {
        setProducts([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const productPromises = compareList.map(async (id) => {
          try {
            const response = await api.getProductById(id)
            if (response.success && response.data) {
              return response.data
            }
            return null
          } catch {
            return null
          }
        })

        const results = await Promise.all(productPromises)
        setProducts(results.filter((p): p is Product => p !== null))
      } catch (error) {
        console.error("Failed to fetch compare products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [compareList])

  const handleAddToCart = (product: Product) => {
    addItem(product)
  }

  // Empty state
  if (!isLoading && compareCount === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GitCompareArrows className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Chưa có món để so sánh</h1>
            <p className="text-muted-foreground mb-6">
              Thêm món vào danh sách so sánh để xem chi tiết bên cạnh nhau
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Xem menu
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">So sánh món</h1>
            <p className="text-muted-foreground">
              {compareCount}/{MAX_COMPARE_ITEMS} món
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Xem menu
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={clearCompare}
              disabled={compareCount === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa tất cả
            </Button>
          </div>
        </div>

        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: compareCount }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Product cards row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[600px] mb-8">
              {products.map((product) => (
                <Card key={product.id} className="relative">
                  {/* Remove button */}
                  <button
                    className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                    onClick={() => removeFromCompare(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  <CardContent className="p-4">
                    <Link href={`/product/${product.slug}`}>
                      <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={product.images[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                        {product.discount && product.discount > 0 && (
                          <Badge className="absolute top-2 left-2 bg-destructive">
                            -{product.discount}%
                          </Badge>
                        )}
                      </div>
                    </Link>

                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {product.brand}
                    </p>
                    <h3 className="font-medium line-clamp-2 h-12 mt-1">
                      <Link href={`/product/${product.slug}`} className="hover:text-primary">
                        {product.name}
                      </Link>
                    </h3>

                    <div className="mt-3">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <Button
                      className="w-full mt-4"
                      variant={isInCart(product.id) ? "secondary" : "default"}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || isInCart(product.id)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {isInCart(product.id) ? "Đã thêm" : "Thêm vào giỏ"}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Empty slots */}
              {Array.from({ length: MAX_COMPARE_ITEMS - products.length }).map((_, i) => (
                <Card key={`empty-${i}`} className="border-dashed">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[300px]">
                    <GitCompareArrows className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Thêm món để so sánh
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Specs comparison */}
            {products.length >= 2 && <SpecsDiff products={products} />}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
