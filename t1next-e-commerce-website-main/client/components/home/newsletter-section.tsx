"use client"

import { useState } from "react"
import { Mail, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStatus("success")
    setEmail("")
    
    // Reset after 3s
    setTimeout(() => setStatus("idle"), 3000)
  }

  return (
    <section className="py-12 md:py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          
          <h2 className="mt-4 text-xl sm:text-2xl font-bold md:text-3xl">
            Đăng ký nhận tin khuyến mãi
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Nhận ngay voucher giảm 100K cho đơn hàng đầu tiên và cập nhật các ưu đãi mới nhất
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading" || status === "success"}
                className="h-11 pr-4"
              />
            </div>
            <Button 
              type="submit" 
              disabled={status === "loading" || status === "success" || !email}
              className="h-11 px-6"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Đang gửi...
                </span>
              ) : status === "success" ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Đã đăng ký
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Đăng ký
                </span>
              )}
            </Button>
          </form>

          <p className="mt-3 text-xs text-muted-foreground">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <a href="/terms" className="text-primary hover:underline">Điều khoản dịch vụ</a>
            {" "}và{" "}
            <a href="/privacy" className="text-primary hover:underline">Chính sách bảo mật</a>
          </p>
        </div>
      </div>
    </section>
  )
}
