/**
 * Shifts Management Routes
 * Quản lý ca làm việc cho nhân viên
 */

import { Router } from 'express'
import { query, queryOne, pool } from '../db/index.js'
import { authMiddleware, adminMiddleware, staffMiddleware } from '../middleware/auth.js'

const router = Router()

interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  description: string | null
  color: string
  is_active: boolean
}

interface StaffShift {
  id: string
  staff_id: string
  staff_name?: string
  shift_id: string
  shift_name?: string
  shift_start?: string
  shift_end?: string
  shift_color?: string
  work_date: string
  status: string
  check_in_time: string | null
  check_out_time: string | null
  notes: string | null
}

interface SwapRequest {
  id: string
  requester_id: string
  requester_name?: string
  requester_shift_id: string
  requester_date?: string
  requester_shift_name?: string
  target_id: string | null
  target_name?: string
  target_shift_id: string | null
  target_date?: string
  target_shift_name?: string
  status: string
  reason: string | null
  response_note: string | null
  responded_by: string | null
  responded_at: string | null
  created_at: string
}

// ==================== SHIFTS (CA LÀM VIỆC) ====================

// GET /api/shifts - Lấy danh sách ca làm việc
router.get('/', authMiddleware, async (req, res) => {
  try {
    const shifts = await query<Shift>('SELECT * FROM shifts WHERE is_active = true ORDER BY start_time')
    res.json({ success: true, data: shifts })
  } catch (error) {
    console.error('Get shifts error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/shifts - Tạo ca làm việc mới (Admin only)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, start_time, end_time, description, color } = req.body

    if (!name || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' })
    }

    const shift = await queryOne<Shift>(
      `INSERT INTO shifts (name, start_time, end_time, description, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, start_time, end_time, description || null, color || '#3b82f6']
    )

    res.status(201).json({ success: true, data: shift })
  } catch (error) {
    console.error('Create shift error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/shifts/:id - Cập nhật ca làm việc (Admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { name, start_time, end_time, description, color, is_active } = req.body

    const shift = await queryOne<Shift>(
      `UPDATE shifts 
       SET name = COALESCE($1, name),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           description = COALESCE($4, description),
           color = COALESCE($5, color),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, start_time, end_time, description, color, is_active, id]
    )

    if (!shift) {
      return res.status(404).json({ success: false, error: 'Ca làm việc không tồn tại' })
    }

    res.json({ success: true, data: shift })
  } catch (error) {
    console.error('Update shift error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// DELETE /api/shifts/:id - Xóa ca làm việc (Admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    await queryOne('UPDATE shifts SET is_active = false WHERE id = $1', [id])
    res.json({ success: true, message: 'Đã xóa ca làm việc' })
  } catch (error) {
    console.error('Delete shift error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// ==================== STAFF SHIFTS (SCHEDULING) ====================

// GET /api/shifts/schedule - Lấy lịch làm việc
router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, staff_id } = req.query
    const user = req.user!

    let sql = `
      SELECT ss.*, 
        u.name as staff_name, u.email as staff_email,
        s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end, s.color as shift_color
      FROM staff_shifts ss
      JOIN users u ON ss.staff_id::text = u.id
      JOIN shifts s ON ss.shift_id = s.id
      WHERE 1=1
    `
    const params: unknown[] = []
    let idx = 1

    // Non-admin can only see their own schedule
    if (user.role !== 'admin') {
      sql += ' AND ss.staff_id = $' + idx
      params.push(user.userId)
      idx++
    } else if (staff_id) {
      sql += ' AND ss.staff_id = $' + idx
      params.push(staff_id)
      idx++
    }

    if (start_date) {
      sql += ' AND ss.work_date >= $' + idx
      params.push(start_date)
      idx++
    }
    if (end_date) {
      sql += ' AND ss.work_date <= $' + idx
      params.push(end_date)
      idx++
    }

    sql += ' ORDER BY ss.work_date, s.start_time'

    const schedule = await query<StaffShift>(sql, params)
    res.json({ success: true, data: schedule })
  } catch (error) {
    console.error('Get schedule error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/shifts/schedule/week - Lấy lịch tuần với tất cả nhân viên
router.get('/schedule/week', adminMiddleware, async (req, res) => {
  try {
    const { start_date } = req.query

    const staff = await query<{ id: string; name: string; role: string }>(
      `SELECT id, name, role FROM users WHERE role IN ('admin', 'sales', 'warehouse') ORDER BY name`
    )

    const shifts = await query<Shift>('SELECT * FROM shifts WHERE is_active = true ORDER BY start_time')

    // Get schedule for the week
    const schedule = await query<StaffShift>(`
      SELECT ss.*, 
        u.name as staff_name,
        s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end, s.color as shift_color
      FROM staff_shifts ss
      JOIN users u ON ss.staff_id::text = u.id
      JOIN shifts s ON ss.shift_id = s.id
      WHERE ss.work_date >= $1 AND ss.work_date < $1::date + interval '7 days'
      ORDER BY ss.work_date, s.start_time
    `, [start_date || new Date().toISOString().split('T')[0]])

    res.json({ success: true, data: { staff, shifts, schedule } })
  } catch (error) {
    console.error('Get week schedule error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/shifts/schedule - Phân công ca (Admin only)
router.post('/schedule', adminMiddleware, async (req, res) => {
  try {
    const { staff_id, shift_id, work_date, notes } = req.body
    const createdBy = req.user!.userId

    if (!staff_id || !shift_id || !work_date) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc' })
    }

    const staffShift = await queryOne<StaffShift>(
      `INSERT INTO staff_shifts (staff_id, shift_id, work_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (staff_id, shift_id, work_date) DO UPDATE SET
         notes = COALESCE($4, staff_shifts.notes),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [staff_id, shift_id, work_date, notes || null, createdBy]
    )

    res.status(201).json({ success: true, data: staffShift })
  } catch (error) {
    console.error('Create staff shift error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/shifts/schedule/bulk - Phân công nhiều ca (Admin only)
router.post('/schedule/bulk', adminMiddleware, async (req, res) => {
  const client = await pool.connect()
  try {
    const { assignments } = req.body // Array of { staff_id, shift_id, work_date }
    const createdBy = req.user!.userId

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ success: false, error: 'Danh sách phân công trống' })
    }

    await client.query('BEGIN')

    for (const a of assignments) {
      await client.query(
        `INSERT INTO staff_shifts (staff_id, shift_id, work_date, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (staff_id, shift_id, work_date) DO NOTHING`,
        [a.staff_id, a.shift_id, a.work_date, createdBy]
      )
    }

    await client.query('COMMIT')
    res.json({ success: true, message: `Đã phân công ${assignments.length} ca` })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Bulk assign error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// DELETE /api/shifts/schedule/:id - Xóa phân công (Admin only)
router.delete('/schedule/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    await queryOne('DELETE FROM staff_shifts WHERE id = $1', [id])
    res.json({ success: true, message: 'Đã xóa phân công' })
  } catch (error) {
    console.error('Delete schedule error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// ==================== CHECK IN/OUT ====================

// POST /api/shifts/check-in - Check in ca làm việc
router.post('/check-in', staffMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId
    // Use Vietnam timezone (UTC+7)
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    const today = vietnamTime.toISOString().split('T')[0]

    const staffShift = await queryOne<StaffShift>(
      `UPDATE staff_shifts 
       SET status = 'working', 
           check_in_time = CURRENT_TIME,
           updated_at = CURRENT_TIMESTAMP
       WHERE staff_id::text = $1 AND work_date = $2 AND status = 'scheduled'
       RETURNING *`,
      [userId, today]
    )

    if (!staffShift) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy ca làm việc hôm nay' })
    }

    res.json({ success: true, data: staffShift, message: 'Check-in thành công' })
  } catch (error) {
    console.error('Check-in error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/shifts/check-out - Check out ca làm việc
router.post('/check-out', staffMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId
    // Use Vietnam timezone (UTC+7)
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    const today = vietnamTime.toISOString().split('T')[0]

    const staffShift = await queryOne<StaffShift>(
      `UPDATE staff_shifts 
       SET status = 'completed', 
           check_out_time = CURRENT_TIME,
           updated_at = CURRENT_TIMESTAMP
       WHERE staff_id::text = $1 AND work_date = $2 AND status = 'working'
       RETURNING *`,
      [userId, today]
    )

    if (!staffShift) {
      return res.status(404).json({ success: false, error: 'Bạn chưa check-in hoặc đã check-out' })
    }

    res.json({ success: true, data: staffShift, message: 'Check-out thành công' })
  } catch (error) {
    console.error('Check-out error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/shifts/my-status - Lấy trạng thái ca hiện tại
router.get('/my-status', staffMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId
    // Use Vietnam timezone (UTC+7)
    const now = new Date()
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    const today = vietnamTime.toISOString().split('T')[0]

    console.log('My-status query:', { userId, today, utc: now.toISOString(), vietnam: vietnamTime.toISOString() })

    const currentShifts = await query<StaffShift>(
      `SELECT ss.*, 
        s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end, s.color as shift_color
       FROM staff_shifts ss
       JOIN shifts s ON ss.shift_id = s.id
       WHERE ss.staff_id::text = $1 AND ss.work_date = $2`,
      [userId, today]
    )

    console.log('My-status result:', currentShifts)

    res.json({ success: true, data: currentShifts })
  } catch (error) {
    console.error('Get status error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// ==================== SWAP REQUESTS ====================

// GET /api/shifts/swap-requests - Lấy danh sách yêu cầu đổi ca
router.get('/swap-requests', staffMiddleware, async (req, res) => {
  try {
    const { status } = req.query
    const user = req.user!

    let sql = `
      SELECT sr.*,
        u1.name as requester_name,
        u2.name as target_name,
        ss1.work_date as requester_date,
        ss2.work_date as target_date,
        s1.name as requester_shift_name,
        s2.name as target_shift_name
      FROM shift_swap_requests sr
      JOIN users u1 ON sr.requester_id = u1.id
      LEFT JOIN users u2 ON sr.target_id = u2.id
      JOIN staff_shifts ss1 ON sr.requester_shift_id = ss1.id
      LEFT JOIN staff_shifts ss2 ON sr.target_shift_id = ss2.id
      JOIN shifts s1 ON ss1.shift_id = s1.id
      LEFT JOIN shifts s2 ON ss2.shift_id = s2.id
      WHERE 1=1
    `
    const params: unknown[] = []
    let idx = 1

    // Non-admin only see their own requests or requests targeting them
    if (user.role !== 'admin') {
      sql += ' AND (sr.requester_id = $' + idx + ' OR sr.target_id = $' + idx + ')'
      params.push(user.userId)
      idx++
    }

    if (status) {
      sql += ' AND sr.status = $' + idx
      params.push(status)
      idx++
    }

    sql += ' ORDER BY sr.created_at DESC'

    const requests = await query<SwapRequest>(sql, params)
    res.json({ success: true, data: requests })
  } catch (error) {
    console.error('Get swap requests error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/shifts/swap-requests - Tạo yêu cầu đổi ca
router.post('/swap-requests', staffMiddleware, async (req, res) => {
  try {
    const requesterId = req.user!.userId
    const { requester_shift_id, target_id, target_shift_id, reason } = req.body

    if (!requester_shift_id) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin ca cần đổi' })
    }

    // Verify requester owns the shift
    const requesterShift = await queryOne<StaffShift>(
      'SELECT * FROM staff_shifts WHERE id = $1 AND staff_id::text = $2',
      [requester_shift_id, requesterId]
    )

    if (!requesterShift) {
      return res.status(400).json({ success: false, error: 'Ca làm việc không hợp lệ' })
    }

    // If target specified, verify target owns their shift
    if (target_id && target_shift_id) {
      const targetShift = await queryOne<StaffShift>(
        'SELECT * FROM staff_shifts WHERE id = $1 AND staff_id::text = $2',
        [target_shift_id, target_id]
      )
      if (!targetShift) {
        return res.status(400).json({ success: false, error: 'Ca của người nhận không hợp lệ' })
      }
    }

    const request = await queryOne<SwapRequest>(
      `INSERT INTO shift_swap_requests (requester_id, requester_shift_id, target_id, target_shift_id, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [requesterId, requester_shift_id, target_id || null, target_shift_id || null, reason || null]
    )

    res.status(201).json({ success: true, data: request, message: 'Đã gửi yêu cầu đổi ca' })
  } catch (error) {
    console.error('Create swap request error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/shifts/swap-requests/:id/respond - Phản hồi yêu cầu đổi ca
router.put('/swap-requests/:id/respond', staffMiddleware, async (req, res) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    const { action, response_note } = req.body // action: 'approve' | 'reject'
    const responderId = req.user!.userId
    const isAdmin = req.user!.role === 'admin'

    const request = await queryOne<SwapRequest>(
      'SELECT * FROM shift_swap_requests WHERE id = $1',
      [id]
    )

    if (!request) {
      return res.status(404).json({ success: false, error: 'Yêu cầu không tồn tại' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Yêu cầu đã được xử lý' })
    }

    // Check permission
    if (!isAdmin && request.target_id !== responderId) {
      return res.status(403).json({ success: false, error: 'Không có quyền xử lý yêu cầu này' })
    }

    await client.query('BEGIN')

    // Update request status
    await client.query(
      `UPDATE shift_swap_requests 
       SET status = $1, response_note = $2, responded_by = $3, responded_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [action === 'approve' ? 'approved' : 'rejected', response_note || null, responderId, id]
    )

    // If approved, swap the shifts
    if (action === 'approve' && request.target_shift_id) {
      await client.query(
        'UPDATE staff_shifts SET staff_id = $1 WHERE id = $2',
        [request.target_id, request.requester_shift_id]
      )
      await client.query(
        'UPDATE staff_shifts SET staff_id = $1 WHERE id = $2',
        [request.requester_id, request.target_shift_id]
      )
    }

    await client.query('COMMIT')

    res.json({ 
      success: true, 
      message: action === 'approve' ? 'Đã chấp nhận yêu cầu đổi ca' : 'Đã từ chối yêu cầu đổi ca' 
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Respond swap request error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  } finally {
    client.release()
  }
})

// DELETE /api/shifts/swap-requests/:id - Hủy yêu cầu đổi ca
router.delete('/swap-requests/:id', staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const request = await queryOne<SwapRequest>(
      'SELECT * FROM shift_swap_requests WHERE id = $1',
      [id]
    )

    if (!request) {
      return res.status(404).json({ success: false, error: 'Yêu cầu không tồn tại' })
    }

    if (request.requester_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Không có quyền hủy yêu cầu này' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể hủy yêu cầu đang chờ' })
    }

    await queryOne('DELETE FROM shift_swap_requests WHERE id = $1', [id])
    res.json({ success: true, message: 'Đã hủy yêu cầu đổi ca' })
  } catch (error) {
    console.error('Delete swap request error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/shifts/available-for-swap - Lấy danh sách ca có thể đổi
router.get('/available-for-swap', staffMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { date } = req.query

    const shifts = await query<StaffShift>(
      `SELECT ss.*, 
        u.name as staff_name,
        s.name as shift_name, s.start_time as shift_start, s.end_time as shift_end
       FROM staff_shifts ss
       JOIN users u ON ss.staff_id::text = u.id
       JOIN shifts s ON ss.shift_id = s.id
       WHERE ss.staff_id::text != $1 
         AND ss.work_date >= CURRENT_DATE
         AND ss.status = 'scheduled'
       ${date ? 'AND ss.work_date = $2' : ''}
       ORDER BY ss.work_date, s.start_time LIMIT 50`,
      date ? [userId, date] : [userId]
    )

    res.json({ success: true, data: shifts })
  } catch (error) {
    console.error('Get available shifts error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

export default router
