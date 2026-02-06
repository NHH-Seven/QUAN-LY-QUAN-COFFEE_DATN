"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Flame } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice: number | null
  images: string[]
  brand: string
  stock: number
  rating: number
  reviewCount: number
  isNew: boolean
  isFeatured: boolean
  discount: number
  category: { name: string; slug: string }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/products?featured=true&limit=5`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-500/10">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold md:text-3xl">Món nổi bật</h2>
              <p className="text-sm sm:text-base mt-0.5 sm:mt-1 text-muted-foreground">Những món được yêu thích nhất</p>
            </div>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline md:flex"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Xem tất cả món nổi bật
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
