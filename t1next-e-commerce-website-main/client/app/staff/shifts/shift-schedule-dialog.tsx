"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
}

interface Staff {
  id: string
  name: string
  email: string
}

interface Props {
  open: boolean
  onClose: () => void
  onUpdate: () => void
  shifts: Shift[]
  staff: Staff[]
}

export function ShiftScheduleDialog({ open, onClose, onUpdate, shifts, staff }: Props) {
  const [staffId, setStaffId] = useState("")
  const [shiftId, setShiftId] = useState("")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!staffId || !shiftId || selectedDates.length === 0) {
      return toast.error("Vui lòng chọn đầy đủ thông tin")
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const assignments = selectedDates.map(date => ({
        staff_id: staffId,
        shift_id: shiftId,
        work_date: date.toISOString().split("T")[0],
      }))

      console.log('Submitting assignments:', assignments)

      const res = await fetch(`${API_URL}/shifts/schedule/bulk`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ assignments }),
      })

      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Response data:', data)

      if (data.success) {
        toast.success(data.message)
        onUpdate()
        onClose()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error("Lỗi phân công ca")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Phân công ca làm việc</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nhân viên</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ca làm việc</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn ca" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chọn ngày (có thể chọn nhiều ngày)</Label>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => setSelectedDates(dates || [])}
              className="rounded-md border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang xử lý..." : `Phân công (${selectedDates.length} ngày)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
