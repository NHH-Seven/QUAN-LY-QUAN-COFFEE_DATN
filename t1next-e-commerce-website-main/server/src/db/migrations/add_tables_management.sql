-- Migration: Add Tables Management for Coffee Shop
-- Date: 2025-01-13

-- Drop existing tables if needed (for re-run)
DROP TABLE IF EXISTS table_order_items CASCADE;
DROP TABLE IF EXISTS table_orders CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS areas CASCADE;

-- Bảng khu vực (areas)
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng quản lý bàn (tables)
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number VARCHAR(20) NOT NULL UNIQUE,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  capacity INTEGER DEFAULT 4,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  current_order_id UUID,
  current_guests INTEGER DEFAULT 0,
  occupied_at TIMESTAMP,
  reserved_at TIMESTAMP,
  reserved_for VARCHAR(100),
  reserved_phone VARCHAR(20),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đơn hàng tại bàn (table_orders) - staff_id là TEXT để match với users.id
CREATE TABLE table_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) NOT NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  guests_count INTEGER DEFAULT 1,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  discount_reason VARCHAR(100),
  total DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  payment_method VARCHAR(20),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chi tiết đơn hàng tại bàn (table_order_items)
CREATE TABLE table_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_order_id UUID REFERENCES table_orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tables_area ON tables(area_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_table_orders_table ON table_orders(table_id);
CREATE INDEX idx_table_orders_status ON table_orders(status);
CREATE INDEX idx_table_order_items_order ON table_order_items(table_order_id);

-- Add foreign key for current_order_id
ALTER TABLE tables ADD CONSTRAINT fk_tables_current_order 
  FOREIGN KEY (current_order_id) REFERENCES table_orders(id) ON DELETE SET NULL;

-- Seed data: Khu vuc mau
INSERT INTO areas (name, description, sort_order) VALUES
  ('Trong nha (Tang 1)', 'Khu vuc trong nha tang 1, co dieu hoa', 1),
  ('San vuon', 'Khu vuc san vuon ngoai troi', 2),
  ('Tang 2', 'Khu vuc tang 2, view dep', 3);

-- Seed data: Ban mau
DO $$
DECLARE
  area1_id UUID;
  area2_id UUID;
  area3_id UUID;
BEGIN
  SELECT id INTO area1_id FROM areas WHERE name = 'Trong nha (Tang 1)' LIMIT 1;
  SELECT id INTO area2_id FROM areas WHERE name = 'San vuon' LIMIT 1;
  SELECT id INTO area3_id FROM areas WHERE name = 'Tang 2' LIMIT 1;

  -- Ban trong nha T-01 den T-12
  INSERT INTO tables (table_number, area_id, capacity, status) VALUES
    ('T-01', area1_id, 4, 'occupied'),
    ('T-02', area1_id, 4, 'available'),
    ('T-03', area1_id, 2, 'occupied'),
    ('T-04', area1_id, 4, 'reserved'),
    ('T-05', area1_id, 4, 'available'),
    ('T-06', area1_id, 4, 'available'),
    ('T-07', area1_id, 6, 'available'),
    ('T-08', area1_id, 6, 'available'),
    ('T-09', area1_id, 4, 'available'),
    ('T-10', area1_id, 4, 'available'),
    ('T-11', area1_id, 2, 'available'),
    ('T-12', area1_id, 2, 'available');

  -- Ban san vuon G-01 den G-08
  INSERT INTO tables (table_number, area_id, capacity, status) VALUES
    ('G-01', area2_id, 6, 'occupied'),
    ('G-02', area2_id, 4, 'available'),
    ('G-03', area2_id, 4, 'available'),
    ('G-04', area2_id, 4, 'available'),
    ('G-05', area2_id, 8, 'available'),
    ('G-06', area2_id, 8, 'available'),
    ('G-07', area2_id, 4, 'available'),
    ('G-08', area2_id, 4, 'available');

  -- Ban tang 2: F-01 den F-06
  INSERT INTO tables (table_number, area_id, capacity, status) VALUES
    ('F-01', area3_id, 4, 'available'),
    ('F-02', area3_id, 4, 'available'),
    ('F-03', area3_id, 6, 'available'),
    ('F-04', area3_id, 6, 'available'),
    ('F-05', area3_id, 8, 'available'),
    ('F-06', area3_id, 8, 'available');
END $$;
