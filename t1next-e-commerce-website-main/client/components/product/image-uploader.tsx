"use client"

import { useState, useRef, useCallback } from "react"
import { X, ImagePlus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Constants for validation
const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

interface ImageUploaderProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
  disabled?: boolean
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = MAX_IMAGES,
  disabled = false
}: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate previews when images change
  const updatePreviews = useCallback((files: File[]) => {
    // Revoke old preview URLs
    previews.forEach(url => URL.revokeObjectURL(url))
    
    // Create new preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
  }, [previews])

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File "${file.name}" không hợp lệ. Chỉ chấp nhận: JPG, PNG, WebP`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" quá lớn. Tối đa 5MB`
    }
    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setError(null)

    // Check total count
    const totalCount = images.length + files.length
    if (totalCount > maxImages) {
      setError(`Tối đa ${maxImages} ảnh. Bạn đã chọn ${images.length} ảnh.`)
      return
    }

    // Validate each file
    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // Add new files
    const newImages = [...images, ...files]
    onImagesChange(newImages)
    updatePreviews(newImages)

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
    updatePreviews(newImages)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    setError(null)

    const totalCount = images.length + files.length
    if (totalCount > maxImages) {
      setError(`Tối đa ${maxImages} ảnh. Bạn đã chọn ${images.length} ảnh.`)
      return
    }

    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    const newImages = [...images, ...files]
    onImagesChange(newImages)
    updatePreviews(newImages)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                disabled={disabled}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
            disabled 
              ? "border-muted bg-muted/50 cursor-not-allowed" 
              : "border-muted-foreground/25 hover:border-primary/50 cursor-pointer"
          )}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Kéo thả hoặc click để chọn ảnh
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tối đa {maxImages} ảnh, mỗi ảnh tối đa 5MB (JPG, PNG, WebP)
          </p>
          <p className="text-xs text-muted-foreground">
            Đã chọn: {images.length}/{maxImages}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
