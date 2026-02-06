"use client"

/**
 * Admin Layout
 * Layout chung cho tất cả trang admin với sidebar và header
 * Phân quyền theo role: admin, sales, warehouse
 */

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useStaffGuard } from "@/hooks/use-staff-guard"
import { PAGE_PERMISSIONS, type StaffRole } from "@/hooks/use-role-guard"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { cn } from "@/lib/utils"
import { Shield } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isStaff, isLoading, user } = useStaffGuard()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)

  // Restore sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed")
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  // Check page-level permissions
  useEffect(() => {
    if (isLoading || !user) return

    // Extract page name from pathname: /staff/products -> products
    const pathParts = pathname.split("/").filter(Boolean)
    const pageName = pathParts[1] || "dashboard" // Default to dashboard

    const allowedRoles = PAGE_PERMISSIONS[pageName]
    
    if (allowedRoles) {
      const userRole = user.role as StaffRole
      const canAccess = allowedRoles.includes(userRole)
      setHasAccess(canAccess)
      
      if (!canAccess) {
        // Redirect to dashboard after a short delay to show message
        setTimeout(() => {
          router.push("/staff/dashboard")
        }, 2000)
      }
    } else {
      // Page not in permissions list - allow all staff
      setHasAccess(true)
    }
  }, [pathname, user, isLoading, router])

  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(newState))
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  // Don't render if not staff (redirect happens in hook)
  if (!isStaff) {
    return null
  }

  return (
    <div className="h-screen overflow-hidden bg-muted/40">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <AdminHeader sidebarCollapsed={sidebarCollapsed} />
      <main
        className={cn(
          "pt-14 h-screen overflow-y-auto transition-all duration-300",
          sidebarCollapsed ? "pl-16" : "pl-60"
        )}
      >
        <div className="p-4 md:p-6 pb-20">
          {hasAccess ? (
            children
          ) : (
            <div className="flex h-[50vh] items-center justify-center">
              <div className="text-center">
                <Shield className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Không có quyền truy cập</h3>
                <p className="text-muted-foreground mb-4">
                  Bạn không có quyền truy cập trang này.
                </p>
                <p className="text-sm text-muted-foreground">
                  Đang chuyển hướng về Dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
