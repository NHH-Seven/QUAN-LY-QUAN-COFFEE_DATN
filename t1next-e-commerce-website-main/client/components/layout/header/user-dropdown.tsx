/**
 * UserDropdown Component
 * Dropdown menu cho user đã đăng nhập
 */

import Link from "next/link"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserDropdownProps } from "./types"

export function UserDropdown({ user, logout }: UserDropdownProps) {
  // Check if user is staff (admin, sales, warehouse)
  const isStaff = user?.role && ['admin', 'sales', 'warehouse'].includes(user.role)
  
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin": return "Quản trị viên"
      case "sales": return "Nhân viên Bán hàng"
      case "warehouse": return "Nhân viên Kho"
      default: return "Khách hàng"
    }
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* User info */}
        <div className="flex items-center gap-2 p-2">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{getRoleLabel(user?.role)}</span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Menu items - khác nhau cho staff và user */}
        {isStaff ? (
          <>
            {/* Staff menu */}
            <DropdownMenuItem asChild>
              <Link href="/staff/dashboard" className="font-medium text-primary">
                Vào trang quản lý
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/staff/profile">Tài khoản của tôi</Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {/* User menu */}
            <DropdownMenuItem asChild>
              <Link href="/profile">Tài khoản của tôi</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile?tab=orders">Đơn hàng</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/wishlist">Yêu thích</Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem onClick={logout} className="text-destructive">
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
