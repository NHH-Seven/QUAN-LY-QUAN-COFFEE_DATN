"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Zap, ArrowLeft, Search, Edit, Loader2, TrendingUp, Package, DollarSign, Clock, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"

interface FlashSaleProduct {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  images: string[]
  discount: number
  stock: number
  sold_today: number
  flash_sale_stock: number
}

interface FlashSaleSettings {
  flashSaleEnabled: boolean
  flashSaleStartHour: number
  flashSaleEndHour: number
}

export default function FlashSalePage() {
  const [products, setProducts] = useState<FlashSaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [settings, setSettings] = useState<FlashSaleSettings>({
    flashSaleEnabled: true,
    flashSaleStartHour: 0,
    flashSaleEndHour: 24
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
    fetchSettings()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/flash-sale?limit=50`)
      const data = await res.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch flash sale products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSettings(prev => ({
            ...prev,
            flashSaleEnabled: data.data.flashSaleEnabled !== false,
            flashSaleStartHour: data.data.flashSaleStartHour ?? 0,
            flashSaleEndHour: data.data.flashSaleEndHour ?? 24
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleToggleFlashSale = async (enabled: boolean) => {
    setSavingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/flash-sale`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled })
      })
      const data = await res.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, flashSaleEnabled: enabled }))
        toast({
          title: enabled ? "Flash Sale đã bật" : "Flash Sale đã tắt",
          description: enabled 
            ? "Flash Sale sẽ hiển thị trên trang chủ" 
            : "Flash Sale sẽ ẩn khỏi trang chủ"
        })
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể cập nhật cài đặt",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to toggle flash sale:', error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cài đặt",
        variant: "destructive"
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleUpdateTime = async () => {
    setSavingSettings(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          flashSaleStartHour: settings.flashSaleStartHour,
          flashSaleEndHour: settings.flashSaleEndHour
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Đã lưu",
          description: `Flash Sale: ${settings.flashSaleStartHour}:00 - ${settings.flashSaleEndHour}:00`
        })
      }
    } catch (error) {
      console.error('Failed to update time:', error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thời gian",
        variant: "destructive"
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const totalProducts = products.length
  const totalSoldToday = products.reduce((sum, p) => sum + (p.sold_today || 0), 0)
  const totalRevenue = products.reduce((sum, p) => sum + (p.sold_today || 0) * p.price, 0)
  const avgDiscount = products.length > 0 
    ? Math.round(products.reduce((sum, p) => sum + p.discount, 0) / products.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/staff/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              Flash Sale
            </h1>
            <p className="text-muted-foreground">Quản lý sản phẩm đang giảm giá</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/staff/products">
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh sửa sản phẩm
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Zap className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sản phẩm</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã bán hôm nay</p>
                <p className="text-2xl font-bold">{totalSoldToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giảm giá TB</p>
                <p className="text-2xl font-bold">{avgDiscount}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flash Sale Settings */}
      <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Cài đặt Flash Sale
          </CardTitle>
          <CardDescription>Bật/tắt và tùy chỉnh thời gian Flash Sale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Toggle */}
            <div className="flex items-center justify-between sm:justify-start gap-4 p-4 bg-white rounded-lg border flex-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${settings.flashSaleEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Zap className={`h-5 w-5 ${settings.flashSaleEnabled ? 'text-green-600 fill-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <Label htmlFor="flash-sale-toggle" className="font-medium">
                    {settings.flashSaleEnabled ? 'Flash Sale đang BẬT' : 'Flash Sale đang TẮT'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.flashSaleEnabled ? 'Hiển thị trên trang chủ' : 'Ẩn khỏi trang chủ'}
                  </p>
                </div>
              </div>
              <Switch
                id="flash-sale-toggle"
                checked={settings.flashSaleEnabled}
                onCheckedChange={handleToggleFlashSale}
                disabled={savingSettings}
              />
            </div>

            {/* Time Settings */}
            <div className="p-4 bg-white rounded-lg border flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Thời gian Flash Sale</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.flashSaleStartHour}
                  onChange={(e) => setSettings(prev => ({ ...prev, flashSaleStartHour: parseInt(e.target.value) || 0 }))}
                  className="w-20 text-center"
                />
                <span className="text-muted-foreground">:00 đến</span>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={settings.flashSaleEndHour}
                  onChange={(e) => setSettings(prev => ({ ...prev, flashSaleEndHour: parseInt(e.target.value) || 24 }))}
                  className="w-20 text-center"
                />
                <span className="text-muted-foreground">:00</span>
                <Button 
                  size="sm" 
                  onClick={handleUpdateTime}
                  disabled={savingSettings}
                >
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Mặc định: 0:00 - 24:00 (cả ngày)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm Flash Sale</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có sản phẩm nào đang giảm giá</p>
              <p className="text-sm mt-1">Thêm discount cho sản phẩm trong trang Sản phẩm</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Giá gốc</TableHead>
                  <TableHead className="text-right">Giá sale</TableHead>
                  <TableHead className="text-center">Giảm</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Đã bán hôm nay</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div>
                          <Link 
                            href={`/product/${product.slug}`}
                            className="font-medium hover:text-primary line-clamp-1"
                          >
                            {product.name}
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground line-through">
                      {product.original_price ? formatPrice(product.original_price) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">-{product.discount}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock < 10 ? "text-red-600 font-medium" : ""}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {product.sold_today || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatPrice((product.sold_today || 0) * product.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-red-500" />
            Mẹo Flash Sale
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Để thêm sản phẩm vào Flash Sale, vào <strong>Sản phẩm</strong> và set <strong>Discount &gt; 0%</strong></li>
            <li>• Flash Sale tự động reset lúc 00:00 mỗi ngày</li>
            <li>• Sản phẩm có discount cao sẽ hiển thị đầu tiên trên trang chủ</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
