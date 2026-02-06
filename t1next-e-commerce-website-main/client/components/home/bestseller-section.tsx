"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface Category {
  id: string
  name: string
  slug: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export function BestsellerSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("")

  // Fetch categories on mount
  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          // Take first 6 categories
          const cats = data.data.slice(0, 6)
          setCategories(cats)
          setActiveTab(cats[0].slug)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fetch products when tab changes
  const fetchProducts = useCallback(async (categorySlug: string) => {
    if (products[categorySlug]) return // Already fetched
    
    try {
      const res = await fetch(`${API_URL}/products?category=${categorySlug}&limit=5&sort=bestseller`)
      const data = await res.json()
      if (data.success) {
        setProducts(prev => ({ ...prev, [categorySlug]: data.data }))
      }
    } catch {
      // Silent fail
    }
  }, [products])

  useEffect(() => {
    if (activeTab) {
      fetchProducts(activeTab)
    }
  }, [activeTab, fetchProducts])

  if (loading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-10 w-full max-w-2xl mb-6" />
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-6">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold md:text-3xl">Sản phẩm bán chạy</h2>
            <p className="text-sm sm:text-base mt-0.5 sm:mt-1 text-muted-foreground">Top sản phẩm được mua nhiều nhất</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 h-auto p-1 bg-muted/50">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.slug} 
                value={cat.slug}
                className="px-4 py-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => {
            const catProducts = products[cat.slug] || []
            
            return (
              <TabsContent key={cat.slug} value={cat.slug} className="mt-0">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {catProducts.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))
                  ) : (
                    catProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  )}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href={`/category/${cat.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Xem tất cả {cat.name.toLowerCase()}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </section>
  )
}
