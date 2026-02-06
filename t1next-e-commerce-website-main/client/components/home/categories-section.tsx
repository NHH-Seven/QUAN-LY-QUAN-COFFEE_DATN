"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Coffee, Leaf, Snowflake, Citrus, Cake, Cookie, Package, Bean, ArrowRight, CupSoda } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  productCount: number
}

const categoryIcons: Record<string, React.ReactNode> = {
  coffee: <Coffee className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
  leaf: <Leaf className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
  snowflake: <Snowflake className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
  citrus: <Citrus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
  cake: <Cake className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
  cookie: <Cookie className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
  package: <Package className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
  bean: <Bean className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />,
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold md:text-3xl">Menu</h2>
            <p className="text-sm sm:text-base mt-0.5 sm:mt-1 text-muted-foreground">Khám phá các loại đồ uống và bánh ngọt</p>
          </div>
          <Link
            href="/categories"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline md:flex"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col items-center p-3 sm:p-6 text-center">
                  <Skeleton className="h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-full" />
                  <Skeleton className="mt-2 sm:mt-4 h-4 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            categories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Card className="group h-full transition-all hover:border-primary hover:shadow-md hover:shadow-primary/10">
                  <CardContent className="flex flex-col items-center p-3 sm:p-6 text-center">
                    <div className="flex h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {categoryIcons[category.icon || ""] || <CupSoda className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />}
                    </div>
                    <h3 className="mt-2 sm:mt-4 text-xs sm:text-sm lg:text-base font-medium">{category.name}</h3>
                    <p className="hidden sm:block mt-1 text-xs sm:text-sm text-muted-foreground">{category.productCount} món</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
