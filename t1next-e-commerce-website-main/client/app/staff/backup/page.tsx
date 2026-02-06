"use client"

import { useState, useEffect } from "react"
import { Database, Download, Trash2, Plus, Loader2, RefreshCw, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Backup {
  filename: string
  size: number
  sizeFormatted: string
  createdAt: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backup`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setBackups(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error)
      toast({ title: "Lỗi", description: "Không thể tải danh sách backup", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const createBackup = async () => {
    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Thành công", description: data.message })
        fetchBackups()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to create backup:', error)
      toast({ title: "Lỗi", description: "Không thể tạo backup", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = (filename: string) => {
    const token = localStorage.getItem('token')
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/admin/backup/${filename}?token=${token}`, '_blank')
  }

  const deleteBackup = async (filename: string) => {
    setDeleting(filename)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/backup/${filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Đã xóa backup" })
        setBackups(prev => prev.filter(b => b.filename !== filename))
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast({ title: "Lỗi", description: "Không thể xóa backup", variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Sao lưu dữ liệu
          </h1>
          <p className="text-muted-foreground">Quản lý backup database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBackups} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button onClick={createBackup} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Tạo backup
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách backup</CardTitle>
          <CardDescription>
            {backups.length} backup đã lưu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mb-4" />
              <p>Chưa có backup nào</p>
              <Button variant="link" onClick={createBackup} disabled={creating}>
                Tạo backup đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên file</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Kích thước</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.filename}>
                    <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                    <TableCell>
                      <Badge variant={backup.filename.endsWith('.sql') ? 'default' : 'secondary'}>
                        {backup.filename.endsWith('.sql') ? 'SQL' : 'JSON'}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.sizeFormatted}</TableCell>
                    <TableCell>{formatDate(backup.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadBackup(backup.filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa backup?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa backup "{backup.filename}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBackup(backup.filename)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleting === backup.filename ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Xóa"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
