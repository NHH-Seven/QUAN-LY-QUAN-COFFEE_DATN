"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { User, Package, Heart, MapPin, Settings, LogOut, ChevronRight, Loader2, Award, X, Filter, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { NotificationSettings } from "@/components/notifications/notification-settings"
import { LoyaltyCard } from "@/components/profile/loyalty-card"
import { AddressManagement } from "@/components/profile/address-management"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { api, ApiError, type Order } from "@/lib/api"
import { formatPrice } from "@/lib/utils"

const menuItems = [
  { icon: Award, label: "Điểm thưởng", value: "loyalty" },
  { icon: User, label: "Thông tin tài khoản", value: "info" },
  { icon: Package, label: "Đơn hàng của tôi", value: "orders" },
  { icon: Heart, label: "Sản phẩm yêu thích", value: "wishlist" },
  { icon: MapPin, label: "Địa chỉ giao hàng", value: "address" },
  { icon: Settings, label: "Cài đặt", value: "settings" },
]

const orderStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xác nhận", variant: "secondary" },
  awaiting_payment: { label: "Chờ thanh toán", variant: "outline" },
  confirmed: { label: "Đã xác nhận", variant: "default" },
  shipping: { label: "Đang giao", variant: "default" },
  delivered: { label: "Đã giao", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
}

export function ProfileContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || "loyalty"
  const [activeTab, setActiveTab] = useState(initialTab)
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [orderFilter, setOrderFilter] = useState<string>("all")

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: ""
  })
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  })
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Initialize profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || ""
      })
    }
  }, [user])

  // Fetch orders when tab changes to orders
  useEffect(() => {
    if (activeTab === "orders" && isAuthenticated && orders.length === 0) {
      fetchOrders()
    }
  }, [activeTab, isAuthenticated])

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await api.getOrders()
      if (response.success && response.data) {
        setOrders(response.data)
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return
    
    try {
      setCancellingOrderId(orderId)
      const response = await api.cancelOrder(orderId)
      if (response.success) {
        // Update order status locally
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: "cancelled" } : order
        ))
        toast({ title: "Đã hủy đơn hàng" })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" })
      }
    } finally {
      setCancellingOrderId(null)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true)
      const response = await api.updateProfile(profileForm)
      if (response.success) {
        toast({ title: "Đã lưu thông tin" })
        refreshUser()
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" })
      }
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({ title: "Vui lòng nhập đầy đủ", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Mật khẩu mới phải có ít nhất 6 ký tự", variant: "destructive" })
      return
    }
    
    try {
      setPasswordSaving(true)
      const response = await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      if (response.success) {
        toast({ title: "Đổi mật khẩu thành công" })
        setPasswordForm({ currentPassword: "", newPassword: "" })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" })
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      setAvatarUploading(true)
      // Upload file
      const uploadRes = await api.uploadFile(file)
      if (uploadRes.success && uploadRes.data?.url) {
        // Cloudinary returns full URL, local returns relative path
        let avatarUrl = uploadRes.data.url
        if (avatarUrl.startsWith('/uploads/')) {
          // Local storage - prepend server URL
          const serverBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'
          avatarUrl = `${serverBase}${avatarUrl}`
        }
        await api.updateProfile({ avatar: avatarUrl })
        await refreshUser()
        toast({ title: "Đã cập nhật ảnh đại diện" })
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
      if (err instanceof ApiError) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" })
      } else {
        toast({ title: "Lỗi", description: "Upload thất bại", variant: "destructive" })
      }
    } finally {
      setAvatarUploading(false)
    }
  }

  if (authLoading) {
    return <ProfileSkeleton />
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Vui lòng đăng nhập</h2>
        <p className="mt-2 text-muted-foreground">Bạn cần đăng nhập để xem trang này</p>
        <Button className="mt-6" asChild>
          <Link href="/login">Đăng nhập</Link>
        </Button>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AvatarUpload
                currentAvatar={user?.avatar}
                userName={user?.name || ""}
                onUpload={handleAvatarUpload}
                isUploading={avatarUploading}
              />
              <div>
                <h2 className="font-semibold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <nav className="mt-6 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.value}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    activeTab === item.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab(item.value)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <ChevronRight className="ml-auto h-4 w-4" />
                </button>
              ))}
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Điểm thưởng */}
          <TabsContent value="loyalty" className="mt-0">
            <LoyaltyCard 
              points={user?.points || 0}
              tier={user?.tier || 'bronze'}
              totalSpent={user?.totalSpent || 0}
              orderCount={user?.orderCount || 0}
            />
          </TabsContent>

          {/* Thông tin tài khoản */}
          <TabsContent value="info" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
                <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input 
                      id="name" 
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="0901234567"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Input 
                      id="address" 
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Đơn hàng của tôi */}
          <TabsContent value="orders" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Đơn hàng của tôi</CardTitle>
                    <CardDescription>Theo dõi và quản lý đơn hàng</CardDescription>
                  </div>
                  {/* Filter buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "Tất cả" },
                      { value: "pending", label: "Chờ xác nhận" },
                      { value: "confirmed", label: "Đã xác nhận" },
                      { value: "shipping", label: "Đang giao" },
                      { value: "delivered", label: "Đã giao" },
                      { value: "cancelled", label: "Đã hủy" },
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        variant={orderFilter === filter.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOrderFilter(filter.value)}
                        className="text-xs"
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : orders.filter(o => orderFilter === "all" || o.status === orderFilter).length > 0 ? (
                  <div className="space-y-4">
                    {orders
                      .filter(o => orderFilter === "all" || o.status === orderFilter)
                      .map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Đơn hàng #{order.id.slice(0, 8).toUpperCase()}</span>
                                <Badge variant={orderStatusMap[order.status]?.variant || "secondary"}>
                                  {orderStatusMap[order.status]?.label || order.status}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString("vi-VN")} • {order.items?.length || 0} sản phẩm
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">{formatPrice(order.total)}</p>
                              <div className="mt-2 flex gap-2 justify-end">
                                {order.status === "pending" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={cancellingOrderId === order.id}
                                  >
                                    {cancellingOrderId === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <X className="h-4 w-4 mr-1" />
                                        Hủy
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/checkout/success/${order.id}`}>Xem chi tiết</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-4 flex gap-2 overflow-x-auto">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                                >
                                  <Image
                                    src={item.images?.[0] || "/placeholder.svg"}
                                    alt={item.name}
                                    fill
                                    className="object-contain p-1"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>
                      {orderFilter === "all" 
                        ? "Bạn chưa có đơn hàng nào" 
                        : `Không có đơn hàng "${orderStatusMap[orderFilter]?.label || orderFilter}"`}
                    </p>
                    {orderFilter === "all" ? (
                      <Button className="mt-4" asChild>
                        <Link href="/">Đặt hàng ngay</Link>
                      </Button>
                    ) : (
                      <Button className="mt-4" variant="outline" onClick={() => setOrderFilter("all")}>
                        Xem tất cả đơn hàng
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sản phẩm yêu thích */}
          <TabsContent value="wishlist" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm yêu thích</CardTitle>
                <CardDescription>Danh sách sản phẩm bạn đã lưu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4 text-center">
                  <Button asChild>
                    <Link href="/wishlist">
                      <Heart className="mr-2 h-4 w-4" />
                      Xem danh sách yêu thích
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Địa chỉ giao hàng */}
          <TabsContent value="address" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Địa chỉ giao hàng</CardTitle>
                <CardDescription>Quản lý địa chỉ giao hàng của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <AddressManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cài đặt */}
          <TabsContent value="settings" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt</CardTitle>
                <CardDescription>Quản lý cài đặt tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Thông báo</Label>
                  <NotificationSettings />
                </div>

                <Separator />

                {/* Password Change */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Đổi mật khẩu</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input 
                      type="password" 
                      placeholder="Mật khẩu hiện tại"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <Input 
                      type="password" 
                      placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleChangePassword} disabled={passwordSaving}>
                    {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Đổi mật khẩu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
