"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, ArrowLeft, Loader2, Tag, X, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { api, type CheckoutInfo, type CreateCheckoutOrderData, type ShippingCalculation, ApiError } from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import { CheckoutForm } from "./checkout-form"
import { PaymentMethodSelector } from "./payment-method-selector"
import { useDebounce } from "@/hooks/use-debounce"

/**
 * Generate a unique idempotency key for duplicate order prevention
 * Uses crypto.randomUUID() for UUID v4 generation
 * 
 * Requirements: 6.4
 */
function generateIdempotencyKey(): string {
  return crypto.randomUUID()
}

export function CheckoutContent() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { clearCart, items: cartItems, appliedPromotion: cartPromotion, setAppliedPromotion: setCartPromotion } = useCart()
  const { toast } = useToast()
  
  const [checkoutData, setCheckoutData] = useState<CheckoutInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Promotion code state
  const [promoCode, setPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<{
    id: string
    code: string
    name: string
    discount: number
  } | null>(cartPromotion)
  
  // Form state
  const [formData, setFormData] = useState<CreateCheckoutOrderData>({
    recipientName: "",
    phone: "",
    address: "",
    note: "",
    paymentMethod: "cod"
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Shipping state (must be after formData)
  const [shippingInfo, setShippingInfo] = useState<ShippingCalculation | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const debouncedAddress = useDebounce(formData.address, 500)
  
  // Idempotency key for duplicate order prevention (Requirement 6.4)
  // Generated once per checkout session and regenerated after successful order
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey())

  // Redirect if not authenticated (Requirement 1.4, 7.1)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thanh toán",
        variant: "destructive"
      })
      router.push("/login?redirect=/checkout")
    }
  }, [authLoading, isAuthenticated, router, toast])

  // Redirect if cart is empty (Requirement 1.3)
  useEffect(() => {
    if (!authLoading && isAuthenticated && cartItems.length === 0 && !checkoutData) {
      toast({
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán"
      })
      router.push("/cart")
    }
  }, [authLoading, isAuthenticated, cartItems.length, checkoutData, router, toast])

  // Fetch checkout data
  useEffect(() => {
    async function fetchCheckout() {
      if (!isAuthenticated) return
      
      try {
        setIsLoading(true)
        setError(null)
        const response = await api.getCheckout()
        
        if (response.success && response.data) {
          setCheckoutData(response.data)
          
          // Set initial shipping info from server
          if (response.data.shippingInfo) {
            setShippingInfo({
              fee: response.data.shippingFee,
              ...response.data.shippingInfo
            })
          }
          
          // Pre-fill form from user profile (Requirement 2.2)
          if (response.data.user) {
            setFormData(prev => ({
              ...prev,
              recipientName: response.data!.user?.name || prev.recipientName,
              phone: response.data!.user?.phone || prev.phone,
              address: response.data!.user?.address || prev.address
            }))
          }
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 400 && err.message === "Giỏ hàng trống") {
            router.push("/cart")
            return
          }
          setError(err.message)
        } else {
          setError("Đã có lỗi xảy ra")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchCheckout()
  }, [isAuthenticated, router])

  // Calculate shipping when address changes
  useEffect(() => {
    async function calculateShipping() {
      if (!debouncedAddress || !checkoutData) return
      
      setShippingLoading(true)
      try {
        const response = await api.calculateShipping(debouncedAddress, checkoutData.subtotal)
        if (response.success && response.data) {
          setShippingInfo(response.data)
        }
      } catch (err) {
        console.error('Failed to calculate shipping:', err)
      } finally {
        setShippingLoading(false)
      }
    }

    calculateShipping()
  }, [debouncedAddress, checkoutData?.subtotal])

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Validate recipientName (Requirement 2.1)
    if (!formData.recipientName.trim()) {
      errors.recipientName = "Tên người nhận không được để trống"
    } else if (formData.recipientName.length < 2) {
      errors.recipientName = "Tên người nhận phải có ít nhất 2 ký tự"
    } else if (formData.recipientName.length > 100) {
      errors.recipientName = "Tên người nhận không được quá 100 ký tự"
    }
    
    // Validate phone (Requirement 2.3)
    if (!formData.phone.trim()) {
      errors.phone = "Số điện thoại không được để trống"
    } else if (!/^0[0-9]{9,10}$/.test(formData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)"
    }
    
    // Validate address (Requirement 2.4)
    if (!formData.address.trim()) {
      errors.address = "Địa chỉ không được để trống"
    }
    
    // Validate paymentMethod (Requirement 3.4)
    if (!formData.paymentMethod) {
      errors.paymentMethod = "Vui lòng chọn phương thức thanh toán"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form field change
  const handleFieldChange = (field: keyof CreateCheckoutOrderData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle apply promotion code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Vui lòng nhập mã giảm giá")
      return
    }
    
    setPromoLoading(true)
    setPromoError(null)
    
    try {
      const response = await api.validatePromotion(promoCode.trim(), checkoutData?.subtotal || 0)
      if (response.success && response.data) {
        const promo = {
          id: response.data.id,
          code: response.data.code,
          name: response.data.name,
          discount: response.data.discount
        }
        setAppliedPromo(promo)
        setCartPromotion(promo)
        setPromoCode("")
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setPromoError(err.message)
      } else {
        setPromoError("Không thể áp dụng mã giảm giá")
      }
    } finally {
      setPromoLoading(false)
    }
  }

  // Handle remove promotion
  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setCartPromotion(null)
    setPromoError(null)
  }

  // Calculate final total with discount and dynamic shipping
  const currentShippingFee = shippingInfo?.fee ?? checkoutData?.shippingFee ?? 0
  const finalTotal = checkoutData 
    ? checkoutData.subtotal + currentShippingFee - (appliedPromo?.discount || 0)
    : 0

  // Handle place order (Requirement 4.1, 6.4)
  const handlePlaceOrder = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      // Include idempotency key for duplicate prevention (Requirement 6.4)
      const orderData: CreateCheckoutOrderData = {
        ...formData,
        idempotencyKey: idempotencyKeyRef.current,
        ...(appliedPromo && {
          promotionId: appliedPromo.id,
          discountAmount: appliedPromo.discount
        })
      }
      
      const response = await api.createCheckoutOrder(orderData)
      
      if (response.success && response.data) {
        // Clear local cart
        clearCart()
        
        // Generate new idempotency key for next order
        idempotencyKeyRef.current = generateIdempotencyKey()
        
        toast({
          title: "Đặt hàng thành công!",
          description: `Mã đơn hàng: ${response.data.orderId}`
        })
        
        // Redirect to success page (Requirement 5.1)
        router.push(`/checkout/success/${response.data.orderId}`)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast({
          title: "Đặt hàng thất bại",
          description: err.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Lỗi",
          description: "Đã có lỗi xảy ra, vui lòng thử lại",
          variant: "destructive"
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (authLoading || isLoading) {
    return <CheckoutSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/cart")}>
          Quay lại giỏ hàng
        </Button>
      </div>
    )
  }

  // No checkout data
  if (!checkoutData) {
    return null
  }

  return (
    <div className="mt-4 sm:mt-8 space-y-4 sm:space-y-6">
      {/* Back to cart - separate row */}
      <Button variant="ghost" size="sm" asChild className="pl-0">
        <Link href="/cart">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại giỏ hàng
        </Link>
      </Button>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[7fr_3fr] items-stretch">
        {/* Left column - Form */}
        <div className="h-full">
        {/* Shipping info form */}
        <CheckoutForm
          formData={formData}
          formErrors={formErrors}
          onFieldChange={handleFieldChange}
          disabled={isSubmitting}
        />
      </div>

      {/* Right column - Order summary */}
      <div className="h-full">
        <Card className="h-full flex flex-col">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-xl font-semibold">Đơn hàng của bạn</h2>
          </div>
          <CardContent className="space-y-4 p-6 pt-0">
            {/* Cart items (Requirement 1.1) */}
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {checkoutData.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={item.product.images[0] || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">SL: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Promotion code input */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Mã giảm giá</p>
              {appliedPromo ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">{appliedPromo.code}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">-{formatPrice(appliedPromo.discount)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePromo}
                    disabled={isSubmitting}
                    className="h-8 w-8 p-0 text-green-600 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã giảm giá"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase())
                      setPromoError(null)
                    }}
                    disabled={isSubmitting || promoLoading}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyPromo}
                    disabled={isSubmitting || promoLoading || !promoCode.trim()}
                  >
                    {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
                  </Button>
                </div>
              )}
              {promoError && (
                <p className="text-xs text-destructive">{promoError}</p>
              )}
            </div>

            <Separator />

            {/* Summary (Requirement 1.2) */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(checkoutData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Phí vận chuyển
                  {shippingLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                </span>
                <span>
                  {shippingInfo?.isFreeShipping ? (
                    <span className="text-green-600">Miễn phí</span>
                  ) : (
                    formatPrice(currentShippingFee)
                  )}
                </span>
              </div>
              {shippingInfo && !shippingInfo.isFreeShipping && shippingInfo.freeShippingThreshold > 0 && (
                <p className="text-xs text-muted-foreground">
                  Miễn phí ship cho đơn từ {formatPrice(shippingInfo.freeShippingThreshold)}
                </p>
              )}
              {appliedPromo && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá ({appliedPromo.code})</span>
                  <span>-{formatPrice(appliedPromo.discount)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Tổng cộng</span>
              <span className="text-lg text-primary">{formatPrice(finalTotal)}</span>
            </div>

            <Separator />

            {/* Payment method - inline */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Phương thức thanh toán</p>
              <div className="space-y-2">
                <label 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => handleFieldChange("paymentMethod", "cod")}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={formData.paymentMethod === "cod"}
                    onChange={() => handleFieldChange("paymentMethod", "cod")}
                    disabled={isSubmitting}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => handleFieldChange("paymentMethod", "bank_transfer")}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={formData.paymentMethod === "bank_transfer"}
                    onChange={() => handleFieldChange("paymentMethod", "bank_transfer")}
                    disabled={isSubmitting}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Chuyển khoản ngân hàng</span>
                </label>
              </div>
              {formErrors.paymentMethod && (
                <p className="text-xs text-destructive">{formErrors.paymentMethod}</p>
              )}
            </div>

            {/* Place order button */}
            <Button 
              className="w-full h-11" 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đặt hàng"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}


// Loading skeleton
function CheckoutSkeleton() {
  return (
    <div className="mt-4 sm:mt-8 grid gap-4 sm:gap-8 lg:grid-cols-[7fr_3fr] items-start">
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
