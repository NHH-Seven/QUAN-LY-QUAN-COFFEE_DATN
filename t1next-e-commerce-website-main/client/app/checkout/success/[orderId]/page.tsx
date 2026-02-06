"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Package, MapPin, CreditCard, Clock, Home, ShoppingBag, QrCode, Copy, Check, Loader2, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { OrderTimeline } from "@/components/order/order-timeline"
import { useAuth } from "@/contexts/auth-context"
import { api, ApiError, PaymentQRData } from "@/lib/api"
import { formatPrice } from "@/lib/utils"

interface OrderItemDetail {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images: string[]
    slug: string
  } | null
}

interface OrderDetail {
  id: string
  status: string
  total: number
  shippingAddress: string
  paymentMethod: string
  recipientName: string
  phone: string
  note: string | null
  createdAt: string
  items: OrderItemDetail[]
}

export default function OrderSuccessPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payment QR state
  const [qrData, setQrData] = useState<PaymentQRData | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!isAuthenticated || !orderId) return
    
    try {
      const response = await api.getOrder(orderId)
      
      if (response.success && response.data) {
        const orderData = response.data as unknown as OrderDetail
        setOrder(orderData)
        
        // If bank transfer, fetch QR code
        if (orderData.paymentMethod === 'bank_transfer' && !qrData) {
          try {
            const qrResponse = await api.getPaymentQR(orderId)
            if (qrResponse.success && qrResponse.data) {
              setQrData(qrResponse.data)
            }
          } catch (qrErr) {
            console.error('Failed to fetch QR:', qrErr)
          }
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Không thể tải thông tin đơn hàng")
      }
    }
  }, [isAuthenticated, orderId, qrData])

  // Initial fetch
  useEffect(() => {
    async function initialFetch() {
      setIsLoading(true)
      await fetchOrder()
      setIsLoading(false)
    }
    initialFetch()
  }, [fetchOrder])

  // Poll order status every 10 seconds to get updates from staff
  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return
    
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [order?.status, fetchOrder])

  // Poll payment status for bank transfer
  useEffect(() => {
    if (!order || order.paymentMethod !== 'bank_transfer' || isPaid) return
    
    const checkStatus = async () => {
      try {
        const response = await api.getPaymentStatus(orderId)
        if (response.success && response.data?.isPaid) {
          setIsPaid(true)
          // Update order status locally
          setOrder(prev => prev ? { ...prev, status: 'confirmed' } : null)
        }
      } catch (err) {
        console.error('Failed to check payment status:', err)
      }
    }

    // Check immediately
    checkStatus()
    
    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000)
    
    return () => clearInterval(interval)
  }, [order, orderId, isPaid])

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  // Cancel order
  const handleCancelOrder = async () => {
    if (!order || !confirm("Bạn có chắc muốn hủy đơn hàng này?")) return
    
    try {
      setIsCancelling(true)
      const response = await api.cancelOrder(order.id)
      if (response.success) {
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message)
      }
    } finally {
      setIsCancelling(false)
    }
  }

  // Calculate estimated delivery (3-5 business days from order date)
  const getEstimatedDelivery = (createdAt: string): string => {
    const orderDate = new Date(createdAt)
    const minDelivery = new Date(orderDate)
    const maxDelivery = new Date(orderDate)
    
    minDelivery.setDate(minDelivery.getDate() + 3)
    maxDelivery.setDate(maxDelivery.getDate() + 5)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    }
    
    return `${formatDate(minDelivery)} - ${formatDate(maxDelivery)}`
  }

  // Get payment method display text
  const getPaymentMethodText = (method: string): string => {
    switch (method) {
      case "cod":
        return "Thanh toán khi nhận hàng (COD)"
      case "bank_transfer":
        return "Chuyển khoản ngân hàng"
      default:
        return method
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <OrderSuccessSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-destructive text-lg">{error}</p>
              <Button className="mt-4" onClick={() => router.push("/")}>
                Về trang chủ
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              order.status === 'cancelled'
                ? 'bg-red-100 dark:bg-red-900/30'
                : order.paymentMethod === 'bank_transfer' && !isPaid
                ? 'bg-purple-100 dark:bg-purple-900/30'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              {order.status === 'cancelled' ? (
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              ) : order.paymentMethod === 'bank_transfer' && !isPaid ? (
                <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              )}
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${
              order.status === 'cancelled'
                ? 'text-red-600 dark:text-red-400'
                : order.paymentMethod === 'bank_transfer' && !isPaid
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {order.status === 'cancelled'
                ? 'Đơn hàng đã hủy'
                : order.paymentMethod === 'bank_transfer' && !isPaid
                ? 'Chờ thanh toán'
                : 'Đặt hàng thành công!'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {order.status === 'cancelled'
                ? "Đơn hàng này đã được hủy. Số lượng sản phẩm đã được hoàn lại kho."
                : order.paymentMethod === 'bank_transfer' && !isPaid
                ? "Vui lòng chuyển khoản để hoàn tất đơn hàng."
                : "Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất."}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            {/* Left column - Order details */}
            <div className="space-y-6">
              {/* Bank Transfer QR Code */}
              {order.paymentMethod === 'bank_transfer' && qrData && (
                <Card className={isPaid ? "border-green-500" : "border-primary"}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {isPaid ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-600">Đã thanh toán</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="h-5 w-5 text-primary" />
                          Quét mã QR để thanh toán
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPaid ? (
                      <div className="text-center py-4">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-3" />
                        <p className="text-green-600 font-medium">Thanh toán thành công!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Đơn hàng của bạn đang được xử lý.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* QR Code Image */}
                        <div className="flex justify-center">
                          <div className="relative bg-white p-3 rounded-lg">
                            <Image
                              src={qrData.qrUrl}
                              alt="VietQR Payment"
                              width={200}
                              height={200}
                              className="rounded"
                            />
                          </div>
                        </div>
                        
                        {/* Bank info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Ngân hàng</span>
                            <span className="font-medium">{qrData.bankCode}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Số tài khoản</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">{qrData.bankAccount}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(qrData.bankAccount, 'account')}
                              >
                                {copied === 'account' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Chủ tài khoản</span>
                            <span className="font-medium">{qrData.accountName}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Số tiền</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-primary">{formatPrice(qrData.amount)}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(String(qrData.amount), 'amount')}
                              >
                                {copied === 'amount' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Nội dung CK</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">{qrData.content}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(qrData.content, 'content')}
                              >
                                {copied === 'content' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Waiting indicator */}
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Đang chờ thanh toán...</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Order ID card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Thông tin đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã đơn hàng</span>
                    <span className="font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày đặt</span>
                    <span>{new Date(order.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : isPaid || order.status === 'confirmed' || order.status === 'shipping' || order.status === 'delivered'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : order.status === 'awaiting_payment'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {order.status === 'cancelled'
                        ? 'Đã hủy'
                        : isPaid || order.status === 'confirmed' || order.status === 'shipping' || order.status === 'delivered' 
                        ? 'Đã thanh toán' 
                        : order.status === 'awaiting_payment'
                        ? 'Chờ thanh toán'
                        : 'Chờ xác nhận'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Địa chỉ giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{order.recipientName}</p>
                  <p className="text-muted-foreground">{order.phone}</p>
                  <p className="text-muted-foreground">{order.shippingAddress}</p>
                  {order.note && (
                    <p className="text-sm text-muted-foreground italic">
                      Ghi chú: {order.note}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment method */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Phương thức thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{getPaymentMethodText(order.paymentMethod)}</p>
                </CardContent>
              </Card>

              {/* Estimated delivery */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Thời gian giao hàng dự kiến
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-primary">
                    {getEstimatedDelivery(order.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thời gian giao hàng có thể thay đổi tùy thuộc vào địa chỉ và tình trạng hàng hóa.
                  </p>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Tiến trình đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline 
                    status={isPaid && order.status === 'awaiting_payment' ? 'confirmed' : order.status}
                    paymentMethod={order.paymentMethod}
                    createdAt={order.createdAt}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right column - Order items */}
            <div className="lg:sticky lg:top-24 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sản phẩm đã đặt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order items */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          {item.product ? (
                            <Image
                              src={item.product.images[0] || "/placeholder.svg"}
                              alt={item.product.name}
                              fill
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">
                            {item.product?.name || "Sản phẩm không còn tồn tại"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SL: {item.quantity} x {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between font-semibold">
                    <span>Tổng cộng</span>
                    <span className="text-lg text-primary">{formatPrice(order.total)}</span>
                  </div>

                  <Separator />

                  {/* Action buttons */}
                  <div className="space-y-2">
                    {order.status === 'pending' && (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleCancelOrder}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Hủy đơn hàng
                      </Button>
                    )}
                    <Button className="w-full" asChild>
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Xem menu
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/profile">
                        <Package className="mr-2 h-4 w-4" />
                        Xem đơn hàng của tôi
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Loading skeleton
function OrderSuccessSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
