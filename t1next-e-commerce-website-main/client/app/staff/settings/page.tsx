"use client"

import { useState, useEffect } from "react"
import { Settings, Zap, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface SiteSettings {
  flashSaleEnabled: boolean
  flashSaleTitle: string
  maintenanceMode: boolean
  siteName: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  // Only admin can access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/staff')
    }
  }, [user, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải cài đặt",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFlashSale = async (enabled: boolean) => {
    setSaving(true)
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
        setSettings(prev => prev ? { ...prev, flashSaleEnabled: enabled } : null)
        toast({
          title: "Đã lưu",
          description: enabled ? "Flash Sale đã được bật" : "Flash Sale đã được tắt"
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
      setSaving(false)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Bạn không có quyền truy cập trang này</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Cài đặt hệ thống
        </h1>
        <p className="text-muted-foreground">Quản lý các cài đặt chung của website</p>
      </div>

      <div className="grid gap-6">
        {/* Flash Sale Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Flash Sale
            </CardTitle>
            <CardDescription>
              Bật/tắt hiển thị Flash Sale trên trang chủ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="flash-sale-toggle">Hiển thị Flash Sale</Label>
                <p className="text-sm text-muted-foreground">
                  Khi tắt, section Flash Sale sẽ không hiển thị trên trang chủ
                </p>
              </div>
              <Switch
                id="flash-sale-toggle"
                checked={settings?.flashSaleEnabled ?? true}
                onCheckedChange={handleToggleFlashSale}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
