# MÔ TẢ KIẾN TRÚC HỆ THỐNG NHH-COFFEE

## 1. TỔNG QUAN KIẾN TRÚC

Hệ thống NHH-Coffee được xây dựng theo mô hình kiến trúc 3 lớp (Three-tier Architecture), bao gồm Client Layer (Lớp giao diện), Controller Layer (Lớp điều khiển) và Data Access Layer (Lớp truy cập dữ liệu). Kiến trúc này tuân theo nguyên tắc phân tách trách nhiệm (Separation of Concerns), giúp hệ thống dễ bảo trì, mở rộng và kiểm thử.

## 2. CLIENT LAYER - LỚP GIAO DIỆN NGƯỜI DÙNG

### 2.1. Vai trò và chức năng

Client Layer là lớp giao diện người dùng, đóng vai trò là cầu nối giữa người dùng cuối và hệ thống backend. Lớp này chịu trách nhiệm:

- Hiển thị giao diện người dùng (UI/UX)
- Thu thập dữ liệu đầu vào từ người dùng
- Gửi request đến Controller Layer thông qua REST API
- Nhận và hiển thị response từ server
- Xử lý các tương tác real-time thông qua WebSocket

### 2.2. Công nghệ triển khai

Trong hệ thống NHH-Coffee, Client Layer được xây dựng bằng:

**Web Browser (Trình duyệt web):**
- Framework: Next.js 14 với App Router
- Library: React 18 + TypeScript
- Styling: Tailwind CSS + shadcn/ui components
- State Management: React Context API + Custom Hooks

### 2.3. Cấu trúc và thành phần

Client Layer bao gồm các thành phần chính:

**a) Pages (Trang):**
- Trang chủ: Hiển thị sản phẩm nổi bật, khuyến mãi, danh mục
- Trang sản phẩm: Danh sách và chi tiết sản phẩm
- Trang giỏ hàng: Quản lý sản phẩm trong giỏ
- Trang thanh toán: Quy trình đặt hàng và thanh toán
- Trang quản trị: Dashboard cho nhân viên và quản lý

**b) Components (Thành phần giao diện):**
- UI Components: Button, Input, Card, Dialog, Toast
- Business Components: ProductCard, CartItem, OrderSummary
- Layout Components: Header, Footer, Sidebar, Navigation

**c) Contexts (Quản lý trạng thái):**
- AuthContext: Quản lý trạng thái đăng nhập
- CartContext: Quản lý giỏ hàng
- ChatContext: Quản lý chat real-time

### 2.4. Giao tiếp với Controller Layer

Client Layer giao tiếp với Controller Layer thông qua hai phương thức:

**a) JSON/API (REST API):**
```
Web Browser → HTTP Request (JSON) → Controller Layer
Web Browser ← HTTP Response (JSON) ← Controller Layer
```

Ví dụ: Khi người dùng xem danh sách sản phẩm, trình duyệt gửi GET request đến `/api/products`, nhận về danh sách sản phẩm dạng JSON và hiển thị lên giao diện.

**b) Socket.IO (WebSocket):**
```
Web Browser ↔ WebSocket Connection ↔ Controller Layer
```

Ví dụ: Khi có tin nhắn chat mới hoặc cập nhật đơn hàng, server push thông báo real-time đến client thông qua WebSocket.

## 3. CONTROLLER LAYER - LỚP ĐIỀU KHIỂN

### 3.1. Vai trò và chức năng

Controller Layer (hay còn gọi là Next.js API hoặc Business Logic Layer) là lớp trung gian giữa Client và Data Access Layer. Lớp này chịu trách nhiệm:

- Nhận và xử lý request từ Client Layer
- Validate dữ liệu đầu vào
- Thực thi business logic (logic nghiệp vụ)
- Gọi Service Layer để xử lý các tác vụ phức tạp
- Trả về response cho Client Layer
- Xử lý authentication và authorization

### 3.2. Công nghệ triển khai

Controller Layer được xây dựng bằng:

**Framework:** Express.js 4.x
**Language:** TypeScript 5.x
**Architecture:** RESTful API + WebSocket

### 3.3. Các Handler chính

Dựa trên code thực tế, hệ thống có các Handler sau:

**a) Auth Handler (Xác thực):**
- Endpoint: `/api/auth/*`
- Chức năng:
  - POST `/api/auth/register`: Đăng ký tài khoản mới
  - POST `/api/auth/verify-otp`: Xác thực OTP
  - POST `/api/auth/login`: Đăng nhập
  - POST `/api/auth/logout`: Đăng xuất
  - POST `/api/auth/forgot-password`: Quên mật khẩu
  - POST `/api/auth/reset-password`: Đặt lại mật khẩu

**b) Product Handler (Sản phẩm):**
- Endpoint: `/api/products/*`
- Chức năng:
  - GET `/api/products`: Lấy danh sách sản phẩm (có filter, search, pagination)
  - GET `/api/products/:id`: Lấy chi tiết sản phẩm
  - POST `/api/products`: Tạo sản phẩm mới (Staff only)
  - PUT `/api/products/:id`: Cập nhật sản phẩm (Staff only)
  - DELETE `/api/products/:id`: Xóa sản phẩm (Staff only)

**c) Order Handler (Đơn hàng):**
- Endpoint: `/api/orders/*`
- Chức năng:
  - GET `/api/orders`: Lấy danh sách đơn hàng
  - GET `/api/orders/:id`: Lấy chi tiết đơn hàng
  - POST `/api/orders`: Tạo đơn hàng mới
  - PUT `/api/orders/:id/status`: Cập nhật trạng thái đơn hàng
  - POST `/api/orders/:id/cancel`: Hủy đơn hàng

**d) Cart Handler (Giỏ hàng):**
- Endpoint: `/api/cart/*`
- Chức năng:
  - GET `/api/cart`: Lấy giỏ hàng của user
  - POST `/api/cart/items`: Thêm sản phẩm vào giỏ
  - PUT `/api/cart/items/:id`: Cập nhật số lượng
  - DELETE `/api/cart/items/:id`: Xóa sản phẩm khỏi giỏ

**e) Payment Handler (Thanh toán):**
- Endpoint: `/api/payment/*`
- Chức năng:
  - POST `/api/payment/create`: Tạo giao dịch thanh toán
  - POST `/api/payment/verify`: Xác thực thanh toán
  - GET `/api/payment/qr-code`: Tạo mã QR thanh toán

**f) Chat Handler (Chat):**
- Endpoint: `/api/chat/*` + WebSocket
- Chức năng:
  - POST `/api/chat/message`: Gửi tin nhắn
  - GET `/api/chat/sessions`: Lấy danh sách phiên chat
  - GET `/api/chat/history/:sessionId`: Lấy lịch sử chat
  - WebSocket: Real-time messaging

**g) Chatbot Handler (AI Chatbot):**
- Endpoint: `/api/chatbot/*`
- Chức năng:
  - POST `/api/chatbot/message`: Gửi tin nhắn đến AI
  - GET `/api/chatbot-knowledge`: Quản lý kiến thức chatbot

**h) Report Handler (Báo cáo):**
- Endpoint: `/api/reports/*`
- Chức năng:
  - GET `/api/reports/revenue`: Báo cáo doanh thu
  - GET `/api/reports/orders`: Báo cáo đơn hàng
  - GET `/api/reports/products`: Báo cáo sản phẩm bán chạy
  - GET `/api/reports/customers`: Báo cáo khách hàng

**i) Promotion Handler (Khuyến mãi):**
- Endpoint: `/api/promotions/*`
- Chức năng:
  - GET `/api/promotions`: Lấy danh sách khuyến mãi
  - POST `/api/promotions`: Tạo khuyến mãi mới
  - POST `/api/promotions/apply`: Áp dụng mã khuyến mãi

**j) Stock Handler (Kho):**
- Endpoint: `/api/stock-alerts/*`
- Chức năng:
  - GET `/api/stock-alerts`: Cảnh báo tồn kho
  - POST `/api/stock-alerts/import`: Nhập kho
  - POST `/api/stock-alerts/export`: Xuất kho

### 3.4. Service Layer - Lớp dịch vụ

Bên trong Controller Layer, có một Service Layer chứa các service xử lý logic phức tạp:

**a) Auth Service:**
- Mã hóa mật khẩu (bcrypt)
- Tạo và xác thực JWT token
- Tạo và xác thực OTP
- Quản lý session

**b) Product Service:**
- Validate dữ liệu sản phẩm
- Tính toán giá sau giảm giá
- Kiểm tra tồn kho
- Cập nhật số lượng tồn kho

**c) Order Service:**
- Validate đơn hàng
- Tính tổng tiền (subtotal, shipping, discount)
- Áp dụng mã khuyến mãi
- Xử lý thanh toán
- Gửi email xác nhận
- Cập nhật inventory

**d) Email Service:**
- Gửi email OTP
- Gửi email xác nhận đơn hàng
- Gửi email thông báo

**e) Chatbot Service:**
- Xử lý tin nhắn từ user
- Tìm kiếm trong knowledge base
- Gọi Gemini AI API
- Tạo response tự động

**f) Cache Service:**
- Lưu cache với Redis
- Lấy dữ liệu từ cache
- Xóa cache khi cần

**g) Socket Service:**
- Quản lý WebSocket connections
- Broadcast messages
- Emit events real-time

### 3.5. Luồng xử lý request

Khi một request đến Controller Layer, luồng xử lý như sau:

```
1. Client gửi request → Controller Layer
2. Middleware xử lý (Authentication, Validation, Rate Limiting)
3. Handler nhận request
4. Handler gọi Service để xử lý logic
5. Service gọi Data Access Layer để truy vấn database
6. Data Access Layer trả kết quả về Service
7. Service xử lý và trả về Handler
8. Handler format response và gửi về Client
```

Ví dụ cụ thể: **Tạo đơn hàng**

```
1. Client POST /api/orders với dữ liệu đơn hàng
2. Middleware authenticate kiểm tra JWT token
3. Order Handler nhận request
4. Order Handler gọi OrderService.createOrder()
5. OrderService validate dữ liệu
6. OrderService gọi Prisma để tạo order trong database
7. OrderService gọi ProductService để giảm stock
8. OrderService gọi EmailService để gửi email xác nhận
9. OrderService trả về order đã tạo
10. Order Handler format response JSON
11. Response gửi về Client
```

## 4. DATA ACCESS LAYER - LỚP TRUY CẬP DỮ LIỆU

### 4.1. Vai trò và chức năng

Data Access Layer (hay còn gọi là Persistence Layer) là lớp chịu trách nhiệm tương tác trực tiếp với database. Lớp này:

- Thực hiện các thao tác CRUD (Create, Read, Update, Delete)
- Quản lý kết nối database
- Thực thi các query SQL
- Đảm bảo tính toàn vẹn dữ liệu (data integrity)
- Xử lý transactions

### 4.2. Công nghệ triển khai

**ORM:** Prisma ORM
**Database:** PostgreSQL 16.x

### 4.3. Các Model chính

Dựa trên code thực tế, hệ thống có các Model sau:

**a) User Model (Người dùng):**
```
Thuộc tính:
- id: UUID (Primary Key)
- email: String (Unique)
- password: String (Hashed)
- name: String
- role: UserRole (CUSTOMER, STAFF, ADMIN)
- points: Integer (Điểm tích lũy)
- tier: String (Bronze, Silver, Gold)
- totalSpent: Decimal
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime

Quan hệ:
- Có nhiều orders (1-N)
- Có nhiều reviews (1-N)
- Có nhiều cartItems (1-N)
- Có nhiều addresses (1-N)
```

**b) Product Model (Sản phẩm):**
```
Thuộc tính:
- id: UUID (Primary Key)
- name: String
- slug: String (Unique)
- description: String
- price: Decimal
- originalPrice: Decimal
- stock: Integer
- categoryId: UUID (Foreign Key)
- images: String[] (Array)
- rating: Decimal
- reviewCount: Integer
- isActive: Boolean
- isFeatured: Boolean
- createdAt: DateTime
- updatedAt: DateTime

Quan hệ:
- Thuộc về 1 category (N-1)
- Có nhiều reviews (1-N)
- Có nhiều cartItems (1-N)
- Có nhiều orderItems (1-N)
```

**c) Order Model (Đơn hàng):**
```
Thuộc tính:
- id: UUID (Primary Key)
- orderNumber: String (Unique)
- userId: UUID (Foreign Key)
- status: OrderStatus (PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED)
- subtotal: Decimal
- shippingFee: Decimal
- discount: Decimal
- total: Decimal
- paymentMethod: String
- paymentStatus: String
- shippingAddress: String
- customerName: String
- customerEmail: String
- customerPhone: String
- createdAt: DateTime
- updatedAt: DateTime

Quan hệ:
- Thuộc về 1 user (N-1)
- Có nhiều orderItems (1-N)
```

**d) OrderItem Model (Chi tiết đơn hàng):**
```
Thuộc tính:
- id: UUID (Primary Key)
- orderId: UUID (Foreign Key)
- productId: UUID (Foreign Key)
- productName: String
- productPrice: Decimal
- quantity: Integer
- subtotal: Decimal

Quan hệ:
- Thuộc về 1 order (N-1)
- Tham chiếu đến 1 product (N-1)
```

**e) Category Model (Danh mục):**
```
Thuộc tính:
- id: UUID (Primary Key)
- name: String
- slug: String (Unique)
- icon: String
- description: String
- productCount: Integer

Quan hệ:
- Có nhiều products (1-N)
```

**f) CartItem Model (Giỏ hàng):**
```
Thuộc tính:
- id: UUID (Primary Key)
- userId: UUID (Foreign Key)
- productId: UUID (Foreign Key)
- quantity: Integer
- createdAt: DateTime

Quan hệ:
- Thuộc về 1 user (N-1)
- Tham chiếu đến 1 product (N-1)
```

**g) Review Model (Đánh giá):**
```
Thuộc tính:
- id: UUID (Primary Key)
- productId: UUID (Foreign Key)
- userId: UUID (Foreign Key)
- rating: Integer (1-5)
- comment: String
- images: String[]
- isVerified: Boolean
- createdAt: DateTime

Quan hệ:
- Thuộc về 1 product (N-1)
- Thuộc về 1 user (N-1)
```

**h) Promotion Model (Khuyến mãi):**
```
Thuộc tính:
- id: UUID (Primary Key)
- code: String (Unique)
- type: PromotionType (PERCENTAGE, FIXED_AMOUNT)
- discountValue: Decimal
- minOrderValue: Decimal
- maxUsage: Integer
- startDate: DateTime
- endDate: DateTime
- isActive: Boolean

Quan hệ:
- Có nhiều promotionUsages (1-N)
```

**i) ChatSession Model (Phiên chat):**
```
Thuộc tính:
- id: UUID (Primary Key)
- userId: UUID (Foreign Key)
- staffId: UUID (Foreign Key, nullable)
- status: ChatSessionStatus (ACTIVE, CLOSED)
- startedAt: DateTime
- endedAt: DateTime

Quan hệ:
- Thuộc về 1 user (N-1)
- Có nhiều chatMessages (1-N)
```

**j) ChatMessage Model (Tin nhắn chat):**
```
Thuộc tính:
- id: UUID (Primary Key)
- sessionId: UUID (Foreign Key)
- senderId: UUID (Foreign Key)
- message: String
- isStaff: Boolean
- isAI: Boolean
- createdAt: DateTime

Quan hệ:
- Thuộc về 1 chatSession (N-1)
```

**k) ChatbotKnowledge Model (Kiến thức chatbot):**
```
Thuộc tính:
- id: UUID (Primary Key)
- question: String
- answer: String
- keywords: String[]
- category: String
- isActive: Boolean
```

### 4.4. Kết nối với PostgreSQL

Data Access Layer sử dụng Prisma ORM để kết nối với PostgreSQL database. Prisma cung cấp:

- Type-safe database client
- Auto-generated types từ schema
- Migration system
- Query builder
- Transaction support

Ví dụ query:
```typescript
// Lấy sản phẩm với filter
const products = await prisma.product.findMany({
  where: {
    categoryId: 'category-id',
    price: { gte: 100, lte: 500 },
    isActive: true
  },
  include: {
    category: true,
    reviews: true
  },
  orderBy: { createdAt: 'desc' }
})

// Tạo đơn hàng với transaction
const order = await prisma.$transaction(async (tx) => {
  const newOrder = await tx.order.create({ data: orderData })
  await tx.orderItem.createMany({ data: items })
  await tx.product.updateMany({ /* update stock */ })
  return newOrder
})
```

## 5. LUỒNG DỮ LIỆU TRONG HỆ THỐNG

### 5.1. Luồng đọc dữ liệu (Read)

```
1. User click vào "Xem sản phẩm" trên Web Browser
2. Client Layer gửi GET request đến /api/products
3. Product Handler nhận request
4. Product Handler gọi ProductService
5. ProductService gọi Prisma ORM
6. Prisma thực thi SQL query: SELECT * FROM products
7. PostgreSQL trả về kết quả
8. Prisma map kết quả thành Product objects
9. ProductService trả về cho Handler
10. Handler format thành JSON response
11. Response gửi về Client Layer
12. Web Browser hiển thị danh sách sản phẩm
```

### 5.2. Luồng ghi dữ liệu (Write)

```
1. User điền form "Tạo đơn hàng" và click "Đặt hàng"
2. Client Layer gửi POST request đến /api/orders với dữ liệu đơn hàng
3. Middleware authenticate kiểm tra JWT token
4. Order Handler nhận request
5. Order Handler validate dữ liệu
6. Order Handler gọi OrderService.createOrder()
7. OrderService bắt đầu transaction
8. OrderService gọi Prisma để INSERT order
9. Prisma thực thi: INSERT INTO orders VALUES (...)
10. OrderService gọi Prisma để INSERT order_items
11. Prisma thực thi: INSERT INTO order_items VALUES (...)
12. OrderService gọi Prisma để UPDATE product stock
13. Prisma thực thi: UPDATE products SET stock = stock - quantity
14. Transaction commit
15. OrderService gọi EmailService để gửi email
16. OrderService trả về order đã tạo
17. Handler format JSON response
18. Response gửi về Client
19. Web Browser hiển thị "Đặt hàng thành công"
```

### 5.3. Luồng real-time (WebSocket)

```
1. User gửi tin nhắn chat
2. Client emit event 'chat-message' qua Socket.IO
3. Socket Handler nhận event
4. Socket Handler gọi ChatService
5. ChatService lưu message vào database qua Prisma
6. ChatService kiểm tra nếu cần AI response
7. ChatService gọi ChatbotService
8. ChatbotService tìm kiếm trong ChatbotKnowledge
9. Nếu không tìm thấy, gọi Gemini AI API
10. ChatbotService tạo response
11. ChatService lưu AI response vào database
12. Socket Handler broadcast 'new-message' event
13. Tất cả clients trong room nhận message real-time
14. Web Browser hiển thị tin nhắn mới
```

## 6. KẾT LUẬN

Kiến trúc 3 lớp của hệ thống NHH-Coffee được thiết kế với sự phân tách rõ ràng giữa các lớp:

- **Client Layer**: Xử lý giao diện và tương tác người dùng
- **Controller Layer**: Xử lý business logic và điều phối các service
- **Data Access Layer**: Quản lý dữ liệu và tương tác với database

Kiến trúc này mang lại các lợi ích:

1. **Dễ bảo trì**: Mỗi lớp có trách nhiệm riêng biệt
2. **Dễ mở rộng**: Có thể thêm tính năng mới mà không ảnh hưởng lớp khác
3. **Dễ kiểm thử**: Có thể test từng lớp độc lập
4. **Tái sử dụng**: Service và Model có thể dùng cho nhiều Handler
5. **Bảo mật**: Phân quyền và validate ở nhiều lớp
6. **Hiệu năng**: Có thể cache ở nhiều mức độ khác nhau

Hệ thống đã sẵn sàng phục vụ người dùng với độ tin cậy và hiệu năng cao.
