"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus, Check, Facebook, Link2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/lib/types"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(0)
  const { addItem, isInCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { toast } = useToast()

  // Extract colors and variants from specs
  const colors: string[] = product.specs?._colors || []
  const variants: string[] = product.specs?._variants || []

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${product.name} x ${quantity}`,
    })
  }

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `${product.name} - ${formatPrice(product.price)}`
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        toast({ title: "Đã sao chép link!" })
        break
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const increaseQuantity = () => {
    if (quantity < product.stock) setQuantity(quantity + 1)
  }

  return (
    <Card className="mt-4 sm:mt-6 p-4 sm:p-6">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="flex flex-col h-full">
          <div className="relative flex-1 min-h-[300px] overflow-hidden rounded-xl bg-muted">
            <Image
              src={product.images?.[selectedImage] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-contain p-4 sm:p-8"
              priority
            />
            {product.discount && (
              <Badge className="absolute left-3 top-3 bg-destructive text-destructive-foreground">
                -{product.discount}%
              </Badge>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImage === index ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4 sm:space-y-5">
          {/* Brand & Name */}
          <div>
            <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-primary">{product.brand}</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                  }`}
                />
              ))}
              <span className="ml-1 text-sm font-medium">{product.rating || 0}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">{product.review_count || 0} đánh giá</span>
          </div>

          {/* Price */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-primary">{formatPrice(Number(product.price))}</span>
              {(product.original_price || product.originalPrice) && Number(product.original_price || product.originalPrice) > Number(product.price) && (
                <>
                  <span className="text-base sm:text-lg text-muted-foreground line-through">
                    {formatPrice(Number(product.original_price || product.originalPrice))}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Tiết kiệm {formatPrice(Number(product.original_price || product.originalPrice) - Number(product.price))}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Còn hàng ({product.stock} sản phẩm)</span>
              </>
            ) : (
              <span className="text-sm text-destructive">Hết hàng</span>
            )}
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Màu sắc: <span className="text-primary">{colors[selectedColor]}</span></p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedColor === index 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Phiên bản: <span className="text-primary">{variants[selectedVariant]}</span></p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVariant(index)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedVariant === index 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center rounded-lg border border-border">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={decreaseQuantity} disabled={quantity <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={increaseQuantity} disabled={quantity >= product.stock}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 h-11"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isInCart(product.id)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isInCart(product.id) ? "Đã có trong giỏ" : "Thêm vào giỏ hàng"}
            </Button>
            <Button variant="secondary" className="flex-1 h-11">
              Mua ngay
            </Button>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`flex-1 ${isInWishlist(product.id) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-transparent'}`}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart className={`mr-2 h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              {isInWishlist(product.id) ? 'Đã yêu thích' : 'Yêu thích'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Share2 className="mr-2 h-4 w-4" />
                  Chia sẻ
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Sao chép link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-[10px] sm:text-xs">Giao hàng nhanh</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-[10px] sm:text-xs">Chất lượng đảm bảo</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <RotateCcw className="h-5 w-5 text-primary" />
              <span className="text-[10px] sm:text-xs">Đổi trả dễ dàng</span>
            </div>
          </div>

          {/* Promotions */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary mb-2">🎁 Ưu đãi khi đặt hàng</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Giảm thêm 5% khi thanh toán qua VNPay/Momo</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Tích điểm đổi quà hấp dẫn</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>Miễn phí giao hàng đơn từ 100K</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  )
}
