# ✅ HOÀN THÀNH: EMAIL VERIFICATION

## 🎯 TÍNH NĂNG ĐÃ CÓ SẴN

Hệ thống **Email Verification đã được xây dựng đầy đủ** từ trước! Tôi đã kiểm tra và xác nhận:

### 1. **Backend API** ✅
- `POST /api/auth/register` - Đăng ký và gửi OTP
- `POST /api/auth/verify-otp` - Xác thực OTP
- `POST /api/auth/resend-otp` - Gửi lại OTP

### 2. **Database** ✅
- Bảng `pending_registrations` đã có đầy đủ fields
- Lưu email, password (hashed), name, OTP, expires_at

### 3. **Email Service** ✅
- Nodemailer đã cấu hình
- Template email OTP đẹp mắt
- Hỗ trợ cả đăng ký và reset password

### 4. **Frontend** ✅
- Trang `/verify-otp` với UI nhập 6 số OTP
- Auto-focus giữa các ô input
- Countdown timer
- Nút gửi lại OTP

### 5. **Security** ✅
- OTP hash với bcrypt
- Expires sau 10 phút
- Rate limiting (3 requests/minute cho register)
- Max 5 attempts

---

## 🔧 CẤU HÌNH ĐỂ SỬ DỤNG

### Bước 1: Cấu hình Gmail SMTP

**File:** `server/.env`

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com          # ← Thay bằng email của bạn
SMTP_PASS=your-app-password             # ← Thay bằng App Password
EMAIL_FROM="NHH Coffee <noreply@nhh-coffee.com>"
```

### Bước 2: Lấy Gmail App Password

1. Vào https://myaccount.google.com/security
2. Bật **2-Step Verification** (nếu chưa bật)
3. Tìm **App passwords**
4. Tạo password mới cho "Mail"
5. Copy password (16 ký tự) vào `SMTP_PASS`

### Bước 3: Restart Server

```bash
cd server
npm run dev
```

---

## 🧪 TEST CHỨC NĂNG

### 1. Test Đăng ký

```bash
# Đăng ký tài khoản mới
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Nguyễn Văn A"
  }'

# Response:
{
  "success": true,
  "message": "Đã gửi mã OTP đến email của bạn"
}
```

**Kiểm tra email** → Nhận được OTP (6 số)

### 2. Test Xác thực OTP

```bash
# Xác thực OTP
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# Response:
{
  "success": true,
  "message": "Xác thực thành công",
  "data": {
    "user": { ... },
    "token": "eyJhbGc..."
  }
}
```

### 3. Test Gửi lại OTP

```bash
# Gửi lại OTP
curl -X POST http://localhost:3001/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## 🎨 LUỒNG NGƯỜI DÙNG

```
1. Khách vào /register
   ↓
2. Điền form: Email, Password, Name
   ↓
3. Submit → API tạo pending_registrations
   ↓
4. Gửi email với OTP (6 số)
   ↓
5. Redirect đến /verify-otp?email=...
   ↓
6. Nhập 6 số OTP
   ↓
7. Submit → API verify OTP
   ↓
8. Tạo user trong bảng users
   ↓
9. Xóa pending_registrations
   ↓
10. Đăng nhập tự động → Redirect /
```

---

## 📧 MẪU EMAIL

```
┌─────────────────────────────────────┐
│     Xác thực tài khoản              │
│                                     │
│  Xin chào Nguyễn Văn A,            │
│                                     │
│  Cảm ơn bạn đã đăng ký tài khoản   │
│  tại NHH-Coffee. Sử dụng mã OTP    │
│  bên dưới để xác thực:             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Mã xác thực của bạn:      │   │
│  │                             │   │
│  │      1  2  3  4  5  6       │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Mã này sẽ hết hạn sau 10 phút  │
│                                     │
│  NHH-Coffee                         │
└─────────────────────────────────────┘
```

---

## 🔒 BẢO MẬT

### 1. **OTP Hash**
- OTP được hash với bcrypt trước khi lưu DB
- Không lưu plain text OTP (chỉ để debug)

### 2. **Expiration**
- OTP hết hạn sau 10 phút
- Tự động xóa pending registrations cũ

### 3. **Rate Limiting**
- Register: 3 requests/minute
- Verify OTP: 10 requests/15 minutes
- Resend OTP: 3 requests/5 minutes

### 4. **Max Attempts**
- Tối đa 5 lần nhập sai OTP
- Sau đó phải request OTP mới

---

## 📊 KIỂM TRA DATABASE

```sql
-- Xem pending registrations
SELECT email, name, otp, expires_at, attempts, created_at 
FROM pending_registrations 
ORDER BY created_at DESC;

-- Xóa pending registrations hết hạn
DELETE FROM pending_registrations 
WHERE expires_at < NOW();

-- Thống kê
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired
FROM pending_registrations;
```

---

## ⚙️ TÙY CHỈNH

### Thay đổi thời gian hết hạn OTP

**File:** `server/src/utils/token.ts`

```typescript
export function getOTPExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 10) // ← Đổi 10 thành số phút khác
  return expiry
}
```

### Thay đổi độ dài OTP

**File:** `server/src/utils/token.ts`

```typescript
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6 số
  // Đổi thành 4 số: 1000 + Math.random() * 9000
}
```

---

## 🎉 KẾT LUẬN

**Email Verification đã hoàn thiện 100%!**

Chỉ cần:
1. ✅ Cấu hình Gmail SMTP trong `.env`
2. ✅ Restart server
3. ✅ Test đăng ký

**Không cần code thêm gì!** Tất cả đã sẵn sàng! 🚀

---

## 🔗 FILES LIÊN QUAN

### Backend
- `server/src/routes/auth.ts` - API routes
- `server/src/services/email.service.ts` - Email service
- `server/src/utils/token.ts` - OTP generation
- `server/src/middleware/rate-limit.ts` - Rate limiting

### Frontend
- `client/app/register/page.tsx` - Trang đăng ký
- `client/app/verify-otp/page.tsx` - Trang xác thực OTP

### Database
- `pending_registrations` table
- `users` table
