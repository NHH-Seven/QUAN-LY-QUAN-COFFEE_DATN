"use client"

/**
 * Warehouse Stock Page
 * Trang quản lý tồn kho - xuất/nhập kho
 * Quyền truy cập: admin, warehouse
 */

import { useState, useEffect } from "react"
import { RoleProtectedPage } from "@/components/admin/role-protected-page"
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  slug: string
  images: string[]
  stock: number
  brand: string
  category_name: string
}

interface InventorySummary {
  totalProducts: number
  totalStock: number
  lowStockCount: number
  outOfStockCount: number
  today: {
    import: { quantity: number; count: number }
    export: { quantity: number; count: number }
  }
}

export default function WarehouseStockPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)

  // Dialog states
  const [importDialog, setImportDialog] = useState(false)
  const [exportDialog, setExportDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [reference, setReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [stockRes, summaryRes] = await Promise.all([
        api.getWarehouseStock({ search, lowStock: showLowStock }),
        api.getInventorySummary()
      ])
      
      if (stockRes.data) setProducts(stockRes.data)
      if (summaryRes.data) setSummary(summaryRes.data)
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu kho",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [search, showLowStock])

  const handleImport = async () => {
    if (!selectedProduct || !quantity) return
    
    setIsSubmitting(true)
    try {
      const res = await api.importStock({
        productId: selectedProduct.id,
        quantity: parseInt(quantity, 10),
        reason,
        reference
      })
      
      toast({
        title: "Thành công",
        description: res.message || "Đã nhập kho thành công",
        variant: "success"
      })
      
      setImportDialog(false)
      resetForm()
      fetchData()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể nhập kho",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async () => {
    if (!selectedProduct || !quantity) return
    
    setIsSubmitting(true)
    try {
      const res = await api.exportStock({
        productId: selectedProduct.id,
        quantity: parseInt(quantity, 10),
        reason,
        reference
      })
      
      toast({
        title: "Thành công",
        description: res.message || "Đã xuất kho thành công",
        variant: "success"
      })
      
      setExportDialog(false)
      resetForm()
      fetchData()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể xuất kho",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedProduct(null)
    setQuantity("")
    setReason("")
    setReference("")
  }

  const openImportDialog = (product: Product) => {
    setSelectedProduct(product)
    setImportDialog(true)
  }

  const openExportDialog = (product: Product) => {
    setSelectedProduct(product)
    setExportDialog(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quản lý Kho</h2>
        <p className="text-muted-foreground">Xuất nhập kho và theo dõi tồn kho</p>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng sản phẩm
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Tổng tồn: {summary.totalStock.toLocaleString()} sản phẩm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nhập kho hôm nay
              </CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                +{summary.today.import.quantity}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.today.import.count} phiếu nhập
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Xuất kho hôm nay
              </CardTitle>
              <ArrowUpFromLine className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                -{summary.today.export.quantity}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.today.export.count} phiếu xuất
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cảnh báo
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.lowStockCount + summary.outOfStockCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.outOfStockCount} hết hàng, {summary.lowStockCount} sắp hết
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-4">
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant={showLowStock ? "default" : "outline"}
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Sắp hết hàng
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Danh mục</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Tồn kho</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy sản phẩm
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{product.category_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.stock === 0
                            ? "bg-red-100 text-red-700"
                            : product.stock < 10
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openImportDialog(product)}
                        >
                          <ArrowDownToLine className="h-4 w-4 mr-1" />
                          Nhập
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openExportDialog(product)}
                          disabled={product.stock === 0}
                        >
                          <ArrowUpFromLine className="h-4 w-4 mr-1" />
                          Xuất
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập kho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-muted-foreground">
                Tồn kho hiện tại: {selectedProduct?.stock}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Số lượng nhập *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Nhập số lượng"
              />
            </div>
            <div className="space-y-2">
              <Label>Mã phiếu nhập</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="VD: PN-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Lý do nhập kho..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleImport} disabled={!quantity || isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Nhập kho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xuất kho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-muted-foreground">
                Tồn kho hiện tại: {selectedProduct?.stock}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Số lượng xuất *</Label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.stock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Nhập số lượng"
              />
            </div>
            <div className="space-y-2">
              <Label>Mã phiếu xuất</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="VD: PX-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Lý do xuất kho..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleExport} disabled={!quantity || isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xuất kho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
