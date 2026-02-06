-- Migration: Add Shifts Management for Coffee Shop
-- Date: 2025-01-13

-- Drop existing tables if needed (for re-run)
DROP TABLE IF EXISTS shift_swap_requests CASCADE;
DROP TABLE IF EXISTS staff_shifts CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;

-- Bang dinh nghia ca lam viec (shifts)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bang phan cong ca lam viec (staff_shifts)
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'checked_out', 'absent', 'swapped')),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  notes TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, shift_id, work_date)
);

-- Bang yeu cau doi ca (shift_swap_requests)
CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  requester_shift_id UUID REFERENCES staff_shifts(id) ON DELETE CASCADE,
  target_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_shift_id UUID REFERENCES staff_shifts(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason TEXT,
  response_note TEXT,
  responded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_staff_shifts_staff ON staff_shifts(staff_id);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(work_date);
CREATE INDEX idx_staff_shifts_shift ON staff_shifts(shift_id);
CREATE INDEX idx_swap_requests_requester ON shift_swap_requests(requester_id);
CREATE INDEX idx_swap_requests_status ON shift_swap_requests(status);

-- Seed data: Ca lam viec mau
INSERT INTO shifts (name, start_time, end_time, description, color) VALUES
  ('Ca sang', '06:00', '14:00', 'Ca lam viec buoi sang', '#22c55e'),
  ('Ca chieu', '14:00', '22:00', 'Ca lam viec buoi chieu', '#3b82f6'),
  ('Ca toi', '18:00', '23:00', 'Ca lam viec buoi toi', '#8b5cf6'),
  ('Ca hanh chinh', '08:00', '17:00', 'Ca hanh chinh van phong', '#f59e0b');
