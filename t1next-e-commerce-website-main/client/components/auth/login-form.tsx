"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Coffee, Shield, Truck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/ui/logo"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitSeconds <= 0) return
    
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [rateLimitSeconds])

  const isRateLimited = rateLimitSeconds > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isRateLimited) return
    
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
        })
        router.push("/")
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: "Email hoặc mật khẩu không đúng",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra"
      
      // Check if rate limited
      if (errorMessage.includes("Quá nhiều lần đăng nhập") || errorMessage.includes("rate limit")) {
        setRateLimitSeconds(60) // 1 minute cooldown
        toast({
          title: "Quá nhiều lần thử",
          description: "Vui lòng đợi 1 phút trước khi thử lại",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <Logo variant="white" />

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Chào mừng trở lại!</h1>
            <p className="mt-2 text-primary-foreground/80">
              Đăng nhập để đặt hàng và theo dõi đơn hàng của bạn.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Chất lượng đảm bảo</p>
                <p className="text-sm text-primary-foreground/70">Nguyên liệu tươi ngon, pha chế chuẩn vị</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Giao hàng nhanh</p>
                <p className="text-sm text-primary-foreground/70">Miễn phí giao hàng đơn từ 100K</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Thanh toán an toàn</p>
                <p className="text-sm text-primary-foreground/70">Bảo mật thông tin tuyệt đối</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">© 2024 NHH-Coffee. All rights reserved.</p>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Logo variant="default" />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="mt-2 text-muted-foreground">
              Nhập thông tin tài khoản của bạn để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 pr-10"
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
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Ghi nhớ đăng nhập
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading || isRateLimited}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRateLimited && <Clock className="mr-2 h-4 w-4" />}
              {isRateLimited 
                ? `Thử lại sau ${rateLimitSeconds}s` 
                : "Đăng nhập"
              }
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
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
