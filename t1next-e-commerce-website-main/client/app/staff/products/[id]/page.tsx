"use client"

/**
 * Admin Edit Product Page
 * Trang chỉnh sửa sản phẩm
 * Requirements: 3.3
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { api, Product, Category } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/admin"
import { useToast } from "@/hooks/use-toast"

export default function AdminEditProductPage() {
  const params = useParams()
  const { toast } = useToast()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [productRes, categoriesRes] = await Promise.all([
          api.getAdminProduct(productId),
          api.getAdminCategories()
        ])
        
        if (productRes.data) {
          setProduct(productRes.data)
        } else {
          setError("Sản phẩm không tồn tại")
        }
        
        if (categoriesRes.data) {
          setCategories(categoriesRes.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu")
        toast({
          title: "Lỗi",
          description: err instanceof Error ? err.message : "Không thể tải dữ liệu",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (productId) {
      fetchData()
    }
  }, [productId, toast])

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

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/staff/products">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
          <p className="text-destructive">{error || "Sản phẩm không tồn tại"}</p>
          <Button asChild className="mt-4">
            <Link href="/staff/products">Về danh sách sản phẩm</Link>
          </Button>
        </div>
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
          <h2 className="text-2xl font-bold tracking-tight">Chỉnh sửa sản phẩm</h2>
          <p className="text-muted-foreground">
            {product.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm product={product} categories={categories} />
    </div>
  )
}
