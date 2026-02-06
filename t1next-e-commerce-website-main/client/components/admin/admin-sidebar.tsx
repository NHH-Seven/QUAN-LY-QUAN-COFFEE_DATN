"use client"

/**
 * Admin Sidebar Component
 * Navigation sidebar cho admin dashboard
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Warehouse,
  History,
  Shield,
  Store,
  Tag,
  BarChart3,
  Receipt,
  AlertTriangle,
  MessageCircle,
  Truck,
  Coffee,
  RotateCcw,
  Database,
  Zap,
  UtensilsCrossed,
  CalendarClock,
  ChefHat,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  id: string
  title: string
  href: string
  icon: typeof LayoutDashboard
}

// Menu items theo role
const getNavItems = (role?: string): NavItem[] => {
  const items: NavItem[] = []

  // Dashboard chung cho tất cả staff
  items.push({
    id: "dashboard",
    title: "Dashboard",
    href: "/staff/dashboard",
    icon: LayoutDashboard,
  })

  // Bán hàng - Admin, Sales, Warehouse
  if (role === "admin" || role === "sales" || role === "warehouse") {
    items.push({
      id: "sales",
      title: "Bán hàng",
      href: "/staff/sales",
      icon: Store,
    })
    items.push({
      id: "kitchen",
      title: "Pha chế",
      href: "/staff/kitchen",
      icon: ChefHat,
    })
    items.push({
      id: "shifts",
      title: "Ca làm việc",
      href: "/staff/shifts",
      icon: CalendarClock,
    })
  }

  // Chat - Admin và Sales
  if (role === "admin" || role === "sales") {
    items.push({
      id: "chat",
      title: "Chat hỗ trợ",
      href: "/staff/chat",
      icon: MessageCircle,
    })
  }

  // Sản phẩm - Admin và Sales
  if (role === "admin" || role === "sales") {
    items.push({
      id: "products",
      title: "Sản phẩm",
      href: "/staff/products",
      icon: Package,
    })
    items.push({
      id: "flash-sale",
      title: "Flash Sale",
      href: "/staff/flash-sale",
      icon: Zap,
    })
  }

  // Đơn hàng - tất cả staff
  items.push({
    id: "orders",
    title: "Đơn hàng",
    href: "/staff/orders",
    icon: ShoppingCart,
  })

  // Khách hàng, Danh mục - Admin và Sales
  if (role === "admin" || role === "sales") {
    items.push({
      id: "customers",
      title: "Khách hàng",
      href: "/staff/customers",
      icon: Users,
    })
    items.push({
      id: "categories",
      title: "Danh mục",
      href: "/staff/categories",
      icon: FolderTree,
    })
    items.push({
      id: "promotions",
      title: "Khuyến mãi",
      href: "/staff/promotions",
      icon: Tag,
    })
    items.push({
      id: "reports",
      title: "Báo cáo",
      href: "/staff/reports",
      icon: BarChart3,
    })
  }

  // Quản lý Nhân viên - Chỉ Admin
  if (role === "admin") {
    items.push({
      id: "staff-management",
      title: "Quản lý Nhân viên",
      href: "/staff/staff-management",
      icon: Shield,
    })
    items.push({
      id: "chatbot-knowledge",
      title: "Kiến thức Chatbot",
      href: "/staff/chatbot-knowledge",
      icon: MessageCircle,
    })
    items.push({
      id: "backup",
      title: "Sao lưu dữ liệu",
      href: "/staff/backup",
      icon: Database,
    })
  }

  // Quản lý Kho - Admin và Warehouse
  if (role === "admin" || role === "warehouse") {
    items.push({
      id: "warehouse-stock",
      title: "Quản lý Kho",
      href: "/staff/stock",
      icon: Warehouse,
    })
    items.push({
      id: "stock-alerts",
      title: "Cảnh báo tồn kho",
      href: "/staff/stock-alerts",
      icon: AlertTriangle,
    })
    items.push({
      id: "warehouse-history",
      title: "Lịch sử Kho",
      href: "/staff/history",
      icon: History,
    })
  }

  return items
}

// Lấy home link - chung cho tất cả staff
const getHomeLink = () => "/staff/dashboard"

const bottomNavItems = [
  {
    title: "Cài đặt",
    href: "/staff/settings",
    icon: Settings,
  },
  {
    title: "Trợ giúp",
    href: "/staff/help",
    icon: HelpCircle,
  },
]

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const navItems = getNavItems(user?.role)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link href={getHomeLink()} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Coffee className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-base">
              {user?.role === "warehouse" ? "Kho" : 
               user?.role === "sales" ? "Bán hàng" : "Admin"}
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href={getHomeLink()} className="mx-auto">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Coffee className="h-4 w-4 text-primary" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className={cn(!collapsed && "ml-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {!collapsed && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Menu
          </p>
        )}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="py-3 px-2 border-t">
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
