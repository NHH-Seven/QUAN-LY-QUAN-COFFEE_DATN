-- =====================================================
-- NHH COFFEE - QUICK DATABASE SETUP
-- =====================================================
-- Database: ecommerce
-- User: postgres / Password: 123456
-- Encoding: UTF8
-- Version: PostgreSQL 18.1
-- Date: 26/01/2026
-- =====================================================

-- DROP DATABASE IF EXISTS
DROP DATABASE IF EXISTS ecommerce;

-- CREATE DATABASE WITH UTF8 ENCODING
CREATE DATABASE ecommerce WITH ENCODING='UTF8';

-- CONNECT TO DATABASE
\c ecommerce

-- =====================================================
-- DEMO USERS (Passwords are hashed with bcrypt)
-- =====================================================
-- admin@nhh-coffee.com / admin123 (admin)
-- staff@nhh-coffee.com / staff123 (sales)
-- warehouse@nhh-coffee.com / warehouse123 (warehouse)
-- user@example.com / password123 (user)

-- =====================================================
-- RESTORE COMMANDS
-- =====================================================
-- Method 1: Restore from full backup
-- psql -U postgres -d ecommerce -f database_backup_full.sql

-- Method 2: Use Prisma
-- cd server
-- npx prisma db push
-- npm run seed

-- =====================================================
-- VERIFY DATABASE
-- =====================================================
-- Check tables
-- \dt

-- Check encoding
-- SHOW client_encoding;
-- SHOW server_encoding;

-- Check data count
-- SELECT 'users' as table_name, COUNT(*) FROM users
-- UNION ALL SELECT 'products', COUNT(*) FROM products
-- UNION ALL SELECT 'orders', COUNT(*) FROM orders
-- UNION ALL SELECT 'chatbot_knowledge', COUNT(*) FROM chatbot_knowledge;

-- =====================================================
-- IMPORTANT TABLES
-- =====================================================
-- 31 tables total:
-- 
-- USER & AUTH:
--   - users (admin, sales, warehouse, user)
--   - pending_registrations (OTP verification)
--   - password_resets
--   - push_subscriptions
--
-- PRODUCTS:
--   - categories (8 categories)
--   - products (40 products)
--   - product_questions
--   - reviews
--   - review_images
--
-- ORDERS:
--   - cart_items
--   - orders
--   - order_items
--
-- STORE:
--   - tables (quản lý bàn)
--   - table_areas
--   - table_orders (đơn hàng tại bàn)
--   - table_order_items
--
-- STAFF:
--   - staff_shifts (ca làm việc)
--   - shifts
--   - shift_swap_requests (đổi ca)
--
-- INVENTORY:
--   - stock_transactions
--
-- PROMOTIONS:
--   - promotions
--   - promotion_usage
--   - points_history (tích điểm)
--   - wishlist
--
-- CHAT:
--   - chat_sessions
--   - chat_messages
--   - chatbot_knowledge (AI knowledge base)
--
-- OTHER:
--   - addresses
--   - notifications
--   - settings
--   - flash_sales

-- =====================================================
-- CHATBOT KNOWLEDGE (6 items with UTF8 encoding)
-- =====================================================
-- 1. Giờ mở cửa - NHH Coffee mở cửa từ 7h sáng đến 10h tối
-- 2. Wifi miễn phí - Mật khẩu: NHHCoffee2024
-- 3. Bãi đậu xe - 20 xe máy và 5 ô tô
-- 4. Đặt bàn trước - Hotline 1900-xxxx
-- 5. Giao hàng tận nơi - Bán kính 5km, phí từ 15k
-- 6. Chương trình khách hàng thân thiết - Tích điểm đổi quà

-- =====================================================
-- PRODUCTS (40 items)
-- =====================================================
-- Categories:
-- 1. Cà phê (15 items) - Đen đá, Sữa đá, Bạc xỉu, Espresso, etc.
-- 2. Trà (12 items) - Đào cam sả, Vải, Sen vàng, Oolong, Matcha
-- 3. Đá xay (8 items) - Chocolate, Cookies & Cream, Dâu, Caramel
-- 4. Nước ép & Sinh tố (10 items) - Cam, Dưa hấu, Bơ, Xoài
-- 5. Bánh ngọt (12 items) - Tiramisu, Cheesecake, Croissant, etc.
-- 6. Snack & Đồ ăn nhẹ (8 items) - Khoai tây chiên, Gà viên, Sandwich
-- 7. Combo (6 items) - Combo sáng, Combo đôi, Combo nhóm
-- 8. Cà phê hạt (10 items) - Arabica Đà Lạt, Robusta Buôn Ma Thuột

-- =====================================================
-- CONNECTION STRING
-- =====================================================
-- postgresql://postgres:123456@localhost:5432/ecommerce

-- =====================================================
-- SERVER CONFIGURATION
-- =====================================================
-- File: server/.env
-- DATABASE_URL=postgresql://postgres:123456@localhost:5432/ecommerce
-- PORT=3001
-- JWT_SECRET=your-secret-key
-- GEMINI_API_KEY=AIzaSyD6p382k9qvx_Mug4RizV9Oz-R5cUOewNI

-- =====================================================
-- CLIENT CONFIGURATION
-- =====================================================
-- File: client/.env.local
-- NEXT_PUBLIC_API_URL=http://localhost:3001/api

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Database encoding MUST be UTF8 for Vietnamese
-- 2. Roles: user, admin, sales, warehouse (NO "staff" role)
-- 3. JWT fields: userId, email, role (NO "id" field)
-- 4. Token stored in localStorage with key "token"
-- 5. All API calls need: Authorization: Bearer ${token}

-- =====================================================
-- END OF QUICK SETUP
-- =====================================================
