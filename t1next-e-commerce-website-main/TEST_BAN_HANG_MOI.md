# CHECKLIST TEST TRANG BÁN HÀNG MỚI

## Chuẩn bị
- [ ] Restart server: `cd server && npm run dev`
- [ ] Restart client: `cd client && npm run dev`
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Login với tài khoản có role: admin, sales, hoặc warehouse
- [ ] Mở 2 tab browser:
  - Tab 1: `/staff/sales` (Bán hàng)
  - Tab 2: `/staff/kitchen` (Pha chế)

## Test 1: Kiểm tra Navigation
- [ ] Sidebar có menu "Bán hàng" với icon Store
- [ ] Click "Bán hàng" → chuyển đến `/staff/sales`
- [ ] Trang có 2 tabs: "Dùng tại quán" và "Mang đi"
- [ ] Sidebar có thể thu gọn/mở rộng bằng nút chevron

## Test 2: Tab Dùng tại quán (Dine-in)

### 2.1. Hiển thị danh sách bàn
- [ ] Hiển thị danh sách bàn theo khu vực
- [ ] Mỗi bàn hiển thị: số bàn, trạng thái, số khách (nếu có)
- [ ] Bàn "Trống" có màu xanh
- [ ] Bàn "Có khách" có màu cam và viền cam
- [ ] Bàn "Đã đặt" có màu xanh dương và viền xanh

### 2.2. Lọc và tìm kiếm
- [ ] Click "Trống" → chỉ hiện bàn trống
- [ ] Click "Có khách" → chỉ hiện bàn có khách
- [ ] Click "Đã đặt" → chỉ hiện bàn đã đặt
- [ ] Tìm kiếm "Bàn 1" → chỉ hiện Bàn 1
- [ ] Clear search → hiện lại tất cả

### 2.3. Thêm món và Real-time
- [ ] Chọn 1 bàn trống
- [ ] Panel chi tiết bàn mở ra bên phải
- [ ] Tìm và thêm món vào order
- [ ] **QUAN TRỌNG**: Chuyển sang tab Kitchen → món hiện ngay lập tức
- [ ] Món hiển thị: tên, số lượng, bàn số, trạng thái "Đang chờ"
- [ ] Thêm thêm món → Kitchen cập nhật real-time

### 2.4. Thanh toán
- [ ] Click "Thanh toán" ở panel bàn
- [ ] Dialog thanh toán hiện ra
- [ ] Nhập tên khách hàng và số điện thoại
- [ ] Chọn phương thức thanh toán
- [ ] Click "Xác nhận thanh toán"
- [ ] Toast "Thanh toán thành công"
- [ ] Bàn chuyển về trạng thái "Trống"
- [ ] Chuyển sang `/staff/orders` → đơn mới hiện với status "Chờ xác nhận"

## Test 3: Tab Mang đi (Takeaway)

### 3.1. Hiển thị sản phẩm
- [ ] Chuyển sang tab "Mang đi"
- [ ] Hiển thị danh sách sản phẩm dạng grid
- [ ] Mỗi sản phẩm hiển thị: ảnh, tên, giá, tồn kho
- [ ] Có thanh tìm kiếm
- [ ] Có các nút lọc danh mục

### 3.2. Giỏ hàng
- [ ] Click vào 1 sản phẩm → tự động thêm vào giỏ
- [ ] Giỏ hàng hiển thị bên phải
- [ ] Hiển thị: ảnh, tên, giá, số lượng
- [ ] Click nút "+" → tăng số lượng
- [ ] Click nút "-" → giảm số lượng
- [ ] Click icon thùng rác → xóa món khỏi giỏ
- [ ] Tổng tiền tự động cập nhật

### 3.3. Thanh toán và Real-time
- [ ] Click "Thanh toán"
- [ ] Dialog thanh toán hiện ra
- [ ] Nhập số điện thoại (bắt buộc)
- [ ] Chọn phương thức thanh toán
- [ ] Nhập giảm giá (optional)
- [ ] Tổng tiền tự động trừ giảm giá
- [ ] Click "Xác nhận thanh toán"
- [ ] **QUAN TRỌNG**: Chuyển sang tab Kitchen → tất cả món hiện ngay
- [ ] Món hiển thị: tên, số lượng, "Mang đi", trạng thái "Đang chờ"
- [ ] Giỏ hàng tự động clear
- [ ] Chuyển sang `/staff/orders` → đơn mới hiện với status "Chờ xác nhận"

## Test 4: Real-time Sync (Quan trọng nhất)

### 4.1. Dine-in → Kitchen
- [ ] Mở 2 tabs: Sales (Dine-in) và Kitchen
- [ ] Thêm món ở Sales → Kitchen cập nhật NGAY LẬP TỨC (không cần refresh)
- [ ] Thêm nhiều món → tất cả hiện ở Kitchen

### 4.2. Takeaway → Kitchen
- [ ] Mở 2 tabs: Sales (Takeaway) và Kitchen
- [ ] Thanh toán đơn Takeaway → Kitchen cập nhật NGAY LẬP TỨC
- [ ] Tất cả món trong giỏ đều hiện ở Kitchen

### 4.3. Sales → Orders
- [ ] Mở 2 tabs: Sales và Orders
- [ ] Thanh toán (Dine-in hoặc Takeaway) → Orders cập nhật NGAY LẬP TỨC
- [ ] Đơn mới hiện ở đầu danh sách

## Test 5: Phân quyền

### 5.1. Admin
- [ ] Login với admin
- [ ] Truy cập `/staff/sales` → OK
- [ ] Thấy cả 2 tabs
- [ ] Có thể thêm món và thanh toán

### 5.2. Sales
- [ ] Login với sales
- [ ] Truy cập `/staff/sales` → OK
- [ ] Thấy cả 2 tabs
- [ ] Có thể thêm món và thanh toán

### 5.3. Warehouse
- [ ] Login với warehouse
- [ ] Truy cập `/staff/sales` → OK
- [ ] Thấy cả 2 tabs
- [ ] Có thể thêm món và thanh toán

## Test 6: Edge Cases

### 6.1. Sản phẩm hết hàng
- [ ] Thêm món có stock = 0 → hiển thị lỗi "Không đủ hàng"
- [ ] Thêm số lượng > stock → hiển thị lỗi

### 6.2. Form validation
- [ ] Thanh toán Takeaway không nhập SĐT → hiển thị lỗi
- [ ] Thanh toán với giỏ trống → hiển thị lỗi

### 6.3. Network error
- [ ] Tắt server → thanh toán → hiển thị lỗi "Lỗi kết nối"
- [ ] Bật lại server → thử lại → OK

## Kết quả Test

### Dine-in
- [ ] ✅ Tất cả test pass
- [ ] ❌ Có lỗi (ghi rõ lỗi gì)

### Takeaway
- [ ] ✅ Tất cả test pass
- [ ] ❌ Có lỗi (ghi rõ lỗi gì)

### Real-time
- [ ] ✅ Socket hoạt động hoàn hảo
- [ ] ❌ Có delay hoặc không sync (ghi rõ)

## Ghi chú
- Nếu có lỗi, check console browser (F12)
- Nếu socket không hoạt động, check server logs
- Nếu món không hiện ở Kitchen, check:
  1. Socket đã connect chưa (xem console log "🔌 Socket connected")
  2. Đã join room "kitchen" chưa (xem log "📍 Joined room: kitchen")
  3. Server có emit event không (xem server logs)
