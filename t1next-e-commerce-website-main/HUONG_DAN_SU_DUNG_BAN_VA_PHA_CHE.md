 # HƯỚNG DẪN SỬ DỤNG HỆ THỐNG BÀN VÀ PHA CHẾ
qazwsx
## � Tổng quan

Hệ thống quản lý bàn và pha chế được thiết kế cho quán cà phê với 2 màn hình chính:
- **Màn hình bán hàng (Tables)**: Quản lý bàn, đặt món, thanh toán
- **Màn hình pha chế (Kitchen)**: Hiển thị món cần pha chế theo thời gian thực

## 🔄 Luồng hoạt động Real-time

### 1. Khi nhân viên bán hàng thêm món vào bàn:

**Bước 1: Thêm món tại màn hình Tables**
```
Nhân viên → Chọn bàn → Thêm món → Nhập số lượng → Xác nhận
```

**Bước 2: Backend xử lý và emit socket event**
```typescript
// server/src/routes/tables.ts
POST /api/tables/orders/:orderId/items
→ Lưu món vào database
→ Emit socket event: 'kitchen:new-item' đến room 'kitchen'
```

**Bước 3: Màn hình Kitchen nhận real-time**
```typescript
// client/app/staff/kitchen/page.tsx
socket.on('kitchen:new-item', (data) => {
  - Phát âm thanh thông báo
  - Hiển thị toast notification
  - Refresh danh sách món
})
```

### 2. Kiến trúc Socket.IO

**Global Socket Client** (`client/lib/socket.ts`):
- Khởi tạo 1 lần duy nhất với token authentication
- Tự động reconnect khi mất kết nối
- Cung cấp các hàm: `initSocket()`, `getSocket()`, `joinRoom()`, `leaveRoom()`

**Socket Rooms**:
- `kitchen`: Nhân viên pha chế (admin, sales, warehouse)
- `tables`: Nhân viên bán hàng (admin, sales, warehouse)
- `staff`: Tất cả nhân viên (admin, sales)
- `user:{userId}`: Room riêng cho từng user

**Backend Socket Server** (`server/src/socket/index.ts`):
- Authentication middleware: Verify JWT token
- Auto join rooms dựa trên role
- Emit functions: `emitToRoom()`, `emitToUser()`, `emitToStaff()`

## 🎯 Các tính năng chính

### Màn hình bán hàng (Tables)

**1. Xem sơ đồ bàn**
- Hiển thị tất cả bàn theo khu vực
- Màu sắc theo trạng thái:
  - � Xanh lá: Trống (available)
  - � Cam: Có khách (occupied)
  - 🔵 Xanh dương: Đã đặt (reserved)
  - ⚪ Xám: Đang dọn (cleaning)

**2. Quản lý đơn hàng**
- Click vào bàn → Xem chi tiết
- Thêm món: Chọn sản phẩm → Nhập số lượng → Ghi chú (optional)
- Cập nhật món: Thay đổi số lượng, trạng thái
- Xóa món: Hủy món (status = 'cancelled')

**3. Thanh toán**
- Xem tổng tiền, giảm giá
- Chọn phương thức thanh toán
- Xác nhận → Bàn chuyển sang "Đang dọn"

### Màn hình pha chế (Kitchen)

**1. Tab "Chờ pha chế" (Pending)**
- Hiển thị món mới order
- Màu vàng, nổi bật
- Nút "Bắt đầu pha chế" → Chuyển sang tab "Đang pha chế"

**2. Tab "Đang pha chế" (Preparing)**
- Hiển thị món đang làm
- Màu xanh dương
- Nút "Hoàn thành" → Chuyển sang tab "Sẵn sàng"

**3. Tab "Sẵn sàng" (Ready)**
- Hiển thị món đã xong
- Màu xanh lá, có animation pulse
- Nút "Đã đưa cho khách" → Đánh dấu served

**4. Thông báo real-time**
- � Âm thanh khi có món mới
- 📱 Toast notification với tên món và số bàn
- 🔄 Auto refresh danh sách

## 🛠️ Cài đặt và khởi động

### 1. Khởi động Server
```bash
cd server
npm install
npm run dev
```
Server chạy tại: `http://localhost:3001`

### 2. Khởi động Client
```bash
cd client
npm install
npm run dev
```
Client chạy tại: `http://localhost:3000`

### 3. Kiểm tra Socket connection
Mở Console (F12) và xem log:
```
🔌 Socket connected: <socket-id>
🍳 Kitchen page: Joined kitchen room
🪑 Tables page: Joined tables room
```

## 🔐 Phân quyền

| Role | Tables | Kitchen | Admin |
|------|--------|---------|-------|
| admin | ✅ | ✅ | ✅ |
| sales | ✅ | ✅ | ❌ |
| warehouse | ✅ | ✅ | ❌ |
| user | ❌ | ❌ | ❌ |

## 🐛 Troubleshooting

### Món không hiện ở màn hình pha chế?

**Kiểm tra 1: Socket connection**
```javascript
// Mở Console tại Kitchen page
console.log(window.socket?.connected) // Phải là true
```

**Kiểm tra 2: Joined room**
```javascript
// Server log phải có:
👨‍🍳 User <userId> (sales) joined kitchen room
```

**Kiểm tra 3: Backend emit**
```javascript
// Server log khi thêm món:
🔔 Emitting kitchen:new-item for: <product_name> Table: <table_number>
```

**Kiểm tra 4: Frontend listener**
```javascript
// Client console khi nhận event:
🔔 Kitchen page: New kitchen item received: {...}
```

### Lỗi "Invalid token"?
- Logout và login lại
- Xóa localStorage: `localStorage.clear()`
- Kiểm tra token còn hạn

### Socket không kết nối?
- Kiểm tra server đang chạy
- Kiểm tra CORS settings
- Kiểm tra token trong localStorage

## 📊 Database Schema

### Tables
```sql
- id: UUID
- table_number: VARCHAR (số bàn)
- status: ENUM (available, occupied, reserved, cleaning)
- current_order_id: UUID (đơn hàng hiện tại)
- current_guests: INT (số khách)
- occupied_at: TIMESTAMP
- reserved_at: TIMESTAMP
- reserved_for: VARCHAR (tên người đặt)
- reserved_phone: VARCHAR
```

### Table Orders
```sql
- id: UUID
- order_number: VARCHAR (mã đơn)
- table_id: UUID
- staff_id: UUID
- guests_count: INT
- subtotal: DECIMAL
- discount_amount: DECIMAL
- total: DECIMAL
- status: ENUM (active, completed, cancelled)
- payment_method: VARCHAR
- payment_status: ENUM (pending, paid, refunded)
```

### Table Order Items
```sql
- id: UUID
- table_order_id: UUID
- product_id: UUID
- product_name: VARCHAR
- product_image: VARCHAR
- quantity: INT
- price: DECIMAL
- notes: TEXT
- status: ENUM (pending, preparing, ready, served, cancelled)
```

## 🎨 UI Components

### Tables Page
- `client/app/staff/tables/page.tsx`: Main page
- `client/app/staff/tables/table-detail-panel.tsx`: Chi tiết bàn (Sheet)
- `client/app/staff/tables/table-settings-dialog.tsx`: Cài đặt sơ đồ

### Kitchen Page
- `client/app/staff/kitchen/page.tsx`: Màn hình pha chế
- Tabs: Pending, Preparing, Ready
- Real-time updates với Socket.IO

## 🔧 API Endpoints

### Tables
- `GET /api/tables/overview`: Lấy tổng quan bàn
- `GET /api/tables/:id`: Chi tiết bàn
- `PUT /api/tables/:id/status`: Cập nhật trạng thái

### Orders
- `POST /api/tables/:id/orders`: Tạo đơn mới
- `GET /api/tables/orders/:orderId`: Chi tiết đơn
- `POST /api/tables/orders/:orderId/items`: Thêm món
- `PUT /api/tables/orders/:orderId/items/:itemId`: Cập nhật món
- `DELETE /api/tables/orders/:orderId/items/:itemId`: Xóa món
- `POST /api/tables/orders/:orderId/checkout`: Thanh toán

### Kitchen
- `GET /api/kitchen/orders`: Danh sách món cần pha chế
- `GET /api/kitchen/ready-items`: Món sẵn sàng
- `GET /api/kitchen/stats`: Thống kê
- `PUT /api/kitchen/items/:id/start`: Bắt đầu pha chế
- `PUT /api/kitchen/items/:id/complete`: Hoàn thành
- `PUT /api/kitchen/items/:id/serve`: Đã phục vụ

## 📝 Notes

- Socket.IO sử dụng WebSocket với fallback polling
- Token được gửi qua `auth.token` khi connect
- Auto reconnect với 5 attempts, delay 1s
- Kitchen page refresh mỗi 5s (fallback nếu socket fail)
- Tables page refresh mỗi 30s

## 🚀 Tính năng đã hoàn thành

- ✅ Real-time sync giữa Tables và Kitchen
- ✅ Socket.IO integration với authentication
- ✅ Global socket client
- ✅ Auto join rooms theo role
- ✅ Toast notifications
- ✅ Sound notifications
- ✅ Auto refresh fallback
- ✅ Scroll area cho danh sách món dài
- ✅ Reserved table UI
- ✅ Authorization headers cho tất cả API calls
