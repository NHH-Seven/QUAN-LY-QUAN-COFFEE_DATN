"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Heart, Star, Eye, GitCompareArrows } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { useCompare } from "@/contexts/compare-context"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/mock-data"
import type { Product } from "@/lib/types"
import { useState } from "react"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCompare, removeFromCompare, isInCompare, isMaxReached } = useCompare()
  const { toast } = useToast()
  const [isHovered, setIsHovered] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isInCompare(product.id)) {
      removeFromCompare(product.id)
      toast({ title: "Đã xóa khỏi so sánh" })
    } else {
      if (isMaxReached) {
        toast({ title: "Đã đạt giới hạn 4 sản phẩm", variant: "destructive" })
        return
      }
      addToCompare(product.id)
      toast({ title: "Đã thêm vào so sánh" })
    }
  }

  const inWishlist = isInWishlist(product.id)
  const inCompare = isInCompare(product.id)
  
  // Validate image URL
  const imageUrl = product.images?.[0]
  const validImageUrl = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/')) 
    ? imageUrl 
    : "/placeholder.svg"

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-border py-0 gap-0 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="flex flex-col h-full">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={validImageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute left-1.5 sm:left-2 top-1.5 sm:top-2 flex flex-col gap-1">
            {product.discount && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs px-1.5 sm:px-2">-{product.discount}%</Badge>
            )}
            {product.isNew && <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">Mới</Badge>}
          </div>

          {/* Quick actions */}
          <div
            className={`absolute right-2 top-2 flex flex-col gap-2 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
            }`}
          >
            <Button
              size="icon"
              variant={inWishlist ? "default" : "secondary"}
              className={`h-8 w-8 rounded-full shadow-md ${inWishlist ? "bg-red-500 hover:bg-red-600" : ""}`}
              onClick={handleToggleWishlist}
            >
              <Heart className={`h-4 w-4 ${inWishlist ? "fill-white" : ""}`} />
              <span className="sr-only">Yêu thích</span>
            </Button>
            <Button
              size="icon"
              variant={inCompare ? "default" : "secondary"}
              className={`h-8 w-8 rounded-full shadow-md ${inCompare ? "bg-primary" : ""}`}
              onClick={handleToggleCompare}
            >
              <GitCompareArrows className={`h-4 w-4`} />
              <span className="sr-only">So sánh</span>
            </Button>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          {/* Brand */}
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{product.brand}</p>

          {/* Name - fixed 2 lines height */}
          <h3 className="mt-1 text-sm sm:text-base font-medium line-clamp-2 h-[2.5rem] sm:h-[3rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                    i < Math.floor(Number(product.rating)) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">({product.reviewCount || product.review_count || 0})</span>
          </div>

          {/* Price */}
          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-end gap-0.5 sm:gap-2">
            <span className="text-base sm:text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs sm:text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          {/* Spacer to push button to bottom */}
          <div className="flex-1" />

          {/* Stock status - hidden on mobile */}
          <p className={`hidden sm:block mt-2 text-xs ${
            product.stock === 0 
              ? "text-destructive font-medium" 
              : product.stock <= 5 
              ? "text-orange-500 font-medium" 
              : product.stock <= 10 
              ? "text-yellow-600" 
              : "text-muted-foreground"
          }`}>
            {product.stock === 0 
              ? "Hết hàng" 
              : product.stock <= 10 
              ? `⚠️ Chỉ còn ${product.stock} sản phẩm` 
              : "Còn hàng"}
          </p>

          {/* Add to cart button */}
          <Button
            className="w-full mt-2 sm:mt-3 h-8 sm:h-10 text-xs sm:text-sm transition-all duration-300"
            variant={isHovered ? "default" : "outline"}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isInCart(product.id)}
          >
            <ShoppingCart className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{isInCart(product.id) ? "Đã thêm" : "Thêm vào giỏ"}</span>
            <span className="sm:hidden">{isInCart(product.id) ? "Đã thêm" : "Thêm giỏ"}</span>
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}
