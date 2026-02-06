"use client"

/**
 * Role Guard Hook
 * Kiểm tra quyền truy cập page dựa trên role
 * Redirect về dashboard nếu không có quyền
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export type StaffRole = "admin" | "sales" | "warehouse"

interface UseRoleGuardOptions {
  /** Các role được phép truy cập */
  allowedRoles: StaffRole[]
  /** URL redirect khi không có quyền (default: /staff/dashboard) */
  redirectTo?: string
}

export function useRoleGuard({ allowedRoles, redirectTo = "/staff/dashboard" }: UseRoleGuardOptions) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const userRole = user?.role as StaffRole | undefined
  const hasAccess = userRole ? allowedRoles.includes(userRole) : false

  useEffect(() => {
    // Chờ load xong mới check
    if (isLoading) return

    // Nếu không có user hoặc không phải staff -> redirect home
    if (!user || !["admin", "sales", "warehouse"].includes(user.role || "")) {
      router.push("/")
      return
    }

    // Nếu là staff nhưng không có quyền truy cập page này -> redirect dashboard
    if (!hasAccess) {
      router.push(redirectTo)
    }
  }, [user, isLoading, hasAccess, router, redirectTo])

  return {
    hasAccess,
    isLoading,
    userRole,
    isAdmin: userRole === "admin",
    isSales: userRole === "sales",
    isWarehouse: userRole === "warehouse",
  }
}

/**
 * Định nghĩa quyền truy cập cho từng page
 */
export const PAGE_PERMISSIONS: Record<string, StaffRole[]> = {
  // Tất cả staff
  dashboard: ["admin", "sales", "warehouse"],
  orders: ["admin", "sales", "warehouse"],
  profile: ["admin", "sales", "warehouse"],
  settings: ["admin", "sales", "warehouse"],

  // Admin + Sales
  pos: ["admin", "sales"],
  "pos-history": ["admin", "sales"],
  chat: ["admin", "sales"],
  products: ["admin", "sales"],
  "flash-sale": ["admin", "sales"],
  customers: ["admin", "sales"],
  categories: ["admin", "sales"],
  promotions: ["admin", "sales"],
  reports: ["admin", "sales"],
  returns: ["admin", "sales"],

  // Admin + Warehouse
  stock: ["admin", "warehouse"],
  "stock-alerts": ["admin", "warehouse"],
  history: ["admin", "warehouse"],

  // Chỉ Admin
  "staff-management": ["admin"],
  backup: ["admin"],
  users: ["admin"],
}
