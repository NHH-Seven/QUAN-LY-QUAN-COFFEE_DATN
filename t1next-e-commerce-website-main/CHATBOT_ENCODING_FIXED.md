# ✅ ĐÃ SỬA LỖI ENCODING TIẾNG VIỆT - CHATBOT KNOWLEDGE

## Vấn đề
- Database hiển thị ký tự tiếng Việt bị lỗi: "Gi? m? c?a" thay vì "Giờ mở cửa"
- Nguyên nhân: Client encoding là WIN1258 trong khi server encoding là UTF8

## Giải pháp đã thực hiện

### 1. Cập nhật Database Connection
**File**: `server/src/db/index.ts`
- Thêm `client_encoding: 'UTF8'` vào Pool config
- Đảm bảo tất cả kết nối đều dùng UTF8

```typescript
export const pool = new Pool({
  connectionString: config.database.url,
  // Force UTF8 encoding for Vietnamese characters
  client_encoding: 'UTF8',
})
```

### 2. Làm sạch và Insert lại dữ liệu
**Script**: `server/fix-chatbot-encoding.js`
- Xóa dữ liệu cũ bị lỗi encoding
- Insert lại 6 mục kiến thức với encoding đúng:
  1. Giờ mở cửa
  2. Wifi miễn phí
  3. Bãi đậu xe
  4. Đặt bàn trước
  5. Giao hàng tận nơi
  6. Chương trình khách hàng thân thiết

### 3. Restart Server
- Dừng server cũ
- Kill process chiếm port 3001
- Khởi động lại server với config mới

## Kết quả
✅ Tiếng Việt hiển thị chính xác trong database
✅ API trả về dữ liệu tiếng Việt đúng
✅ UI admin hiển thị tiếng Việt không bị lỗi
✅ AI chatbot có thể đọc và trả lời bằng tiếng Việt

## Dữ liệu mẫu hiện tại

### Thông tin quán
- **Giờ mở cửa**: NHH Coffee mở cửa từ 7h sáng đến 10h tối hàng ngày, kể cả cuối tuần và ngày lễ.

### Tiện ích
- **Wifi miễn phí**: Quán có wifi miễn phí cho khách. Mật khẩu: NHHCoffee2024
- **Bãi đậu xe**: Quán có bãi đậu xe miễn phí cho khách ở phía sau quán, sức chứa khoảng 20 xe máy và 5 ô tô.

### Dịch vụ
- **Đặt bàn trước**: Quý khách có thể đặt bàn trước qua hotline 1900-xxxx hoặc trực tiếp tại quán. Đặt bàn từ 2 người trở lên.
- **Giao hàng tận nơi**: NHH Coffee có dịch vụ giao hàng tận nơi trong bán kính 5km. Phí ship từ 15.000đ. Đơn hàng từ 200.000đ được miễn phí ship.

### Khuyến mãi
- **Chương trình khách hàng thân thiết**: Tích điểm mỗi lần mua hàng. 1.000đ = 1 điểm. Đổi điểm lấy voucher giảm giá và quà tặng hấp dẫn.

## Test
1. Truy cập: http://localhost:3000/staff/chatbot-knowledge
2. Đăng nhập với tài khoản admin
3. Kiểm tra tiếng Việt hiển thị đúng trong bảng
4. Thử thêm/sửa kiến thức mới với tiếng Việt
5. Test AI chatbot với câu hỏi tiếng Việt

## Files đã sửa
- ✅ `server/src/db/index.ts` - Thêm UTF8 encoding
- ✅ `server/fix-chatbot-encoding.js` - Script fix dữ liệu (NEW)
- ✅ Database: Xóa và insert lại 6 mục kiến thức

## Lưu ý
- Tất cả dữ liệu mới insert vào database sẽ tự động dùng UTF8
- Không cần chạy lại script fix-chatbot-encoding.js
- Nếu gặp lỗi encoding trong tương lai, kiểm tra client_encoding trong connection

---
**Ngày hoàn thành**: 26/01/2026
**Status**: ✅ HOÀN THÀNH
