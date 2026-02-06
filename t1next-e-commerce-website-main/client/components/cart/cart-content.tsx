"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/mock-data"

export function CartContent() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart()
  const { toast } = useToast()

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    const result = await updateQuantity(productId, quantity)
    if (!result.success && result.error) {
      toast({
        title: "Không thể cập nhật",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Giỏ hàng trống</h2>
        <p className="mt-2 text-muted-foreground">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
        <Button className="mt-6" asChild>
          <Link href="/">
            Xem menu
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  const shippingFee = totalPrice >= 500000 ? 0 : 30000

  return (
    <div className="mt-4 sm:mt-8 grid gap-4 sm:gap-8 lg:grid-cols-[1fr_400px]">
      {/* Cart items */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base text-muted-foreground">{items.length} sản phẩm</span>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive text-xs sm:text-sm">
            <Trash2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Xóa tất cả
          </Button>
        </div>

        {items.map((item) => (
          <Card key={item.product.id}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex gap-3 sm:gap-4">
                {/* Image */}
                <Link
                  href={`/product/${item.product.slug}`}
                  className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.name}
                    fill
                    className="object-contain p-2"
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="text-sm sm:text-base font-medium hover:text-primary line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">{item.product.brand}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    {/* Quantity */}
                    <div className="flex items-center rounded-lg border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 sm:w-8 text-center text-xs sm:text-sm">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-semibold text-primary">{formatPrice(item.product.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{formatPrice(item.product.price)}/sp</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order summary */}
      <div className="lg:sticky lg:top-24 h-fit">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Tóm tắt đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
              </div>
              {shippingFee > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Miễn phí vận chuyển cho đơn hàng từ {formatPrice(500000)}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span className="text-sm sm:text-base">Tổng cộng</span>
              <span className="text-lg sm:text-xl text-primary">{formatPrice(totalPrice + shippingFee)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 p-4 sm:p-6 pt-0 sm:pt-0">
            <Button className="w-full h-10 sm:h-11 text-sm sm:text-base" asChild>
              <Link href="/checkout">
                Tiến hành thanh toán
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full h-9 sm:h-10 text-sm bg-transparent" asChild>
              <Link href="/">Xem menu</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
