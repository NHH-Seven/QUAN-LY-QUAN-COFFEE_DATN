# 🔄 HƯỚNG DẪN RESTART VÀ TEST

## ✅ Đã sửa gì?

### Vấn đề:
- Socket đã connected nhưng không join room "kitchen"
- `joinRoom()` không được gọi nếu socket đã tồn tại
- Kitchen page không nhận được event `kitchen:new-item`

### Giải pháp:
1. **Sửa `client/lib/socket.ts`:**
   - `joinRoom()` bây giờ kiểm tra socket state
   - Nếu chưa connected, sẽ join khi connected
   - Thêm log để debug

2. **Sửa `client/app/staff/kitchen/page.tsx`:**
   - Kiểm tra socket.connected trước khi join
   - Nếu chưa connected, đợi event 'connect' rồi join
   - Thêm nhiều log để debug

## 🚀 BƯỚC 1: RESTART SERVER VÀ CLIENT

### Terminal 1: Restart Server
```bash
# Nhấn Ctrl+C để stop server hiện tại
# Sau đó chạy lại:
cd server
npm run dev
```

**Chờ đến khi thấy:**
```
Server running on port 3001
🔌 Socket.io server initialized
```

### Terminal 2: Restart Client
```bash
# Nhấn Ctrl+C để stop client hiện tại
# Sau đó chạy lại:
cd client
npm run dev
```

**Chờ đến khi thấy:**
```
✓ Ready in 2s
○ Local: http://localhost:3000
```

## 🧪 BƯỚC 2: TEST KITCHEN PAGE

### 1. Clear Cache và Login
```bash
# Mở browser
# Nhấn Ctrl+Shift+Delete
# Chọn "Cached images and files"
# Click "Clear data"
```

Hoặc mở Console (F12) và chạy:
```javascript
localStorage.clear()
location.reload()
```

### 2. Login lại
- Truy cập: `http://localhost:3000/login`
- Login với tài khoản sales/admin/warehouse

### 3. Mở Kitchen Page
- Truy cập: `http://localhost:3000/staff/kitchen`
- Mở Console (F12)

### 4. Kiểm tra logs

**Phải thấy các log sau (theo thứ tự):**
```
🍳 Kitchen page: Initializing socket...
🔌 Socket connected: <socket-id>
📍 Joined room: kitchen
🍳 Kitchen page: Socket connected, joined kitchen room
👨‍🍳 User <userId> (sales) joined kitchen room
```

**Nếu KHÔNG thấy log trên:**
```javascript
// Chạy lệnh này trong Console:
console.log('Socket:', window.socket)
console.log('Connected:', window.socket?.connected)
console.log('Token:', localStorage.getItem('token'))
```

## 🧪 BƯỚC 3: TEST THÊM MÓN

### 1. Mở tab mới: Tables Page
- URL: `http://localhost:3000/staff/tables`
- Login nếu cần

### 2. Thêm món
1. Click vào bàn trống
2. Click "Mở bàn" → Nhập số khách (ví dụ: 2) → Xác nhận
3. Click "Thêm món"
4. Chọn sản phẩm (ví dụ: Cà phê đen)
5. Nhập số lượng: 1
6. Click "Thêm"

### 3. Kiểm tra Server Terminal

**Phải thấy:**
```
🔔 Emitting kitchen:new-item for: Cà phê đen Table: 01
```

**Nếu KHÔNG thấy:**
- Có lỗi khi thêm món
- Kiểm tra Network tab (F12 → Network)
- Xem response của request POST `/api/tables/orders/.../items`

### 4. Kiểm tra Kitchen Console

**Phải thấy:**
```
🔔 Kitchen page: New kitchen item received: {
  id: "...",
  product_name: "Cà phê đen",
  table_number: "01",
  quantity: 1,
  ...
}
```

**Và toast notification:**
```
Món mới: Cà phê đen - Bàn 01
```

### 5. Kiểm tra Kitchen UI

**Phải thấy:**
- Tab "Chờ pha chế" có món mới
- Card màu vàng với tên món "Cà phê đen"
- Số lượng: x1
- Bàn: 01

## 🐛 NẾU VẪN KHÔNG HOẠT ĐỘNG

### Debug Step 1: Kiểm tra Socket Connection

Tại Kitchen Console, chạy:
```javascript
// Test 1: Socket object
console.log('=== SOCKET TEST ===')
console.log('Socket:', window.socket)
console.log('Connected:', window.socket?.connected)
console.log('ID:', window.socket?.id)

// Test 2: Manual join
window.socket?.emit('join:room', 'kitchen')
console.log('Manually joined kitchen room')

// Test 3: Test listener
window.socket?.on('kitchen:new-item', (data) => {
  console.log('✅ TEST LISTENER WORKING:', data)
  alert('Received: ' + data.product_name)
})
console.log('Test listener registered')
```

### Debug Step 2: Kiểm tra Server Rooms

Tại Server, thêm log vào `server/src/socket/index.ts`:

```typescript
// Sau dòng: socket.join('kitchen')
console.log('🔍 Socket rooms:', Array.from(socket.rooms))
```

Restart server và kiểm tra log khi Kitchen page load.

### Debug Step 3: Test API trực tiếp

Tại Kitchen Console:
```javascript
fetch('http://localhost:3001/api/kitchen/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => {
  console.log('API Response:', d)
  console.log('Items:', d.data)
})
```

**Nếu API trả về empty:**
- Không có món pending trong database
- Hoặc table_order không active

## 📸 Screenshot cần gửi nếu vẫn lỗi

1. **Kitchen Console** (toàn bộ logs từ khi load page)
2. **Server Terminal** (logs khi thêm món)
3. **Network tab** (F12 → Network → Filter: WS → Xem WebSocket frames)
4. **Kết quả Debug Step 1, 2, 3**

## ✅ Kết quả mong đợi

Sau khi làm đúng các bước:

1. ✅ Kitchen Console có log "Socket connected"
2. ✅ Kitchen Console có log "Joined room: kitchen"
3. ✅ Server log có "User ... joined kitchen room"
4. ✅ Khi thêm món, Server log có "Emitting kitchen:new-item"
5. ✅ Kitchen Console có "New kitchen item received"
6. ✅ Toast notification xuất hiện
7. ✅ Món hiển thị trong tab "Chờ pha chế"

---

**Quan trọng:**
- Phải restart CẢ server VÀ client
- Phải clear cache và login lại
- Phải mở Console để xem logs
- Nếu vẫn lỗi, gửi screenshot cho tôi
