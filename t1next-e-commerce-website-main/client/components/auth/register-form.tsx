"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Gift, CreditCard, Headphones } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { Logo } from "@/components/ui/logo"
import { PasswordStrength } from "@/components/auth/password-strength"
import { useState } from "react"

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { register: registerUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  })

  const acceptTerms = watch("acceptTerms")
  const password = watch("password")

  const onSubmit = async (data: RegisterInput) => {
    // Clear previous server error
    setServerError(null)
    
    try {
      const result = await registerUser(data.email, data.password, data.name)
      
      if (result.success) {
        toast({
          title: "Mã xác thực đã được gửi",
          description: "Vui lòng kiểm tra email để lấy mã OTP",
        })
        // Redirect to OTP verification page
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`)
      } else {
        // Handle server-side validation errors (Requirements: 7.2)
        if (result.validationErrors && result.validationErrors.length > 0) {
          // Map server validation errors to form fields
          result.validationErrors.forEach((err) => {
            const fieldName = err.path[0] as keyof RegisterInput
            if (fieldName && ['email', 'password', 'name'].includes(fieldName)) {
              setError(fieldName, { type: 'server', message: err.message })
            }
          })
          // Clear password fields on validation error (Requirements: 7.5)
          setValue("password", "")
          setValue("confirmPassword", "")
        } else if (result.retryAfter) {
          // Handle rate limit error
          setServerError(`Quá nhiều yêu cầu, vui lòng thử lại sau ${result.retryAfter} giây`)
        } else {
          // Handle general error (e.g., "Email đã được sử dụng")
          setServerError(result.error || "Đăng ký thất bại")
          // Clear password fields on error (Requirements: 7.5)
          setValue("password", "")
          setValue("confirmPassword", "")
        }
        
        toast({
          title: "Đăng ký thất bại",
          description: result.error || "Vui lòng kiểm tra lại thông tin",
          variant: "destructive",
        })
      }
    } catch {
      setServerError("Đã có lỗi xảy ra, vui lòng thử lại")
      // Clear password fields on error (Requirements: 7.5)
      setValue("password", "")
      setValue("confirmPassword", "")
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra, vui lòng thử lại",
        variant: "destructive",
      })
    }
  }


  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <Logo variant="white" />

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Tham gia cùng chúng tôi!</h1>
            <p className="mt-2 text-primary-foreground/80">
              Tạo tài khoản để nhận nhiều ưu đãi hấp dẫn và theo dõi đơn hàng dễ dàng.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Ưu đãi thành viên</p>
                <p className="text-sm text-primary-foreground/70">Giảm giá độc quyền cho thành viên mới</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Tích điểm đổi quà</p>
                <p className="text-sm text-primary-foreground/70">Đặt hàng tích điểm, đổi voucher giảm giá</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Hỗ trợ 24/7</p>
                <p className="text-sm text-primary-foreground/70">Đội ngũ CSKH luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">© 2024 NHH-Coffee. All rights reserved.</p>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Logo variant="default" />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Tạo tài khoản</h2>
            <p className="mt-2 text-muted-foreground">
              Nhập thông tin để tạo tài khoản mới
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                {...register("name")}
                disabled={isSubmitting}
                className={`h-11 ${errors.name ? "border-destructive" : ""}`}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                disabled={isSubmitting}
                className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isSubmitting}
                    className={`h-11 pr-10 ${errors.password ? "border-destructive" : ""}`}
                    aria-invalid={errors.password ? "true" : "false"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                <PasswordStrength password={password || ""} className="mt-2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  disabled={isSubmitting}
                  className={`h-11 ${errors.confirmPassword ? "border-destructive" : ""}`}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms === true}
                onCheckedChange={(checked) => setValue("acceptTerms", checked === true ? true : false as unknown as true, { shouldValidate: true })}
                className="mt-0.5"
                disabled={isSubmitting}
              />
              <div className="space-y-1">
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                  Tôi đồng ý với{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </Link>
                </Label>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                )}
              </div>
            </div>

            {/* Server error display (Requirements: 7.2) */}
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng ký
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
