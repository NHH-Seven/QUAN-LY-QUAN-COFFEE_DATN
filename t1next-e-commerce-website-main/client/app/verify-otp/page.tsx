"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function VerifyOTPPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const email = searchParams.get("email") || ""
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError("")

    // Auto focus next input
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

  const handleVerify = async () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Vui lòng nhập đủ 6 số")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await api.verifyOTP(email, otpString)
      if (response.success) {
        toast({
          title: "Đăng ký thành công!",
          description: "Chào mừng bạn đến với NHH-Coffee",
        })
        router.push("/")
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Đã có lỗi xảy ra, vui lòng thử lại")
      }
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError("")

    try {
      await api.resendOTP(email)
      toast({
        title: "Đã gửi lại mã OTP",
        description: "Vui lòng kiểm tra email của bạn",
      })
      setCountdown(60)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Không thể gửi lại mã, vui lòng thử lại")
      }
    } finally {
      setIsResending(false)
    }
  }

  // Auto submit when all digits entered
  useEffect(() => {
    if (otp.every(digit => digit !== "") && !isLoading) {
      handleVerify()
    }
  }, [otp])

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Không tìm thấy thông tin đăng ký</p>
            <Button asChild>
              <Link href="/register">Quay lại đăng ký</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Xác thực email</CardTitle>
          <CardDescription className="text-base">
            Nhập mã 6 số đã gửi đến
          </CardDescription>
          <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{email}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold"
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button 
            onClick={handleVerify} 
            className="w-full" 
            disabled={isLoading || otp.some(d => !d)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác thực
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Không nhận được mã?
            </p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className="text-blue-600"
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

          <Button variant="ghost" asChild className="w-full">
            <Link href="/register">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại đăng ký
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
