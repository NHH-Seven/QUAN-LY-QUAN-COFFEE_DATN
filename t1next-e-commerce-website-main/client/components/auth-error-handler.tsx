"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

/**
 * Component xử lý lỗi authentication
 * Lắng nghe event auth:logout và hiển thị thông báo
 */
export function AuthErrorHandler() {
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const handleAuthLogout = () => {
      toast({
        title: "Phiên đăng nhập đã hết hạn",
        description: "Vui lòng đăng nhập lại để tiếp tục",
        variant: "destructive",
      })
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    }

    window.addEventListener("auth:logout", handleAuthLogout)

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout)
    }
  }, [toast, router])

  return null
}
