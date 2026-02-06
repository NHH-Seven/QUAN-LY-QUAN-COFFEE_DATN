# ✅ CHECKLIST: SỬA LỖI KITCHEN KHÔNG HIỆN MÓN

## Bước 1: Restart Server và Client

```bash
# Terminal 1: Stop server (Ctrl+C) rồi chạy lại
cd server
npm run dev

# Terminal 2: Stop client (Ctrl+C) rồi chạy lại  
cd client
npm run dev
```

**Lý do:** Code đã thay đổi, cần restart để áp dụng.

## Bước 2: Clear Cache và Login lại

1. Mở browser
2. Nhấn `Ctrl+Shift+Delete`
3. Chọn "Cached images and files"
4. Click "Clear data"
5. Hoặc mở Console (F12) và chạy:
```javascript
localStorage.clear()
```
6. Truy cập `http://localhost:3000/login`
7. Login với tài khoản sales/admin

**Lý do:** Token cũ có thể hết hạn hoặc không hợp lệ.

## Bước 3: Kiểm tra Kitchen Page

1. Truy cập: `http://localhost:3000/staff/kitchen`
2. Mở Console (F12)
3. Kiểm tra có các log sau:

```
✅ Phải có:
🔌 Socket connected: <socket-id>
🍳 Kitchen page: Joined kitchen room
```

4. Nếu KHÔNG có log trên, chạy lệnh này trong Console:

```javascript
// Kiểm tra socket
console.log('Socket:', window.socket)
console.log('Connected:', window.socket?.connected)

// Kiểm tra token
console.log('Token:', localStorage.getItem('token'))
```

## Bước 4: Test thêm món

1. Mở tab mới: `http://localhost:3000/staff/tables`
2. Click vào bàn trống
3. Click "Mở bàn" → Nhập số khách → Xác nhận
4. Click "Thêm món"
5. Chọn sản phẩm (ví dụ: Cà phê đen)
6. Nhập số lượng: 1
7. Click "Thêm"

## Bước 5: Kiểm tra Server Log

**Tại Terminal Server, phải thấy:**

```
🔔 Emitting kitchen:new-item for: Cà phê đen Table: 01
```

**Nếu KHÔNG thấy:**
- Server chưa restart
- Hoặc có lỗi khi thêm món

## Bước 6: Kiểm tra Kitchen Console

**Tại Kitchen Page Console, phải thấy:**

```
🔔 Kitchen page: New kitchen item received: {
  id: "...",
  product_name: "Cà phê đen",
  table_number: "01",
  quantity: 1,
  ...
}
```

**Nếu KHÔNG thấy:**
- Socket chưa join room "kitchen"
- Event listener chưa được setup
- Client chưa restart

## Bước 7: Kiểm tra UI Kitchen

**Tại Kitchen Page:**

1. Tab "Chờ pha chế" phải có món mới
2. Có toast notification: "Món mới: Cà phê đen - Bàn 01"
3. Có âm thanh thông báo (nếu bật)

## 🐛 Nếu vẫn không hoạt động

### Test 1: Kiểm tra API trực tiếp

Mở Console tại Kitchen page và chạy:

```javascript
fetch('http://localhost:3001/api/kitchen/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "product_name": "Cà phê đen",
      "table_number": "01",
      "quantity": 1,
      "status": "pending",
      ...
    }
  ]
}
```

### Test 2: Kiểm tra Socket Room

Mở Console tại Kitchen page và chạy:

```javascript
// Test join room
window.socket.emit('join:room', 'kitchen')
console.log('Joined kitchen room')

// Test listener
window.socket.on('kitchen:new-item', (data) => {
  console.log('✅ Listener working!', data)
})
```

### Test 3: Kiểm tra Database

Nếu API trả về empty, kiểm tra database:

```sql
-- Kiểm tra có table_orders active không
SELECT * FROM table_orders WHERE status = 'active';

-- Kiểm tra có items pending không
SELECT toi.*, tor.order_number, t.table_number
FROM table_order_items toi
JOIN table_orders tor ON toi.table_order_id = tor.id
JOIN tables t ON tor.table_id = t.id
WHERE tor.status = 'active' AND toi.status = 'pending';
```

## 📸 Screenshot cần gửi nếu vẫn lỗi

1. Kitchen Console (toàn bộ logs)
2. Server Terminal (khi thêm món)
3. Network tab (F12 → Network → Filter: WS)
4. Kết quả Test 1, 2, 3 ở trên

## 🎯 Kết quả mong đợi

Sau khi làm đúng các bước:

- ✅ Kitchen page có log "Socket connected"
- ✅ Kitchen page có log "Joined kitchen room"
- ✅ Server log có "Emitting kitchen:new-item" khi thêm món
- ✅ Kitchen console có "New kitchen item received"
- ✅ Kitchen UI hiển thị món mới trong tab "Chờ pha chế"
- ✅ Toast notification xuất hiện
- ✅ Âm thanh thông báo phát

---

**Lưu ý quan trọng:**
- Phải restart CẢ server VÀ client sau khi sửa code
- Phải clear cache và login lại
- Phải mở Console để xem logs
