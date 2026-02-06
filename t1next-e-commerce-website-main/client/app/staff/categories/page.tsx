"use client"

/**
 * Admin Categories Page
 * Quản lý danh mục với inline edit
 * Requirements: 6.1-6.4
 */

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Check, X, Loader2, FolderOpen } from "lucide-react"
import { api, AdminCategory, CreateCategoryData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface EditingCategory {
  id: string | null // null = new category
  name: string
  slug: string
  icon: string
  description: string
}

export default function AdminCategoriesPage() {
  const { toast } = useToast()

  // State
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<EditingCategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.getAdminCategories()
      setCategories(res.data || [])
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể tải danh mục",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])


  // Start editing existing category
  const handleEdit = (category: AdminCategory) => {
    setEditing({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon || "",
      description: category.description || "",
    })
  }

  // Start creating new category
  const handleAddNew = () => {
    setEditing({
      id: null,
      name: "",
      slug: "",
      icon: "",
      description: "",
    })
  }

  // Cancel editing
  const handleCancel = () => {
    setEditing(null)
  }

  // Save category (create or update)
  const handleSave = async () => {
    if (!editing) return

    // Validate
    if (!editing.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên danh mục là bắt buộc",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const data: CreateCategoryData = {
        name: editing.name.trim(),
        slug: editing.slug.trim() || undefined,
        icon: editing.icon.trim() || undefined,
        description: editing.description.trim() || undefined,
      }

      if (editing.id) {
        // Update existing
        await api.updateAdminCategory(editing.id, data)
        toast({
          title: "Thành công",
          description: "Đã cập nhật danh mục",
          variant: "success"
        })
      } else {
        // Create new
        await api.createAdminCategory(data)
        toast({
          title: "Thành công",
          description: "Đã tạo danh mục mới",
          variant: "success"
        })
      }

      setEditing(null)
      fetchCategories()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể lưu danh mục",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return

    try {
      setDeletingId(id)
      await api.deleteAdminCategory(id)
      toast({
        title: "Thành công",
        description: "Đã xóa danh mục",
        variant: "success"
      })
      fetchCategories()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể xóa danh mục",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }


  // Render inline edit row
  const renderEditRow = () => {
    if (!editing) return null

    return (
      <tr key={editing.id || 'new-category'} className="border-b bg-muted/30">
        <td className="px-4 py-3">
          <Input
            placeholder="Tên danh mục *"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="h-8"
            autoFocus
          />
        </td>
        <td className="px-4 py-3">
          <Input
            placeholder="slug-tu-dong"
            value={editing.slug}
            onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
            className="h-8"
          />
        </td>
        <td className="px-4 py-3">
          <Input
            placeholder="📱"
            value={editing.icon}
            onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
            className="h-8 w-16"
          />
        </td>
        <td className="px-4 py-3">
          <Input
            placeholder="Mô tả ngắn"
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="h-8"
          />
        </td>
        <td className="px-4 py-3 text-center">—</td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSave}
              disabled={isSubmitting}
              title="Lưu"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCancel}
              disabled={isSubmitting}
              title="Hủy"
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Danh mục</h2>
          <p className="text-muted-foreground">
            Quản lý danh mục sản phẩm ({categories.length} danh mục)
          </p>
        </div>
        <Button onClick={handleAddNew} disabled={editing !== null}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      {/* Categories Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Tên danh mục</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-medium w-20">Icon</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Mô tả</th>
                <th className="px-4 py-3 text-center text-sm font-medium w-28">Sản phẩm</th>
                <th className="px-4 py-3 text-right text-sm font-medium w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {/* New category row at top */}
              {editing && editing.id === null && renderEditRow()}

              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-muted mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-8 w-20 animate-pulse rounded bg-muted ml-auto" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 && !editing ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Chưa có danh mục nào</p>
                    <Button variant="link" onClick={handleAddNew} className="mt-2">
                      Thêm danh mục đầu tiên
                    </Button>
                  </td>
                </tr>
              ) : (
                categories.map((category) =>
                  editing && editing.id === category.id ? (
                    renderEditRow()
                  ) : (
                    <tr
                      key={category.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{category.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {category.slug}
                      </td>
                      <td className="px-4 py-3 text-lg">{category.icon || "—"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {category.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {category.product_count ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(category)}
                            disabled={editing !== null || deletingId === category.id}
                            title="Sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(category.id)}
                            disabled={editing !== null || deletingId === category.id}
                            title="Xóa"
                          >
                            {deletingId === category.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help text */}
      <p className="text-sm text-muted-foreground">
        * Không thể xóa danh mục đang có sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.
      </p>
    </div>
  )
}
