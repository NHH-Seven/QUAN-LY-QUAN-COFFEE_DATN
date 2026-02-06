"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface StaffShift {
  id: string
  staff_id: string
  staff_name: string
  shift_name: string
  shift_start: string
  shift_end: string
  shift_color: string
  work_date: string
}

interface Props {
  open: boolean
  onClose: () => void
  onUpdate: () => void
  myShifts: StaffShift[]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })
}

export function SwapRequestDialog({ open, onClose, onUpdate, myShifts }: Props) {
  const [myShiftId, setMyShiftId] = useState("")
  const [availableShifts, setAvailableShifts] = useState<StaffShift[]>([])
  const [targetShiftId, setTargetShiftId] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log('SwapRequestDialog opened')
      console.log('My shifts received:', myShifts)
      console.log('My shifts length:', myShifts.length)
    }
  }, [open, myShifts])

  // Fetch available shifts for swap
  useEffect(() => {
    if (open) {
      const token = localStorage.getItem('token')
      fetch(`${API_URL}/shifts/available-for-swap`, { 
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
        .then(res => res.json())
        .then(data => {
          console.log('Available shifts response:', data)
          if (data.success) setAvailableShifts(data.data)
        })
    }
  }, [open])

  const handleSubmit = async () => {
    if (!myShiftId) {
      return toast.error("Vui lòng chọn ca của bạn")
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const targetShift = availableShifts.find(s => s.id === targetShiftId)
      
      const res = await fetch(`${API_URL}/shifts/swap-requests`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          requester_shift_id: myShiftId,
          target_id: targetShift?.staff_id || null,
          target_shift_id: targetShiftId && targetShiftId.trim() ? targetShiftId : null,
          reason,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        onUpdate()
        onClose()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Lỗi gửi yêu cầu")
    } finally {
      setLoading(false)
    }
  }

  // Filter future shifts only (including today)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset to start of day
  const futureShifts = myShifts.filter(s => {
    const shiftDate = new Date(s.work_date)
    shiftDate.setHours(0, 0, 0, 0)
    return shiftDate >= today
  })

  console.log('Today:', today)
  console.log('Future shifts after filter:', futureShifts)
  console.log('Future shifts length:', futureShifts.length)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yêu cầu đổi ca</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ca của bạn muốn đổi</Label>
            <Select value={myShiftId} onValueChange={setMyShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn ca của bạn" />
              </SelectTrigger>
              <SelectContent>
                {futureShifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.shift_name} - {formatDate(s.work_date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ca muốn đổi sang (tùy chọn)</Label>
            <Select value={targetShiftId} onValueChange={setTargetShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn ca muốn đổi hoặc để trống" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Không chỉ định (yêu cầu chung)</SelectItem>
                {availableShifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.staff_name} - {s.shift_name} - {formatDate(s.work_date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lý do đổi ca</Label>
            <Textarea
              placeholder="Nhập lý do..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
