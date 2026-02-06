# 📦 CÁC FILE SQL DATABASE

## 📄 Danh sách files

### 1. **`database_tables_only.sql`** ⭐ (Khuyên dùng)
- ✅ File SQL sạch, dễ đọc nhất
- ✅ Chỉ chứa CREATE TABLE statements
- ✅ Có comments giải thích từng bảng
- ✅ Có indexes và foreign keys
- ✅ **31 bảng** (đã xóa returns và suppliers)
- ✅ Đã cập nhật mới nhất

**Nội dung:**
- ENUMS (UserRole, OrderStatus, ChatSessionStatus, StockTransactionType)
- 31 CREATE TABLE statements
- Indexes
- Foreign key constraints

**Kích thước**: ~15KB

---

### 2. **`database_schema_latest.sql`**
- ✅ Export trực tiếp từ database hiện tại
- ✅ Đầy đủ nhất, chính xác 100%
- ✅ Bao gồm tất cả constraints, indexes
- ✅ Format chuẩn PostgreSQL

**Kích thước**: ~50KB

---

### 3. **`database_quick_setup.sql`**
- ✅ File hướng dẫn nhanh
- ✅ Có comments và instructions
- ✅ Tổng quan cấu trúc database
- ✅ Không có code CREATE TABLE đầy đủ

**Kích thước**: ~5KB

---

### 4. **`database_backup_full.sql`** (Cũ)
- ⚠️ Chứa cả dữ liệu
- ⚠️ Còn bảng returns và suppliers (đã xóa)
- ⚠️ Không khuyên dùng

**Kích thước**: ~500KB+

---

### 5. **`database_schema_only.sql`** (Cũ)
- ⚠️ Còn bảng returns và suppliers (đã xóa)
- ⚠️ Không khuyên dùng

**Kích thước**: ~50KB

---

## 🎯 Khuyến nghị sử dụng

### Để copy code SQL các bảng:
👉 **Dùng file: `database_tables_only.sql`**

**Lý do:**
- ✅ Sạch nhất, dễ đọc nhất
- ✅ Có comments tiếng Việt
- ✅ Đã cập nhật mới nhất (31 bảng)
- ✅ Không có dữ liệu thừa
- ✅ Format đẹp, dễ copy

### Để restore database:
👉 **Dùng file: `database_schema_latest.sql`**

**Lý do:**
- ✅ Export trực tiếp từ DB hiện tại
- ✅ Chính xác 100%
- ✅ Đầy đủ constraints

---

## 📋 Danh sách 31 bảng

### User & Auth (4 bảng)
```sql
1. users
2. pending_registrations
3. password_resets
4. push_subscriptions
```

### Products (6 bảng)
```sql
5. categories
6. products
7. product_questions
8. reviews
9. review_images
10. flash_sales
```

### Orders (3 bảng)
```sql
11. cart_items
12. orders
13. order_items
```

### Store Management (4 bảng)
```sql
14. tables
15. areas
16. table_orders
17. table_order_items
```

### Staff & Shifts (3 bảng)
```sql
18. shifts
19. staff_shifts
20. shift_swap_requests
```

### Inventory (1 bảng)
```sql
21. stock_transactions
```

### Promotions & Loyalty (3 bảng)
```sql
22. promotions
23. promotion_usage
24. points_history
```

### Wishlist (1 bảng)
```sql
25. wishlist
```

### Chat & AI (4 bảng)
```sql
26. chat_sessions
27. chat_messages
28. chatbot_knowledge
29. chatbot_feedback
```

### Other (3 bảng)
```sql
30. addresses
31. notifications
32. settings
```

---

## 🚀 Cách sử dụng

### 1. Copy code SQL từ file
```bash
# Mở file trong editor
code database_tables_only.sql

# Hoặc xem trong terminal
cat database_tables_only.sql
```

### 2. Tạo database mới
```sql
CREATE DATABASE ecommerce WITH ENCODING='UTF8';
```

### 3. Chạy SQL file
```bash
# Cách 1: Dùng psql
psql -U postgres -d ecommerce -f database_tables_only.sql

# Cách 2: Dùng schema_latest (chính xác hơn)
psql -U postgres -d ecommerce -f database_schema_latest.sql
```

### 4. Kiểm tra
```sql
-- Xem danh sách bảng
\dt

-- Đếm số bảng
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
-- Kết quả: 31
```

---

## 📝 Lưu ý

### Encoding
- Database phải dùng **UTF8** encoding
- Để hỗ trợ tiếng Việt

### Connection String
```
postgresql://postgres:123456@localhost:5432/ecommerce
```

### Thứ tự tạo bảng
1. Tạo ENUMS trước
2. Tạo bảng cha (users, categories, products)
3. Tạo bảng con (orders, reviews, cart_items)
4. Tạo indexes
5. Tạo foreign keys

---

## 🔄 Cập nhật

**Lần cuối cập nhật**: 26/01/2026

**Thay đổi**:
- ✅ Xóa bảng returns (3 bảng)
- ✅ Xóa bảng suppliers (2 bảng)
- ✅ Tổng: 35 → 31 bảng

**Files đã cập nhật**:
- ✅ `database_tables_only.sql`
- ✅ `database_schema_latest.sql` (NEW)
- ✅ `database_quick_setup.sql`

**Files cũ (không dùng)**:
- ⚠️ `database_backup_full.sql`
- ⚠️ `database_schema_only.sql`

---

## 💡 Tips

### Để tạo backup mới:
```bash
# Schema only (không có dữ liệu)
pg_dump -U postgres -d ecommerce --schema-only --no-owner --no-privileges -f my_schema.sql

# Full backup (có dữ liệu)
pg_dump -U postgres -d ecommerce --clean --if-exists --no-owner --no-privileges -f my_backup.sql
```

### Để so sánh 2 schema:
```bash
diff database_tables_only.sql database_schema_latest.sql
```

### Để tìm một bảng cụ thể:
```bash
grep -A 20 "TABLE.*users" database_tables_only.sql
```

---

**Tóm lại**: Dùng file **`database_tables_only.sql`** để copy code SQL các bảng! ✅
