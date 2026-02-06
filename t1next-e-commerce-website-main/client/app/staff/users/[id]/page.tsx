"use client"

/**
 * Admin User Detail Page
 * Hiển thị profile, order history, cho phép edit
 * Requirements: 5.2, 5.3
 */

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, Mail, Phone, MapPin, ShoppingBag, Edit2, Save, X } from "lucide-react"
import { api, AdminUserDetail, Order } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import { OrderStatusBadge, OrderStatus } from "@/components/admin"

/**
 * Format ngày giờ
 */
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const userId = params.id as string

  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    role: "user" as "user" | "admin",
  })

  // Fetch user detail
  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.getAdminUser(userId)
      if (res.data) {
        setUser(res.data)
        setEditForm({
          name: res.data.name || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          role: res.data.role,
        })
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể tải thông tin người dùng",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId, toast])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Handle save
  const handleSave = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      await api.updateAdminUser(userId, editForm)
      toast({
        title: "Thành công",
        description: "Cập nhật thông tin người dùng thành công",
        variant: "success"
      })
      setIsEditing(false)
      fetchUser()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể cập nhật thông tin",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel edit
  const handleCancel = () => {
    if (user) {
      setEditForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        role: user.role,
      })
    }
    setIsEditing(false)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  // Not found
  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/staff/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Người dùng không tồn tại</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/staff/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
            <p className="text-muted-foreground">
              Tham gia {formatDate(user.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {user.role === "admin" ? "Admin" : "User"}
          </Badge>
          <Badge variant={user.isActive ? "outline" : "destructive"}>
            {user.isActive ? "Hoạt động" : "Đã khóa"}
          </Badge>
        </div>
      </div>


      {/* User Info & Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Thông tin cá nhân
            </CardTitle>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Sửa
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Lưu
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              // Edit form
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Họ tên</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value: "user" | "admin") =>
                      setEditForm({ ...editForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              // Display info
              <>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Họ tên</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{user.phone || "Chưa cập nhật"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{user.address || "Chưa cập nhật"}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Thống kê mua hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold">{user.orders?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(user.total_spent)}
                </p>
                <p className="text-sm text-muted-foreground">Tổng chi tiêu</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đơn thành công</span>
                <span className="font-medium">
                  {user.orders?.filter((o) => o.status === "delivered").length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đơn đang xử lý</span>
                <span className="font-medium">
                  {user.orders?.filter((o) =>
                    ["pending", "confirmed", "shipping"].includes(o.status)
                  ).length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đơn đã hủy</span>
                <span className="font-medium">
                  {user.orders?.filter((o) => o.status === "cancelled").length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {!user.orders || user.orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có đơn hàng nào
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Mã đơn</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Số SP</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Tổng tiền</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Ngày đặt</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {user.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/staff/orders/${order.id}`}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.items_count}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/staff/orders/${order.id}`}>
                            Xem
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
