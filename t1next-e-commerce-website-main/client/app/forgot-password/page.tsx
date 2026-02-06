"use client"

/**
 * Forgot Password Page
 * Giao diện quên mật khẩu với OTP verification
 * Tương tự trang verify-otp
 */

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, KeyRound, Loader2, CheckCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

type Step = "email" | "otp" | "success"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState("")
  const { toast } = useToast()
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ title: "Vui lòng nhập email", variant: "destructive" })
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Đã gửi mã xác thực đến email của bạn" })
        setStep("otp")
        setCountdown(60)
        // Focus first OTP input
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        setError(data.error || "Có lỗi xảy ra")
      }
    } catch {
      setError("Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError("")

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Đã gửi lại mã OTP", description: "Vui lòng kiểm tra email" })
        setCountdown(60)
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      } else {
        setError(data.error || "Không thể gửi lại mã")
      }
    } catch {
      setError("Lỗi kết nối")
    } finally {
      setIsResending(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = otp.join("")
    
    if (otpString.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP")
      return
    }
    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới")
      return
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString, newPassword })
      })
      const data = await res.json()
      if (data.success) {
        setStep("success")
      } else {
        setError(data.error || "Có lỗi xảy ra")
        if (data.error?.includes("OTP")) {
          setOtp(["", "", "", "", "", ""])
          inputRefs.current[0]?.focus()
        }
      }
    } catch {
      setError("Lỗi kết nối server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {step === "success" ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Đặt lại mật khẩu thành công!</CardTitle>
              <CardDescription className="text-base">
                Bạn có thể đăng nhập với mật khẩu mới
              </CardDescription>
            </>
          ) : step === "email" ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
              <CardDescription className="text-base">
                Nhập email để nhận mã xác thực
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
              <CardDescription className="text-base">
                Nhập mã 6 số đã gửi đến
              </CardDescription>
              <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{email}</p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  disabled={loading}
                  className="h-12"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi mã xác thực
              </Button>

              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại đăng nhập
                </Link>
              </Button>
            </form>
          )}

          {/* Step 2: OTP + New Password */}
          {step === "otp" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* OTP Input */}
              <div className="space-y-2">
                <Label className="text-center block">Mã xác thực</Label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Không nhận được mã?
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendOTP}
                  disabled={isResending || countdown > 0}
                  className="text-blue-600 p-0 h-auto"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : countdown > 0 ? (
                    `Gửi lại sau ${countdown}s`
                  ) : (
                    "Gửi lại mã"
                  )}
                </Button>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError("") }}
                  disabled={loading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
                  disabled={loading}
                  className="h-12"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={loading || otp.some(d => !d)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Đặt lại mật khẩu
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="w-full" 
                onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError("") }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Đổi email khác
              </Button>
            </form>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="space-y-4">
              <Button className="w-full h-12" asChild>
                <Link href="/login">Đăng nhập ngay</Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
