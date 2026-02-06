"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Knowledge {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[] | null
  is_active: boolean
}

interface Props {
  knowledge: Knowledge | null
  onClose: () => void
}

export function KnowledgeFormDialog({ knowledge, onClose }: Props) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (knowledge) {
      setTitle(knowledge.title)
      setContent(knowledge.content)
      setCategory(knowledge.category || "")
      setTags(knowledge.tags || [])
      setIsActive(knowledge.is_active)
    }
  }, [knowledge])

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const url = knowledge
        ? `${API_URL}/chatbot-knowledge/${knowledge.id}`
        : `${API_URL}/chatbot-knowledge`

      const res = await fetch(url, {
        method: knowledge ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: category.trim() || null,
          tags: tags.length > 0 ? tags : null,
          is_active: isActive
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message || (knowledge ? 'Đã cập nhật' : 'Đã tạo mới'))
        onClose()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Lỗi khi lưu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {knowledge ? 'Chỉnh sửa kiến thức' : 'Thêm kiến thức mới'}
          </DialogTitle>
          <DialogDescription>
            Thêm câu hỏi và câu trả lời để chatbot có thể trả lời tự động
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề / Câu hỏi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="VD: Quán mở cửa mấy giờ?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Nội dung / Câu trả lời <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="VD: NHH Coffee mở cửa từ 7h sáng đến 10h tối hàng ngày..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Đây là câu trả lời mà chatbot sẽ gửi cho khách hàng
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Input
              id="category"
              placeholder="VD: thông tin quán, dịch vụ, khuyến mãi..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Giúp phân loại và quản lý kiến thức dễ dàng hơn
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (từ khóa tìm kiếm)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="VD: giờ, mở cửa, thời gian..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag}>
                Thêm
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tags giúp chatbot tìm kiếm chính xác hơn. Nhấn Enter hoặc nút Thêm để thêm tag
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Trạng thái</Label>
              <p className="text-sm text-muted-foreground">
                Bật để chatbot có thể sử dụng kiến thức này
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : knowledge ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
