# Hướng dẫn lấy Google Gemini API Key (MIỄN PHÍ)

## Bước 1: Truy cập Google AI Studio

1. Mở trình duyệt và vào: https://aistudio.google.com/
2. Đăng nhập bằng tài khoản Google của bạn

## Bước 2: Tạo API Key

1. Click vào nút **"Get API key"** ở góc trên bên trái
2. Chọn **"Create API key"**
3. Chọn project (hoặc tạo project mới nếu chưa có)
4. API key sẽ được tạo tự động

## Bước 3: Copy API Key

1. Click vào icon **Copy** để copy API key
2. API key sẽ có dạng: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

## Bước 4: Thêm vào .env

1. Mở file `server/.env`
2. Tìm dòng `GEMINI_API_KEY=your-gemini-api-key-here`
3. Thay thế bằng API key vừa copy:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Lưu file

## Bước 5: Restart Server

```bash
cd server
npm run dev
```

## Giới hạn miễn phí

- **60 requests/minute** (đủ cho hầu hết ứng dụng)
- **1500 requests/day** (free tier)
- Nếu cần nhiều hơn, có thể upgrade lên paid plan

## Kiểm tra API Key

Sau khi thêm API key và restart server, hãy test chatbot:

1. Mở browser console (F12)
2. Gõ:
```javascript
fetch('http://localhost:3001/api/chatbot/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Xin chào',
    guestId: 'test-123'
  })
}).then(r => r.json()).then(console.log)
```

3. Nếu thành công, bạn sẽ thấy response từ AI

## Troubleshooting

### Lỗi: "GEMINI_API_KEY not found"
- Kiểm tra file `.env` có đúng tên biến không
- Restart server sau khi thêm API key

### Lỗi: "API key not valid"
- Kiểm tra API key có đúng không (không có khoảng trắng thừa)
- Thử tạo API key mới

### Lỗi: "Quota exceeded"
- Đã vượt quá 60 requests/minute
- Đợi 1 phút rồi thử lại
- Hoặc upgrade lên paid plan

## Links hữu ích

- Google AI Studio: https://aistudio.google.com/
- Gemini API Docs: https://ai.google.dev/docs
- Pricing: https://ai.google.dev/pricing

---

**Lưu ý**: Không share API key với người khác và không commit vào Git!
