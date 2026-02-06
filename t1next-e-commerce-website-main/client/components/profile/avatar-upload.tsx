"use client"

/**
 * Avatar Upload Component
 * Component upload và crop ảnh đại diện
 */

import { useState, useRef } from "react"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  currentAvatar?: string
  userName: string
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
}

export function AvatarUpload({ currentAvatar, userName, onUpload, isUploading }: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
      setIsOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await onUpload(selectedFile)
      setIsOpen(false)
      setPreview(null)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="relative group">
        {/* Avatar Display */}
        <div className="relative h-24 w-24 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
          {currentAvatar ? (
            <img src={currentAvatar} alt={userName} className="h-full w-full object-cover" />
          ) : (
            <span>{userName?.charAt(0).toUpperCase()}</span>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Upload Button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
        </Button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Preview Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview */}
            {preview && (
              <div className="flex justify-center">
                <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-muted">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              </div>
            )}

            {/* File Info */}
            {selectedFile && (
              <div className="text-sm text-muted-foreground text-center">
                <p>{selectedFile.name}</p>
                <p>{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? "Đang tải lên..." : "Tải lên"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
