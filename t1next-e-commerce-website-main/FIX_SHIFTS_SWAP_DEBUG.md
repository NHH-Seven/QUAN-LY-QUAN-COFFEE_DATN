# Sửa lỗi Yêu cầu đổi ca - Debug Log

## Vấn đề
User không phải admin đăng nhập vào không thấy ca đã được phân công trong dropdown "Yêu cầu đổi ca"

## Các thay đổi đã thực hiện

### 1. Client - Thêm debug logs

#### `client/app/staff/shifts/page.tsx`
- Thêm console.log khi fetch data để xem schedule có được load không
- Thêm console.log khi click nút "Yêu cầu đổi ca" để xem schedule state
- Log cả admin và non-admin schedule data

#### `client/app/staff/shifts/swap-request-dialog.tsx`
- Thêm console.log khi dialog mở để xem `myShifts` prop
- Thêm console.log cho `futureShifts` sau khi filter
- Sửa logic filter để bao gồm cả ca hôm nay (không chỉ future)
- Thêm log cho available shifts response

### 2. Server - Thêm debug logs

#### `server/src/routes/shifts.ts`
- Thêm console.log trong endpoint `/shifts/schedule` để xem:
  - User ID và role
  - Query params (start_date, end_date, staff_id)
  - SQL query được build
  - Params array
  - Số rows trả về

## Cách kiểm tra

### Bước 1: Đăng nhập với tài khoản admin
1. Vào trang `/staff/shifts`
2. Phân công ca cho một nhân viên (ví dụ: sales user)
3. Chọn ngày hôm nay hoặc ngày mai
4. Chọn ca (Sáng, Chiều, hoặc Tối)
5. Click "Phân công"

### Bước 2: Đăng nhập với tài khoản đã được phân công
1. Logout khỏi admin
2. Login với tài khoản sales (hoặc warehouse) đã được phân công ca
3. Vào trang `/staff/shifts`
4. Mở Console (F12) để xem logs
5. Click nút "Yêu cầu đổi ca"

### Bước 3: Kiểm tra Console logs

Bạn sẽ thấy các logs sau:

#### Khi load trang:
```
Shifts data: {...}
Week data: {...}
Non-admin schedule data: [...]
Schedule length: X
```

#### Khi click "Yêu cầu đổi ca":
```
Opening swap dialog with schedule: [...]
Schedule length: X
SwapRequestDialog opened
My shifts received: [...]
My shifts length: X
Today: ...
Future shifts after filter: [...]
Future shifts length: X
Available shifts response: {...}
```

#### Từ server:
```
GET /schedule - User: <user_id> <role>
Query params: { start_date: '...', end_date: '...' }
SQL: SELECT ss.*, ...
Params: ['<user_id>', '...']
Schedule result: X rows
```

## Các trường hợp có thể xảy ra

### Trường hợp 1: `schedule` state rỗng
- **Triệu chứng**: `Schedule length: 0`
- **Nguyên nhân**: API không trả về data hoặc query params sai
- **Kiểm tra**: Xem server logs để xem SQL query và params
- **Giải pháp**: Kiểm tra database có data không, kiểm tra user_id đúng không

### Trường hợp 2: `futureShifts` rỗng sau khi filter
- **Triệu chứng**: `My shifts length: X` nhưng `Future shifts length: 0`
- **Nguyên nhân**: Filter date loại bỏ tất cả shifts
- **Kiểm tra**: Xem `work_date` của shifts có >= hôm nay không
- **Giải pháp**: Đã sửa filter để bao gồm cả hôm nay

### Trường hợp 3: `myShifts` prop không được truyền đúng
- **Triệu chứng**: `My shifts received: []` hoặc `undefined`
- **Nguyên nhân**: `schedule` state chưa được set khi dialog mở
- **Giải pháp**: Đợi data load xong trước khi mở dialog

## Lưu ý

- Database có 4 roles: `user`, `admin`, `sales`, `warehouse` (KHÔNG có "staff")
- Non-admin users chỉ thấy ca của chính họ
- Admin thấy tất cả ca của tất cả nhân viên
- Filter `futureShifts` đã được sửa để bao gồm cả ca hôm nay (không chỉ future)
- Date comparison đã được sửa để so sánh đúng (reset hours to 0)

## Next Steps

Sau khi kiểm tra console logs, hãy cho biết:
1. `Schedule length` là bao nhiêu?
2. `Future shifts length` là bao nhiêu?
3. Server có log gì không?
4. Có lỗi nào trong console không?

Dựa vào thông tin này, chúng ta sẽ biết chính xác vấn đề ở đâu và sửa tiếp.
