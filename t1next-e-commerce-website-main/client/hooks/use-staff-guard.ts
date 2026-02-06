"use client"

/**
 * Staff Guard Hook
 * Kiểm tra quyền staff (admin, sales, warehouse) và redirect nếu không có quyền
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

const STAFF_ROLES = ["admin", "sales", "warehouse"]

export function useStaffGuard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const isStaff = user?.role ? STAFF_ROLES.includes(user.role) : false
  const isAdmin = user?.role === "admin"
  const isSales = user?.role === "sales"
  const isWarehouse = user?.role === "warehouse"

  useEffect(() => {
    if (!isLoading && (!user || !isStaff)) {
      router.push("/")
    }
  }, [user, isLoading, router, isStaff])

  return { isStaff, isAdmin, isSales, isWarehouse, isLoading, user }
}
