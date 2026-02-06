"use client"

/**
 * Admin Products Page
 * Quản lý sản phẩm với DataTable, search, filter, pagination
 * Requirements: 3.1, 7.5
 * Quyền truy cập: admin, sales
 */

import { useState, useEffect, useCallback } from "react"
import { RoleProtectedPage } from "@/components/admin/role-protected-page"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { api, Product, Category } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn, formatPrice } from "@/lib/utils"

export default function AdminProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filters from URL
  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || ""
  const sort = searchParams.get("sort") || "created_at"
  const order = (searchParams.get("order") as "asc" | "desc") || "desc"

  // Local search state for debouncing
  const [searchInput, setSearchInput] = useState(search)

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const [productsRes, categoriesRes] = await Promise.all([
        api.getAdminProducts({ page, limit: 10, search, category, sort, order }),
        api.getAdminCategories()
      ])
      
      setProducts(productsRes.data || [])
      setTotal(productsRes.total || 0)
      setTotalPages(productsRes.totalPages || 0)
      
      if (categoriesRes.data) {
        setCategories(categoriesRes.data)
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể tải dữ liệu",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, search, category, sort, order, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateFilters({ search: searchInput, page: 1 })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

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
    router.push(`/staff/products?${params.toString()}`)
  }

  // Delete product
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) return

    try {
      await api.deleteAdminProduct(id)
      toast({
        title: "Thành công",
        description: "Sản phẩm đã được xóa",
        variant: "success"
      })
      fetchProducts()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể xóa sản phẩm",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sản phẩm</h2>
          <p className="text-muted-foreground">
            Quản lý danh sách sản phẩm ({total} sản phẩm)
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => updateFilters({ category: value === "all" ? "" : value, page: 1 })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <SelectItem value="price-asc">Giá thấp → cao</SelectItem>
            <SelectItem value="price-desc">Giá cao → thấp</SelectItem>
            <SelectItem value="stock-asc">Tồn kho thấp</SelectItem>
            <SelectItem value="stock-desc">Tồn kho cao</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {/* Products Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Danh mục</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Giá</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tồn kho</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-muted ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 animate-pulse rounded bg-muted ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 animate-pulse rounded bg-muted mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-8 w-20 animate-pulse rounded bg-muted ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const imageUrl = product.images?.[0]
                  const isValidImageUrl = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))
                  
                  return (
                  <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                          {isValidImageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                              No img
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.brand || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {product.category?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="font-medium">{formatPrice(product.price)}</p>
                        {product.original_price && product.original_price > product.price && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.original_price)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "font-medium",
                        product.stock < 10 && "text-destructive"
                      )}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {product.is_featured && (
                          <Badge variant="default" className="text-xs">Nổi bật</Badge>
                        )}
                        {product.is_new && (
                          <Badge variant="secondary" className="text-xs">Mới</Badge>
                        )}
                        {product.stock < 10 && (
                          <Badge variant="destructive" className="text-xs">Sắp hết</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/staff/products/${product.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})
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
