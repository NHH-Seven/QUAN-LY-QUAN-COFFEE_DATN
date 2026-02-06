"use client"

import { useEffect } from "react"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"

interface TrackProductViewProps {
  product: {
    id: string
    slug: string
    name: string
    price: number
    original_price?: number
    images: string[]
  }
}

export function TrackProductView({ product }: TrackProductViewProps) {
  const { addProduct } = useRecentlyViewed()

  useEffect(() => {
    if (product?.id) {
      addProduct({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        original_price: product.original_price ? Number(product.original_price) : undefined,
        images: product.images || []
      })
    }
  }, [product?.id, product?.slug, product?.name, product?.price, product?.original_price, product?.images, addProduct])

  return null
}
