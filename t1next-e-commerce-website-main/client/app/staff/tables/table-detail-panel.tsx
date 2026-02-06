"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { 
  X, Users, Clock, Plus, Minus, Trash2, Printer, 
  CreditCard, Search, Coffee, RefreshCw
} from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Table {
  id: string
  table_number: string
  status: string
  current_order_id: string | null
  current_guests: number
  occupied_at: string | null
  capacity: number
  reserved_at: string | null
  reserved_for: string | null
  reserved_phone: string | null
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  price: number
  status: string
  notes: string | null
}

interface TableOrder {
  id: string
  order_number: string
  guests_count: number
  subtotal: number
  discount_amount: number
  total: number
  status: string
  items: OrderItem[]
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category: { name: string }
}

interface Props {
  table: Table
  onClose: () => void
  onUpdate: () => void
  isAdmin: boolean
}

const itemStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-500" },
  preparing: { label: "Đang làm", color: "bg-blue-500" },
  ready: { label: "Sẵn sàng", color: "bg-green-500" },
  served: { label: "Đã ra món", color: "bg-gray-500" },
  cancelled: { label: "Đã hủy", color: "bg-red-500" },
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price)
}

function formatDuration(startTime: string | null): string {
  if (!startTime) return ""
  const start = new Date(startTime)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
  const hours = Math.floor(diff / 60)
  const minutes = diff % 60
  if (hours > 0) return `${hours}h ${minutes}p`
  return `${minutes}p`
}

export function TableDetailPanel({ table, onClose, onUpdate, isAdmin }: Props) {
  const [order, setOrder] = useState<TableOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [searchProduct, setSearchProduct] = useState("")
  const [guestsCount, setGuestsCount] = useState(table.current_guests || 1)

  const fetchTableDetail = useCallback(async () => {
    if (table.id === "new") return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      console.log('Fetching table detail for:', table.id)
      const res = await fetch(`${API_URL}/tables/${table.id}`, { 
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      
      console.log('Table detail response:', data)
      
      if (data.success && data.data.current_order) {
        console.log('Setting order:', data.data.current_order)
        setOrder(data.data.current_order)
      } else if (data.success) {
        // Bàn không có order hiện tại
        console.log('No current order, table status:', table.status)
        setOrder(null)
      } else {
        console.error('Failed to fetch table detail:', data.error)
        toast.error(data.error || 'Không thể tải thông tin bàn')
      }
    } catch (error) {
      console.error("Fetch table detail error:", error)
      toast.error('Lỗi kết nối server')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }, [table.id, table.status])

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/products?limit=100`, { 
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch (error) {
      console.error("Fetch products error:", error)
    }
  }, [])

  useEffect(() => {
    fetchTableDetail()
    fetchProducts()
  }, [fetchTableDetail, fetchProducts])

  const handleStartOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tables/${table.id}/orders`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ guests_count: guestsCount }),
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.data)
        onUpdate()
        toast.success("Đã mở bàn")
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi khi mở bàn")
    }
  }

  const handleAddItem = async (product: Product) => {
    if (!order) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tables/orders/${order.id}/items`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      })
      const data = await res.json()
      if (data.success) {
        fetchTableDetail()
        toast.success(`Đã thêm ${product.name}`)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi khi thêm món")
    }
  }

  const handleUpdateItemQuantity = async (itemId: string, quantity: number) => {
    if (!order || quantity < 1) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tables/orders/${order.id}/items/${itemId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      })
      if (res.ok) fetchTableDetail()
    } catch (error) {
      toast.error("Lỗi cập nhật")
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!order) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tables/orders/${order.id}/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (res.ok) {
        fetchTableDetail()
        toast.success("Đã hủy món")
      }
    } catch (error) {
      toast.error("Lỗi khi hủy món")
    }
  }

  const handleCheckout = async (paymentMethod: string, discountAmount: number, recipientName: string, phone: string) => {
    if (!order) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tables/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ 
          payment_method: paymentMethod, 
          discount_amount: discountAmount,
          recipient_name: recipientName,
          phone: phone || 'N/A'
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || "Thanh toán thành công. Đơn hàng đã được tạo.")
        setShowCheckout(false)
        onUpdate()
        onClose()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi thanh toán")
    }
  }

  const handleCancelOrder = async () => {
    if (!order || !confirm("Bạn có chắc muốn hủy đơn hàng này?")) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/tables/orders/${order.id}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (res.ok) {
        toast.success("Đã hủy đơn hàng")
        onUpdate()
        onClose()
      }
    } catch (error) {
      toast.error("Lỗi khi hủy đơn")
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  )

  const statusLabel = table.status === "occupied" ? "Đang phục vụ" :
    table.status === "reserved" ? "Đã đặt trước" : "Trống"

  const statusColor = table.status === "occupied" ? "text-orange-600" :
    table.status === "reserved" ? "text-blue-600" : "text-green-600"

  return (
    <>
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
          <SheetHeader className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl">Bàn {table.table_number}</SheetTitle>
                <p className={`text-sm font-medium ${statusColor}`}>{statusLabel}</p>
              </div>
            </div>
            {table.status === "occupied" && (
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(table.occupied_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{table.current_guests} Người</span>
                </div>
              </div>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}

            {/* Reserved table */}
            {!loading && table.status === "reserved" && (
              <div className="text-center py-8">
                <Coffee className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <h3 className="font-semibold mb-2">Bàn đã đặt trước</h3>
                {table.reserved_for && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Khách: {table.reserved_for}
                  </p>
                )}
                {table.reserved_phone && (
                  <p className="text-sm text-muted-foreground mb-2">
                    SĐT: {table.reserved_phone}
                  </p>
                )}
                {table.reserved_at && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Đặt lúc: {new Date(table.reserved_at).toLocaleString('vi-VN')}
                  </p>
                )}
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleStartOrder}>
                    <Users className="mr-2 h-4 w-4" />
                    Khách đã đến
                  </Button>
                  <Button variant="outline" onClick={() => {
                    // TODO: Cancel reservation
                    toast.info("Chức năng hủy đặt bàn đang phát triển")
                  }}>
                    Hủy đặt
                  </Button>
                </div>
              </div>
            )}

            {/* Empty table - Start order */}
            {!loading && (table.status === "available" || table.status === "cleaning") && !order && (
              <div className="text-center py-8">
                <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Bàn đang trống</h3>
                <p className="text-sm text-muted-foreground mb-4">Nhập số khách để bắt đầu phục vụ</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Button variant="outline" size="icon" onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-lg font-semibold">{guestsCount}</span>
                  <Button variant="outline" size="icon" onClick={() => setGuestsCount(guestsCount + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleStartOrder}>
                  <Users className="mr-2 h-4 w-4" />
                  Mở bàn
                </Button>
              </div>
            )}

            {/* Occupied table but no order - Error state */}
            {!loading && table.status === "occupied" && !order && (
              <div className="text-center py-8">
                <Coffee className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                <h3 className="font-semibold mb-2">Bàn đang phục vụ</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Không tìm thấy đơn hàng cho bàn này
                </p>
                <Button onClick={fetchTableDetail} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tải lại
                </Button>
              </div>
            )}

            {/* Order items */}
            {!loading && order && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Đơn hàng ({order.items?.length || 0})</h3>
                  <Badge variant="outline">#{order.order_number}</Badge>
                </div>

                {order.items?.filter(i => i.status !== "cancelled").map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          {item.product_image ? (
                            <Image src={item.product_image} alt={item.product_name} fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Coffee className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.product_name}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className={`text-xs ${itemStatusConfig[item.status]?.color} text-white`}>
                              {itemStatusConfig[item.status]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6"
                                onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6"
                                onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-semibold text-primary">{formatPrice(item.price * item.quantity)}đ</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-destructive"
                          onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" className="w-full" onClick={() => setShowAddProduct(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm món
                </Button>
              </div>
            )}
            </div>
          </ScrollArea>

          {/* Footer - Order summary */}
          {order && (
            <div className="border-t p-4 space-y-3 shrink-0">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(order.subtotal)}đ</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(order.discount_amount)}đ</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(order.total)}đ</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleCancelOrder}>
                  Hủy đơn
                </Button>
                <Button variant="outline" className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  In tạm tính
                </Button>
                <Button className="flex-1" onClick={() => setShowCheckout(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Thanh toán
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Thêm món</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm món..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => { handleAddItem(product); setShowAddProduct(false) }}>
                  <CardContent className="p-3">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Coffee className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-sm text-primary font-semibold">{formatPrice(product.price)}đ</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        order={order}
        onCheckout={handleCheckout}
      />
    </>
  )
}


// Checkout Dialog Component
function CheckoutDialog({ open, onClose, order, onCheckout }: {
  open: boolean
  onClose: () => void
  order: TableOrder | null
  onCheckout: (paymentMethod: string, discountAmount: number, recipientName: string, phone: string) => void
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [recipientName, setRecipientName] = useState("Khách")
  const [phone, setPhone] = useState("")

  if (!order) return null

  const subtotal = order.subtotal
  const finalTotal = subtotal - discountAmount

  const handlePercentChange = (percent: number) => {
    setDiscountPercent(percent)
    setDiscountAmount(Math.round(subtotal * percent / 100))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thanh toán</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên khách hàng</label>
            <Input
              placeholder="Nhập tên khách hàng"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Số điện thoại</label>
            <Input
              placeholder="Nhập số điện thoại (tùy chọn)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            <label className="text-sm font-medium">Giảm giá</label>
            <div className="flex gap-2">
              {[0, 5, 10, 15, 20].map((p) => (
                <Button key={p} variant={discountPercent === p ? "default" : "outline"} size="sm"
                  onClick={() => handlePercentChange(p)}>
                  {p}%
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Hoặc nhập số tiền giảm"
              value={discountAmount || ""}
              onChange={(e) => {
                setDiscountAmount(Number(e.target.value))
                setDiscountPercent(0)
              }}
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
              <span className="text-primary">{formatPrice(finalTotal)}đ</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => onCheckout(paymentMethod, discountAmount, recipientName, phone)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Xác nhận thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
