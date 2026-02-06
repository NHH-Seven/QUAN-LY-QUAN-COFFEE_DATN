"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Plus, Trash2, Edit, Save } from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Area {
  id: string
  name: string
  description: string | null
  sort_order: number
  table_count?: number
}

interface Table {
  id: string
  table_number: string
  area_id: string | null
  capacity: number
  status: string
  is_active: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  onUpdate: () => void
}

export function TableSettingsDialog({ open, onClose, onUpdate }: Props) {
  const [areas, setAreas] = useState<Area[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [newArea, setNewArea] = useState({ name: "", description: "" })
  const [newTable, setNewTable] = useState({ table_number: "", area_id: "", capacity: 4 })

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [areasRes, tablesRes] = await Promise.all([
        fetch(`${API_URL}/tables/areas`, { credentials: "include" }),
        fetch(`${API_URL}/tables`, { credentials: "include" }),
      ])
      const areasData = await areasRes.json()
      const tablesData = await tablesRes.json()
      if (areasData.success) setAreas(areasData.data)
      if (tablesData.success) setTables(tablesData.data)
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Area CRUD
  const handleCreateArea = async () => {
    if (!newArea.name.trim()) return toast.error("Vui lòng nhập tên khu vực")
    try {
      const res = await fetch(`${API_URL}/tables/areas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newArea),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Đã tạo khu vực")
        setNewArea({ name: "", description: "" })
        fetchData()
        onUpdate()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi tạo khu vực")
    }
  }

  const handleUpdateArea = async () => {
    if (!editingArea) return
    try {
      const res = await fetch(`${API_URL}/tables/areas/${editingArea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingArea),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Đã cập nhật khu vực")
        setEditingArea(null)
        fetchData()
        onUpdate()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi cập nhật")
    }
  }

  const handleDeleteArea = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa khu vực này?")) return
    try {
      const res = await fetch(`${API_URL}/tables/areas/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        toast.success("Đã xóa khu vực")
        fetchData()
        onUpdate()
      }
    } catch (error) {
      toast.error("Lỗi xóa khu vực")
    }
  }

  // Table CRUD
  const handleCreateTable = async () => {
    if (!newTable.table_number.trim()) return toast.error("Vui lòng nhập số bàn")
    try {
      const res = await fetch(`${API_URL}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newTable),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Đã tạo bàn")
        setNewTable({ table_number: "", area_id: "", capacity: 4 })
        fetchData()
        onUpdate()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi tạo bàn")
    }
  }

  const handleUpdateTable = async () => {
    if (!editingTable) return
    try {
      const res = await fetch(`${API_URL}/tables/${editingTable.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingTable),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Đã cập nhật bàn")
        setEditingTable(null)
        fetchData()
        onUpdate()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi cập nhật")
    }
  }

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bàn này?")) return
    try {
      const res = await fetch(`${API_URL}/tables/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Đã xóa bàn")
        fetchData()
        onUpdate()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Lỗi xóa bàn")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cài đặt sơ đồ bàn</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="areas" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="areas">Khu vực</TabsTrigger>
            <TabsTrigger value="tables">Bàn</TabsTrigger>
          </TabsList>

          {/* Areas Tab */}
          <TabsContent value="areas" className="flex-1 flex flex-col">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Input placeholder="Tên khu vực" value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })} />
              <Input placeholder="Mô tả (tùy chọn)" value={newArea.description}
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })} />
              <Button onClick={handleCreateArea}>
                <Plus className="mr-2 h-4 w-4" /> Thêm khu vực
              </Button>
            </div>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {areas.map((area) => (
                  <div key={area.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {editingArea?.id === area.id ? (
                      <>
                        <Input value={editingArea.name} className="flex-1"
                          onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })} />
                        <Input value={editingArea.description || ""} className="flex-1"
                          onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })} />
                        <Button size="sm" onClick={handleUpdateArea}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingArea(null)}>Hủy</Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium">{area.name}</p>
                          {area.description && <p className="text-sm text-muted-foreground">{area.description}</p>}
                        </div>
                        <Badge variant="outline">{area.table_count || 0} bàn</Badge>
                        <Button size="sm" variant="ghost" onClick={() => setEditingArea(area)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteArea(area.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="flex-1 flex flex-col">
            <div className="grid grid-cols-4 gap-3 mb-4">
              <Input placeholder="Số bàn (VD: T-01)" value={newTable.table_number}
                onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })} />
              <Select value={newTable.area_id} onValueChange={(v) => setNewTable({ ...newTable, area_id: v })}>
                <SelectTrigger><SelectValue placeholder="Chọn khu vực" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Sức chứa" value={newTable.capacity}
                onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })} />
              <Button onClick={handleCreateTable}>
                <Plus className="mr-2 h-4 w-4" /> Thêm bàn
              </Button>
            </div>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2">
                {tables.map((table) => (
                  <div key={table.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {editingTable?.id === table.id ? (
                      <>
                        <Input value={editingTable.table_number} className="w-24"
                          onChange={(e) => setEditingTable({ ...editingTable, table_number: e.target.value })} />
                        <Select value={editingTable.area_id || ""} onValueChange={(v) => setEditingTable({ ...editingTable, area_id: v })}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" value={editingTable.capacity} className="w-20"
                          onChange={(e) => setEditingTable({ ...editingTable, capacity: Number(e.target.value) })} />
                        <Button size="sm" onClick={handleUpdateTable}><Save className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTable(null)}>Hủy</Button>
                      </>
                    ) : (
                      <>
                        <span className="font-bold w-20">{table.table_number}</span>
                        <span className="text-sm text-muted-foreground flex-1">
                          {areas.find(a => a.id === table.area_id)?.name || "Chưa phân khu"}
                        </span>
                        <Badge variant="outline">{table.capacity} chỗ</Badge>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTable(table)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteTable(table.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
