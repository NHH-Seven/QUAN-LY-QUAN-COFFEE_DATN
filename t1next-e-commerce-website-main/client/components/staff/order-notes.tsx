"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface OrderNote {
  id: string
  note: string
  staff_name: string
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export function OrderNotes({ orderId }: { orderId: string }) {
  const [notes, setNotes] = useState<OrderNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotes()
  }, [orderId])

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/order-notes/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setNotes(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newNote.trim()) return
    setSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/order-notes/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note: newNote.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setNewNote("")
        fetchNotes()
      } else {
        toast({ title: data.error, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Lỗi kết nối", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm("Xóa ghi chú này?")) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/order-notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) fetchNotes()
    } catch (err) {
      toast({ title: "Lỗi", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Ghi chú nội bộ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <div className="flex gap-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Thêm ghi chú..."
            rows={2}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={submitting || !newNote.trim()} size="icon">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {/* Notes list */}
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chưa có ghi chú</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{note.staff_name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{note.staff_name || "Staff"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleString("vi-VN")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{note.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
