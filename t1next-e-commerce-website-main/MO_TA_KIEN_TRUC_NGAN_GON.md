# MÔ TẢ KIẾN TRÚC HỆ THỐNG NHH-COFFEE

## 1. TỔNG QUAN

Hệ thống NHH-Coffee được xây dựng theo kiến trúc 3 lớp (Three-tier Architecture), bao gồm Client Layer, Controller Layer và Data Access Layer. Kiến trúc này đảm bảo sự phân tách rõ ràng giữa giao diện người dùng, xử lý nghiệp vụ và quản lý dữ liệu.

## 2. CLIENT LAYER - LỚP GIAO DIỆN

Client Layer là lớp giao diện người dùng, được xây dựng bằng Next.js 14 và React 18. Lớp này chịu trách nhiệm hiển thị giao diện, thu thập dữ liệu từ người dùng và giao tiếp với server thông qua REST API và WebSocket.

**Thành phần chính:**
- Web Browser: Giao diện web responsive cho khách hàng
- Staff Panel: Trang quản trị cho nhân viên và quản lý
- Components: Các thành phần UI tái sử dụng (Button, Card, Form, Dialog)
- Contexts: Quản lý trạng thái toàn cục (Auth, Cart, Chat)

**Giao tiếp:**
- REST API: Gửi/nhận dữ liệu dạng JSON qua HTTP
- WebSocket: Kết nối real-time cho chat và notifications

## 3. CONTROLLER LAYER - LỚP ĐIỀU KHIỂN

Controller Layer là lớp trung gian xử lý business logic, được xây dựng bằng Express.js và TypeScript. Lớp này nhận request từ Client, xử lý logic nghiệp vụ, gọi Service Layer và trả về response.

**Các Handler chính:**

**Auth Handler** (`/api/auth`): Xử lý đăng ký, đăng nhập, xác thực OTP, quên mật khẩu. Sử dụng JWT cho authentication và bcrypt cho mã hóa password.

**Product Handler** (`/api/products`): Quản lý sản phẩm với các chức năng CRUD, tìm kiếm, lọc theo danh mục và giá, phân trang. Hỗ trợ upload hình ảnh và quản lý tồn kho.

**Order Handler** (`/api/orders`): Xử lý đơn hàng từ tạo mới, cập nhật trạng thái đến hủy đơn. Tích hợp với Payment Handler để xử lý thanh toán và Email Service để gửi xác nhận.

**Cart Handler** (`/api/cart`): Quản lý giỏ hàng của người dùng, bao gồm thêm/xóa/cập nhật sản phẩm, tính tổng tiền và kiểm tra tồn kho.

**Payment Handler** (`/api/payment`): Xử lý thanh toán, tạo mã QR, xác thực giao dịch và hoàn tiền. Hỗ trợ nhiều phương thức thanh toán.

**Chat Handler** (`/api/chat`): Quản lý chat giữa khách hàng và nhân viên. Sử dụng WebSocket để gửi/nhận tin nhắn real-time.

**Chatbot Handler** (`/api/chatbot`): Xử lý tin nhắn AI chatbot, tìm kiếm trong knowledge base và gọi Gemini AI API để tạo response tự động.

**Report Handler** (`/api/reports`): Tạo báo cáo thống kê về doanh thu, đơn hàng, sản phẩm bán chạy và khách hàng. Hỗ trợ export PDF/Excel.

**Promotion Handler** (`/api/promotions`): Quản lý mã khuyến mãi, áp dụng giảm giá và theo dõi lượt sử dụng.

**Stock Handler** (`/api/stock-alerts`): Quản lý tồn kho, cảnh báo hết hàng, nhập/xuất kho và theo dõi lịch sử giao dịch.

**Service Layer:**

Bên trong Controller Layer có các Service xử lý logic phức tạp:

- **Auth Service**: Mã hóa password, tạo JWT token, xác thực OTP
- **Email Service**: Gửi email OTP, xác nhận đơn hàng, thông báo
- **Chatbot Service**: Xử lý AI, tìm kiếm knowledge base, gọi Gemini API
- **Cache Service**: Quản lý Redis cache để tăng hiệu năng
- **Socket Service**: Quản lý WebSocket connections và broadcast events

## 4. DATA ACCESS LAYER - LỚP TRUY CẬP DỮ LIỆU

Data Access Layer sử dụng Prisma ORM để tương tác với PostgreSQL database. Lớp này thực hiện các thao tác CRUD, quản lý transactions và đảm bảo tính toàn vẹn dữ liệu.

**Các Model chính:**

**User Model**: Lưu thông tin người dùng (email, password, name, role, points, tier). Có quan hệ với Order, Review, CartItem và Address.

**Product Model**: Lưu thông tin sản phẩm (name, price, stock, images, rating). Thuộc về Category và có nhiều Review, CartItem, OrderItem.

**Order Model**: Lưu thông tin đơn hàng (orderNumber, status, total, paymentMethod, shippingAddress). Thuộc về User và có nhiều OrderItem.

**OrderItem Model**: Lưu chi tiết sản phẩm trong đơn hàng (productId, quantity, price, subtotal). Thuộc về Order và tham chiếu Product.

**Category Model**: Lưu danh mục sản phẩm (name, slug, icon). Có nhiều Product.

**CartItem Model**: Lưu sản phẩm trong giỏ hàng (userId, productId, quantity). Thuộc về User và tham chiếu Product.

**Review Model**: Lưu đánh giá sản phẩm (rating, comment, images, isVerified). Thuộc về Product và User.

**Promotion Model**: Lưu mã khuyến mãi (code, type, discountValue, minOrderValue, maxUsage). Có nhiều PromotionUsage.

**ChatSession Model**: Lưu phiên chat (userId, staffId, status). Có nhiều ChatMessage.

**ChatMessage Model**: Lưu tin nhắn chat (message, isStaff, isAI). Thuộc về ChatSession.

**ChatbotKnowledge Model**: Lưu kiến thức cho chatbot (question, answer, keywords, category).

**Kết nối Database:**

Prisma ORM cung cấp type-safe database client, tự động generate types từ schema, hỗ trợ migrations và transactions. Tất cả queries đều được parameterized để phòng chống SQL injection.

## 5. LUỒNG XỬ LÝ DỮ LIỆU

**Luồng đọc dữ liệu (Ví dụ: Xem danh sách sản phẩm)**

User click "Xem sản phẩm" → Client gửi GET `/api/products` → Product Handler nhận request → Gọi Prisma query database → PostgreSQL trả kết quả → Handler format JSON → Response về Client → Hiển thị sản phẩm.

**Luồng ghi dữ liệu (Ví dụ: Tạo đơn hàng)**

User điền form đặt hàng → Client POST `/api/orders` → Middleware authenticate kiểm tra token → Order Handler validate dữ liệu → OrderService bắt đầu transaction → Tạo Order → Tạo OrderItems → Cập nhật Product stock → Commit transaction → EmailService gửi email → Response về Client → Hiển thị "Đặt hàng thành công".

**Luồng real-time (Ví dụ: Chat)**

User gửi tin nhắn → Client emit 'chat-message' qua Socket.IO → Socket Handler nhận event → ChatService lưu message vào database → Nếu cần AI, gọi ChatbotService → ChatbotService tìm knowledge base hoặc gọi Gemini AI → Tạo response → Lưu vào database → Socket broadcast 'new-message' → Tất cả clients nhận message real-time.

## 6. ƯU ĐIỂM KIẾN TRÚC

Kiến trúc 3 lớp mang lại các lợi ích:

- **Phân tách trách nhiệm**: Mỗi lớp có nhiệm vụ riêng biệt, dễ quản lý
- **Dễ bảo trì**: Thay đổi một lớp không ảnh hưởng lớp khác
- **Dễ mở rộng**: Có thể thêm tính năng mới mà không phá vỡ code cũ
- **Tái sử dụng**: Service và Model có thể dùng cho nhiều Handler
- **Bảo mật**: Validate và phân quyền ở nhiều lớp
- **Hiệu năng**: Cache ở nhiều mức (Redis, Database query cache)
- **Dễ kiểm thử**: Test từng lớp độc lập

Hệ thống đã sẵn sàng phục vụ người dùng với độ tin cậy, bảo mật và hiệu năng cao.
