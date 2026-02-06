# SỬA LỖI THANH CUỘN VÀ ĐẶT BÀN

## 🐛 Vấn đề

### 1. Danh sách món quá dài
- Khi có nhiều món, danh sách tràn ra ngoài
- Không có thanh cuộn
- Phần thanh toán bị mất (không nhìn thấy)

### 2. Bàn đã đặt trước trống
- Click vào bàn "Đã đặt trước" (reserved) → Panel trống
- Không hiển thị thông tin đặt bàn
- Không có nút xử lý

## ✅ Đã sửa

### 1. Thêm thanh cuộn (ScrollArea)

**File:** `client/app/staff/tables/table-detail-panel.tsx`

#### a) Cấu trúc layout mới
```typescript
<SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
  {/* Header - Fixed */}
  <SheetHeader className="p-4 border-b shrink-0">
    ...
  </SheetHeader>

  {/* Content - Scrollable */}
  <ScrollArea className="flex-1 overflow-y-auto">
    <div className="p-4 space-y-4">
      {/* Danh sách món */}
    </div>
  </ScrollArea>

  {/* Footer - Fixed */}
  {order && (
    <div className="border-t p-4 space-y-3 shrink-0">
      {/* Tổng tiền và nút thanh toán */}
    </div>
  )}
</SheetContent>
```

#### b) Key changes:
- `h-full` trên SheetContent → Chiếm full height
- `shrink-0` trên Header và Footer → Không bị co lại
- `flex-1` trên ScrollArea → Chiếm phần còn lại
- `overflow-y-auto` → Cho phép cuộn dọc

### 2. Xử lý bàn đã đặt trước (Reserved)

#### a) Thêm UI cho reserved table
```typescript
{!loading && table.status === "reserved" && (
  <div className="text-center py-8">
    <Coffee className="h-12 w-12 mx-auto text-blue-500 mb-4" />
    <h3 className="font-semibold mb-2">Bàn đã đặt trước</h3>
    
    {/* Thông tin khách đặt */}
    {table.reserved_for && (
      <p className="text-sm text-muted-foreground mb-2">
        Khách: {table.reserved_for}
      </p>
    )}
    
    {table.reserved_phone && (
      <p className="text-sm text-muted-foreground mb-2">
        SĐT: {table.reserved_phone}
      </p>
    )}
    
    {table.reserved_at && (
      <p className="text-sm text-muted-foreground mb-4">
        Đặt lúc: {new Date(table.reserved_at).toLocaleString('vi-VN')}
      </p>
    )}
    
    {/* Actions */}
    <div className="flex gap-2 justify-center">
      <Button onClick={handleStartOrder}>
        <Users className="mr-2 h-4 w-4" />
        Khách đã đến
      </Button>
      <Button variant="outline" onClick={() => {
        toast.info("Chức năng hủy đặt bàn đang phát triển")
      }}>
        Hủy đặt
      </Button>
    </div>
  </div>
)}
```

#### b) Thêm fields vào Table interface
```typescript
interface Table {
  id: string
  table_number: string
  status: string
  current_order_id: string | null
  current_guests: number
  occupied_at: string | null
  capacity: number
  reserved_at: string | null      // ← Mới
  reserved_for: string | null     // ← Mới
  reserved_phone: string | null   // ← Mới
}
```

## 🎯 Kết quả

### Trước khi sửa:
❌ Danh sách món dài → Không cuộn được → Mất nút thanh toán
❌ Bàn đã đặt → Panel trống → Không biết làm gì

### Sau khi sửa:
✅ Danh sách món dài → Có thanh cuộn → Luôn thấy nút thanh toán
✅ Bàn đã đặt → Hiển thị thông tin → Có nút "Khách đã đến" và "Hủy đặt"

## 📱 Demo

### 1. Bàn đang phục vụ (Occupied) - Nhiều món
```
┌─────────────────────────────┐
│ Bàn T-01                 [X]│ ← Header (Fixed)
│ Đang phục vụ                │
│ ⏱ 3p  👥 4 Người            │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Đơn hàng (5)      #TT01 │ │
│ │                         │ │
│ │ [Món 1]                 │ │
│ │ [Món 2]                 │ │ ← Scrollable
│ │ [Món 3]                 │ │
│ │ [Món 4]                 │ │
│ │ [Món 5]                 │ │
│ │                         │ │
│ │ [+ Thêm món]            │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Tạm tính:        370.000đ   │ ← Footer (Fixed)
│ Tổng cộng:       370.000đ   │
│ [Hủy] [In] [Thanh toán]     │
└─────────────────────────────┘
```

### 2. Bàn đã đặt trước (Reserved)
```
┌─────────────────────────────┐
│ Bàn T-04                 [X]│
│ Đã đặt trước                │
├─────────────────────────────┤
│                             │
│        ☕                    │
│   Bàn đã đặt trước          │
│                             │
│   Khách: Nguyễn Văn A       │
│   SĐT: 0901234567           │
│   Đặt lúc: 23/01 13:30      │
│                             │
│ [Khách đã đến] [Hủy đặt]    │
│                             │
└─────────────────────────────┘
```

## 🧪 Test

### Test 1: Thanh cuộn
1. Mở bàn T-01 (đang phục vụ)
2. Thêm nhiều món (>5 món)
3. Kiểm tra:
   - ✅ Có thanh cuộn bên phải
   - ✅ Cuộn được danh sách món
   - ✅ Luôn thấy phần tổng tiền ở dưới
   - ✅ Luôn thấy nút thanh toán

### Test 2: Bàn đã đặt
1. Mở bàn T-04 (đã đặt trước)
2. Kiểm tra:
   - ✅ Hiển thị icon cà phê màu xanh
   - ✅ Hiển thị "Bàn đã đặt trước"
   - ✅ Hiển thị thông tin khách (nếu có)
   - ✅ Có nút "Khách đã đến"
   - ✅ Có nút "Hủy đặt"

### Test 3: Responsive
1. Thu nhỏ cửa sổ trình duyệt
2. Kiểm tra:
   - ✅ Panel vẫn hiển thị đúng
   - ✅ Thanh cuộn vẫn hoạt động
   - ✅ Nút không bị che

## 🔧 Troubleshooting

### Vấn đề 1: Vẫn không cuộn được

**Nguyên nhân:** CSS conflict hoặc ScrollArea không có height

**Giải pháp:**
1. Kiểm tra SheetContent có `h-full`
2. Kiểm tra ScrollArea có `flex-1`
3. Clear cache (Ctrl + Shift + R)

### Vấn đề 2: Bàn reserved vẫn trống

**Nguyên nhân:** Database không có dữ liệu reserved

**Giải pháp:**
```sql
-- Tạo bàn reserved mẫu
UPDATE tables 
SET status = 'reserved',
    reserved_for = 'Nguyễn Văn A',
    reserved_phone = '0901234567',
    reserved_at = NOW()
WHERE table_number = 'T-04';
```

### Vấn đề 3: Nút "Khách đã đến" không hoạt động

**Nguyên nhân:** Chưa implement logic

**Giải pháp:** Nút này sẽ gọi `handleStartOrder()` để mở bàn cho khách đã đặt trước.

## 📝 TODO

- [ ] Implement chức năng "Hủy đặt bàn"
- [ ] Thêm form đặt bàn trước
- [ ] Thêm notification khi bàn đã đặt sắp đến giờ
- [ ] Thêm lịch sử đặt bàn

## ✅ Checklist

- [x] Thêm ScrollArea với flex-1
- [x] Header và Footer có shrink-0
- [x] SheetContent có h-full
- [x] Thêm UI cho reserved table
- [x] Thêm fields reserved vào Table interface
- [x] Test thanh cuộn với nhiều món
- [x] Test bàn đã đặt trước
- [x] Không có lỗi TypeScript
- [x] Không có lỗi runtime

---

**Kết quả:** Panel quản lý bàn giờ đã hoạt động mượt mà với thanh cuộn và xử lý đầy đủ các trạng thái bàn! 🎉
