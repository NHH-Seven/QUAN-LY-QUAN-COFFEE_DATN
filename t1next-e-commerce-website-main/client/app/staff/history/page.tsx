"use client"

/**
 * Warehouse History Page
 * Trang lịch sử xuất nhập kho
 */

import { useState, useEffect } from "react"
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react"
import { api, StockTransaction } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const typeLabels: Record<string, string> = {
  import: "Nhập kho",
  export: "Xuất kho",
  adjust: "Điều chỉnh",
  order: "Đơn hàng",
  return: "Trả hàng",
}

const typeColors: Record<string, string> = {
  import: "bg-emerald-100 text-emerald-700",
  export: "bg-orange-100 text-orange-700",
  adjust: "bg-blue-100 text-blue-700",
  order: "bg-purple-100 text-purple-700",
  return: "bg-pink-100 text-pink-700",
}

export default function WarehouseHistoryPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [type, setType] = useState<string>("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await api.getStockHistory({
        type: type || undefined,
        page,
        limit: 20,
      })

      if (res.data) {
        setTransactions(res.data)
        setTotalPages(res.totalPages)
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch sử kho",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [type, page])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Lịch sử Kho</h2>
        <p className="text-muted-foreground">Theo dõi các giao dịch xuất nhập kho</p>
      </div>

      <div className="flex gap-4">
        <Select value={type || "all"} onValueChange={(v) => setType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="import">Nhập kho</SelectItem>
            <SelectItem value="export">Xuất kho</SelectItem>
            <SelectItem value="adjust">Điều chỉnh</SelectItem>
            <SelectItem value="order">Đơn hàng</SelectItem>
            <SelectItem value="return">Trả hàng</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Thời gian</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Loại</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Sản phẩm</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Số lượng</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Tồn kho</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Người thực hiện</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">{formatDate(tx.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          typeColors[tx.type] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {tx.type === "import" && <ArrowDownToLine className="h-3 w-3" />}
                        {tx.type === "export" && <ArrowUpFromLine className="h-3 w-3" />}
                        {typeLabels[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{tx.product_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          tx.type === "import" || tx.type === "return"
                            ? "text-emerald-600"
                            : "text-orange-600"
                        }
                      >
                        {tx.type === "import" || tx.type === "return" ? "+" : "-"}
                        {tx.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                      {tx.stock_before} → {tx.stock_after}
                    </td>
                    <td className="px-4 py-3 text-sm">{tx.user_name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {tx.reference && <span className="mr-2 font-mono">{tx.reference}</span>}
                      {tx.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="flex items-center px-4 text-sm">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
