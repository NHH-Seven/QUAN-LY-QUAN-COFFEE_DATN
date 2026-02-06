"use client"

import { useState, useEffect } from "react"
import { MapPin, Plus, Trash2, Star, Loader2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Address {
  id: string
  name: string
  phone: string
  address: string
  is_default: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export function AddressManagement() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", address: "", isDefault: false })
  const { toast } = useToast()

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setAddresses(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAddresses() }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.address) {
      toast({ title: "Vui lòng nhập đầy đủ thông tin", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const url = editingAddress 
        ? `${API_URL}/addresses/${editingAddress.id}`
        : `${API_URL}/addresses`
      const res = await fetch(url, {
        method: editingAddress ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: editingAddress ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ" })
        setDialogOpen(false)
        setEditingAddress(null)
        setForm({ name: "", phone: "", address: "", isDefault: false })
        fetchAddresses()
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Lỗi kết nối", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa địa chỉ này?")) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Đã xóa địa chỉ" })
        fetchAddresses()
      }
    } catch (err) {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/addresses/${id}/default`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Đã đặt làm mặc định" })
        fetchAddresses()
      }
    } catch (err) {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  const openEdit = (addr: Address) => {
    setEditingAddress(addr)
    setForm({ name: addr.name, phone: addr.phone, address: addr.address, isDefault: addr.is_default })
    setDialogOpen(true)
  }

  const openAdd = () => {
    setEditingAddress(null)
    setForm({ name: "", phone: "", address: "", isDefault: false })
    setDialogOpen(true)
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Thêm địa chỉ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Họ tên người nhận</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Số nhà, đường, phường, quận, thành phố" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="default" checked={form.isDefault} onCheckedChange={(c) => setForm(p => ({ ...p, isDefault: !!c }))} />
                <Label htmlFor="default" className="cursor-pointer">Đặt làm địa chỉ mặc định</Label>
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Bạn chưa có địa chỉ nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{addr.name}</p>
                    {addr.is_default && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Mặc định</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                  <p className="mt-1 text-sm">{addr.address}</p>
                </div>
                <div className="flex gap-2">
                  {!addr.is_default && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(addr)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
