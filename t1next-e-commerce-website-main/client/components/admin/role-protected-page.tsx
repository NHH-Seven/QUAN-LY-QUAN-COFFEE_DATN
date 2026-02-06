"use client"

/**
 * Role Protected Page Component
 * Wrapper component để bảo vệ page theo role
 */

import { useRoleGuard, type StaffRole } from "@/hooks/use-role-guard"

interface RoleProtectedPageProps {
  children: React.ReactNode
  /** Các role được phép truy cập */
  allowedRoles: StaffRole[]
  /** Loading component (optional) */
  loadingComponent?: React.ReactNode
}

export function RoleProtectedPage({
  children,
  allowedRoles,
  loadingComponent,
}: RoleProtectedPageProps) {
  const { hasAccess, isLoading } = useRoleGuard({ allowedRoles })

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      )
    )
  }

  if (!hasAccess) {
    return null // Hook sẽ redirect
  }

  return <>{children}</>
}
