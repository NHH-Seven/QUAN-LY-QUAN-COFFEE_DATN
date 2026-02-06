"use client"

/**
 * Admin Guard Hook
 * Kiểm tra quyền admin và redirect nếu không có quyền
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function useAdminGuard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, isLoading, router])

  return { isAdmin, isLoading, user }
}
