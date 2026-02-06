# SỬA LỖI QUẢN LÝ BÀN TRỐNG

## 🐛 Vấn đề

Khi click vào bàn đang phục vụ (occupied), panel chi tiết hiển thị trống.

## 🔍 Nguyên nhân

1. **Database chưa có bảng tables**: Migration chưa chạy
2. **Bàn occupied nhưng không có order**: Dữ liệu không nhất quán
3. **Frontend không xử lý trường hợp loading/error**: UI không hiển thị gì khi đang load hoặc lỗi

## ✅ Đã sửa

### 1. Chạy migration tạo bảng
```bash
cd server
npx tsx src/db/run-tables-migration.ts
```

**Kết quả:**
- ✅ Tạo 4 bảng: `areas`, `tables`, `table_orders`, `table_order_items`
- ✅ Seed 3 khu vực
- ✅ Seed 26 bàn

### 2. Tạo dữ liệu mẫu cho orders
```bash
cd server
npx tsx src/db/seed-table-orders.ts
```

**Kết quả:**
- ✅ Tạo orders cho các bàn occupied
- ✅ Thêm 2-4 món ngẫu nhiên cho mỗi order
- ✅ Link order với bàn qua `current_order_id`

### 3. Cải thiện UI Frontend

**File:** `client/app/staff/tables/table-detail-panel.tsx`

**Thay đổi:**

#### a) Thêm loading state
```typescript
{loading && (
  <div className="flex items-center justify-center py-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)}
```

#### b) Thêm error state cho bàn occupied không có order
```typescript
{!loading && table.status === "occupied" && !order && (
  <div className="text-center py-8">
    <Coffee className="h-12 w-12 mx-auto text-orange-500 mb-4" />
    <h3 className="font-semibold mb-2">Bàn đang phục vụ</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Không tìm thấy đơn hàng cho bàn này
    </p>
    <Button onClick={fetchTableDetail} variant="outline">
      <RefreshCw className="mr-2 h-4 w-4" />
      Tải lại
    </Button>
  </div>
)}
```

#### c) Thêm debug log và error handling
```typescript
const fetchTableDetail = useCallback(async () => {
  // ...
  console.log('Table detail response:', data) // Debug log
  
  if (data.success && data.data.current_order) {
    setOrder(data.data.current_order)
  } else if (data.success) {
    setOrder(null) // Bàn không có order
  } else {
    console.error('Failed to fetch table detail:', data.error)
    toast.error(data.error || 'Không thể tải thông tin bàn')
  }
}, [table.id])
```

## 🧪 Cách kiểm tra

### 1. Kiểm tra database
```bash
cd server
npx tsx src/db/check-tables.ts
```

**Kết quả mong đợi:**
```
📊 Occupied tables:
  ✓ G-01: TG01824374 - active
  ✓ T-01: TT01824363 - active
  ✓ T-03: TT03824370 - active

📈 Tables by status:
  available: 22
  occupied: 3
  reserved: 1

📝 Total orders: 3
```

### 2. Kiểm tra frontend

1. **Mở trình duyệt**: http://localhost:3000/staff/tables
2. **Đăng nhập** với tài khoản admin/sales/warehouse
3. **Click vào bàn T-01** (màu cam - occupied)
4. **Kiểm tra panel bên phải**:
   - ✅ Hiển thị thông tin bàn
   - ✅ Hiển thị số khách
   - ✅ Hiển thị thời gian phục vụ
   - ✅ Hiển thị danh sách món
   - ✅ Có nút "Thêm món", "Thanh toán"

### 3. Kiểm tra console log

Mở **DevTools (F12)** → Tab **Console**

**Khi click vào bàn, sẽ thấy:**
```javascript
Table detail response: {
  success: true,
  data: {
    id: "...",
    table_number: "T-01",
    status: "occupied",
    current_order: {
      id: "...",
      order_number: "TT01824363",
      items: [...]
    }
  }
}
```

## 🔧 Troubleshooting

### Vấn đề 1: Panel vẫn trống

**Giải pháp:**
1. Clear cache trình duyệt (Ctrl + Shift + R)
2. Kiểm tra console log có lỗi không
3. Kiểm tra Network tab xem API response

### Vấn đề 2: Lỗi "Không tìm thấy đơn hàng"

**Nguyên nhân:** Bàn occupied nhưng không có order

**Giải pháp:**
```bash
cd server
npx tsx src/db/seed-table-orders.ts
```

### Vấn đề 3: Lỗi 401 Unauthorized

**Nguyên nhân:** Token hết hạn

**Giải pháp:**
```javascript
localStorage.clear()
location.reload()
// Đăng nhập lại
```

### Vấn đề 4: Không có dữ liệu bàn

**Nguyên nhân:** Migration chưa chạy

**Giải pháp:**
```bash
cd server
npx tsx src/db/run-tables-migration.ts
```

## 📝 Scripts hữu ích

### Kiểm tra dữ liệu
```bash
cd server
npx tsx src/db/check-tables.ts
```

### Reset và tạo lại dữ liệu
```bash
cd server
# Chạy lại migration (sẽ xóa dữ liệu cũ)
npx tsx src/db/run-tables-migration.ts

# Tạo orders mẫu
npx tsx src/db/seed-table-orders.ts
```

### Xóa tất cả orders
```sql
-- Trong psql hoặc database client
DELETE FROM table_order_items;
DELETE FROM table_orders;
UPDATE tables SET current_order_id = NULL, status = 'available', current_guests = 0, occupied_at = NULL;
```

## ✅ Checklist

- [ ] Migration đã chạy (có 4 bảng: areas, tables, table_orders, table_order_items)
- [ ] Database có dữ liệu bàn (26 bàn)
- [ ] Bàn occupied có orders (check với script)
- [ ] Frontend hiển thị loading state
- [ ] Frontend hiển thị error state khi cần
- [ ] Console log không có lỗi
- [ ] Panel hiển thị đầy đủ thông tin khi click vào bàn

## 🎯 Kết quả

Sau khi sửa:
- ✅ Click vào bàn trống → Hiển thị form mở bàn
- ✅ Click vào bàn đang phục vụ → Hiển thị danh sách món
- ✅ Click vào bàn đã đặt → Hiển thị thông tin đặt trước
- ✅ Loading state khi đang tải
- ✅ Error state khi có lỗi
- ✅ Có nút "Tải lại" khi lỗi

---

**Lưu ý:** Nếu vẫn gặp vấn đề, kiểm tra:
1. Server đang chạy (port 3001)
2. Client đang chạy (port 3000)
3. Token hợp lệ trong localStorage
4. Database connection OK
5. Console log để xem lỗi cụ thể
