# HỆ THỐNG PHÂN QUYỀN

## 📋 Các Role trong hệ thống

Hệ thống có **4 role** chính:

### 1. **USER** (Khách hàng)
- Role mặc định khi đăng ký
- Chỉ truy cập được phần frontend (trang chủ, sản phẩm, giỏ hàng, đơn hàng)
- **KHÔNG** có quyền truy cập `/staff/*`

### 2. **ADMIN** (Quản trị viên)
- Quyền cao nhất trong hệ thống
- Truy cập được **TẤT CẢ** chức năng
- Có thể quản lý nhân viên, cấu hình hệ thống

### 3. **SALES** (Nhân viên bán hàng)
- Chuyên về bán hàng và chăm sóc khách hàng
- Truy cập: POS, Đơn hàng, Khách hàng, Sản phẩm, Chat

### 4. **WAREHOUSE** (Nhân viên kho)
- Chuyên về quản lý kho và hàng hóa
- Truy cập: Kho, Tồn kho, Lịch sử nhập xuất, Quản lý bàn

---

## 🔐 Ma trận phân quyền chi tiết

| Chức năng | USER | SALES | WAREHOUSE | ADMIN |
|-----------|------|-------|-----------|-------|
| **Frontend (Trang chủ, Sản phẩm)** | ✅ | ✅ | ✅ | ✅ |
| **Giỏ hàng & Đặt hàng** | ✅ | ✅ | ✅ | ✅ |
| **Dashboard** | ❌ | ✅ | ✅ | ✅ |
| **Quản lý Bàn** | ❌ | ✅ | ✅ | ✅ |
| **Pha chế (Kitchen)** | ❌ | ✅ | ✅ | ✅ |
| **Ca làm việc** | ❌ | ✅ | ✅ | ✅ |
| **POS (Bán hàng)** | ❌ | ✅ | ❌ | ✅ |
| **Lịch sử POS** | ❌ | ✅ | ❌ | ✅ |
| **Chat hỗ trợ** | ❌ | ✅ | ❌ | ✅ |
| **Sản phẩm** | ❌ | ✅ | ❌ | ✅ |
| **Flash Sale** | ❌ | ✅ | ❌ | ✅ |
| **Đơn hàng** | ❌ | ✅ | ✅ | ✅ |
| **Khách hàng** | ❌ | ✅ | ❌ | ✅ |
| **Danh mục** | ❌ | ✅ | ❌ | ✅ |
| **Khuyến mãi** | ❌ | ✅ | ❌ | ✅ |
| **Báo cáo** | ❌ | ✅ | ❌ | ✅ |
| **Quản lý Nhân viên** | ❌ | ❌ | ❌ | ✅ |
| **Nhà cung cấp** | ❌ | ❌ | ❌ | ✅ |
| **Sao lưu dữ liệu** | ❌ | ❌ | ❌ | ✅ |
| **Đổi trả hàng** | ❌ | ✅ | ❌ | ✅ |
| **Quản lý Kho** | ❌ | ❌ | ✅ | ✅ |
| **Cảnh báo tồn kho** | ❌ | ❌ | ✅ | ✅ |
| **Lịch sử Kho** | ❌ | ❌ | ✅ | ✅ |

---

## 🛡️ Backend Middleware

### 1. **authMiddleware**
```typescript
// Yêu cầu: Đã đăng nhập (có token hợp lệ)
// Áp dụng cho: Tất cả user đã đăng nhập
```

### 2. **adminMiddleware**
```typescript
// Yêu cầu: role === 'admin'
// Áp dụng cho: Chỉ Admin
```

### 3. **staffMiddleware**
```typescript
// Yêu cầu: role in ['admin', 'sales', 'warehouse']
// Áp dụng cho: Tất cả nhân viên
```

### 4. **salesMiddleware**
```typescript
// Yêu cầu: role in ['admin', 'sales']
// Áp dụng cho: Admin và Sales
```

### 5. **warehouseMiddleware**
```typescript
// Yêu cầu: role in ['admin', 'warehouse']
// Áp dụng cho: Admin và Warehouse
```

### 6. **optionalAuth**
```typescript
// Không bắt buộc đăng nhập
// Nếu có token thì parse, không có thì bỏ qua
```

---

## 📍 API Endpoints và Middleware

### Auth & User
- `POST /api/auth/login` - Public
- `POST /api/auth/register` - Public
- `GET /api/auth/me` - **authMiddleware**
- `PUT /api/auth/me` - **authMiddleware**

### Products
- `GET /api/products` - Public
- `GET /api/products/:slug` - Public
- `POST /api/admin/products` - **adminMiddleware**
- `PUT /api/admin/products/:id` - **adminMiddleware**
- `DELETE /api/admin/products/:id` - **adminMiddleware**

### Orders
- `GET /api/orders` - **authMiddleware**
- `POST /api/orders` - **authMiddleware**
- `GET /api/admin/orders` - **staffMiddleware**
- `PUT /api/admin/orders/:id/status` - **staffMiddleware**

### Tables (Quản lý bàn)
- `GET /api/tables/overview` - Public (nhưng frontend check role)
- `GET /api/tables/:id` - **authMiddleware**
- `POST /api/tables/:id/orders` - **staffMiddleware**
- `POST /api/tables/orders/:orderId/items` - **staffMiddleware**
- `PUT /api/tables/orders/:orderId/items/:itemId` - **staffMiddleware**
- `DELETE /api/tables/orders/:orderId/items/:itemId` - **staffMiddleware**
- `POST /api/tables/orders/:orderId/checkout` - **staffMiddleware**
- `POST /api/tables/orders/:orderId/cancel` - **staffMiddleware**
- `POST /api/tables` - **adminMiddleware** (Tạo bàn mới)
- `PUT /api/tables/:id` - **adminMiddleware** (Cập nhật bàn)
- `DELETE /api/tables/:id` - **adminMiddleware** (Xóa bàn)

### Kitchen (Pha chế)
- `GET /api/kitchen/orders` - **staffMiddleware**
- `GET /api/kitchen/stats` - **staffMiddleware**
- `GET /api/kitchen/ready-items` - **staffMiddleware**
- `PUT /api/kitchen/items/:id/start` - **staffMiddleware**
- `PUT /api/kitchen/items/:id/complete` - **staffMiddleware**
- `PUT /api/kitchen/items/:id/serve` - **staffMiddleware**

### Stock (Kho)
- `GET /api/stock` - **warehouseMiddleware**
- `POST /api/stock/import` - **warehouseMiddleware**
- `POST /api/stock/export` - **warehouseMiddleware**
- `GET /api/stock/history` - **warehouseMiddleware**

### Suppliers (Nhà cung cấp)
- `GET /api/suppliers` - **staffMiddleware**
- `POST /api/suppliers` - **adminMiddleware**
- `PUT /api/suppliers/:id` - **adminMiddleware**
- `DELETE /api/suppliers/:id` - **adminMiddleware**

### Shifts (Ca làm việc)
- `GET /api/shifts` - Public
- `POST /api/shifts` - **adminMiddleware**
- `PUT /api/shifts/:id` - **adminMiddleware**
- `DELETE /api/shifts/:id` - **adminMiddleware**
- `GET /api/shifts/schedule` - **authMiddleware**
- `POST /api/shifts/schedule` - **adminMiddleware**
- `POST /api/shifts/check-in` - **staffMiddleware**
- `POST /api/shifts/check-out` - **staffMiddleware**

---

## 🎯 Frontend Route Protection

### Client-side check (trong component)
```typescript
// Ví dụ: client/app/staff/tables/page.tsx
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push("/login")
    return
  }
  if (user && !["admin", "sales", "warehouse"].includes(user.role)) {
    router.push("/")
    return
  }
}, [authLoading, isAuthenticated, user, router])
```

### Sidebar Menu (AdminSidebar)
Menu items được filter dựa trên role:
- **Admin**: Thấy tất cả menu
- **Sales**: Thấy POS, Sản phẩm, Đơn hàng, Khách hàng, Chat
- **Warehouse**: Thấy Kho, Tồn kho, Lịch sử kho, Quản lý bàn

---

## ⚠️ Lưu ý quan trọng

### 1. **Không có role "staff"**
- ❌ KHÔNG sử dụng: `user.role === "staff"`
- ✅ SỬ DỤNG: `["admin", "sales", "warehouse"].includes(user.role)`

### 2. **Double check phân quyền**
- Frontend check role để ẩn/hiện UI
- Backend middleware check role để bảo mật API
- **KHÔNG BAO GIỜ** chỉ dựa vào frontend check

### 3. **Token authentication**
- Tất cả API staff phải gửi `Authorization: Bearer <token>`
- Token được lưu trong localStorage với key `"token"`
- Token hết hạn sau 7 ngày (JWT_EXPIRES_IN=7d)

### 4. **Xử lý lỗi 401/403**
- 401 Unauthorized: Token không hợp lệ hoặc hết hạn → Đăng xuất
- 403 Forbidden: Không có quyền truy cập → Hiển thị thông báo

---

## 🔧 Cách test phân quyền

### 1. Tạo tài khoản test
```sql
-- Admin
INSERT INTO users (id, email, password, name, role) 
VALUES (uuid_generate_v4(), 'admin@test.com', '$2a$10$...', 'Admin', 'admin');

-- Sales
INSERT INTO users (id, email, password, name, role) 
VALUES (uuid_generate_v4(), 'sales@test.com', '$2a$10$...', 'Sales', 'sales');

-- Warehouse
INSERT INTO users (id, email, password, name, role) 
VALUES (uuid_generate_v4(), 'warehouse@test.com', '$2a$10$...', 'Warehouse', 'warehouse');

-- User
INSERT INTO users (id, email, password, name, role) 
VALUES (uuid_generate_v4(), 'user@test.com', '$2a$10$...', 'User', 'user');
```

### 2. Test từng role
1. Đăng nhập với từng tài khoản
2. Kiểm tra menu sidebar (chỉ hiển thị menu được phép)
3. Thử truy cập các route khác nhau
4. Kiểm tra API response (200 OK hoặc 403 Forbidden)

### 3. Test API trực tiếp
```bash
# Lấy token sau khi login
TOKEN="your_jwt_token_here"

# Test endpoint với token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/tables/overview

# Kết quả mong đợi:
# - Admin/Sales/Warehouse: 200 OK
# - User: 403 Forbidden
```

---

## 📊 Tóm tắt

| Role | Mô tả | Quyền chính |
|------|-------|-------------|
| **USER** | Khách hàng | Mua hàng, xem đơn hàng |
| **SALES** | Nhân viên bán hàng | POS, Khách hàng, Sản phẩm, Chat |
| **WAREHOUSE** | Nhân viên kho | Kho, Tồn kho, Nhập xuất |
| **ADMIN** | Quản trị viên | Tất cả chức năng |

**Nguyên tắc:** Backend luôn là lớp bảo mật cuối cùng. Frontend chỉ để UX tốt hơn.
