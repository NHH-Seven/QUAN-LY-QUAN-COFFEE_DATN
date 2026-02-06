"use client"

import { useAuth } from "@/contexts/auth-context"
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react"
import { useAdminStats } from "@/hooks/use-admin-stats"
import {
  StatsCard,
  StatsCardSkeleton,
  RecentOrdersTable,
  RecentOrdersSkeleton,
  LowStockAlert,
  LowStockSkeleton,
} from "@/components/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Import warehouse dashboard
import WarehouseDashboard from "./warehouse-dashboard"

/**
 * Format số tiền VND
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Staff Dashboard Page
 * Hiển thị dashboard khác nhau theo role
 */
export default function StaffDashboardPage() {
  const { user } = useAuth()
  
  // Warehouse có dashboard riêng
  if (user?.role === "warehouse") {
    return <WarehouseDashboard />
  }
  
  // Admin và Sales dùng dashboard chung
  return <AdminSalesDashboard />
}

function AdminSalesDashboard() {
  const { stats, isLoading, error } = useAdminStats()

  // Tính tổng đơn hàng
  const totalOrders = stats
    ? stats.orders.pending +
      stats.orders.confirmed +
      stats.orders.shipping +
      stats.orders.delivered +
      stats.orders.cancelled
    : 0

  // Tính phần trăm đơn hàng theo trạng thái
  const getOrderPercentage = (count: number) => {
    if (totalOrders === 0) return 0
    return Math.round((count / totalOrders) * 100)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Chào mừng trở lại! Đây là tổng quan hoạt động kinh doanh của bạn.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Có lỗi xảy ra</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatsCard
              title="Doanh thu tháng này"
              value={formatCurrency(stats.revenue.month)}
              description={`Hôm nay: ${formatCurrency(stats.revenue.today)}`}
              icon={DollarSign}
              variant="primary"
            />
            <StatsCard
              title="Tổng đơn hàng"
              value={totalOrders}
              description={`${stats.orders.pending} đang chờ xử lý`}
              icon={ShoppingCart}
              variant="warning"
            />
            <StatsCard
              title="Người dùng"
              value={stats.users.total}
              description={`+${stats.users.newThisMonth} tháng này`}
              icon={Users}
              variant="success"
            />
            <StatsCard
              title="Sản phẩm"
              value={stats.products.total}
              description={`${stats.products.lowStock} sắp hết hàng`}
              icon={Package}
              variant={stats.products.lowStock > 5 ? "danger" : "default"}
            />
          </>
        ) : null}
      </div>

      {/* Order Status Overview */}
      {!isLoading && stats && totalOrders > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Tình trạng đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>Chờ xử lý</span>
                  </div>
                  <span className="font-medium">{stats.orders.pending}</span>
                </div>
                <Progress
                  value={getOrderPercentage(stats.orders.pending)}
                  className="h-2 bg-yellow-100"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span>Đã xác nhận</span>
                  </div>
                  <span className="font-medium">{stats.orders.confirmed}</span>
                </div>
                <Progress
                  value={getOrderPercentage(stats.orders.confirmed)}
                  className="h-2 bg-blue-100"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    <span>Đang giao</span>
                  </div>
                  <span className="font-medium">{stats.orders.shipping}</span>
                </div>
                <Progress
                  value={getOrderPercentage(stats.orders.shipping)}
                  className="h-2 bg-purple-100"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Hoàn thành</span>
                  </div>
                  <span className="font-medium">{stats.orders.delivered}</span>
                </div>
                <Progress
                  value={getOrderPercentage(stats.orders.delivered)}
                  className="h-2 bg-emerald-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <RecentOrdersSkeleton />
          ) : stats ? (
            <RecentOrdersTable orders={stats.recentOrders} />
          ) : null}
        </div>
      </div>

      {/* Low Stock Alert */}
      {isLoading ? (
        <LowStockSkeleton />
      ) : stats && stats.lowStockProducts.length > 0 ? (
        <LowStockAlert products={stats.lowStockProducts} />
      ) : null}
    </div>
  )
}
