"use client"

/**
 * POS Page - Bán hàng tại quầy
 * Quyền truy cập: admin, sales
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { RoleProtectedPage } from "@/components/admin/role-protected-page"
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, Loader2, User, Receipt, Check, ChevronLeft, ChevronRight, Printer, Tag, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Product { id: string; name: string; price: string; images: string[]; stock: number; category_id: string }
interface Category { id: string; name: string }
interface CartItem { product: Product; quantity: number }
interface AppliedPromo { id: string; code: string; name: string; discount: number }
interface CompletedOrder { id: string; total: number; subtotal: number; customerName: string; items: CartItem[]; paymentMethod: string; cashReceived?: number; change?: number; createdAt: Date; promo?: AppliedPromo }

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ"
const ITEMS_PER_PAGE = 12

// VietQR config - lấy từ env hoặc dùng default
const BANK_CODE = process.env.NEXT_PUBLIC_VIETQR_BANK_CODE || "MB"
const ACCOUNT_NO = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || "5678720112004"
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || "NGUYEN VAN DUOC"

export default function POSPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [payment, setPayment] = useState("cash")
  const [page, setPage] = useState(1)
  const [cashReceived, setCashReceived] = useState("")
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [availablePromos, setAvailablePromos] = useState<Array<{ id: string; code: string; name: string; type: string; value: number }>>([])
  const [showPromoSuggestions, setShowPromoSuggestions] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [p, c, promos] = await Promise.all([
          api.getProducts({ limit: 500 }), 
          api.getCategories(),
          api.getPromotions({ status: 'active', limit: 50 })
        ])
        setProducts(p.data || [])
        setCategories(c.data || [])
        setAvailablePromos((promos.data || []).map(p => ({ id: p.id, code: p.code, name: p.name, type: p.type, value: p.value })))
      } catch { toast({ title: "Lỗi tải dữ liệu", variant: "destructive" }) }
      finally { setLoading(false) }
    })()
  }, [toast])

  const filtered = useMemo(() => products.filter(p => 
    p.stock > 0 && p.name.toLowerCase().includes(search.toLowerCase()) && (category === "all" || p.category_id === category)
  ), [products, search, category])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page])
  useEffect(() => { setPage(1) }, [search, category])

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) { toast({ title: "Không đủ hàng", variant: "destructive" }); return prev }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [toast])

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.product.id !== id) return [i]
      const newQty = i.quantity + delta
      if (newQty <= 0) return []
      if (newQty > i.product.stock) { toast({ title: "Không đủ hàng", variant: "destructive" }); return [i] }
      return [{ ...i, quantity: newQty }]
    }))
  }, [toast])

  const total = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0)
  const subtotal = total
  const discount = appliedPromo?.discount || 0
  const finalTotal = total - discount
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0)
  const cashReceivedNum = parseInt(cashReceived.replace(/\D/g, "")) || 0
  const change = cashReceivedNum - finalTotal

  const quickCashAmounts = useMemo(() => {
    const rounded = Math.ceil(finalTotal / 10000) * 10000
    return [rounded, rounded + 50000, rounded + 100000, rounded + 200000].filter(v => v >= finalTotal)
  }, [finalTotal])

  // Apply promo code
  const applyPromoCode = async (code?: string) => {
    const codeToApply = code || promoCode.trim()
    if (!codeToApply) return
    setValidatingPromo(true)
    setShowPromoSuggestions(false)
    try {
      const res = await api.validatePromotion(codeToApply, subtotal)
      if (res.data) {
        setAppliedPromo({
          id: res.data.id,
          code: res.data.code,
          name: res.data.name,
          discount: res.data.discount
        })
        setPromoCode(res.data.code)
        toast({ title: "Áp dụng thành công", description: `Giảm ${formatPrice(res.data.discount)}` })
      }
    } catch (e) {
      toast({ title: "Mã không hợp lệ", description: e instanceof Error ? e.message : "Không thể áp dụng mã", variant: "destructive" })
    } finally {
      setValidatingPromo(false)
    }
  }

  const removePromo = () => {
    setAppliedPromo(null)
    setPromoCode("")
  }

  const checkout = async () => {
    if (!cart.length) return
    if (payment === "cash" && cashReceivedNum < finalTotal) {
      toast({ title: "Tiền nhận chưa đủ", variant: "destructive" }); return
    }
    setProcessing(true)
    try {
      const res = await api.createPOSOrder({
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, price: Number(i.product.price) })),
        customerName: customerName || "Khách lẻ", customerPhone, paymentMethod: payment, shippingAddress: "Mua tại cửa hàng",
        promotionId: appliedPromo?.id, discountAmount: discount
      })
      const order: CompletedOrder = {
        id: res.data?.id || "", total: finalTotal, subtotal, customerName: customerName || "Khách lẻ", items: [...cart],
        paymentMethod: payment, cashReceived: payment === "cash" ? cashReceivedNum : undefined,
        change: payment === "cash" ? change : undefined, createdAt: new Date(), promo: appliedPromo || undefined
      }
      setCompletedOrder(order)
      setReceiptOpen(true)
      toast({ title: "Thành công!", description: `Đơn #${res.data?.id?.slice(0, 8)}`, variant: "success" })
      setCart([]); setCustomerName(""); setCustomerPhone(""); setCashReceived(""); setCheckoutOpen(false)
      setPromoCode(""); setAppliedPromo(null)
      const p = await api.getProducts({ limit: 500 }); setProducts(p.data || [])
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Không thể tạo đơn", variant: "destructive" })
    } finally { setProcessing(false) }
  }

  const printReceipt = () => {
    if (!receiptRef.current) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`<html><head><title>Hóa đơn</title><style>
      body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
      .center { text-align: center; } .bold { font-weight: bold; } .line { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; } .item { margin: 4px 0; }
    </style></head><body>${receiptRef.current.innerHTML}</body></html>`)
    printWindow.document.close(); printWindow.print(); printWindow.close()
  }

  const qrUrl = payment === "transfer" ? `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-compact.png?amount=${finalTotal}&addInfo=DH${completedOrder?.id?.slice(0,8) || Date.now()}&accountName=${encodeURIComponent(ACCOUNT_NAME)}` : ""

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-slate-100 dark:bg-slate-900">
      {/* LEFT: Products */}
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-4">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="pl-10 h-11 bg-white dark:bg-slate-800 border-0 shadow-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button onClick={() => setCategory("all")} className={cn("px-4 h-11 rounded-lg font-medium text-sm whitespace-nowrap transition-all", category === "all" ? "bg-primary text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm")}>Tất cả</button>
            {categories.slice(0, 6).map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} className={cn("px-4 h-11 rounded-lg font-medium text-sm whitespace-nowrap transition-all", category === c.id ? "bg-primary text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm")}>{c.name}</button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-4 pr-2">
            {paginated.map(p => {
              const inCart = cart.find(i => i.product.id === p.id)
              const imageUrl = p.images?.[0]
              const validImageUrl = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/')) ? imageUrl : "/placeholder.svg"
              return (
                <button key={p.id} onClick={() => addToCart(p)} className={cn("group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden text-left transition-all hover:shadow-lg active:scale-[0.98]", inCart && "ring-2 ring-primary")}>
                  <div className="aspect-square relative bg-slate-100 dark:bg-slate-700">
                    <Image src={validImageUrl} alt={p.name} fill className="object-cover" />
                    {inCart && <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">{inCart.quantity}</div>}
                    {p.stock <= 5 && <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">Còn {p.stock}</div>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">{p.name}</p>
                    <p className="text-primary font-bold mt-1">{formatPrice(Number(p.price))}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <span className="text-sm text-slate-500">{paginated.length} sản phẩm trong {filtered.length} sản phẩm</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                return <Button key={pageNum} variant={page === pageNum ? "default" : "ghost"} size="sm" className="h-8 w-8 p-0" onClick={() => setPage(pageNum)}>{pageNum}</Button>
              })}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Cart */}
      <div className="w-[400px] bg-white dark:bg-slate-800 flex flex-col shadow-xl">
        <div className="p-4 border-b dark:border-slate-700 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Đơn hàng mới</h2>
            {cart.length > 0 && <Badge variant="secondary" className="font-semibold">{totalQty} sản phẩm</Badge>}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(100vh-16rem)]">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-8">
                <Receipt className="h-16 w-16 mb-4 opacity-30" /><p className="font-medium">Chưa có sản phẩm</p><p className="text-sm mt-1">Chọn sản phẩm để thêm vào đơn</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white dark:bg-slate-600 shrink-0">
                      <Image src={item.product.images[0] || "/placeholder.svg"} alt="" width={64} height={64} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-primary font-bold text-sm mt-0.5">{formatPrice(Number(item.product.price))}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white dark:bg-slate-600 rounded-lg shadow-sm">
                          <button onClick={() => updateQty(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-l-lg"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-r-lg"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <span className="font-bold">{formatPrice(Number(item.product.price) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          {appliedPromo && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-green-600 flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{appliedPromo.code}</span>
              <span className="text-green-600 font-medium">-{formatPrice(appliedPromo.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500">Tổng cộng</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(finalTotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => { setCart([]); removePromo() }} disabled={!cart.length} className="h-12"><Trash2 className="h-4 w-4 mr-2" />Xóa đơn</Button>
            <Button onClick={() => setCheckoutOpen(true)} disabled={!cart.length} className="h-12 font-semibold"><CreditCard className="h-4 w-4 mr-2" />Thanh toán</Button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl">Thanh toán</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4" />Khách hàng</label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Tên (để trống = Khách lẻ)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-11" />
                <Input placeholder="Số điện thoại" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-11" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2"><Tag className="h-4 w-4" />Mã giảm giá</label>
              {appliedPromo ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">{appliedPromo.code}</p>
                    <p className="text-sm text-green-600 dark:text-green-500">Giảm {formatPrice(appliedPromo.discount)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removePromo} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nhập mã giảm giá..." 
                      value={promoCode} 
                      onChange={e => setPromoCode(e.target.value.toUpperCase())} 
                      onFocus={() => setShowPromoSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowPromoSuggestions(false), 200)}
                      className="h-11 flex-1" 
                      onKeyDown={e => e.key === "Enter" && applyPromoCode()} 
                    />
                    <Button onClick={() => applyPromoCode()} disabled={!promoCode.trim() || validatingPromo} className="h-11 px-4">
                      {validatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
                    </Button>
                  </div>
                  {showPromoSuggestions && availablePromos.length > 0 && (
                    <div className="absolute top-full left-0 right-12 mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {availablePromos
                        .filter(p => !promoCode || p.code.includes(promoCode) || p.name.toLowerCase().includes(promoCode.toLowerCase()))
                        .slice(0, 5)
                        .map(p => (
                          <button
                            key={p.id}
                            className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                            onMouseDown={() => applyPromoCode(p.code)}
                          >
                            <div>
                              <p className="font-medium text-sm">{p.code}</p>
                              <p className="text-xs text-slate-500">{p.name}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {p.type === 'percentage' ? `${p.value}%` : formatPrice(p.value)}
                            </Badge>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Phương thức thanh toán</label>
              <div className="grid grid-cols-3 gap-3">
                {[{ id: "cash", icon: Banknote, label: "Tiền mặt" }, { id: "card", icon: CreditCard, label: "Thẻ" }, { id: "transfer", icon: QrCode, label: "Chuyển khoản" }].map(m => (
                  <button key={m.id} onClick={() => { setPayment(m.id); setCashReceived("") }} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all relative", payment === m.id ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:border-slate-300")}>
                    <m.icon className={cn("h-6 w-6", payment === m.id ? "text-primary" : "text-slate-400")} />
                    <span className={cn("text-sm font-medium", payment === m.id ? "text-primary" : "text-slate-600")}>{m.label}</span>
                    {payment === m.id && <Check className="h-4 w-4 text-primary absolute top-2 right-2" />}
                  </button>
                ))}
              </div>
            </div>

            {payment === "cash" && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Tiền khách đưa</label>
                <Input placeholder="Nhập số tiền..." value={cashReceived} onChange={e => setCashReceived(e.target.value.replace(/\D/g, ""))} className="h-12 text-lg font-semibold" />
                <div className="flex gap-2 flex-wrap">
                  {quickCashAmounts.slice(0, 4).map(amount => (
                    <Button key={amount} variant="outline" size="sm" onClick={() => setCashReceived(amount.toString())}>{formatPrice(amount)}</Button>
                  ))}
                </div>
                {cashReceivedNum > 0 && (
                  <div className={cn("p-3 rounded-lg", change >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                    <div className="flex justify-between">
                      <span className="text-sm">Tiền thừa</span>
                      <span className={cn("font-bold text-lg", change >= 0 ? "text-green-600" : "text-red-600")}>{change >= 0 ? formatPrice(change) : `Thiếu ${formatPrice(-change)}`}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {payment === "transfer" && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Quét mã QR để thanh toán</label>
                <div className="bg-white p-4 rounded-xl border flex flex-col items-center">
                  <Image src={`https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-compact.png?amount=${finalTotal}&addInfo=POS${Date.now()}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`} alt="QR" width={200} height={200} className="rounded-lg" />
                  <p className="text-sm text-slate-500 mt-3">Ngân hàng: {BANK_CODE}</p>
                  <p className="font-mono font-semibold">{ACCOUNT_NO}</p>
                  <p className="text-sm">{ACCOUNT_NAME}</p>
                  <p className="text-primary font-bold text-lg mt-2">{formatPrice(finalTotal)}</p>
                </div>
              </div>
            )}

            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Số lượng</span><span className="font-medium">{totalQty} sản phẩm</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Tạm tính</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
              {appliedPromo && (
                <div className="flex justify-between text-sm text-green-600"><span>Giảm giá ({appliedPromo.code})</span><span className="font-medium">-{formatPrice(appliedPromo.discount)}</span></div>
              )}
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex justify-between"><span className="font-medium">Tổng thanh toán</span><span className="text-xl font-bold text-primary">{formatPrice(finalTotal)}</span></div>
            </div>
          </div>

          <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-background">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="flex-1 h-12">Hủy</Button>
            <Button onClick={checkout} disabled={processing || (payment === "cash" && cashReceivedNum < finalTotal)} className="flex-1 h-12 font-semibold">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}Xác nhận
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-sm p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Hóa đơn</DialogTitle>
          </DialogHeader>

          <div ref={receiptRef} className="p-4 bg-white text-black">
            <div className="center">
              <p className="bold text-lg">NHH-COFFEE</p>
              <p className="text-xs">Cửa hàng cà phê & trà</p>
              <p className="text-xs">Hotline: 0762393111</p>
              <div className="line" />
            </div>
            
            <div className="text-xs">
              <p>Mã đơn: #{completedOrder?.id?.slice(0, 8)}</p>
              <p>Ngày: {completedOrder?.createdAt?.toLocaleString("vi-VN")}</p>
              <p>Khách: {completedOrder?.customerName}</p>
              <div className="line" />
            </div>

            <div className="text-xs space-y-1">
              {completedOrder?.items.map((item, i) => (
                <div key={i}>
                  <p>{item.product.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity} x {formatPrice(Number(item.product.price))}</span>
                    <span>{formatPrice(Number(item.product.price) * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="line" />
            <div className="text-sm">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tạm tính</span><span>{formatPrice(completedOrder?.subtotal || 0)}</span></div>
              {completedOrder?.promo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}><span>Giảm giá ({completedOrder.promo.code})</span><span>-{formatPrice(completedOrder.promo.discount)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>TỔNG CỘNG</span><span>{formatPrice(completedOrder?.total || 0)}</span></div>
              {completedOrder?.paymentMethod === "cash" && completedOrder.cashReceived && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tiền khách đưa</span><span>{formatPrice(completedOrder.cashReceived)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tiền thừa</span><span>{formatPrice(completedOrder.change || 0)}</span></div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Thanh toán</span><span>{completedOrder?.paymentMethod === "cash" ? "Tiền mặt" : completedOrder?.paymentMethod === "card" ? "Thẻ" : "Chuyển khoản"}</span></div>
            </div>

            <div className="line" />
            <div className="center text-xs">
              <p>Cảm ơn quý khách!</p>
              <p>Hẹn gặp lại</p>
            </div>
          </div>

          <div className="p-4 border-t flex gap-3">
            <Button variant="outline" onClick={() => setReceiptOpen(false)} className="flex-1">Đóng</Button>
            <Button onClick={printReceipt} className="flex-1"><Printer className="h-4 w-4 mr-2" />In hóa đơn</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
