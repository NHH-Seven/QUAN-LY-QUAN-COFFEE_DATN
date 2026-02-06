"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Dynamic imports for heavy components (code splitting)
const ProductReviews = dynamic(
  () => import("@/components/product/product-reviews").then(mod => ({ default: mod.ProductReviews })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
)

const ProductQA = dynamic(
  () => import("@/components/product/product-qa").then(mod => ({ default: mod.ProductQA })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
)

const RecentlyViewed = dynamic(
  () => import("@/components/product/recently-viewed").then(mod => ({ default: mod.RecentlyViewed })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
)

interface ProductPageClientProps {
  productId: string
  initialRating: number
  initialReviewCount: number
}

export function ProductPageClient({ productId, initialRating, initialReviewCount }: ProductPageClientProps) {
  return (
    <>
      {/* Reviews - full width */}
      <div className="mt-4 sm:mt-6">
        <ProductReviews 
          productId={productId} 
          initialRating={initialRating}
          initialReviewCount={initialReviewCount}
        />
      </div>

      {/* Q&A */}
      <div className="mt-4 sm:mt-6">
        <ProductQA productId={productId} />
      </div>

      {/* Recently viewed */}
      <div className="mt-4 sm:mt-6">
        <RecentlyViewed />
      </div>
    </>
  )
}
