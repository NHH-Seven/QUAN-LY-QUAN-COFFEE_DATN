# 📦 HƯỚNG DẪN BACKUP VÀ RESTORE DATABASE

## Files Database

### 1. `database_backup_full.sql` 
**File backup đầy đủ** - Chứa toàn bộ:
- Cấu trúc database (tables, indexes, constraints)
- Tất cả dữ liệu (users, products, orders, etc.)
- Sequences và triggers
- Kích thước: ~500KB+

### 2. `server/prisma/schema.prisma`
**Schema Prisma** - Định nghĩa cấu trúc database theo format Prisma ORM

---

## 🔄 CÁCH RESTORE DATABASE

### Phương pháp 1: Restore từ file SQL (Khuyên dùng)

#### Bước 1: Xóa database cũ (nếu có)
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS ecommerce;"
```

#### Bước 2: Tạo database mới
```bash
psql -U postgres -c "CREATE DATABASE ecommerce WITH ENCODING='UTF8';"
```

#### Bước 3: Restore từ file backup
```bash
psql -U postgres -d ecommerce -f database_backup_full.sql
```

#### Bước 4: Kiểm tra
```bash
psql -U postgres -d ecommerce -c "\dt"
```

### Phương pháp 2: Restore từ Prisma Schema

#### Bước 1: Cài đặt dependencies
```bash
cd server
npm install
```

#### Bước 2: Push schema lên database
```bash
npx prisma db push
```

#### Bước 3: Seed dữ liệu mẫu
```bash
npm run seed
```

---

## 💾 CÁCH TẠO BACKUP MỚI

### Backup toàn bộ database
```bash
pg_dump -U postgres -d ecommerce --clean --if-exists --no-owner --no-privileges -f database_backup_full.sql
```

### Backup chỉ cấu trúc (không có dữ liệu)
```bash
pg_dump -U postgres -d ecommerce --schema-only -f database_schema_only.sql
```

### Backup chỉ dữ liệu (không có cấu trúc)
```bash
pg_dump -U postgres -d ecommerce --data-only -f database_data_only.sql
```

### Backup một bảng cụ thể
```bash
pg_dump -U postgres -d ecommerce -t products -f products_backup.sql
```

---

## 📊 THÔNG TIN DATABASE

### Thông tin kết nối
- **Database**: ecommerce
- **User**: postgres
- **Password**: 123456
- **Host**: localhost
- **Port**: 5432
- **Encoding**: UTF8

### Danh sách bảng chính (35 bảng)

#### 👤 User & Auth
1. `users` - Người dùng (admin, sales, warehouse, user)
2. `pending_registrations` - Đăng ký chờ xác thực OTP
3. `password_resets` - Reset mật khẩu
4. `push_subscriptions` - Push notifications

#### 🛍️ Products & Categories
5. `categories` - Danh mục sản phẩm
6. `products` - Sản phẩm
7. `product_questions` - Hỏi đáp sản phẩm
8. `reviews` - Đánh giá sản phẩm
9. `review_images` - Hình ảnh đánh giá

#### 🛒 Cart & Orders
10. `cart_items` - Giỏ hàng
11. `orders` - Đơn hàng
12. `order_items` - Chi tiết đơn hàng

#### 🏪 Store Management
13. `tables` - Quản lý bàn
14. `table_areas` - Khu vực bàn
15. `table_orders` - Đơn hàng tại bàn
16. `table_order_items` - Chi tiết đơn hàng tại bàn

#### 👥 Staff & Shifts
17. `staff_shifts` - Ca làm việc
18. `shifts` - Định nghĩa ca
19. `shift_swap_requests` - Yêu cầu đổi ca

#### 📦 Inventory
20. `stock_transactions` - Giao dịch kho
21. `suppliers` - Nhà cung cấp
22. `product_suppliers` - Liên kết sản phẩm - nhà cung cấp

#### 🎁 Promotions & Loyalty
23. `promotions` - Khuyến mãi
24. `promotion_usage` - Lịch sử sử dụng khuyến mãi
25. `points_history` - Lịch sử tích điểm
26. `wishlist` - Danh sách yêu thích

#### 🔄 Returns
27. `returns` - Đơn trả hàng
28. `return_items` - Chi tiết trả hàng

#### 💬 Chat & Support
29. `chat_sessions` - Phiên chat
30. `chat_messages` - Tin nhắn chat
31. `chatbot_knowledge` - Kiến thức AI chatbot

#### 📍 Addresses
32. `addresses` - Địa chỉ giao hàng

#### 🔔 Notifications
33. `notifications` - Thông báo

#### ⚙️ Settings
34. `settings` - Cài đặt hệ thống

#### 📊 Flash Sales
35. `flash_sales` - Flash sale sản phẩm

---

## 🔍 QUERIES HỮU ÍCH

### Kiểm tra số lượng bản ghi
```sql
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'chatbot_knowledge', COUNT(*) FROM chatbot_knowledge;
```

### Xem tất cả bảng
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### Xem kích thước database
```sql
SELECT pg_size_pretty(pg_database_size('ecommerce'));
```

### Xem kích thước từng bảng
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚨 LƯU Ý QUAN TRỌNG

### 1. Encoding
- Database phải dùng **UTF8** encoding để hỗ trợ tiếng Việt
- Khi tạo database mới: `CREATE DATABASE ecommerce WITH ENCODING='UTF8';`

### 2. Roles & Permissions
- Roles: `user`, `admin`, `sales`, `warehouse`
- **KHÔNG có role "staff"** - đã bỏ

### 3. JWT Token
- Fields: `userId`, `email`, `role`
- **KHÔNG có field "id"** - dùng `userId`

### 4. Demo Accounts
```
admin@nhh-coffee.com / admin123 (admin)
staff@nhh-coffee.com / staff123 (sales)
warehouse@nhh-coffee.com / warehouse123 (warehouse)
user@example.com / password123 (user)
```

### 5. Chatbot Knowledge
- Đã có 6 mục kiến thức mẫu với tiếng Việt
- Encoding đã được fix (UTF8)

---

## 📝 CHANGELOG

### 26/01/2026
- ✅ Fix encoding UTF8 cho tiếng Việt
- ✅ Thêm 6 mục chatbot_knowledge
- ✅ Cập nhật table_orders status logic
- ✅ Bỏ status "cleaning" khỏi tables
- ✅ Fix shifts timezone (Vietnam +7)

### 25/01/2026
- ✅ Thêm tables management
- ✅ Thêm shifts management
- ✅ Thêm chatbot_knowledge table
- ✅ Fix JWT userId field

---

## 🆘 TROUBLESHOOTING

### Lỗi: "database already exists"
```bash
psql -U postgres -c "DROP DATABASE ecommerce;"
```

### Lỗi: "role does not exist"
```bash
psql -U postgres -c "CREATE USER postgres WITH PASSWORD '123456';"
```

### Lỗi encoding tiếng Việt
```sql
-- Kiểm tra encoding
SHOW client_encoding;
SHOW server_encoding;

-- Set UTF8
SET client_encoding TO 'UTF8';
```

### Lỗi permission denied
```bash
# Chạy với quyền admin
psql -U postgres -d ecommerce
```

---

## 📞 SUPPORT

Nếu gặp vấn đề khi restore database:
1. Kiểm tra PostgreSQL đã cài đặt và chạy
2. Kiểm tra user/password đúng
3. Kiểm tra encoding UTF8
4. Xem log lỗi chi tiết

**Database Version**: PostgreSQL 18.1
**Last Updated**: 26/01/2026
