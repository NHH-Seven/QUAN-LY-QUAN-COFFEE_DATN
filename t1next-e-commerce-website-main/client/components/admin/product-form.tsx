"use client"

/**
 * Product Form Component
 * Form để tạo/chỉnh sửa sản phẩm với validation
 * Requirements: 3.2, 3.5, 3.6, 7.6
 */

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { X, Plus, Loader2, Upload, ImagePlus } from "lucide-react"
import { api, Product, Category, CreateProductData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ProductFormProps {
  product?: Product
  categories: Category[]
  onSuccess?: () => void
}

interface FormErrors {
  name?: string
  price?: string
  category_id?: string
  stock?: string
  images?: string
}

export function ProductForm({ product, categories, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!product

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState<CreateProductData>({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    original_price: product?.original_price || undefined,
    images: product?.images || [],
    category_id: product?.category?.id || "",
    brand: product?.brand || "",
    specs: product?.specs || {},
    stock: product?.stock || 0,
    is_new: product?.is_new || false,
    is_featured: product?.is_featured || false,
    discount: product?.discount || 0,
  })

  // Specs state for dynamic key-value pairs
  const [specKey, setSpecKey] = useState("")
  const [specValue, setSpecValue] = useState("")

  // Image URL input
  const [imageUrl, setImageUrl] = useState("")
  
  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Tên sản phẩm là bắt buộc"
    }

    if (formData.price <= 0) {
      newErrors.price = "Giá sản phẩm phải lớn hơn 0"
    }

    if (!formData.category_id) {
      newErrors.category_id = "Vui lòng chọn danh mục"
    }

    if (formData.stock !== undefined && formData.stock < 0) {
      newErrors.stock = "Số lượng tồn kho không được âm"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (isEditing && product) {
        await api.updateAdminProduct(product.id, formData)
        toast({
          title: "Thành công",
          description: "Sản phẩm đã được cập nhật",
          variant: "success"
        })
      } else {
        await api.createAdminProduct(formData)
        toast({
          title: "Thành công",
          description: "Sản phẩm đã được tạo",
          variant: "success"
        })
      }
      
      onSuccess?.()
      router.push("/staff/products")
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể lưu sản phẩm",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add image URL
  const addImage = () => {
    if (!imageUrl.trim()) return
    
    // Basic URL validation
    try {
      new URL(imageUrl)
    } catch {
      toast({
        title: "Lỗi",
        description: "URL hình ảnh không hợp lệ",
        variant: "destructive"
      })
      return
    }

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), imageUrl.trim()]
    }))
    setImageUrl("")
  }

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }))
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => api.uploadImage(file))
      const results = await Promise.all(uploadPromises)
      
      const newUrls = results
        .filter(r => r.success && r.data)
        .map(r => `${API_URL}${r.data!.url}`)

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newUrls]
      }))

      toast({
        title: "Thành công",
        description: `Đã upload ${newUrls.length} ảnh`,
        variant: "success"
      })
    } catch (err) {
      toast({
        title: "Lỗi upload",
        description: err instanceof Error ? err.message : "Không thể upload ảnh",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Add spec
  const addSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return
    
    setFormData(prev => ({
      ...prev,
      specs: { ...prev.specs, [specKey.trim()]: specValue.trim() }
    }))
    setSpecKey("")
    setSpecValue("")
  }

  // Remove spec
  const removeSpec = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specs }
      delete newSpecs[key]
      return { ...prev, specs: newSpecs }
    })
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Thông tin cơ bản</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Tên sản phẩm <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên sản phẩm"
              className="h-10"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Nhập mô tả sản phẩm"
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Danh mục <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger className="h-10" aria-invalid={!!errors.category_id}>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm font-medium">
              Thương hiệu
            </Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="Nhập thương hiệu"
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Giá & Tồn kho</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Giá bán (VNĐ) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="h-10"
              aria-invalid={!!errors.price}
            />
            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="original_price" className="text-sm font-medium">
              Giá gốc (VNĐ)
            </Label>
            <Input
              id="original_price"
              type="number"
              min="0"
              value={formData.original_price || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                original_price: e.target.value ? Number(e.target.value) : undefined 
              }))}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount" className="text-sm font-medium">
              Giảm giá (%)
            </Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={formData.discount || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock" className="text-sm font-medium">
              Tồn kho <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
              className="h-10"
              aria-invalid={!!errors.stock}
            />
            {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
          </div>
        </div>
      </div>


      {/* Images */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Hình ảnh</h3>
        
        {/* Image list */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
          {formData.images && formData.images.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Ảnh chính
                </span>
              )}
            </div>
          ))}
          
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-xs">Upload ảnh</span>
              </>
            )}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Or add by URL */}
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Hoặc nhập URL hình ảnh"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
          />
          <Button type="button" variant="outline" onClick={addImage}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm URL
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Hỗ trợ: jpg, png, webp, gif (tối đa 5MB/ảnh). Ảnh đầu tiên sẽ là ảnh chính.
        </p>
      </div>

      {/* Specs */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Thông số kỹ thuật</h3>
        
        {/* Specs list */}
        {formData.specs && Object.keys(formData.specs).length > 0 && (
          <div className="space-y-2 mb-4">
            {Object.entries(formData.specs).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <span className="font-medium min-w-[120px]">{key}:</span>
                <span className="flex-1">{value}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeSpec(key)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add spec */}
        <div className="flex gap-2">
          <Input
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            placeholder="Tên thông số (VD: CPU)"
            className="flex-1"
          />
          <Input
            value={specValue}
            onChange={(e) => setSpecValue(e.target.value)}
            placeholder="Giá trị (VD: Intel Core i7)"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())}
          />
          <Button type="button" variant="outline" onClick={addSpec}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm
          </Button>
        </div>
      </div>


      {/* Flags */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Tùy chọn hiển thị</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_featured: checked === true }))
              }
            />
            <Label htmlFor="is_featured" className="cursor-pointer">
              Sản phẩm nổi bật
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_new"
              checked={formData.is_new}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_new: checked === true }))
              }
            />
            <Label htmlFor="is_new" className="cursor-pointer">
              Sản phẩm mới
            </Label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/staff/products")}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Cập nhật" : "Tạo sản phẩm"}
        </Button>
      </div>
    </form>
  )
}
