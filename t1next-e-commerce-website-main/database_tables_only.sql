-- =====================================================
-- NHH COFFEE - DATABASE TABLES SCHEMA
-- =====================================================
-- Database: ecommerce
-- Encoding: UTF8
-- PostgreSQL Version: 18.1
-- Total Tables: 31
-- Date: 26/01/2026
-- =====================================================

-- SET ENCODING
SET client_encoding = 'UTF8';

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'sales', 'warehouse');

CREATE TYPE "OrderStatus" AS ENUM (
    'pending',
    'awaiting_payment',
    'confirmed',
    'shipping',
    'delivered',
    'cancelled'
);

CREATE TYPE "ChatSessionStatus" AS ENUM ('waiting', 'active', 'closed');

CREATE TYPE "StockTransactionType" AS ENUM ('import', 'export', 'adjust', 'order', 'return');

-- =====================================================
-- TABLE 1: USERS
-- =====================================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    role "UserRole" DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    avatar TEXT,
    points INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'bronze',
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 2: PENDING_REGISTRATIONS (OTP Verification)
-- =====================================================
CREATE TABLE pending_registrations (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    otp_hash VARCHAR(255) NOT NULL,
    otp_attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 3: PASSWORD_RESETS
-- =====================================================
CREATE TABLE password_resets (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    otp_attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP(3) NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 4: PUSH_SUBSCRIPTIONS
-- =====================================================
CREATE TABLE push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT UNIQUE NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 5: CATEGORIES
-- =====================================================
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    product_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 6: PRODUCTS
-- =====================================================
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    images TEXT[],
    category_id TEXT NOT NULL,
    brand VARCHAR(100),
    specs JSONB,
    stock INTEGER DEFAULT 0 NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_new BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    discount INTEGER DEFAULT 0,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 7: PRODUCT_QUESTIONS (Q&A)
-- =====================================================
CREATE TABLE product_questions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by TEXT,
    answered_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 8: REVIEWS
-- =====================================================
CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 9: REVIEW_IMAGES
-- =====================================================
CREATE TABLE review_images (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 10: CART_ITEMS
-- =====================================================
CREATE TABLE cart_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 11: ORDERS
-- =====================================================
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status "OrderStatus" DEFAULT 'pending' NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    promotion_id TEXT,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 12: ORDER_ITEMS
-- =====================================================
CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 13: TABLES (Quản lý bàn)
-- =====================================================
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(20) UNIQUE NOT NULL,
    area_id UUID,
    capacity INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available',
    current_order_id UUID,
    qr_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 14: TABLE_AREAS (Khu vực bàn)
-- =====================================================
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 15: TABLE_ORDERS (Đơn hàng tại bàn)
-- =====================================================
CREATE TABLE table_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL,
    staff_id TEXT NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 16: TABLE_ORDER_ITEMS (Chi tiết đơn hàng tại bàn)
-- =====================================================
CREATE TABLE table_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_order_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_order_id) REFERENCES table_orders(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 17: SHIFTS (Định nghĩa ca làm việc)
-- =====================================================
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 18: STAFF_SHIFTS (Ca làm việc của nhân viên)
-- =====================================================
CREATE TABLE staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT NOT NULL,
    shift_id UUID NOT NULL,
    shift_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 19: SHIFT_SWAP_REQUESTS (Yêu cầu đổi ca)
-- =====================================================
CREATE TABLE shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id TEXT NOT NULL,
    requester_shift_id UUID NOT NULL,
    target_id TEXT NOT NULL,
    target_shift_id UUID NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    responded_by TEXT,
    response_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_shift_id) REFERENCES staff_shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_shift_id) REFERENCES staff_shifts(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 20: STOCK_TRANSACTIONS (Giao dịch kho)
-- =====================================================
CREATE TABLE stock_transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    type "StockTransactionType" NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 20: STOCK_TRANSACTIONS (Giao dịch kho)
-- =====================================================
CREATE TABLE promotions (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    start_date TIMESTAMP(3) NOT NULL,
    end_date TIMESTAMP(3) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 22: PROMOTION_USAGE (Lịch sử sử dụng khuyến mãi)
-- =====================================================
CREATE TABLE promotion_usage (
    id TEXT PRIMARY KEY,
    promotion_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 23: POINTS_HISTORY (Lịch sử tích điểm)
-- =====================================================
CREATE TABLE points_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    order_id TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 24: WISHLIST (Danh sách yêu thích)
-- =====================================================
CREATE TABLE wishlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, product_id)
);

-- =====================================================
-- TABLE 25: CHAT_SESSIONS (Phiên chat)
-- =====================================================
CREATE TABLE chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    staff_id TEXT,
    status "ChatSessionStatus" DEFAULT 'waiting' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at TIMESTAMP(3),
    guest_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 26: CHAT_MESSAGES (Tin nhắn chat)
-- =====================================================
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender_id TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sender_type VARCHAR(20) DEFAULT 'user',
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE 27: CHATBOT_KNOWLEDGE (Kiến thức AI chatbot)
-- =====================================================
CREATE TABLE chatbot_knowledge (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 28: CHATBOT_FEEDBACK (Phản hồi chatbot)
-- =====================================================
CREATE TABLE chatbot_feedback (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    message_id TEXT,
    session_id TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 29: ADDRESSES (Địa chỉ giao hàng)
-- =====================================================
CREATE TABLE addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 30: NOTIFICATIONS (Thông báo)
-- =====================================================
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE 31: SETTINGS (Cài đặt hệ thống)
-- =====================================================
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- TABLE 32: FLASH_SALES (Flash sale sản phẩm)
-- =====================================================
CREATE TABLE flash_sales (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    discount_percent INTEGER NOT NULL,
    start_time TIMESTAMP(3) NOT NULL,
    end_time TIMESTAMP(3) NOT NULL,
    stock_limit INTEGER,
    sold_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users
CREATE INDEX idx_users_points ON users(points);
CREATE INDEX idx_users_tier ON users(tier);

-- Products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_is_new ON products(is_new);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_discount ON products(discount);

-- Reviews
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_review_images_review ON review_images(review_id);

-- Product Questions
CREATE INDEX idx_product_questions_product_id ON product_questions(product_id);

-- Points History
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_points_history_created_at ON points_history(created_at);

-- Wishlist
CREATE INDEX idx_wishlist_user ON wishlist(user_id);

-- Promotions
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_promotion_usage_promotion ON promotion_usage(promotion_id);

-- Push Subscriptions
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Stock Transactions
CREATE INDEX idx_stock_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_user ON stock_transactions(user_id);
CREATE INDEX idx_stock_created ON stock_transactions(created_at);

-- Tables
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_area ON tables(area_id);

-- Table Orders
CREATE INDEX idx_table_orders_table ON table_orders(table_id);
CREATE INDEX idx_table_orders_status ON table_orders(status);
CREATE INDEX idx_table_order_items_order ON table_order_items(table_order_id);

-- Staff Shifts
CREATE INDEX idx_staff_shifts_staff ON staff_shifts(staff_id);
CREATE INDEX idx_staff_shifts_shift ON staff_shifts(shift_id);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(shift_date);

-- Shift Swap Requests
CREATE INDEX idx_swap_requests_requester ON shift_swap_requests(requester_id);
CREATE INDEX idx_swap_requests_status ON shift_swap_requests(status);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Tables
ALTER TABLE tables ADD CONSTRAINT fk_tables_current_order 
    FOREIGN KEY (current_order_id) REFERENCES table_orders(id) ON DELETE SET NULL;

ALTER TABLE tables ADD CONSTRAINT tables_area_id_fkey 
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
