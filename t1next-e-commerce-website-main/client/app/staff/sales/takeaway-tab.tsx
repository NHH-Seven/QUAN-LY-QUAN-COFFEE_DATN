"use client"

/**
 * Takeaway Tab - Mang đi
 * Simplified POS for takeaway orders
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Plus, Minus, Trash2, CreditCard, ShoppingBag, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Image from "next/image"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  stock: number
  category: { id: string; name: string }
}

interface CartItem {
  product: Product
  quantity: number
}

interface Category {
  id: string
  name: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price)
}

export default function TakeawayTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Checkout form
  const [customerName, setCustomerName] = useState("Khách mang đi")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [discountAmount, setDiscountAmount] = useState(0)

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/products?limit=500`, { headers }),
          fetch(`${API_URL}/categories`, { headers }),
        ])

        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()

        if (productsData.success) setProducts(productsData.data)
        if (categoriesData.success) setCategories(categoriesData.data)
      } catch (error) {
        console.error("Fetch error:", error)
        toast.error("Lỗi tải dữ liệu")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === "all" || p.category?.id === categoryFilter
      const inStock = p.stock > 0
      return matchSearch && matchCategory && inStock
    })
  }, [products, search, categoryFilter])

  // Cart actions
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Không đủ hàng")
          return prev
        }
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.product.id !== productId) return i
          const newQty = i.quantity + delta
          if (newQty <= 0) return null
          if (newQty > i.product.stock) {
            toast.error("Không đủ hàng")
            return i
          }
          return { ...i, quantity: newQty }
        })
        .filter(Boolean) as CartItem[]
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  const total = subtotal - discountAmount

  // Checkout
  const handleCheckout = async () => {
    console.log('=== CHECKOUT STARTED ===')
    console.log('Cart:', cart)
    console.log('Customer phone:', customerPhone)
    
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống")
      return
    }

    if (!customerPhone) {
      toast.error("Vui lòng nhập số điện thoại")
      return
    }

    setProcessing(true)

    try {
      const token = localStorage.getItem('token')
      console.log('Token:', token ? 'exists' : 'missing')
      
      const requestBody = {
        recipient_name: customerName,
        phone: customerPhone,
        shipping_address: "Mang đi",
        paymentMethod: paymentMethod, // Đổi từ payment_method sang paymentMethod
        subtotal,
        discount_amount: discountAmount,
        total,
        note: "Đơn mang đi",
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      }
      
      console.log('Takeaway checkout request:', requestBody)
      console.log('API URL:', `${API_URL}/orders`)
      
      // Create order using /api/orders endpoint (already fixed with gen_random_uuid)
      const orderRes = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', orderRes.status)
      
      if (!orderRes.ok) {
        const errorText = await orderRes.text()
        console.error('Response error:', errorText)
        throw new Error(`HTTP ${orderRes.status}: ${errorText}`)
      }
      
      const orderData = await orderRes.json()
      console.log('Takeaway checkout response:', orderData)

      if (orderData.success) {
        toast.success("Đặt hàng thành công!")
        
        // Reset form
        clearCart()
        setCustomerName("Khách mang đi")
        setCustomerPhone("")
        setDiscountAmount(0)
        setCheckoutOpen(false)
      } else {
        toast.error(orderData.error || "Lỗi đặt hàng")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error(error instanceof Error ? error.message : "Lỗi kết nối")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="h-full flex bg-background">
      {/* Products List */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search and Filter */}
        <div className="p-4 border-b space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              Tất cả
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square relative mb-2 rounded-lg overflow-hidden bg-gray-100">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold">
                    {formatPrice(product.price)}đ
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Còn: {product.stock}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 xl:w-96 shrink-0 border-l flex flex-col bg-card overflow-hidden">
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Giỏ hàng</h2>
            <Badge>{cart.length} món</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Giỏ hàng trống</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.product.id}>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 relative rounded overflow-hidden bg-gray-100 shrink-0">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {item.product.name}
                        </h3>
                        <p className="text-primary font-bold text-sm">
                          {formatPrice(item.product.price)}đ
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 ml-auto"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t space-y-3 shrink-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}đ</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatPrice(discountAmount)}đ</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatPrice(total)}đ</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Thanh toán
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán - Mang đi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên khách hàng</label>
              <Input
                placeholder="Nhập tên khách hàng"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Số điện thoại *</label>
              <Input
                placeholder="Nhập số điện thoại"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phương thức thanh toán</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="momo">Momo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Giảm giá (đ)</label>
              <Input
                type="number"
                placeholder="0"
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatPrice(subtotal)}đ</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discountAmount)}đ</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatPrice(total)}đ</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCheckout} disabled={processing}>
              {processing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Xác nhận thanh toán
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
