# DEBUG: KITCHEN KHÔNG NHẬN REAL-TIME

## 🔍 Các bước kiểm tra

### Bước 1: Kiểm tra Socket Connection

**Tại Kitchen Page (`http://localhost:3000/staff/kitchen`):**

1. Mở Console (F12)
2. Kiểm tra các log sau:

```
✅ Phải có:
🔌 Socket connected: <socket-id>
🍳 Kitchen page: Joined kitchen room

❌ Nếu không có:
- Socket chưa kết nối
- Token không hợp lệ
- Server chưa chạy
```

3. Kiểm tra socket object:
```javascript
// Paste vào Console
console.log('Socket:', window.socket)
console.log('Connected:', window.socket?.connected)
console.log('ID:', window.socket?.id)
```

**Kết quả mong đợi:**
```javascript
Socket: Socket { ... }
Connected: true
ID: "abc123..."
```

### Bước 2: Kiểm tra Server Emit

**Tại Tables Page, thêm món:**

1. Click vào bàn → Thêm món → Chọn sản phẩm → Xác nhận
2. Kiểm tra **Server Terminal** có log:

```
✅ Phải có:
🔔 Emitting kitchen:new-item for: <product_name> Table: <table_number>

❌ Nếu không có:
- Backend chưa restart sau khi sửa code
- Endpoint thêm món có lỗi
```

### Bước 3: Kiểm tra Kitchen Listener

**Tại Kitchen Page Console:**

Sau khi thêm món ở Tables, kiểm tra log:

```
✅ Phải có:
🔔 Kitchen page: New kitchen item received: { ... }

❌ Nếu không có:
- Socket chưa join room "kitchen"
- Event listener chưa được setup
- Frontend chưa rebuild
```

### Bước 4: Test Manual Socket Emit

**Tại Kitchen Page Console:**

```javascript
// Test emit từ client
window.socket.emit('test', { message: 'Hello from kitchen' })

// Test listen
window.socket.on('test-response', (data) => {
  console.log('Received:', data)
})
```

## 🐛 Các vấn đề thường gặp

### 1. Socket không kết nối

**Triệu chứng:**
- Console không có log "Socket connected"
- `window.socket` là undefined hoặc `connected: false`

**Nguyên nhân:**
- Token không hợp lệ hoặc hết hạn
- Server không chạy
- CORS settings sai

**Giải pháp:**
```javascript
// 1. Kiểm tra token
console.log('Token:', localStorage.getItem('token'))

// 2. Logout và login lại
localStorage.clear()
// Sau đó login lại

// 3. Kiểm tra server đang chạy
// Truy cập: http://localhost:3001
```

### 2. Socket kết nối nhưng không join room

**Triệu chứng:**
- Có log "Socket connected"
- Không có log "Joined kitchen room"

**Nguyên nhân:**
- `joinRoom('kitchen')` chưa được gọi
- Frontend chưa rebuild

**Giải pháp:**
```bash
# Restart client
cd client
# Ctrl+C để stop
npm run dev
```

### 3. Server không emit event

**Triệu chứng:**
- Thêm món thành công
- Server log không có "Emitting kitchen:new-item"

**Nguyên nhân:**
- Backend chưa restart sau khi sửa code
- Code emit bị comment hoặc xóa

**Giải pháp:**
```bash
# Restart server
cd server
# Ctrl+C để stop
npm run dev
```

### 4. Kitchen không refresh

**Triệu chứng:**
- Socket connected
- Server emit event
- Kitchen console có log "New kitchen item received"
- Nhưng UI không update

**Nguyên nhân:**
- `fetchData()` không được gọi
- API `/api/kitchen/orders` trả về empty

**Giải pháp:**
```javascript
// Tại Kitchen Console, test API
fetch('http://localhost:3001/api/kitchen/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('Kitchen orders:', d))
```

## 🧪 Test Script

**Paste vào Kitchen Console để test toàn bộ:**

```javascript
// Test Socket Connection
console.log('=== SOCKET TEST ===')
console.log('1. Socket object:', window.socket)
console.log('2. Connected:', window.socket?.connected)
console.log('3. Socket ID:', window.socket?.id)

// Test Token
console.log('\n=== TOKEN TEST ===')
const token = localStorage.getItem('token')
console.log('4. Token exists:', !!token)
console.log('5. Token length:', token?.length)

// Test API
console.log('\n=== API TEST ===')
fetch('http://localhost:3001/api/kitchen/orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(d => {
  console.log('6. API Response:', d)
  console.log('7. Items count:', d.data?.length)
})
.catch(e => console.error('8. API Error:', e))

// Test Socket Listener
console.log('\n=== LISTENER TEST ===')
window.socket?.on('kitchen:new-item', (data) => {
  console.log('9. ✅ Listener working! Received:', data)
})
console.log('10. Listener registered. Now add item from Tables page.')
```

## 📋 Checklist

Trước khi báo lỗi, hãy kiểm tra:

- [ ] Server đang chạy (port 3001)
- [ ] Client đang chạy (port 3000)
- [ ] Đã login với tài khoản sales/admin/warehouse
- [ ] Token có trong localStorage
- [ ] Console có log "Socket connected"
- [ ] Console có log "Joined kitchen room"
- [ ] Server log có "Emitting kitchen:new-item" khi thêm món
- [ ] Kitchen console có "New kitchen item received" khi thêm món
- [ ] API `/api/kitchen/orders` trả về dữ liệu

## 🔧 Quick Fix

Nếu vẫn không hoạt động, thử các bước sau:

```bash
# 1. Stop tất cả
# Ctrl+C ở cả 2 terminal (server và client)

# 2. Clear cache
# Tại browser: Ctrl+Shift+Delete → Clear cache

# 3. Restart server
cd server
npm run dev

# 4. Restart client (terminal mới)
cd client
npm run dev

# 5. Clear localStorage
# Tại browser Console:
localStorage.clear()

# 6. Login lại
# Truy cập: http://localhost:3000/login

# 7. Test lại
# Kitchen: http://localhost:3000/staff/kitchen
# Tables: http://localhost:3000/staff/tables
```

## 📞 Nếu vẫn lỗi

Gửi cho tôi:

1. **Kitchen Console logs** (toàn bộ)
2. **Server Terminal logs** (khi thêm món)
3. **Network tab** (F12 → Network → Filter: WS)
4. **Kết quả test script** (paste vào Console)

---

**Lưu ý:** Socket.IO cần WebSocket hoặc polling. Kiểm tra firewall/antivirus không block port 3001.
