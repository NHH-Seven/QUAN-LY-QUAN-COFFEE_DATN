"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Package, PackageX, Settings, RefreshCw, Bell, TrendingUp, Clock, Download } from "lucide-react"
import Image from "next/image"

interface StockAlert {
  id: string
  name: string
  slug: string
  image: string | null
  stock: number
  reservedQuantity: number
  availableStock: number
  threshold: number
  categoryName: string | null
  price: number
  status: "low_stock" | "out_of_stock"
  suggestedReorder: number
}

interface Summary {
  lowStock: number
  outOfStock: number
  total: number
}

interface TurnoverProduct {
  id: string
  name: string
  image: string | null
  stock: number
  categoryName: string | null
  totalSold: number
  orderCount: number
  avgDailySales: number
  daysUntilStockout: number
}

interface SlowMovingProduct {
  id: string
  name: string
  image: string | null
  stock: number
  price: number
  categoryName: string | null
  lastSoldAt: string | null
  daysSinceLastSale: number | null
  stockValue: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export default function StockAlertsPage() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [summary, setSummary] = useState<Summary>({ lowStock: 0, outOfStock: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null)
  const [newThreshold, setNewThreshold] = useState("")
  const [sendingNotifications, setSendingNotifications] = useState(false)
  const [turnoverProducts, setTurnoverProducts] = useState<TurnoverProduct[]>([])
  const [slowMovingProducts, setSlowMovingProducts] = useState<SlowMovingProduct[]>([])
  const [activeTab, setActiveTab] = useState("alerts")
  const [exporting, setExporting] = useState(false)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/stock-alerts?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setAlerts(data.data)
        setSummary(data.summary)
      }
    } catch {
      toast({ title: "Lỗi tải dữ liệu", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const fetchTurnover = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/stock-alerts/turnover?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setTurnoverProducts(data.data)
      }
    } catch {
      // Silent fail
    }
  }, [])

  const fetchSlowMoving = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/stock-alerts/slow-moving?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSlowMovingProducts(data.data)
      }
    } catch {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    if (activeTab === "turnover") fetchTurnover()
    if (activeTab === "slow-moving") fetchSlowMoving()
  }, [activeTab, fetchTurnover, fetchSlowMoving])

  const updateThreshold = async (productId: string, threshold: number) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/stock-alerts/threshold/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ threshold })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Đã cập nhật ngưỡng" })
        setEditingThreshold(null)
        fetchAlerts()
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Lỗi cập nhật", variant: "destructive" })
    }
  }

  const formatPrice = (price: number) => 
    new Intl.NumberFormat("vi-VN").format(price) + "đ"

  const sendNotifications = async () => {
    try {
      setSendingNotifications(true)
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/notifications/send-stock-alerts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Đã gửi thông báo cho nhân viên kho" })
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Lỗi gửi thông báo", variant: "destructive" })
    } finally {
      setSendingNotifications(false)
    }
  }

  const exportToExcel = async () => {
    try {
      setExporting(true)
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/stock-alerts/export`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error("Export failed")
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bao-cao-ton-kho-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ title: "Đã xuất báo cáo Excel" })
    } catch {
      toast({ title: "Lỗi xuất báo cáo", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cảnh báo tồn kho</h1>
          <p className="text-muted-foreground">Theo dõi sản phẩm sắp hết hàng</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel} 
            variant="outline" 
            size="sm"
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </Button>
          <Button 
            onClick={sendNotifications} 
            variant="outline" 
            size="sm"
            disabled={sendingNotifications || summary.total === 0}
          >
            <Bell className="h-4 w-4 mr-2" />
            {sendingNotifications ? "Đang gửi..." : "Gửi thông báo"}
          </Button>
          <Button onClick={fetchAlerts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng cảnh báo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">sản phẩm cần chú ý</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sắp hết hàng</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.lowStock}</div>
            <p className="text-xs text-muted-foreground">dưới ngưỡng cảnh báo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hết hàng</CardTitle>
            <PackageX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.outOfStock}</div>
            <p className="text-xs text-muted-foreground">cần nhập thêm ngay</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cảnh báo ({summary.total})
          </TabsTrigger>
          <TabsTrigger value="turnover" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Bán chạy
          </TabsTrigger>
          <TabsTrigger value="slow-moving" className="gap-2">
            <Clock className="h-4 w-4" />
            Chậm bán
          </TabsTrigger>
        </TabsList>

        {/* Tab: Cảnh báo */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cảnh báo</SelectItem>
                <SelectItem value="low">Sắp hết hàng</SelectItem>
                <SelectItem value="out">Hết hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-center">Tồn kho</TableHead>
                    <TableHead className="text-center">Đang giữ</TableHead>
                    <TableHead className="text-center">Khả dụng</TableHead>
                    <TableHead className="text-center">Ngưỡng</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-center">Đề xuất nhập</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : alerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Không có sản phẩm nào cần cảnh báo
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {alert.image ? (
                              <Image
                                src={alert.image}
                                alt={alert.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{alert.name}</p>
                              <p className="text-xs text-muted-foreground">{alert.categoryName || "Chưa phân loại"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{alert.stock}</TableCell>
                        <TableCell className="text-center text-orange-600">{alert.reservedQuantity}</TableCell>
                        <TableCell className="text-center">
                          <span className={alert.availableStock <= 0 ? "text-red-600 font-bold" : "text-yellow-600 font-bold"}>
                            {alert.availableStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingThreshold === alert.id ? (
                            <div className="flex items-center gap-1 justify-center">
                              <Input
                                type="number"
                                value={newThreshold}
                                onChange={(e) => setNewThreshold(e.target.value)}
                                className="w-16 h-8 text-center"
                                min={0}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateThreshold(alert.id, parseInt(newThreshold))}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingThreshold(null)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => {
                                setEditingThreshold(alert.id)
                                setNewThreshold(alert.threshold.toString())
                              }}
                            >
                              {alert.threshold}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {alert.status === "out_of_stock" ? (
                            <Badge variant="destructive">Hết hàng</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Sắp hết
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium text-blue-600">
                          +{alert.suggestedReorder}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Cài đặt ngưỡng - {alert.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="text-sm font-medium">Ngưỡng cảnh báo</label>
                                  <Input
                                    type="number"
                                    defaultValue={alert.threshold}
                                    min={0}
                                    className="mt-1"
                                    onChange={(e) => setNewThreshold(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Cảnh báo khi tồn kho khả dụng ≤ ngưỡng này
                                  </p>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => updateThreshold(alert.id, parseInt(newThreshold || alert.threshold.toString()))}
                                >
                                  Lưu thay đổi
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Bán chạy (Turnover) */}
        <TabsContent value="turnover" className="space-y-4">
          <p className="text-sm text-muted-foreground">Top sản phẩm bán chạy nhất trong 30 ngày qua</p>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-center">Đã bán</TableHead>
                    <TableHead className="text-center">Số đơn</TableHead>
                    <TableHead className="text-center">TB/ngày</TableHead>
                    <TableHead className="text-center">Tồn kho</TableHead>
                    <TableHead className="text-center">Còn ~ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turnoverProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Chưa có dữ liệu bán hàng
                      </TableCell>
                    </TableRow>
                  ) : (
                    turnoverProducts.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-bold text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} width={40} height={40} className="rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.categoryName || "Chưa phân loại"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-green-600">{product.totalSold}</TableCell>
                        <TableCell className="text-center">{product.orderCount}</TableCell>
                        <TableCell className="text-center">{product.avgDailySales}</TableCell>
                        <TableCell className="text-center">{product.stock}</TableCell>
                        <TableCell className="text-center">
                          <span className={product.daysUntilStockout <= 7 ? "text-red-600 font-bold" : product.daysUntilStockout <= 14 ? "text-yellow-600" : ""}>
                            {product.daysUntilStockout >= 999 ? "∞" : `${product.daysUntilStockout} ngày`}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Chậm bán (Slow-moving) */}
        <TabsContent value="slow-moving" className="space-y-4">
          <p className="text-sm text-muted-foreground">Sản phẩm không bán được trong 30 ngày qua (sắp xếp theo giá trị tồn kho)</p>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-center">Tồn kho</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-right">Giá trị tồn</TableHead>
                    <TableHead className="text-center">Lần bán cuối</TableHead>
                    <TableHead className="text-center">Số ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowMovingProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Không có sản phẩm chậm bán
                      </TableCell>
                    </TableRow>
                  ) : (
                    slowMovingProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <Image src={product.image} alt={product.name} width={40} height={40} className="rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.categoryName || "Chưa phân loại"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{product.stock}</TableCell>
                        <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
                        <TableCell className="text-right font-medium text-orange-600">{formatPrice(product.stockValue)}</TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {product.lastSoldAt ? new Date(product.lastSoldAt).toLocaleDateString("vi-VN") : "Chưa bán"}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.daysSinceLastSale !== null ? (
                            <Badge variant="secondary">{product.daysSinceLastSale} ngày</Badge>
                          ) : (
                            <Badge variant="outline">N/A</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
