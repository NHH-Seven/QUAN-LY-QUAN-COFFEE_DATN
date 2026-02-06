# HƯỚNG DẪN SỬ DỤNG TRANG BÁN HÀNG

## Tổng quan
Trang **Bán hàng** (`/staff/sales`) gộp 2 chức năng:
1. **Dùng tại quán (Dine-in)** - Quản lý bàn và order tại chỗ
2. **Mang đi (Takeaway)** - POS đơn giản cho đơn mang đi

## Phân quyền
- **Admin**: Truy cập đầy đủ cả 2 tab
- **Sales**: Truy cập đầy đủ cả 2 tab  
- **Warehouse**: Truy cập đầy đủ cả 2 tab

## Tab 1: Dùng tại quán (Dine-in)

### Chức năng
- Xem danh sách bàn theo khu vực
- Lọc bàn theo trạng thái: Trống, Có khách, Đã đặt
- Tìm kiếm bàn
- Chọn bàn để xem chi tiết và thêm món
- Thanh toán và tạo đơn hàng

### Luồng sử dụng
1. Chọn tab "Dùng tại quán"
2. Chọn bàn cần phục vụ
3. Thêm món vào order
4. Món sẽ hiện real-time ở màn hình "Pha chế"
5. Khi khách thanh toán → nhập thông tin → Thanh toán
6. Đơn hàng được tạo trong "Đơn hàng" với trạng thái "Chờ xác nhận"

## Tab 2: Mang đi (Takeaway)

### Chức năng
- Xem danh sách sản phẩm
- Lọc theo danh mục
- Tìm kiếm sản phẩm
- Thêm vào giỏ hàng
- Điều chỉnh số lượng
- Áp dụng giảm giá
- Thanh toán và tạo đơn hàng

### Luồng sử dụng
1. Chọn tab "Mang đi"
2. Tìm và chọn sản phẩm → tự động thêm vào giỏ
3. Điều chỉnh số lượng bằng nút +/-
4. Click "Thanh toán"
5. Nhập thông tin:
   - Tên khách hàng (mặc định: "Khách mang đi")
   - Số điện thoại (bắt buộc)
   - Phương thức thanh toán
   - Giảm giá (nếu có)
6. Click "Xác nhận thanh toán"
7. Món sẽ hiện real-time ở màn hình "Pha chế"
8. Đơn hàng được tạo trong "Đơn hàng" với trạng thái "Chờ xác nhận"

## Real-time Sync

### Khi thêm món (Dine-in)
- Socket event: `kitchen:new-item`
- Màn hình "Pha chế" nhận ngay lập tức
- Hiển thị: Tên món, số lượng, bàn số, trạng thái "Đang chờ"

### Khi thanh toán (Takeaway)
- Server tự động emit socket event `kitchen:new-item` cho từng món
- Màn hình "Pha chế" nhận ngay lập tức
- Hiển thị: Tên món, số lượng, "Mang đi", trạng thái "Đang chờ"

### Khi tạo đơn hàng
- Socket event: `order:new`
- Màn hình "Đơn hàng" nhận thông báo real-time
- Tự động refresh danh sách đơn

## Lưu ý kỹ thuật
- Sidebar có thể thu gọn/mở rộng
- Tất cả socket events được emit từ server (không emit từ client)
- Endpoint Takeaway: `POST /api/orders` (hỗ trợ direct items)
- Endpoint Dine-in: `POST /api/tables/orders/:orderId/checkout`
