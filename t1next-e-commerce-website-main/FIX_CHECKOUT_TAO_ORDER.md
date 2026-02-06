# FIX: THANH TOÁN TẠI BÀN TẠO ĐƠN HÀNG TRONG HỆ THỐNG

## ❌ Vấn đề

Khi thanh toán ở màn hình bán hàng (Tables), đơn hàng chỉ được đóng trong `table_orders` nhưng **KHÔNG** tạo đơn hàng mới trong bảng `orders`. Do đó, đơn hàng không xuất hiện ở màn hình "Đơn hàng" với trạng thái "Chờ xác nhận".

## 🎯 Yêu cầu

Khi thanh toán ở Tables:
1. Tạo đơn hàng mới trong bảng `orders` với status `pending` (Chờ xác nhận)
2. Copy tất cả items từ `table_order_items` sang `order_items`
3. Đơn hàng xuất hiện ở màn hình Orders
4. Thông báo real-time cho staff

## ✅ Giải pháp

### 1. Backend: Cập nhật endpoint checkout

**File:** `server/src/routes/tables.ts`

**Thay đổi:**
```typescript
POST /api/tables/orders/:orderId/checkout
```

**Logic mới:**
1. Lấy thông tin table_order và items
2. Tạo Order mới trong bảng `orders`:
   - `user_id`: null (khách vãng lai)
   - `status`: 'pending' (Chờ xác nhận)
   - `recipient_name`: Từ request body
   - `phone`: Từ request body
   - `shipping_address`: "Bàn {số bàn}"
   - `payment_method`: cash/card/transfer/momo
   - `total`, `subtotal`, `discount_amount`
   - `note`: "Đơn tại bàn {số bàn}"
3. Copy items từ `table_order_items` sang `order_items`
4. Đóng table_order (status = 'completed')
5. Giải phóng bàn (status = 'cleaning')
6. Emit socket event `order:new` đến room 'staff'

**Request body:**
```json
{
  "payment_method": "cash",
  "discount_amount": 0,
  "recipient_name": "Nguyễn Văn A",
  "phone": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tableOrder": { ... },
    "orderId": "uuid-of-new-order"
  },
  "message": "Thanh toán thành công. Đơn hàng đã được tạo và chờ xác nhận."
}
```

### 2. Frontend: Cập nhật UI checkout

**File:** `client/app/staff/tables/table-detail-panel.tsx`

**Thay đổi:**

**CheckoutDialog Component:**
- Thêm input "Tên khách hàng" (required)
- Thêm input "Số điện thoại" (optional)
- Cập nhật signature: `onCheckout(paymentMethod, discountAmount, recipientName, phone)`

**handleCheckout Function:**
- Gửi thêm `recipient_name` và `phone` trong request body
- Hiển thị message từ server: "Thanh toán thành công. Đơn hàng đã được tạo."

### 3. Frontend: Real-time notification cho Orders page

**File:** `client/app/staff/orders/page.tsx`

**Thêm:**
- Import socket utilities
- Initialize socket và join room 'staff'
- Listen event `order:new`:
  - Hiển thị toast notification
  - Refresh danh sách orders
- Listen event `order:updated`:
  - Refresh danh sách orders

## 📊 Luồng dữ liệu

```
Tables Page (Checkout)
  ↓
POST /api/tables/orders/:orderId/checkout
  ↓
Backend:
  1. Create Order in `orders` table (status: pending)
  2. Copy items to `order_items`
  3. Close table_order (status: completed)
  4. Free table (status: cleaning)
  5. Emit socket: order:new → room 'staff'
  ↓
Orders Page (Real-time)
  ← Socket event: order:new
  ← Toast notification
  ← Refresh orders list
  ← Đơn hàng xuất hiện với status "Chờ xác nhận"
```

## 🗄️ Database Schema

### Bảng `orders`
```sql
- id: UUID
- user_id: UUID (null cho khách vãng lai)
- status: ENUM (pending, awaiting_payment, confirmed, shipping, delivered, cancelled)
- recipient_name: VARCHAR (Tên khách hàng)
- phone: VARCHAR (Số điện thoại)
- shipping_address: VARCHAR (Địa chỉ / Bàn số)
- payment_method: VARCHAR (cash, card, transfer, momo)
- total: DECIMAL
- subtotal: DECIMAL
- discount_amount: DECIMAL
- shipping_fee: DECIMAL (0 cho dine-in)
- note: TEXT
- created_at: TIMESTAMP
```

### Bảng `order_items`
```sql
- id: UUID
- order_id: UUID (FK → orders.id)
- product_id: UUID (FK → products.id)
- quantity: INT
- price: DECIMAL
```

## 🧪 Cách test

### 1. Khởi động ứng dụng
```bash
# Terminal 1: Server
cd server
npm run dev

# Terminal 2: Client
cd client
npm run dev
```

### 2. Mở 2 tabs browser

**Tab 1: Tables (Bán hàng)**
- URL: `http://localhost:3000/staff/tables`
- Login với tài khoản sales/admin

**Tab 2: Orders (Đơn hàng)**
- URL: `http://localhost:3000/staff/orders`
- Login với tài khoản sales/admin
- Mở Console (F12)

### 3. Test thanh toán

**Tại Tab 1 (Tables):**
1. Click vào bàn trống
2. Click "Mở bàn" → Nhập số khách → Xác nhận
3. Click "Thêm món" → Chọn sản phẩm → Thêm
4. Click "Thanh toán"
5. Nhập:
   - Tên khách hàng: "Nguyễn Văn A"
   - Số điện thoại: "0123456789"
   - Phương thức: "Tiền mặt"
   - Giảm giá: 0đ
6. Click "Xác nhận thanh toán"

**Kiểm tra Tab 2 (Orders):**
- ✅ Toast notification xuất hiện: "Đơn hàng mới từ bàn 01"
- ✅ Danh sách orders tự động refresh
- ✅ Đơn hàng mới xuất hiện với:
  - Khách hàng: "Nguyễn Văn A"
  - Trạng thái: "Đã xác nhận" (badge xanh dương)
  - Tổng tiền: Đúng số tiền
  - Số SP: Đúng số lượng món

**Kiểm tra Console:**
```
🔔 Orders page: New order received: {
  orderId: "...",
  tableNumber: "01",
  total: 150000,
  status: "pending"
}
```

## 📝 Files đã thay đổi

1. ✅ `server/src/routes/tables.ts` - Cập nhật checkout endpoint
2. ✅ `client/app/staff/tables/table-detail-panel.tsx` - Thêm input tên & SĐT
3. ✅ `client/app/staff/orders/page.tsx` - Real-time notification

## 🎯 Kết quả

### Trước khi fix:
- ❌ Thanh toán chỉ đóng table_order
- ❌ Không tạo Order trong bảng orders
- ❌ Không xuất hiện ở màn hình Orders

### Sau khi fix:
- ✅ Thanh toán tạo Order mới (status: pending)
- ✅ Copy items sang order_items
- ✅ Đơn hàng xuất hiện ở Orders với trạng thái "Chờ xác nhận"
- ✅ Toast notification real-time
- ✅ Lưu thông tin khách hàng (tên, SĐT)

## 🔄 Luồng nghiệp vụ hoàn chỉnh

1. **Khách đến quán** → Nhân viên mở bàn
2. **Khách gọi món** → Nhân viên thêm món vào bàn
3. **Món được pha chế** → Hiển thị ở Kitchen
4. **Khách thanh toán** → Nhân viên checkout:
   - Nhập tên khách hàng
   - Nhập số điện thoại (optional)
   - Chọn phương thức thanh toán
   - Áp dụng giảm giá (nếu có)
5. **Hệ thống tạo Order** → Status "Chờ xác nhận"
6. **Staff xác nhận** → Chuyển status sang "Đã xác nhận"
7. **Hoàn tất** → Đơn hàng được lưu vào hệ thống

## 📊 Thống kê

- **Bảng liên quan:** 4 (tables, table_orders, orders, order_items)
- **Socket events:** 1 (order:new)
- **Socket rooms:** 1 (staff)
- **API endpoints:** 1 (POST /api/tables/orders/:orderId/checkout)
- **UI components:** 2 (CheckoutDialog, Orders Page)

---

**Status:** ✅ HOÀN THÀNH
**Tested:** ✅ ĐÃ TEST
**Date:** 2026-01-23
