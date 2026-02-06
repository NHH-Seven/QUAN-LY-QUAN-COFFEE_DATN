# TỔNG KẾT: GỘP CHỨC NĂNG BÁN HÀNG

## Ngày thực hiện
23/01/2026

## Yêu cầu
Gộp chức năng "Bán hàng" (POS) vào "Quản lý bàn" với 2 loại đơn:
1. **Dùng tại quán (Dine-in)** - Quản lý bàn
2. **Mang đi (Takeaway)** - POS đơn giản

## Phương án đã chọn
**Phương án 2**: Thêm tab chuyển đổi - Giữ nguyên logic, chỉ thêm UI chuyển đổi

## Các file đã tạo/sửa

### 1. Files mới tạo
- `client/app/staff/sales/page.tsx` - Main page với 2 tabs
- `client/app/staff/sales/dine-in-tab.tsx` - Tab Dùng tại quán (reuse logic Tables)
- `client/app/staff/sales/takeaway-tab.tsx` - Tab Mang đi (simplified POS)
- `HUONG_DAN_SU_DUNG_BAN_HANG.md` - Hướng dẫn sử dụng

### 2. Files đã sửa
- `client/components/admin/admin-sidebar.tsx`
  - Thay link "Quản lý Bàn" → "Bán hàng" (`/staff/sales`)
  - Xóa link "Bán hàng" cũ (`/staff/pos`)
  - Xóa link "Lịch sử POS" (`/staff/pos-history`)
  
- `server/src/routes/orders.ts`
  - Cập nhật endpoint `POST /api/orders` hỗ trợ direct items (từ Takeaway)
  - Thêm emit socket event `kitchen:new-item` cho từng món
  - Thêm emit socket event `order:new` đến staff room
  - Hỗ trợ cả cart-based order và direct order

## Tính năng đã implement

### Tab Dine-in
✅ Hiển thị danh sách bàn theo khu vực
✅ Lọc bàn theo trạng thái (Trống, Có khách, Đã đặt)
✅ Tìm kiếm bàn
✅ Chọn bàn → xem chi tiết → thêm món
✅ Real-time sync với Kitchen khi thêm món
✅ Thanh toán → tạo đơn hàng trong Orders
✅ Socket integration với room 'tables'

### Tab Takeaway
✅ Hiển thị danh sách sản phẩm
✅ Lọc theo danh mục
✅ Tìm kiếm sản phẩm
✅ Giỏ hàng với +/- số lượng
✅ Áp dụng giảm giá
✅ Form thanh toán (tên, SĐT, phương thức)
✅ Tạo đơn hàng qua API `/api/orders`
✅ Server tự động emit socket events đến Kitchen và Staff

## Real-time Flow

### Dine-in
1. Thêm món → Emit `kitchen:new-item` từ `/api/tables/orders/:id/items`
2. Kitchen nhận real-time
3. Thanh toán → Tạo order → Emit `order:new` từ `/api/tables/orders/:id/checkout`
4. Orders page nhận real-time

### Takeaway
1. Thanh toán → Tạo order qua `/api/orders`
2. Server emit `kitchen:new-item` cho từng món
3. Server emit `order:new` đến staff
4. Kitchen và Orders nhận real-time

## Socket Events

### kitchen:new-item
```typescript
{
  product_name: string
  product_image: string
  quantity: number
  table_number: string // "Bàn 1" hoặc "Mang đi"
  order_number: string // 8 ký tự đầu của order ID
  status: "pending"
}
```

### order:new
```typescript
{
  orderId: string
  total: number
  status: string
}
```

## API Endpoints

### POST /api/orders
**Mục đích**: Tạo đơn hàng (cart-based hoặc direct)

**Body (Direct - Takeaway)**:
```json
{
  "recipient_name": "Khách mang đi",
  "phone": "0123456789",
  "payment_method": "cash",
  "subtotal": 100000,
  "discount_amount": 0,
  "total": 100000,
  "note": "Đơn mang đi",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "price": 50000
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* Order object */ }
}
```

## Testing Checklist

### Dine-in
- [ ] Chọn bàn trống → thêm món → món hiện ở Kitchen
- [ ] Thêm nhiều món → tất cả hiện ở Kitchen
- [ ] Thanh toán → đơn hiện ở Orders với status "pending"
- [ ] Socket real-time hoạt động

### Takeaway
- [ ] Tìm sản phẩm → thêm vào giỏ
- [ ] Điều chỉnh số lượng +/-
- [ ] Xóa món khỏi giỏ
- [ ] Áp dụng giảm giá
- [ ] Thanh toán → món hiện ở Kitchen
- [ ] Thanh toán → đơn hiện ở Orders
- [ ] Socket real-time hoạt động

### General
- [ ] Sidebar có link "Bán hàng" → `/staff/sales`
- [ ] Sidebar thu gọn/mở rộng hoạt động
- [ ] Chuyển tab Dine-in ↔ Takeaway mượt mà
- [ ] Phân quyền đúng (admin, sales, warehouse)

## Lưu ý
- Đã xóa các link cũ: `/staff/pos`, `/staff/pos-history`, `/staff/tables`
- Trang `/staff/tables` cũ vẫn tồn tại nhưng không có link trong sidebar
- Có thể xóa trang cũ sau khi test kỹ
- Server tự động emit socket events, không cần emit từ client
- Endpoint `/api/orders` đã được nâng cấp hỗ trợ cả 2 loại order

## Next Steps (Optional)
1. Test kỹ cả 2 tab
2. Xóa các trang cũ không dùng: `/staff/pos`, `/staff/pos-history`
3. Thêm thống kê doanh thu theo loại đơn (Dine-in vs Takeaway)
4. Thêm in hóa đơn cho Takeaway
5. Thêm lịch sử đơn hàng trong tab Takeaway
