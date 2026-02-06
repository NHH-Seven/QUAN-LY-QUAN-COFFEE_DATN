"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Users, Crown, Medal, Award, Star, ChevronLeft, ChevronRight, Eye, RefreshCw, Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ"
const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN")

interface Customer {
  id: string; email: string; name: string; phone: string | null
  address: string | null; avatar: string | null; points: number
  tier: string; totalSpent: number; orderCount: number
  note: string | null; isActive: boolean; createdAt: string
}

interface CustomerDetail extends Customer {
  recentOrders: Array<{ id: string; total: number; status: string; itemsCount: number; createdAt: string }>
}

const tierConfig: Record<string, { label: string; color: string; icon: typeof Crown; bg: string }> = {
  bronze: { label: 'Đồng', color: 'text-orange-700', icon: Medal, bg: 'bg-orange-100' },
  silver: { label: 'Bạc', color: 'text-slate-500', icon: Award, bg: 'bg-slate-100' },
  gold: { label: 'Vàng', color: 'text-yellow-600', icon: Star, bg: 'bg-yellow-100' },
  platinum: { label: 'Bạch Kim', color: 'text-purple-600', icon: Crown, bg: 'bg-purple-100' }
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý', awaiting_payment: 'Chờ thanh toán', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Hoàn thành', cancelled: 'Đã hủy'
}

export default function CustomersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<{ total: number; byTier: Record<string, number>; newThisMonth: number } | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Filters
  const [search, setSearch] = useState("")
  const [tier, setTier] = useState("all")
  const [sort, setSort] = useState("created_at")
  
  // Detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editNote, setEditNote] = useState("")
  const [pointsAdjust, setPointsAdjust] = useState(0)
  const [saving, setSaving] = useState(false)

  const fetchCustomers = async (page = 1) => {
    setLoading(true)
    try {
      const [customersRes, statsRes] = await Promise.all([
        api.getCustomers({ search: search || undefined, tier: tier !== 'all' ? tier : undefined, sort, order: 'desc', page, limit: 20 }),
        api.getCustomerStats()
      ])
      setCustomers(customersRes.data || [])
      setPagination(customersRes.pagination)
      setStats(statsRes.data || null)
    } catch {
      toast({ title: "Lỗi tải dữ liệu", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleSearch = () => fetchCustomers(1)

  const viewDetail = async (id: string) => {
    setLoadingDetail(true)
    setDetailOpen(true)
    try {
      const res = await api.getCustomerDetail(id)
      setSelectedCustomer(res.data || null)
    } catch {
      toast({ title: "Lỗi tải chi tiết", variant: "destructive" })
      setDetailOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const openEdit = () => {
    if (!selectedCustomer) return
    setEditNote(selectedCustomer.note || "")
    setPointsAdjust(0)
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!selectedCustomer) return
    setSaving(true)
    try {
      await api.updateCustomer(selectedCustomer.id, { note: editNote, pointsAdjust })
      toast({ title: "Đã cập nhật" })
      setEditOpen(false)
      viewDetail(selectedCustomer.id)
      fetchCustomers(pagination.page)
    } catch {
      toast({ title: "Lỗi cập nhật", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const recalculate = async (id: string) => {
    try {
      await api.recalculateCustomer(id)
      toast({ title: "Đã cập nhật thống kê" })
      viewDetail(id)
      fetchCustomers(pagination.page)
    } catch {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const recalculateAll = async () => {
    if (!confirm("Cập nhật thống kê cho tất cả khách hàng?")) return
    try {
      await api.recalculateAllCustomers()
      toast({ title: "Đã cập nhật tất cả" })
      fetchCustomers(pagination.page)
    } catch {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const TierBadge = ({ tier: t }: { tier: string }) => {
    const config = tierConfig[t] || tierConfig.bronze
    const Icon = config.icon
    return (
      <Badge variant="outline" className={`${config.bg} ${config.color} border-0 gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Quản lý khách hàng
          </h1>
          <p className="text-muted-foreground">Thông tin, điểm tích lũy và lịch sử mua hàng</p>
        </div>
        <Button variant="outline" onClick={recalculateAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Cập nhật tất cả
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng KH</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          {Object.entries(tierConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <Card key={key}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-xl font-bold">{stats.byTier[key] || 0}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm theo tên, email, SĐT..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Hạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="bronze">Đồng</SelectItem>
                <SelectItem value="silver">Bạc</SelectItem>
                <SelectItem value="gold">Vàng</SelectItem>
                <SelectItem value="platinum">Bạch Kim</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Ngày tạo</SelectItem>
                <SelectItem value="points">Điểm</SelectItem>
                <SelectItem value="total_spent">Chi tiêu</SelectItem>
                <SelectItem value="order_count">Số đơn</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Danh sách khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p>Không tìm thấy khách hàng</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Khách hàng</th>
                      <th className="pb-3 font-medium">Liên hệ</th>
                      <th className="pb-3 font-medium">Hạng</th>
                      <th className="pb-3 font-medium text-right">Điểm</th>
                      <th className="pb-3 font-medium text-right">Chi tiêu</th>
                      <th className="pb-3 font-medium text-right">Đơn hàng</th>
                      <th className="pb-3 font-medium text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm">{c.email}</p>
                          {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                        </td>
                        <td className="py-3"><TierBadge tier={c.tier} /></td>
                        <td className="py-3 text-right font-medium">{c.points.toLocaleString()}</td>
                        <td className="py-3 text-right text-primary font-medium">{formatPrice(c.totalSpent)}</td>
                        <td className="py-3 text-right">{c.orderCount}</td>
                        <td className="py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => viewDetail(c.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Trang {pagination.page} / {pagination.totalPages} ({pagination.total} khách hàng)
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchCustomers(pagination.page - 1)} disabled={pagination.page <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchCustomers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  {selectedCustomer.phone && <p className="text-sm">{selectedCustomer.phone}</p>}
                </div>
                <TierBadge tier={selectedCustomer.tier} />
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{selectedCustomer.points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Điểm</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatPrice(selectedCustomer.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Chi tiêu</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedCustomer.orderCount}</p>
                  <p className="text-xs text-muted-foreground">Đơn hàng</p>
                </div>
              </div>

              {selectedCustomer.note && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm"><strong>Ghi chú:</strong> {selectedCustomer.note}</p>
                </div>
              )}

              {selectedCustomer.recentOrders.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Đơn hàng gần đây</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCustomer.recentOrders.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                        <div>
                          <span className="font-mono">#{o.id.slice(0, 8)}</span>
                          <span className="text-muted-foreground ml-2">{formatDate(o.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{statusLabels[o.status]}</Badge>
                          <span className="font-medium">{formatPrice(o.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => recalculate(selectedCustomer.id)} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cập nhật
                </Button>
                <Button onClick={openEdit} className="flex-1">Chỉnh sửa</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Điều chỉnh điểm</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button variant="outline" size="icon" onClick={() => setPointsAdjust(p => p - 100)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input 
                  type="number" 
                  value={pointsAdjust} 
                  onChange={e => setPointsAdjust(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button variant="outline" size="icon" onClick={() => setPointsAdjust(p => p + 100)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Điểm hiện tại: {selectedCustomer?.points.toLocaleString()} → {((selectedCustomer?.points || 0) + pointsAdjust).toLocaleString()}
              </p>
            </div>

            <div>
              <Label>Ghi chú</Label>
              <Textarea 
                value={editNote} 
                onChange={e => setEditNote(e.target.value)}
                placeholder="Ghi chú về khách hàng..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
