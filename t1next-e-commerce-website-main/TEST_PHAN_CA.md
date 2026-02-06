# ✅ HƯỚNG DẪN TEST CHỨC NĂNG PHÂN CA

## 🔧 ĐÃ SỬA
- ✅ Đã viết lại hoàn toàn file `server/src/routes/shifts.ts`
- ✅ Sửa tất cả `req.user.id` → `req.user.userId` (theo JwtPayload interface)
- ✅ Sửa SQL placeholders: dùng concatenation `' AND field = $' + idx` thay vì template string
- ✅ Sửa JOIN: `ss.staff_id::text = u.id` để cast integer to text
- ✅ Server đã restart thành công

## 📋 CÁC BƯỚC TEST

### 1️⃣ TEST ADMIN PHÂN CÔNG CA

**Đăng nhập Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Vào trang Phân ca:**
1. Vào `/staff/shifts`
2. Nhấn nút **"Phân công ca"** (góc trên bên phải)
3. Chọn nhân viên từ dropdown
4. Chọn ca làm việc (Sáng/Chiều/Tối)
5. Chọn ngày làm việc
6. Nhấn **"Phân công"**

**Kiểm tra:**
- ✅ Có thông báo "Đã phân công ca" xuất hiện
- ✅ Ca mới xuất hiện trong bảng lịch tuần
- ✅ Kiểm tra console không có lỗi

### 2️⃣ TEST NHÂN VIÊN XEM CA

**Đăng nhập Nhân viên:**
- Email: `sales@example.com` (role: sales)
- Password: `sales123`

**Hoặc:**
- Email: `warehouse@example.com` (role: warehouse)
- Password: `warehouse123`

**Vào trang Phân ca:**
1. Vào `/staff/shifts`
2. Xem tab **"Lịch làm việc"**

**Kiểm tra:**
- ✅ Nhân viên chỉ thấy ca của mình (không thấy ca của người khác)
- ✅ Ca được phân công bởi Admin hiển thị đúng
- ✅ Hiển thị tên ca, giờ bắt đầu, giờ kết thúc
- ✅ Màu sắc ca hiển thị đúng

### 3️⃣ TEST CHẤM CÔNG (CHECK IN/OUT)

**Điều kiện:**
- Phải có ca được phân công cho **hôm nay**
- Admin phân công ca cho nhân viên với ngày = hôm nay

**Test Check-in:**
1. Đăng nhập nhân viên có ca hôm nay
2. Vào `/staff/shifts`
3. Nhấn nút **"Chấm công vào"**

**Kiểm tra:**
- ✅ Thông báo "Check-in thành công"
- ✅ Trạng thái ca chuyển từ "Đã lên lịch" → "Đang làm"
- ✅ Nút đổi thành **"Chấm công ra"**

**Test Check-out:**
1. Sau khi đã check-in
2. Nhấn nút **"Chấm công ra"**

**Kiểm tra:**
- ✅ Thông báo "Check-out thành công"
- ✅ Trạng thái ca chuyển thành "Đã xong"
- ✅ Không còn nút chấm công

### 4️⃣ TEST YÊU CẦU ĐỔI CA

**Điều kiện:**
- Nhân viên A và B đều có ca được phân công
- Nhân viên A muốn đổi ca với B

**Tạo yêu cầu đổi ca:**
1. Đăng nhập Nhân viên A
2. Vào `/staff/shifts`
3. Nhấn nút **"Yêu cầu đổi ca"**
4. Chọn ca của mình muốn đổi
5. Chọn nhân viên B
6. Chọn ca của B muốn nhận
7. Nhập lý do (optional)
8. Nhấn **"Gửi yêu cầu"**

**Kiểm tra:**
- ✅ Thông báo "Đã gửi yêu cầu đổi ca"
- ✅ Yêu cầu xuất hiện trong tab "Yêu cầu đổi ca"
- ✅ Trạng thái: "Chờ duyệt"

**Phản hồi yêu cầu (Nhân viên B hoặc Admin):**
1. Đăng nhập Nhân viên B hoặc Admin
2. Vào `/staff/shifts` → Tab "Yêu cầu đổi ca"
3. Thấy yêu cầu từ Nhân viên A
4. Nhấn **"Chấp nhận"** hoặc **"Từ chối"**

**Kiểm tra khi Chấp nhận:**
- ✅ Thông báo "Đã chấp nhận yêu cầu đổi ca"
- ✅ Ca của A và B được hoán đổi trong lịch
- ✅ Trạng thái yêu cầu: "Đã duyệt"

**Kiểm tra khi Từ chối:**
- ✅ Thông báo "Đã từ chối yêu cầu đổi ca"
- ✅ Ca không thay đổi
- ✅ Trạng thái yêu cầu: "Đã từ chối"

## 🐛 NẾU GẶP LỖI

### Lỗi: "Không tìm thấy ca làm việc"
**Nguyên nhân:** Chưa có ca được tạo trong database
**Giải pháp:** Admin tạo ca mới (Sáng/Chiều/Tối) trước

### Lỗi: "Không thấy nhân viên trong dropdown"
**Nguyên nhân:** Query staff bị lỗi
**Kiểm tra:**
```sql
SELECT id, name, role FROM users WHERE role IN ('admin', 'sales', 'warehouse');
```

### Lỗi: "Không lưu được phân công"
**Kiểm tra Console:**
- Xem có lỗi SQL không
- Xem có lỗi "req.user.userId is undefined" không
- Xem có lỗi cast integer to text không

### Lỗi: "Nhân viên không thấy ca của mình"
**Kiểm tra:**
1. Console log: `schedule` array có data không
2. API response: `/api/shifts/schedule` trả về gì
3. Filter logic: `sh.work_date.split("T")[0] === dateStr` có đúng không

## 📊 KIỂM TRA DATABASE

**Xem ca đã phân công:**
```sql
SELECT ss.*, u.name as staff_name, s.name as shift_name
FROM staff_shifts ss
JOIN users u ON ss.staff_id::text = u.id
JOIN shifts s ON ss.shift_id = s.id
ORDER BY ss.work_date DESC;
```

**Xem yêu cầu đổi ca:**
```sql
SELECT sr.*, 
  u1.name as requester_name,
  u2.name as target_name
FROM shift_swap_requests sr
JOIN users u1 ON sr.requester_id = u1.id
LEFT JOIN users u2 ON sr.target_id = u2.id
ORDER BY sr.created_at DESC;
```

## ✅ CHECKLIST

- [ ] Admin có thể phân công ca cho nhân viên
- [ ] Nhân viên thấy ca được phân công
- [ ] Nhân viên có thể check-in/check-out
- [ ] Nhân viên có thể tạo yêu cầu đổi ca
- [ ] Nhân viên/Admin có thể phản hồi yêu cầu đổi ca
- [ ] Ca được hoán đổi khi chấp nhận yêu cầu
- [ ] Không có lỗi trong console
- [ ] Không có lỗi SQL trong server log

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi test xong, chức năng Phân ca phải hoạt động hoàn toàn bình thường:
- ✅ Admin phân công ca → Lưu vào DB
- ✅ Nhân viên xem ca → Hiển thị đúng
- ✅ Chấm công → Cập nhật trạng thái
- ✅ Đổi ca → Hoán đổi ca thành công

---

**Server đang chạy:** ✅ http://localhost:3001
**Client đang chạy:** ✅ http://localhost:3000

Hãy test theo các bước trên và báo lại kết quả! 🚀
