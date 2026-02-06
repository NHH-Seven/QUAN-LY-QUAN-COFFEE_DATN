"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Tag, Percent, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Promotion {
  id: string
  code: string
  name: string
  description: string | null
  type: 'percentage' | 'fixed'
  value: number
  min_order_value: number
  max_discount: number | null
  usage_limit: number | null
  used_count: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

const formatPrice = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ"

export default function PromotionsPage() {
  const { toast } = useToast()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    code: "", name: "", description: "", type: "percentage" as const,
    value: "", minOrderValue: "", maxDiscount: "", usageLimit: "",
    startDate: "", endDate: ""
  })

  const fetchPromotions = async () => {
    try {
      const res = await api.getPromotions()
      setPromotions(res.data || [])
    } catch { toast({ title: "Lỗi tải dữ liệu", variant: "destructive" }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPromotions() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: "", name: "", description: "", type: "percentage", value: "", minOrderValue: "", maxDiscount: "", usageLimit: "", startDate: "", endDate: "" })
    setDialogOpen(true)
  }

  const openEdit = (p: Promotion) => {
    setEditing(p)
    setForm({
      code: p.code, name: p.name, description: p.description || "", type: p.type,
      value: p.value.toString(), minOrderValue: p.min_order_value?.toString() || "",
      maxDiscount: p.max_discount?.toString() || "", usageLimit: p.usage_limit?.toString() || "",
      startDate: p.start_date?.slice(0, 16) || "", endDate: p.end_date?.slice(0, 16) || ""
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.name || !form.value) {
      toast({ title: "Vui lòng điền đầy đủ thông tin", variant: "destructive" }); return
    }
    setSaving(true)
    try {
      const data = {
        code: form.code, name: form.name, description: form.description || null,
        type: form.type, value: parseFloat(form.value),
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : 0,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        startDate: form.startDate || null, endDate: form.endDate || null
      }
      if (editing) {
        await api.updatePromotion(editing.id, data)
        toast({ title: "Cập nhật thành công" })
      } else {
        await api.createPromotion(data)
        toast({ title: "Tạo mã giảm giá thành công" })
      }
      setDialogOpen(false)
      fetchPromotions()
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Không thể lưu", variant: "destructive" })
    } finally { setSaving(false) }
  }

  const handleToggle = async (id: string) => {
    try {
      await api.togglePromotion(id)
      fetchPromotions()
    } catch { toast({ title: "Lỗi", variant: "destructive" }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa mã giảm giá này?")) return
    try {
      await api.deletePromotion(id)
      toast({ title: "Đã xóa" })
      fetchPromotions()
    } catch { toast({ title: "Lỗi", variant: "destructive" }) }
  }

  const filtered = promotions.filter(p => 
    p.code.toLowerCase().includes(search.toLowerCase()) || 
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (p: Promotion) => {
    if (!p.is_active) return { label: "Tắt", color: "bg-slate-500" }
    const now = new Date()
    if (p.start_date && new Date(p.start_date) > now) return { label: "Chưa bắt đầu", color: "bg-yellow-500" }
    if (p.end_date && new Date(p.end_date) < now) return { label: "Hết hạn", color: "bg-red-500" }
    if (p.usage_limit && p.used_count >= p.usage_limit) return { label: "Hết lượt", color: "bg-red-500" }
    return { label: "Hoạt động", color: "bg-green-500" }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mã giảm giá</h1>
          <p className="text-muted-foreground">Quản lý khuyến mãi và mã giảm giá</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Tạo mã mới</Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm mã giảm giá..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => {
          const status = getStatus(p)
          return (
            <Card key={p.id} className="relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 right-0 h-1", status.color)} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span className="font-mono">{p.code}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{p.name}</p>
                  </div>
                  <Badge variant="secondary" className={cn("text-white", status.color)}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  {p.type === "percentage" ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                  {p.type === "percentage" ? `${p.value}%` : formatPrice(p.value)}
                  {p.max_discount && <span className="text-sm font-normal text-muted-foreground">(tối đa {formatPrice(p.max_discount)})</span>}
                </div>

                <div className="text-sm space-y-1 text-muted-foreground">
                  {p.min_order_value > 0 && <p>Đơn tối thiểu: {formatPrice(p.min_order_value)}</p>}
                  {p.usage_limit && <p>Đã dùng: {p.used_count}/{p.usage_limit}</p>}
                  {(p.start_date || p.end_date) && (
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {p.start_date && new Date(p.start_date).toLocaleDateString("vi-VN")}
                      {p.start_date && p.end_date && " - "}
                      {p.end_date && new Date(p.end_date).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggle(p.id)}>
                    {p.is_active ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                    {p.is_active ? "Tắt" : "Bật"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Chưa có mã giảm giá nào</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã giảm giá *</Label>
                <Input placeholder="VD: SALE50" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>Tên *</Label>
                <Input placeholder="VD: Giảm 50%" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input placeholder="Mô tả ngắn..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại giảm giá *</Label>
                <Select value={form.type} onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị *</Label>
                <Input type="number" placeholder={form.type === "percentage" ? "VD: 10" : "VD: 50000"} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đơn tối thiểu</Label>
                <Input type="number" placeholder="0" value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Giảm tối đa</Label>
                <Input type="number" placeholder="Không giới hạn" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Số lượt sử dụng</Label>
              <Input type="number" placeholder="Không giới hạn" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
