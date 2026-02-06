"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { KnowledgeFormDialog } from "./knowledge-form-dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Knowledge {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Category {
  category: string
  count: number
}

export default function ChatbotKnowledgePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [knowledge, setKnowledge] = useState<Knowledge[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDialog, setShowDialog] = useState(false)
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (user && user.role !== "admin") {
      router.push("/")
      return
    }
    if (user) {
      fetchKnowledge()
      fetchCategories()
    }
  }, [authLoading, isAuthenticated, user, router])

  const fetchKnowledge = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (search) params.append('search', search)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('is_active', statusFilter)

      const res = await fetch(`${API_URL}/chatbot-knowledge?${params}`, {
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      
      if (data.success) {
        setKnowledge(data.data)
      }
    } catch (error) {
      console.error('Fetch knowledge error:', error)
      toast.error('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chatbot-knowledge/categories/list`, {
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa kiến thức này?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chatbot-knowledge/${id}`, {
        method: 'DELETE',
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Đã xóa kiến thức')
        fetchKnowledge()
        fetchCategories()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Lỗi khi xóa')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chatbot-knowledge/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(currentStatus ? 'Đã tắt kiến thức' : 'Đã bật kiến thức')
        fetchKnowledge()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật')
    }
  }

  const handleEdit = (item: Knowledge) => {
    setEditingKnowledge(item)
    setShowDialog(true)
  }

  const handleAdd = () => {
    setEditingKnowledge(null)
    setShowDialog(true)
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    setEditingKnowledge(null)
    fetchKnowledge()
    fetchCategories()
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Kiến thức Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý câu hỏi và câu trả lời cho AI chatbot
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm kiến thức
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledge.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang bật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {knowledge.filter(k => k.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang tắt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {knowledge.filter(k => !k.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Danh mục
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchKnowledge()}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang bật</SelectItem>
                <SelectItem value="false">Đang tắt</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchKnowledge}>Tìm kiếm</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {knowledge.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Chưa có kiến thức nào
                  </TableCell>
                </TableRow>
              ) : (
                knowledge.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {item.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags && item.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Đang bật" : "Đang tắt"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          title={item.is_active ? "Tắt" : "Bật"}
                        >
                          {item.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      {showDialog && (
        <KnowledgeFormDialog
          knowledge={editingKnowledge}
          onClose={handleDialogClose}
        />
      )}
    </div>
  )
}
