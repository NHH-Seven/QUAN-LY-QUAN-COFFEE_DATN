"use client"

/**
 * Admin New Product Page
 * Trang tạo sản phẩm mới
 * Requirements: 3.2
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { api, Category } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/admin"
import { useToast } from "@/hooks/use-toast"

export default function AdminNewProductPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getAdminCategories()
        if (res.data) {
          setCategories(res.data)
        }
      } catch (err) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh mục",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategories()
  }, [toast])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/staff/products">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Thêm sản phẩm mới</h2>
          <p className="text-muted-foreground">
            Điền thông tin để tạo sản phẩm mới
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm categories={categories} />
    </div>
  )
}
