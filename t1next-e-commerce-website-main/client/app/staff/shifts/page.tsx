"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, Clock, Users, ArrowLeftRight, Check, X,
  ChevronLeft, ChevronRight, Plus, LogIn, LogOut
} from "lucide-react"
import { toast } from "sonner"
import { ShiftScheduleDialog } from "./shift-schedule-dialog"
import { SwapRequestDialog } from "./swap-request-dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
}

interface StaffShift {
  id: string
  staff_id: string
  staff_name: string
  shift_id: string
  shift_name: string
  shift_start: string
  shift_end: string
  shift_color: string
  work_date: string
  status: string
  check_in_time: string | null
  check_out_time: string | null
}

interface Staff {
  id: string
  name: string
  email: string
  role: string
}

interface SwapRequest {
  id: string
  requester_name: string
  requester_date: string
  requester_shift_name: string
  target_name: string | null
  target_date: string | null
  target_shift_name: string | null
  status: string
  reason: string | null
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Đã lên lịch", color: "bg-blue-500" },
  checked_in: { label: "Đang làm", color: "bg-green-500" },
  checked_out: { label: "Đã xong", color: "bg-gray-500" },
  absent: { label: "Vắng mặt", color: "bg-red-500" },
  swapped: { label: "Đã đổi ca", color: "bg-purple-500" },
}

function formatTime(time: string) {
  return time?.slice(0, 5) || ""
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })
}

function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = []
  const start = new Date(startDate)
  start.setDate(start.getDate() - start.getDay() + 1) // Monday
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(start))
    start.setDate(start.getDate() + 1)
  }
  return dates
}

export default function ShiftsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [schedule, setSchedule] = useState<StaffShift[]>([])
  const [myStatus, setMyStatus] = useState<StaffShift[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showSwapDialog, setShowSwapDialog] = useState(false)

  const weekDates = getWeekDates(currentWeek)
  const weekStart = weekDates[0].toISOString().split("T")[0]

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      console.log('Fetching data with token:', token ? 'exists' : 'missing')
      console.log('User role:', user?.role)
      console.log('Week start:', weekStart)
      
      const [shiftsRes, weekRes, statusRes, swapRes] = await Promise.all([
        fetch(`${API_URL}/shifts`, { credentials: "include", headers }).catch(err => {
          console.error('Shifts fetch error:', err)
          return { ok: false, json: async () => ({ success: false, error: err.message }) }
        }),
        user?.role === "admin" 
          ? fetch(`${API_URL}/shifts/schedule/week?start_date=${weekStart}`, { credentials: "include", headers }).catch(err => {
              console.error('Week schedule fetch error:', err)
              return { ok: false, json: async () => ({ success: false, error: err.message }) }
            })
          : fetch(`${API_URL}/shifts/schedule?start_date=${weekStart}&end_date=${weekDates[6].toISOString().split("T")[0]}`, { credentials: "include", headers }).catch(err => {
              console.error('Schedule fetch error:', err)
              return { ok: false, json: async () => ({ success: false, error: err.message }) }
            }),
        fetch(`${API_URL}/shifts/my-status`, { credentials: "include", headers }).catch(err => {
          console.error('My status fetch error:', err)
          return { ok: false, json: async () => ({ success: false, error: err.message }) }
        }),
        fetch(`${API_URL}/shifts/swap-requests`, { credentials: "include", headers }).catch(err => {
          console.error('Swap requests fetch error:', err)
          return { ok: false, json: async () => ({ success: false, error: err.message }) }
        }),
      ])

      const shiftsData = await shiftsRes.json()
      const weekData = await weekRes.json()
      const statusData = await statusRes.json()
      const swapData = await swapRes.json()

      console.log('Shifts data:', shiftsData)
      console.log('Week data:', weekData)
      console.log('Status data:', statusData)
      console.log('Swap data:', swapData)
      console.log('Staff from week data:', weekData.data?.staff)

      if (shiftsData.success) setShifts(shiftsData.data || [])
      if (weekData.success) {
        if (user?.role === "admin") {
          console.log('Setting staff:', weekData.data.staff)
          setStaff(weekData.data.staff || [])
          setSchedule(weekData.data.schedule || [])
        } else {
          console.log('Non-admin schedule data:', weekData.data)
          console.log('Schedule length:', weekData.data?.length)
          setSchedule(weekData.data || [])
        }
      }
      console.log('Schedule state after setting:', schedule)
      if (statusData.success) setMyStatus(statusData.data || [])
      if (swapData.success) setSwapRequests(swapData.data || [])
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (user && !["admin", "warehouse", "sales"].includes(user.role)) {
      router.push("/")
      return
    }
    if (user) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.role, weekStart])

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/shifts/check-in`, {
        method: "POST",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Lỗi chấm công")
    }
  }

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/shifts/check-out`, {
        method: "POST",
        credentials: "include",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Lỗi chấm công")
    }
  }

  const handleRespondSwap = async (id: string, action: "approve" | "reject") => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/shifts/swap-requests/${id}/respond`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error("Lỗi xử lý yêu cầu")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isAdmin = user?.role === "admin"
  const currentShift = myStatus.find(s => s.status === "checked_in")
  const scheduledShift = myStatus.find(s => s.status === "scheduled")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ca làm việc</h1>
          <p className="text-sm text-muted-foreground">Quản lý lịch làm việc và đổi ca</p>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <Button variant="outline" onClick={() => {
              console.log('Opening swap dialog with schedule:', schedule)
              console.log('Schedule length:', schedule.length)
              setShowSwapDialog(true)
            }}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Yêu cầu đổi ca
            </Button>
          )}
          {isAdmin && (
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Phân công ca
            </Button>
          )}
        </div>
      </div>
          {/* My Status Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ca làm việc hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myStatus.length === 0 ? (
                <p className="text-muted-foreground">Bạn không có ca làm việc hôm nay</p>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {myStatus.map((shift) => (
                      <div key={shift.id} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: shift.shift_color }} />
                        <div>
                          <p className="font-medium">{shift.shift_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                          </p>
                        </div>
                        <Badge className={statusConfig[shift.status]?.color}>
                          {statusConfig[shift.status]?.label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {scheduledShift && !currentShift && (
                      <Button onClick={handleCheckIn}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Chấm công vào
                      </Button>
                    )}
                    {currentShift && (
                      <Button variant="outline" onClick={handleCheckOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Chấm công ra
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="schedule">
            <TabsList>
              <TabsTrigger value="schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Lịch làm việc
              </TabsTrigger>
              <TabsTrigger value="swap">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Yêu cầu đổi ca
                {swapRequests.filter(r => r.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {swapRequests.filter(r => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Lịch tuần</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => {
                        const prev = new Date(currentWeek)
                        prev.setDate(prev.getDate() - 7)
                        setCurrentWeek(prev)
                      }}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium min-w-[200px] text-center">
                        {formatDate(weekDates[0].toISOString())} - {formatDate(weekDates[6].toISOString())}
                      </span>
                      <Button variant="outline" size="icon" onClick={() => {
                        const next = new Date(currentWeek)
                        next.setDate(next.getDate() + 7)
                        setCurrentWeek(next)
                      }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 bg-muted text-left min-w-[120px]">
                            {isAdmin ? "Nhân viên" : "Ca"}
                          </th>
                          {weekDates.map((date) => (
                            <th key={date.toISOString()} className="border p-2 bg-muted text-center min-w-[100px]">
                              <div className="text-xs text-muted-foreground">
                                {date.toLocaleDateString("vi-VN", { weekday: "short" })}
                              </div>
                              <div className="font-medium">
                                {date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {isAdmin ? (
                          staff.map((s) => (
                            <tr key={s.id}>
                              <td className="border p-2 font-medium">{s.name}</td>
                              {weekDates.map((date) => {
                                const dateStr = date.toISOString().split("T")[0]
                                const dayShifts = schedule.filter(
                                  (sh) => sh.staff_id === s.id && sh.work_date.split("T")[0] === dateStr
                                )
                                return (
                                  <td key={dateStr} className="border p-1">
                                    {dayShifts.map((sh) => (
                                      <div
                                        key={sh.id}
                                        className="text-xs p-1 rounded mb-1 text-white"
                                        style={{ backgroundColor: sh.shift_color }}
                                      >
                                        {sh.shift_name}
                                        <br />
                                        {formatTime(sh.shift_start)}-{formatTime(sh.shift_end)}
                                      </div>
                                    ))}
                                  </td>
                                )
                              })}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border p-2 font-medium">{user?.name}</td>
                            {weekDates.map((date) => {
                              const dateStr = date.toISOString().split("T")[0]
                              const dayShifts = schedule.filter(
                                (sh) => sh.work_date.split("T")[0] === dateStr
                              )
                              console.log(`Date: ${dateStr}, Schedule:`, schedule.map(s => ({ date: s.work_date, split: s.work_date.split("T")[0] })))
                              console.log(`Day shifts for ${dateStr}:`, dayShifts)
                              return (
                                <td key={dateStr} className="border p-1">
                                  {dayShifts.map((sh) => (
                                    <div
                                      key={sh.id}
                                      className="text-xs p-1 rounded mb-1 text-white"
                                      style={{ backgroundColor: sh.shift_color }}
                                    >
                                      {sh.shift_name}
                                      <br />
                                      {formatTime(sh.shift_start)}-{formatTime(sh.shift_end)}
                                    </div>
                                  ))}
                                </td>
                              )
                            })}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Swap Requests Tab */}
            <TabsContent value="swap" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Yêu cầu đổi ca</CardTitle>
                </CardHeader>
                <CardContent>
                  {swapRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Không có yêu cầu đổi ca nào</p>
                  ) : (
                    <div className="space-y-3">
                      {swapRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{req.requester_name}</span>
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{req.target_name || "Chưa chỉ định"}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="text-primary">{req.requester_shift_name}</span>
                              {" "}({formatDate(req.requester_date)})
                              {req.target_shift_name && (
                                <>
                                  {" ↔ "}
                                  <span className="text-primary">{req.target_shift_name}</span>
                                  {" "}({formatDate(req.target_date!)})
                                </>
                              )}
                            </div>
                            {req.reason && (
                              <p className="text-sm text-muted-foreground mt-1">Lý do: {req.reason}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {req.status === "pending" ? (
                              isAdmin || req.target_name === user?.name ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleRespondSwap(req.id, "reject")}>
                                    <X className="h-4 w-4 mr-1" /> Từ chối
                                  </Button>
                                  <Button size="sm" onClick={() => handleRespondSwap(req.id, "approve")}>
                                    <Check className="h-4 w-4 mr-1" /> Chấp nhận
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="outline">Chờ duyệt</Badge>
                              )
                            ) : (
                              <Badge variant={req.status === "approved" ? "default" : "secondary"}>
                                {req.status === "approved" ? "Đã duyệt" : req.status === "rejected" ? "Đã từ chối" : "Đã hủy"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      {/* Dialogs */}
      {showScheduleDialog && (
        <ShiftScheduleDialog
          open={showScheduleDialog}
          onClose={() => setShowScheduleDialog(false)}
          onUpdate={fetchData}
          shifts={shifts}
          staff={staff}
        />
      )}

      {showSwapDialog && (
        <SwapRequestDialog
          open={showSwapDialog}
          onClose={() => setShowSwapDialog(false)}
          onUpdate={fetchData}
          myShifts={schedule}
        />
      )}
    </div>
  )
}
