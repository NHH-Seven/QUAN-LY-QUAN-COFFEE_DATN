"use client"

/**
 * Admin Profile Page
 * Trang thông tin cá nhân cho staff (admin, sales, warehouse)
 */

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { Shield, Mail, Phone, MapPin, User } from "lucide-react"

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await api.updateProfile(formData)
      await refreshUser()
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin cá nhân",
        variant: "success",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật thông tin",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true)
    try {
      // Resize image before upload
      const resizedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            // Create canvas to resize
            const canvas = document.createElement('canvas')
            const MAX_SIZE = 200 // Max width/height
            let width = img.width
            let height = img.height

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width
                width = MAX_SIZE
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height
                height = MAX_SIZE
              }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)

            // Convert to base64 with compression
            resolve(canvas.toDataURL('image/jpeg', 0.7))
          }
          img.onerror = reject
          img.src = e.target?.result as string
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      await api.updateProfile({ avatar: resizedBase64 })
      await refreshUser()
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật ảnh đại diện",
        variant: "success",
      })
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tải ảnh lên",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin": return "Quản trị viên"
      case "sales": return "Nhân viên Bán hàng"
      case "warehouse": return "Nhân viên Kho"
      default: return "Nhân viên"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Thông tin cá nhân</h2>
        <p className="text-muted-foreground">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Hồ sơ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <AvatarUpload
                currentAvatar={user?.avatar}
                userName={user?.name || ""}
                onUpload={handleAvatarUpload}
                isUploading={isUploadingAvatar}
              />
              <div className="text-center">
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                  <Shield className="h-4 w-4" />
                  {getRoleLabel(user?.role)}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.phone}</span>
                </div>
              )}
              {user?.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Thông tin tài khoản</CardTitle>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                Chỉnh sửa
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="0909888888"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Địa chỉ làm việc"
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: user?.name || "",
                        phone: user?.phone || "",
                        address: user?.address || "",
                      })
                    }}
                    disabled={isLoading}
                  >
                    Hủy
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
