"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Search, Calendar, Receipt, Printer, Eye, ChevronLeft, ChevronRight, Banknote, CreditCard, QrCode, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { exportToCSV, orderColumns, formatters } from "@/lib/export-utils"
import Image from "next/image"

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ"
const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN")
const formatDateShort = (date: string) => new Date(date).toLocaleDateString("vi-VN")

interface POSOrder {
  id: string; total: number; status: string; paymentMethod: string
  customerName: string; phone: string; discount: number
  itemsCount: number; staffEmail: string; createdAt: string
}

interface OrderDetail {
  id: string; total: number; subtotal: number; discount: number
  status: string; paymentMethod: string; customerName: string; phone: string
  createdAt: string; staffEmail: string
  promotion: { code: string; name: string } | null
  items: Array<{ id: string; productId: string; name: string; image: string | null; quantity: number; price: number }>
}

const paymentLabels: Record<string, string> = {
  cash: "Tiền mặt", card: "Thẻ", transfer: "Chuyển khoản", cod: "COD"
}

const PaymentIcon = ({ method }: { method: string }) => {
  switch (method) {
    case 'cash': return <Banknote className="h-4 w-4" />
    case 'card': return <CreditCard className="h-4 w-4" />
    case 'transfer': return <QrCode className="h-4 w-4" />
    default: return <Banknote className="h-4 w-4" />
  }
}

export default function POSHistoryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<POSOrder[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  
  // Filters
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [payment, setPayment] = useState("all")
  
  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const fetchOrders = async (page = 1) => {
    setLoading(true)
    try {
      const res = await api.getPOSHistory({
        search: search || undefined,
        from: dateFrom || undefined,
        to: dateTo ? `${dateTo}T23:59:59` : undefined,
        payment: payment !== 'all' ? payment : undefined,
        page,
        limit: 20
      })
      setOrders(res.data || [])
      setPagination(res.pagination)
    } catch {
      toast({ title: "Lỗi tải dữ liệu", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleSearch = () => {
    fetchOrders(1)
  }

  const viewDetail = async (orderId: string) => {
    setLoadingDetail(true)
    setDetailOpen(true)
    try {
      const res = await api.getPOSOrderDetail(orderId)
      setSelectedOrder(res.data || null)
    } catch {
      toast({ title: "Lỗi tải chi tiết", variant: "destructive" })
      setDetailOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const printReceipt = () => {
    if (!receiptRef.current) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`<html><head><title>Hóa đơn</title><style>
      body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
      .center { text-align: center; } .bold { font-weight: bold; } .line { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; } .item { margin: 4px 0; }
    </style></head><body>${receiptRef.current.innerHTML}</body></html>`)
    printWindow.document.close(); printWindow.print(); printWindow.close()
  }

  const exportOrders = () => {
    if (!orders.length) return
    const data = orders.map(o => ({
      id: o.id.slice(0, 8),
      createdAt: formatters.datetime(o.createdAt),
      customerName: o.customerName,
      phone: o.phone || '',
      paymentMethod: formatters.paymentMethod(o.paymentMethod),
      status: formatters.status(o.status),
      discount: o.discount > 0 ? formatters.price(o.discount) : '0',
      total: formatters.price(o.total)
    }))
    const dateStr = dateFrom && dateTo ? `${dateFrom}-${dateTo}` : 'all'
    exportToCSV(data, orderColumns, `don-hang-pos-${dateStr}`)
    toast({ title: "Đã xuất file", description: `${orders.length} đơn hàng đã được tải xuống` })
  }

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalOrders = pagination.total

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Lịch sử bán hàng POS
          </h1>
          <p className="text-muted-foreground">Xem lại và in hóa đơn các đơn hàng đã bán</p>
        </div>
        <Button variant="outline" onClick={exportOrders} disabled={!orders.length}>
          <Download className="h-4 w-4 mr-2" />
          Xuất Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm theo mã đơn, tên, SĐT..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px]" />
              <span className="text-muted-foreground">-</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px]" />
            </div>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="card">Thẻ</SelectItem>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng đơn</p>
              <p className="text-xl font-bold">{totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Banknote className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Doanh thu (trang này)</p>
              <p className="text-xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Danh sách đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Receipt className="h-12 w-12 mb-3 opacity-30" />
              <p>Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Mã đơn</th>
                      <th className="pb-3 font-medium">Thời gian</th>
                      <th className="pb-3 font-medium">Khách hàng</th>
                      <th className="pb-3 font-medium">Thanh toán</th>
                      <th className="pb-3 font-medium text-right">Tổng tiền</th>
                      <th className="pb-3 font-medium text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3">
                          <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                        </td>
                        <td className="py-3 text-sm">{formatDate(order.createdAt)}</td>
                        <td className="py-3">
                          <p className="font-medium text-sm">{order.customerName}</p>
                          {order.phone && <p className="text-xs text-muted-foreground">{order.phone}</p>}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="gap-1">
                            <PaymentIcon method={order.paymentMethod} />
                            {paymentLabels[order.paymentMethod] || order.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <p className="font-semibold text-primary">{formatPrice(order.total)}</p>
                          {order.discount > 0 && (
                            <p className="text-xs text-green-600">-{formatPrice(order.discount)}</p>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => viewDetail(order.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Trang {pagination.page} / {pagination.totalPages} ({pagination.total} đơn)
                  </p>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={() => fetchOrders(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={() => fetchOrders(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
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
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Chi tiết đơn hàng
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedOrder && (
            <>
              <div ref={receiptRef} className="p-4 bg-white text-black max-h-[60vh] overflow-y-auto">
                <div className="center">
                  <p className="bold text-lg">NHH-COFFEE</p>
                  <p className="text-xs">Cửa hàng cà phê & trà</p>
                  <p className="text-xs">Hotline: 0762393111</p>
                  <div className="line" />
                </div>
                
                <div className="text-xs space-y-1">
                  <p>Mã đơn: #{selectedOrder.id.slice(0, 8)}</p>
                  <p>Ngày: {formatDate(selectedOrder.createdAt)}</p>
                  <p>Khách: {selectedOrder.customerName}</p>
                  {selectedOrder.phone && <p>SĐT: {selectedOrder.phone}</p>}
                  <p>NV: {selectedOrder.staffEmail}</p>
                  <div className="line" />
                </div>

                <div className="text-xs space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id}>
                      <p className="line-clamp-1">{item.name}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.quantity} x {formatPrice(item.price)}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="line" />
                <div className="text-sm space-y-1">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tạm tính</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
                  {selectedOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                      <span>Giảm giá {selectedOrder.promotion && `(${selectedOrder.promotion.code})`}</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>TỔNG CỘNG</span><span>{formatPrice(selectedOrder.total)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thanh toán</span>
                    <span>{paymentLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                  </div>
                </div>

                <div className="line" />
                <div className="center text-xs">
                  <p>Cảm ơn quý khách!</p>
                  <p>Hẹn gặp lại</p>
                </div>
              </div>

              <div className="p-4 border-t flex gap-3">
                <Button variant="outline" onClick={() => setDetailOpen(false)} className="flex-1">Đóng</Button>
                <Button onClick={printReceipt} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  In hóa đơn
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
