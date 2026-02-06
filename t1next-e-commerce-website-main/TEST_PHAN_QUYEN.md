# SCRIPT TEST PHÂN QUYỀN

## 🧪 Checklist kiểm tra phân quyền

### 1. Kiểm tra Database Schema
```sql
-- Xem các role có trong database
SELECT DISTINCT role FROM users;

-- Kết quả mong đợi: user, admin, sales, warehouse
```

### 2. Tạo tài khoản test (nếu chưa có)

```sql
-- Tạo password hash cho "123456"
-- Sử dụng bcrypt với salt rounds = 10
-- Hash: $2a$10$rOvHPZYRKJQH5mXqF5vQxOqKxGxJxGxJxGxJxGxJxGxJxGxJxGxJxG

-- Admin
INSERT INTO users (id, email, password, name, role, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  '$2a$10$rOvHPZYRKJQH5mXqF5vQxOqKxGxJxGxJxGxJxGxJxGxJxGxJxGxJxG',
  'Admin Test',
  'admin',
  true,
  NOW()
);

-- Sales
INSERT INTO users (id, email, password, name, role, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'sales@test.com',
  '$2a$10$rOvHPZYRKJQH5mXqF5vQxOqKxGxJxGxJxGxJxGxJxGxJxGxJxGxJxG',
  'Sales Test',
  'sales',
  true,
  NOW()
);

-- Warehouse
INSERT INTO users (id, email, password, name, role, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'warehouse@test.com',
  '$2a$10$rOvHPZYRKJQH5mXqF5vQxOqKxGxJxGxJxGxJxGxJxGxJxGxJxGxJxG',
  'Warehouse Test',
  'warehouse',
  true,
  NOW()
);

-- User
INSERT INTO users (id, email, password, name, role, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'user@test.com',
  '$2a$10$rOvHPZYRKJQH5mXqF5vQxOqKxGxJxGxJxGxJxGxJxGxJxGxJxGxJxG',
  'User Test',
  'user',
  true,
  NOW()
);
```

### 3. Test Frontend - Sidebar Menu

| Role | Menu hiển thị |
|------|---------------|
| **Admin** | Dashboard, Quản lý Bàn, Pha chế, Ca làm việc, POS, Lịch sử POS, Chat, Sản phẩm, Flash Sale, Đơn hàng, Khách hàng, Danh mục, Khuyến mãi, Báo cáo, Quản lý Nhân viên, Nhà cung cấp, Sao lưu, Đổi trả, Quản lý Kho, Cảnh báo tồn kho, Lịch sử Kho |
| **Sales** | Dashboard, Quản lý Bàn, Pha chế, Ca làm việc, POS, Lịch sử POS, Chat, Sản phẩm, Flash Sale, Đơn hàng, Khách hàng, Danh mục, Khuyến mãi, Báo cáo, Đổi trả |
| **Warehouse** | Dashboard, Quản lý Bàn, Pha chế, Ca làm việc, Đơn hàng, Quản lý Kho, Cảnh báo tồn kho, Lịch sử Kho |
| **User** | Không có quyền truy cập /staff/* |

**Cách test:**
1. Đăng nhập với từng tài khoản
2. Truy cập http://localhost:3000/staff/dashboard
3. Kiểm tra sidebar menu
4. So sánh với bảng trên

### 4. Test Frontend - Route Protection

#### Test với USER role:
```
✅ Truy cập: http://localhost:3000 (Trang chủ)
✅ Truy cập: http://localhost:3000/product/... (Chi tiết sản phẩm)
✅ Truy cập: http://localhost:3000/cart (Giỏ hàng)
❌ Truy cập: http://localhost:3000/staff/dashboard → Redirect về /
❌ Truy cập: http://localhost:3000/staff/tables → Redirect về /
❌ Truy cập: http://localhost:3000/staff/kitchen → Redirect về /
```

#### Test với SALES role:
```
✅ Truy cập: http://localhost:3000/staff/dashboard
✅ Truy cập: http://localhost:3000/staff/tables
✅ Truy cập: http://localhost:3000/staff/kitchen
✅ Truy cập: http://localhost:3000/staff/pos
✅ Truy cập: http://localhost:3000/staff/products
❌ Truy cập: http://localhost:3000/staff/stock → Không có trong menu
❌ Truy cập: http://localhost:3000/staff/staff-management → Không có trong menu
```

#### Test với WAREHOUSE role:
```
✅ Truy cập: http://localhost:3000/staff/dashboard
✅ Truy cập: http://localhost:3000/staff/tables
✅ Truy cập: http://localhost:3000/staff/kitchen
✅ Truy cập: http://localhost:3000/staff/stock
✅ Truy cập: http://localhost:3000/staff/stock-alerts
❌ Truy cập: http://localhost:3000/staff/pos → Không có trong menu
❌ Truy cập: http://localhost:3000/staff/products → Không có trong menu
```

#### Test với ADMIN role:
```
✅ Truy cập: TẤT CẢ các route /staff/*
```

### 5. Test Backend API

#### Lấy token sau khi login:
```bash
# Login và lấy token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# Response sẽ có token
# Lưu token vào biến
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Test Tables API (staffMiddleware):
```bash
# Admin/Sales/Warehouse: 200 OK
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tables/overview

# User: 403 Forbidden
```

#### Test Kitchen API (staffMiddleware):
```bash
# Admin/Sales/Warehouse: 200 OK
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/kitchen/orders

# User: 403 Forbidden
```

#### Test Stock API (warehouseMiddleware):
```bash
# Admin/Warehouse: 200 OK
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/stock

# Sales/User: 403 Forbidden
```

#### Test Admin API (adminMiddleware):
```bash
# Admin: 200 OK
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/admin/products

# Sales/Warehouse/User: 403 Forbidden
```

### 6. Test Specific Features

#### Quản lý Bàn (Tables):
| Action | USER | SALES | WAREHOUSE | ADMIN |
|--------|------|-------|-----------|-------|
| Xem sơ đồ bàn | ❌ | ✅ | ✅ | ✅ |
| Mở bàn | ❌ | ✅ | ✅ | ✅ |
| Thêm món | ❌ | ✅ | ✅ | ✅ |
| Thanh toán | ❌ | ✅ | ✅ | ✅ |
| Tạo/Sửa/Xóa bàn | ❌ | ❌ | ❌ | ✅ |

**Test steps:**
1. Login với từng role
2. Truy cập /staff/tables
3. Thử các action trên
4. Kiểm tra response

#### Pha chế (Kitchen):
| Action | USER | SALES | WAREHOUSE | ADMIN |
|--------|------|-------|-----------|-------|
| Xem món chờ | ❌ | ✅ | ✅ | ✅ |
| Bắt đầu pha chế | ❌ | ✅ | ✅ | ✅ |
| Hoàn thành | ❌ | ✅ | ✅ | ✅ |
| Đã phục vụ | ❌ | ✅ | ✅ | ✅ |

**Test steps:**
1. Login với từng role
2. Truy cập /staff/kitchen
3. Thử các action trên
4. Kiểm tra response

#### POS (Point of Sale):
| Action | USER | SALES | WAREHOUSE | ADMIN |
|--------|------|-------|-----------|-------|
| Tạo đơn POS | ❌ | ✅ | ❌ | ✅ |
| Xem lịch sử | ❌ | ✅ | ❌ | ✅ |

**Test steps:**
1. Login với Sales/Admin
2. Truy cập /staff/pos
3. Tạo đơn hàng mới
4. Kiểm tra lịch sử

#### Quản lý Kho:
| Action | USER | SALES | WAREHOUSE | ADMIN |
|--------|------|-------|-----------|-------|
| Xem tồn kho | ❌ | ❌ | ✅ | ✅ |
| Nhập kho | ❌ | ❌ | ✅ | ✅ |
| Xuất kho | ❌ | ❌ | ✅ | ✅ |
| Xem lịch sử | ❌ | ❌ | ✅ | ✅ |

**Test steps:**
1. Login với Warehouse/Admin
2. Truy cập /staff/stock
3. Thử nhập/xuất kho
4. Kiểm tra lịch sử

### 7. Test Error Handling

#### Test 401 Unauthorized:
```bash
# Không có token
curl http://localhost:3001/api/tables/overview
# Expected: 401 Unauthorized

# Token không hợp lệ
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3001/api/tables/overview
# Expected: 401 Invalid token

# Token hết hạn
# Expected: 401 Invalid token → Auto logout frontend
```

#### Test 403 Forbidden:
```bash
# User role truy cập staff API
curl -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:3001/api/tables/overview
# Expected: 403 Không có quyền truy cập

# Sales role truy cập warehouse API
curl -H "Authorization: Bearer $SALES_TOKEN" \
  http://localhost:3001/api/stock
# Expected: 403 Không có quyền truy cập kho
```

### 8. Checklist tổng hợp

- [ ] Database có đúng 4 role: user, admin, sales, warehouse
- [ ] Tạo được tài khoản test cho cả 4 role
- [ ] Login thành công với từng role
- [ ] Sidebar menu hiển thị đúng theo role
- [ ] Route protection hoạt động (redirect khi không có quyền)
- [ ] API trả về 403 khi role không đủ quyền
- [ ] API trả về 401 khi token không hợp lệ
- [ ] Auto logout khi token hết hạn
- [ ] Quản lý bàn: Admin/Sales/Warehouse có quyền
- [ ] Pha chế: Admin/Sales/Warehouse có quyền
- [ ] POS: Admin/Sales có quyền
- [ ] Kho: Admin/Warehouse có quyền
- [ ] Quản lý nhân viên: Chỉ Admin có quyền
- [ ] User role không truy cập được /staff/*

### 9. Lỗi thường gặp

#### Lỗi: "Invalid token"
**Nguyên nhân:** Token hết hạn hoặc không hợp lệ
**Giải pháp:** 
```javascript
localStorage.clear()
location.reload()
// Đăng nhập lại
```

#### Lỗi: 403 Forbidden
**Nguyên nhân:** Role không đủ quyền
**Giải pháp:** Kiểm tra role trong database
```sql
SELECT email, role FROM users WHERE email = 'your@email.com';
```

#### Lỗi: Sidebar không hiển thị menu
**Nguyên nhân:** Role không được nhận dạng
**Giải pháp:** Kiểm tra user object trong localStorage
```javascript
console.log(JSON.parse(localStorage.getItem('nhh-coffee-user')))
```

### 10. Kết quả mong đợi

✅ **Tất cả test cases pass**
✅ **Không có lỗi console**
✅ **Phân quyền chính xác theo role**
✅ **API bảo mật đúng cách**
✅ **UX tốt (không hiển thị menu không có quyền)**

---

**Lưu ý:** Nếu có bất kỳ test case nào fail, kiểm tra lại:
1. Database schema (enum UserRole)
2. Backend middleware (auth.ts)
3. Frontend route protection
4. Token trong localStorage
5. API endpoint và middleware mapping
