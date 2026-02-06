# 🤖 Hướng Dẫn Sử Dụng AI Chatbot - NHH Coffee

## ✅ Đã Hoàn Thành

AI Chatbot đã được tích hợp hoàn chỉnh với các tính năng:

### 1. **Tích hợp Google Gemini AI**
- Model: `gemini-2.5-flash` (mới nhất, miễn phí, nhanh)
- API Key đã cấu hình trong `.env`
- Hỗ trợ chat thông minh với context

### 2. **Kết nối Database**
- Tìm kiếm sản phẩm theo từ khóa
- Lấy sản phẩm khuyến mãi/giảm giá
- Tra cứu đơn hàng
- Trả lời với thông tin thực từ database

### 3. **Unified Chat Widget**
- Chọn mode: AI hoặc Staff
- Chuyển đổi mượt mà giữa các mode
- Giao diện đẹp, dễ sử dụng

## 📋 Danh Mục Sản Phẩm

Quán coffee có các danh mục sau:

1. **Cà phê** ☕
   - Cà phê đen đá, Cà phê sữa đá, Bạc xỉu
   - Espresso, Americano, Cappuccino, Latte
   - Mocha, Caramel Macchiato, Cold Brew

2. **Trà** 🍵
   - Trà đào cam sả, Trà vải, Trà sen vàng
   - Trà oolong sữa, Trà matcha đá xay, Hồng trà

3. **Đá xay** 🧊
   - Chocolate đá xay, Cookies & Cream
   - Dâu đá xay, Caramel đá xay

4. **Nước ép & Sinh tố** 🥤
   - Nước ép cam, Nước ép dưa hấu
   - Sinh tố bơ, Sinh tố xoài

5. **Bánh ngọt** 🍰
   - Bánh tiramisu, Bánh cheesecake
   - Croissant bơ, Bánh mì que pate
   - Bánh mousse chocolate

6. **Snack & Đồ ăn nhẹ** 🍟
   - Khoai tây chiên, Gà viên chiên
   - Sandwich gà

7. **Combo** 🎁
   - Combo sáng 1, Combo sáng 2
   - Combo đôi, Combo nhóm

8. **Cà phê hạt** 🫘
   - Arabica Đà Lạt, Robusta Buôn Ma Thuột
   - Blend House, Espresso Blend

## 🎯 Cách Sử Dụng

### Cho Khách Hàng:

1. **Mở Chat Widget**
   - Click vào icon chat ở góc dưới bên phải
   - Chọn "AI Assistant" để chat với AI

2. **Hỏi về Sản Phẩm**
   ```
   Ví dụ:
   - "Có cà phê gì ngon không?"
   - "Tôi muốn uống trà"
   - "Sản phẩm nào đang khuyến mãi?"
   - "Có bánh ngọt không?"
   - "Combo nào tiết kiệm?"
   ```

3. **Hỏi về Giá**
   ```
   - "Cà phê sữa đá giá bao nhiêu?"
   - "Bánh tiramisu giá bao nhiêu?"
   ```

4. **Tra Cứu Đơn Hàng**
   ```
   - "Kiểm tra đơn hàng #123"
   - "Đơn hàng của tôi đến đâu rồi?"
   ```

5. **Hỏi về Chính Sách**
   ```
   - "Quán mở cửa mấy giờ?"
   - "Có giao hàng không?"
   - "Chính sách đổi trả thế nào?"
   ```

### Cho Nhân Viên:

1. **Theo Dõi Chat**
   - Vào trang `/staff/chat` để xem các cuộc hội thoại
   - Có thể nhảy vào hỗ trợ khi cần

2. **Xem Analytics**
   - Số lượng chat sessions
   - Số tin nhắn
   - Đánh giá từ khách hàng

## 🧠 AI Có Thể Làm Gì?

### ✅ AI Có Thể:
- Tư vấn sản phẩm dựa trên sở thích khách hàng
- Giới thiệu combo tiết kiệm
- Trả lời về giá cả, menu
- Hướng dẫn đặt hàng
- Tra cứu đơn hàng
- Giải đáp thắc mắc về chính sách quán

### ❌ AI Không Thể:
- Xử lý thanh toán trực tiếp
- Thay đổi đơn hàng đã đặt
- Giải quyết khiếu nại phức tạp (sẽ chuyển sang nhân viên)

## 🎨 Tính Năng Đặc Biệt

### 1. **Context-Aware**
AI nhớ lịch sử chat và trả lời phù hợp với ngữ cảnh

### 2. **Product Search**
Tự động tìm kiếm sản phẩm trong database khi khách hỏi

### 3. **Promotion Detection**
Tự động giới thiệu sản phẩm đang giảm giá khi khách hỏi về khuyến mãi

### 4. **Intent Detection**
Phân loại câu hỏi để xử lý phù hợp:
- Product inquiry (hỏi về sản phẩm)
- Order tracking (tra cứu đơn hàng)
- Purchase intent (muốn mua)
- General question (câu hỏi chung)

### 5. **Quick Replies**
Gợi ý câu hỏi nhanh cho khách hàng:
- "Sản phẩm nào đang khuyến mãi?"
- "Tôi muốn mua cà phê"
- "Kiểm tra đơn hàng"
- "Chính sách đổi trả"

## 🔧 Cấu Hình

### Environment Variables (`.env`):
```env
GEMINI_API_KEY=AIzaSyD6p382k9qvx_Mug4RizV9Oz-R5cUOewNI
```

### Database Tables:
- `chat_sessions` - Lưu phiên chat
- `chat_messages` - Lưu tin nhắn
- `chatbot_feedback` - Lưu đánh giá
- `products` - Sản phẩm (đã có sẵn)

## 📊 Ví Dụ Hội Thoại

### Ví dụ 1: Hỏi về cà phê
```
Khách: "Có cà phê gì ngon không?"

AI: "Chào bạn! ☕ Quán mình có nhiều loại cà phê ngon lắm:

1. Cà phê đen đá - 25,000đ
   Đậm đà, hương vị Việt Nam truyền thống

2. Cà phê sữa đá - 29,000đ  
   Thức uống quốc dân, ngọt béo

3. Cappuccino - 45,000đ
   Chuẩn Ý, bọt sữa mịn màng

Bạn thích vị đắng hay ngọt nhỉ? 😊"
```

### Ví dụ 2: Hỏi về khuyến mãi
```
Khách: "Có khuyến mãi gì không?"

AI: "Dạ có ạ! Hiện tại quán đang có các sản phẩm giảm giá:

1. Cà phê đen đá - 25,000đ (Giảm 17% từ 30,000đ)
2. Cà phê sữa đá - 29,000đ (Giảm 17% từ 35,000đ)
3. Bạc xỉu - 32,000đ (Giảm 16% từ 38,000đ)

Ngoài ra còn có Combo tiết kiệm nữa:
- Combo sáng 1: Cà phê sữa + Croissant chỉ 55,000đ (tiết kiệm 16,000đ)

Bạn muốn thử combo nào không? 😊"
```

### Ví dụ 3: Hỏi về giờ mở cửa
```
Khách: "Quán mở cửa mấy giờ?"

AI: "Quán mình mở cửa từ 7:00 sáng đến 23:00 tối hàng ngày ạ! ☕

Bạn có thể ghé quán bất cứ lúc nào trong khung giờ này. Quán có không gian yên tĩnh, WiFi miễn phí, rất phù hợp để làm việc hoặc học tập đấy! 😊

Bạn có muốn đặt bàn trước không?"
```

## 🚀 Cải Tiến Trong Tương Lai

- [ ] Voice chat (chat bằng giọng nói)
- [ ] Image recognition (nhận diện hình ảnh món ăn)
- [ ] Personalized recommendations (gợi ý cá nhân hóa)
- [ ] Multi-language support (hỗ trợ nhiều ngôn ngữ)
- [ ] Integration với Zalo, Facebook Messenger

## 📞 Hỗ Trợ

Nếu có vấn đề với AI Chatbot:
1. Kiểm tra console log trong browser (F12)
2. Kiểm tra server log
3. Verify GEMINI_API_KEY trong `.env`
4. Restart server nếu cần

---

**Lưu ý**: AI được train để phục vụ khách hàng tốt nhất, nhưng vẫn có thể có sai sót. Nhân viên nên theo dõi và hỗ trợ khi cần thiết.
