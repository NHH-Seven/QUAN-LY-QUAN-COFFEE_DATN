"use client"

/**
 * Admin Users Page
 * Quản lý người dùng với DataTable, search, pagination
 * Requirements: 5.1, 7.5
 */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Eye, UserCheck, UserX } from "lucide-react"
import { api, AdminUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"

/**
 * Format ngày
 */
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString))
}

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchInput, setSearchInput] = useState("")
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  // Filters from URL
  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const sort = searchParams.get("sort") || "created_at"
  const order = (searchParams.get("order") as "asc" | "desc") || "desc"

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.getAdminUsers({
        page,
        limit: 10,
        search,
        sort,
        order,
      })

      setUsers(res.data || [])
      setTotal(res.total || 0)
      setTotalPages(res.totalPages || 0)
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể tải dữ liệu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, search, sort, order, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Update URL params
  const updateFilters = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })
    router.push(`/staff/users?${params.toString()}`)
  }

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchInput, page: 1 })
  }

  // Toggle user status
  const handleToggleStatus = async (user: AdminUser) => {
    try {
      setUpdatingUserId(user.id)
      await api.updateAdminUserStatus(user.id, !user.isActive)
      toast({
        title: "Thành công",
        description: user.isActive 
          ? "Đã vô hiệu hóa tài khoản" 
          : "Đã kích hoạt tài khoản",
        variant: "success"
      })
      fetchUsers()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Người dùng</h2>
        <p className="text-muted-foreground">
          Quản lý danh sách người dùng ({total} người dùng)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>

        <Select
          value={`${sort}-${order}`}
          onValueChange={(value) => {
            const [newSort, newOrder] = value.split("-")
            updateFilters({ sort: newSort, order: newOrder })
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Mới nhất</SelectItem>
            <SelectItem value="created_at-asc">Cũ nhất</SelectItem>
            <SelectItem value="name-asc">Tên A-Z</SelectItem>
            <SelectItem value="name-desc">Tên Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {/* Users Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Người dùng</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Liên hệ</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Đơn hàng</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng chi tiêu</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Role</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ngày tạo</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-16 animate-pulse rounded bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-20 animate-pulse rounded bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-8 w-20 animate-pulse rounded bg-muted ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/staff/users/${user.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {user.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.orders_count}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(user.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.isActive ? "outline" : "destructive"}>
                        {user.isActive ? "Hoạt động" : "Đã khóa"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/staff/users/${user.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {user.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggleStatus(user)}
                            disabled={updatingUserId === user.id}
                            title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: page - 1 })}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: page + 1 })}
                disabled={page >= totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
