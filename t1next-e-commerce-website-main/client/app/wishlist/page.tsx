"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingCart, ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { useCart } from "@/contexts/cart-context"
import { formatPrice } from "@/lib/utils"

export default function WishlistPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { items, isLoading, removeFromWishlist } = useWishlist()
  const { addItem } = useCart()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/wishlist")
    }
  }, [user, authLoading, router])

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.price),
      images: item.product.images,
      stock: item.product.stock,
    } as any, 1)
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                Món yêu thích
              </h1>
              <p className="text-muted-foreground">{items.length} món</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Chưa có món yêu thích</h2>
              <p className="text-muted-foreground mb-6">
                Hãy thêm món vào danh sách yêu thích để xem lại sau
              </p>
              <Button asChild>
                <Link href="/search">Khám phá menu</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <Link href={`/product/${item.product.slug}`}>
                    <div className="relative aspect-square bg-muted">
                      {item.product.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-contain p-4 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      {item.product.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          -{item.product.discount}%
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <Link href={`/product/${item.product.slug}`}>
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    {item.product.brand && (
                      <p className="text-sm text-muted-foreground mt-1">{item.product.brand}</p>
                    )}
                    
                    <div className="mt-2">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(Number(item.product.price))}
                      </span>
                      {item.product.original_price && Number(item.product.original_price) > Number(item.product.price) && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(Number(item.product.original_price))}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAddToCart(item)}
                        disabled={item.product.stock === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {item.product.stock === 0 ? 'Hết hàng' : 'Thêm'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeFromWishlist(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
