"use client"

/**
 * Staff Management Page
 * Quản lý tài khoản nhân viên (chỉ admin)
 * Quyền truy cập: admin
 */

import { useState, useEffect, useCallback } from "react"
import { RoleProtectedPage } from "@/components/admin/role-protected-page"
import { Plus, Search, Edit, Trash2, Shield, Key, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { api, ApiError, StaffMember, StaffRole } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

const roleLabels: Record<StaffRole, string> = {
  admin: "Quản trị viên",
  sales: "Nhân viên Bán hàng",
  warehouse: "Nhân viên Kho",
}

const roleColors: Record<StaffRole, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  sales: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  warehouse: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
}

export default function StaffManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialog states
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "sales" as StaffRole,
    phone: "",
  })
  const [newPassword, setNewPassword] = useState("")

  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.getStaffMembers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter as StaffRole || undefined,
        sort: 'created_at',
        order: 'desc',
      })
      setStaff(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể tải danh sách nhân viên"
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, search, roleFilter, toast])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.name || !formData.role) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await api.createStaffMember({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        phone: formData.phone || undefined,
      })
      toast({
        title: "Thành công",
        description: "Đã tạo tài khoản nhân viên",
        variant: "success",
      })
      setCreateDialog(false)
      resetForm()
      fetchStaff()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể tạo tài khoản"
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedStaff) return

    try {
      setIsSubmitting(true)
      await api.updateStaffMember(selectedStaff.id, {
        name: formData.name,
        role: formData.role,
        phone: formData.phone || undefined,
      })
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin nhân viên",
        variant: "success",
      })
      setEditDialog(false)
      setSelectedStaff(null)
      fetchStaff()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể cập nhật thông tin"
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedStaff || !newPassword) return

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await api.resetStaffPassword(selectedStaff.id, newPassword)
      toast({
        title: "Thành công",
        description: "Đã đổi mật khẩu nhân viên",
        variant: "success",
      })
      setPasswordDialog(false)
      setSelectedStaff(null)
      setNewPassword("")
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể đổi mật khẩu"
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (member: StaffMember) => {
    try {
      await api.updateStaffStatus(member.id, !member.isActive)
      toast({
        title: "Thành công",
        description: member.isActive ? "Đã vô hiệu hóa tài khoản" : "Đã kích hoạt tài khoản",
        variant: "success",
      })
      fetchStaff()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể thay đổi trạng thái"
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa nhân viên này?")) return
    
    try {
      await api.deleteStaffMember(id)
      toast({
        title: "Thành công",
        description: "Đã xóa nhân viên",
        variant: "success",
      })
      fetchStaff()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Không thể xóa nhân viên"
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      role: "sales",
      phone: "",
    })
  }

  const openEditDialog = (member: StaffMember) => {
    setSelectedStaff(member)
    setFormData({
      email: member.email,
      password: "",
      name: member.name,
      role: member.role,
      phone: member.phone || "",
    })
    setEditDialog(true)
  }

  const openPasswordDialog = (member: StaffMember) => {
    setSelectedStaff(member)
    setNewPassword("")
    setPasswordDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Nhân viên</h2>
          <p className="text-muted-foreground">
            Quản lý tài khoản và phân quyền nhân viên ({total} nhân viên)
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm nhân viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={(value) => { setRoleFilter(value === 'all' ? '' : value); setPage(1) }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tất cả vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="admin">Quản trị viên</SelectItem>
            <SelectItem value="sales">Nhân viên Bán hàng</SelectItem>
            <SelectItem value="warehouse">Nhân viên Kho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Nhân viên</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Vai trò</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy nhân viên
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={roleColors[member.role]}>
                        {roleLabels[member.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{member.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(member)}
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordDialog(member)}
                          title="Đổi mật khẩu"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(member)}
                          disabled={member.id === user?.id}
                          title={member.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        >
                          {member.isActive ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(member.id)}
                          disabled={member.id === user?.id}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhân viên mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu * (tối thiểu 6 ký tự)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Họ và tên *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label>Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: StaffRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="sales">Nhân viên Bán hàng</SelectItem>
                  <SelectItem value="warehouse">Nhân viên Kho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0909888888"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
            </div>
            <div className="space-y-2">
              <Label>Họ và tên *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: StaffRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="sales">Nhân viên Bán hàng</SelectItem>
                  <SelectItem value="warehouse">Nhân viên Kho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu nhân viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Đổi mật khẩu cho: <strong>{selectedStaff?.name}</strong> ({selectedStaff?.email})
            </p>
            <div className="space-y-2">
              <Label>Mật khẩu mới * (tối thiểu 6 ký tự)</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleResetPassword} disabled={isSubmitting || newPassword.length < 6}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Đổi mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
