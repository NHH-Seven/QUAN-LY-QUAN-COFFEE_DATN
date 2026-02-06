# SƠ ĐỒ KIẾN TRÚC HỆ THỐNG NHH-COFFEE

## 📋 TỔNG QUAN

Hệ thống NHH-Coffee là một ứng dụng quản lý cửa hàng cà phê & trà toàn diện với kiến trúc Client-Server, sử dụng công nghệ hiện đại và hỗ trợ real-time communication.

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Next.js 16)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Customer   │  │    Staff     │  │    Admin     │              │
│  │   Frontend   │  │   Frontend   │  │   Frontend   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                    ┌───────▼────────┐                                │
│                    │  React Context │                                │
│                    │   - Auth       │                                │
│                    │   - Cart       │                                │
│                    │   - Wishlist   │                                │
│                    │   - Compare    │                                │
│                    │   - Chat       │                                │
│                    └───────┬────────┘                                │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   HTTP/HTTPS    │
                    │   WebSocket     │
                    └────────┬────────┘
                             │
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER (Express + Node.js)                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      API GATEWAY                                │ │
│  │  - CORS Configuration                                           │ │
│  │  - Security Headers (Helmet)                                    │ │
│  │  - Rate Limiting                                                │ │
│  │  - CSRF Protection                                              │ │
│  │  - JWT Authentication                                           │ │
│  └────────────────────────┬───────────────────────────────────────┘ │
│                           │                                           │
│  ┌────────────────────────▼───────────────────────────────────────┐ │
│  │                    REST API ROUTES                              │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Public     │  │    Staff     │  │    Admin     │         │ │
│  │  │   Routes     │  │   Routes     │  │   Routes     │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                  │ │
│  │  • Auth          • Products       • Orders                      │ │
│  │  • Products      • POS            • Customers                   │ │
│  │  • Cart          • Kitchen        • Reports                     │ │
│  │  • Checkout      • Tables         • Stock Management            │ │
│  │  • Wishlist      • Shifts         • Staff Management            │ │
│  │  • Reviews       • Sales          • Settings                    │ │
│  │  • Chat          • Chatbot        • Backup/Restore              │ │
│  └──────────────────────────────────────────────────────────────┬─┘ │
│                                                                   │   │
│  ┌────────────────────────────────────────────────────────────┐  │   │
│  │                  SOCKET.IO SERVER                           │  │   │
│  │                                                              │  │   │
│  │  • Real-time Chat (Customer ↔ Staff)                       │  │   │
│  │  • AI Chatbot Integration                                   │  │   │
│  │  • Order Notifications                                      │  │   │
│  │  • Kitchen Display Updates                                  │  │   │
│  │  • Table Status Updates                                     │  │   │
│  │  • Stock Alerts                                             │  │   │
│  └──────────────────────────────────────────────────────────┬─┘  │   │
│                                                               │    │   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     BUSINESS LOGIC LAYER                        │ │
│  │                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   Services   │  │  Middleware  │  │  Validators  │         │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │ │
│  │                                                                  │ │
│  │  • Cache Service (Redis)                                        │ │
│  │  • Email Service (Nodemailer)                                   │ │
│  │  • Push Notification Service (Web Push)                         │ │
│  │  • Chatbot Service (Google Gemini AI)                           │ │
│  │  • Chat Service                                                 │ │
│  │  • Shipping Service                                             │ │
│  │  • Wishlist Sale Service                                        │ │
│  │  • Idempotency Service                                          │ │
│  └──────────────────────────────────────────────────────────────┬─┘ │
│                                                                   │   │
│  ┌────────────────────────────────────────────────────────────┐  │   │
│  │                    DATA ACCESS LAYER                        │  │   │
│  │                     (Prisma ORM)                            │  │   │
│  └──────────────────────────────────────────────────────────┬─┘  │   │
└──────────────────────────────────────────────────────────────┼────┼───┘
                                                               │    │
                                                               ▼    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL Database                          │ │
│  │                                                                  │ │
│  │  Core Tables:                                                   │ │
│  │  • users                    • orders                            │ │
│  │  • products                 • order_items                       │ │
│  │  • categories               • reviews                           │ │
│  │  • cart_items               • wishlist                          │ │
│  │                                                                  │ │
│  │  Business Tables:                                               │ │
│  │  • promotions               • stock_transactions               │ │
│  │  • promotion_usage          • notifications                     │ │
│  │  • suppliers                • push_subscriptions               │ │
│  │                                                                  │ │
│  │  Chat & Support:                                                │ │
│  │  • chat_sessions            • chatbot_knowledge                 │ │
│  │  • chat_messages            • product_questions                 │ │
│  │                                                                  │ │
│  │  Staff Management:                                              │ │
│  │  • shifts                   • order_notes                       │ │
│  │  • shift_swaps              • points_history                    │ │
│  │  • tables                   • user_addresses                    │ │
│  │  • kitchen_items                                                │ │
│  └──────────────────────────────────────────────────────────────┬─┘ │
└──────────────────────────────────────────────────────────────────┼───┘
                                                                   │
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Redis      │  │   Cloudinary │  │  Google AI   │              │
│  │   Cache      │  │   (Images)   │  │   (Gemini)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   SMTP       │  │  Web Push    │  │   Swagger    │              │
│  │   Email      │  │  Service     │  │   API Docs   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 CÔNG NGHỆ SỬ DỤNG

### Frontend (Client)
- **Framework**: Next.js 16 (React 19)
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod
- **Charts**: Recharts
- **Real-time**: Socket.io Client
- **HTTP Client**: Fetch API
- **Testing**: Vitest + Testing Library

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Cache**: Redis (ioredis)
- **AI**: Google Generative AI (Gemini)
- **Documentation**: Swagger
- **Testing**: Vitest + Supertest

---

## 📊 LUỒNG DỮ LIỆU CHÍNH

### 1. Authentication Flow
```
User → Login Form → API /auth/login → JWT Token → Store in Context → Protected Routes
```

### 2. Order Flow
```
Customer → Add to Cart → Checkout → Payment → Order Created → 
→ Notification to Staff → Kitchen Display → Prepare → Complete → Delivery
```

### 3. Real-time Chat Flow
```
Customer → Chat Widget → Socket.io → Server → Staff Dashboard → Response → 
→ Socket.io → Customer Receives Message
```

### 4. AI Chatbot Flow
```
User → Chat Message → Chatbot Service → Gemini AI → Knowledge Base → 
→ Generate Response → Return to User
```

### 5. Stock Management Flow
```
Staff → Update Stock → Stock Transaction → Check Threshold → 
→ Low Stock Alert → Notification → Staff/Admin
```

---

## 🔐 BẢO MẬT

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (user, sales, warehouse, admin)
- Password hashing with bcrypt
- OTP verification for registration
- Password reset with OTP

### Security Measures
- CORS configuration
- Helmet security headers
- Rate limiting
- CSRF protection
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS protection

---

## 🚀 TÍNH NĂNG CHÍNH

### Khách hàng (Customer)
- Đăng ký/Đăng nhập
- Xem sản phẩm, tìm kiếm, lọc
- Giỏ hàng, Wishlist, So sánh sản phẩm
- Đặt hàng, thanh toán
- Theo dõi đơn hàng
- Đánh giá sản phẩm
- Chat với nhân viên
- AI Chatbot hỗ trợ
- Tích điểm thành viên
- Nhận thông báo

### Nhân viên (Staff)
- Quản lý bán hàng (POS)
- Quản lý bàn (Tables)
- Màn hình bếp (Kitchen Display)
- Chat với khách hàng
- Quản lý đơn hàng
- Quản lý ca làm việc
- Báo cáo bán hàng

### Quản trị (Admin)
- Quản lý sản phẩm
- Quản lý danh mục
- Quản lý kho hàng
- Quản lý nhân viên
- Quản lý khách hàng
- Quản lý khuyến mãi
- Báo cáo thống kê
- Quản lý AI Chatbot Knowledge Base
- Backup/Restore dữ liệu
- Cài đặt hệ thống

---

## 📡 REAL-TIME FEATURES

### Socket.io Rooms
- `user:{userId}` - Personal room cho từng user
- `staff` - Room cho tất cả nhân viên
- `kitchen` - Room cho bếp/pha chế
- `service` - Room cho phục vụ
- `tables` - Room cho quản lý bàn

### Real-time Events
- Order notifications
- Chat messages
- Kitchen order updates
- Table status changes
- Stock alerts
- Shift notifications

---

## 💾 DATABASE SCHEMA

### Core Entities
- **User**: Khách hàng, nhân viên, admin
- **Product**: Sản phẩm (cà phê, trà, bánh)
- **Category**: Danh mục sản phẩm
- **Order**: Đơn hàng
- **OrderItem**: Chi tiết đơn hàng

### Business Logic
- **Promotion**: Khuyến mãi, mã giảm giá
- **StockTransaction**: Lịch sử xuất nhập kho
- **Review**: Đánh giá sản phẩm
- **Wishlist**: Danh sách yêu thích
- **CartItem**: Giỏ hàng

### Communication
- **ChatSession**: Phiên chat
- **ChatMessage**: Tin nhắn chat
- **ChatbotKnowledge**: Kiến thức AI chatbot
- **Notification**: Thông báo

### Staff Management
- **Shift**: Ca làm việc
- **ShiftSwap**: Đổi ca
- **Table**: Quản lý bàn
- **KitchenItem**: Món trong bếp

---

## 🔄 DEPLOYMENT

### Development
```bash
npm run dev  # Chạy cả client và server
```

### Production
```bash
# Build
npm run build:client
npm run build:server

# Start
npm start
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: JWT signing key
- `REDIS_URL`: Redis connection
- `GEMINI_API_KEY`: Google AI API key
- `CLOUDINARY_*`: Cloudinary credentials
- `SMTP_*`: Email configuration

---

## 📈 SCALABILITY

### Horizontal Scaling
- Stateless API servers
- Redis for session/cache sharing
- Socket.io with Redis adapter (future)

### Performance Optimization
- Redis caching
- Database indexing
- Image optimization (Cloudinary)
- Lazy loading
- Code splitting (Next.js)

### Monitoring
- Health check endpoint
- Error logging
- Performance metrics

---

**Ngày tạo**: 26/01/2026  
**Phiên bản**: 1.0.0  
**Tác giả**: NHH-Coffee Development Team
