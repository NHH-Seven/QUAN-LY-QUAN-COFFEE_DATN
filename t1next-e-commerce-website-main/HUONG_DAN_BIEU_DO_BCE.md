# HƯỚNG DẪN SỬ DỤNG BIỂU ĐỒ BCE

## DANH SÁCH CÁC FILE

Đã tạo 9 file PlantUML riêng biệt cho từng module:

1. **BCE_01_SAN_PHAM.puml** - Module Quản lý Sản phẩm
2. **BCE_02_DON_HANG.puml** - Module Quản lý Đơn hàng
3. **BCE_03_XAC_THUC.puml** - Module Xác thực & Người dùng
4. **BCE_04_GIO_HANG.puml** - Module Quản lý Giỏ hàng
5. **BCE_05_CHATBOT.puml** - Module Chatbot AI
6. **BCE_06_KHO.puml** - Module Quản lý Kho
7. **BCE_07_DANH_GIA.puml** - Module Đánh giá Sản phẩm
8. **BCE_08_KHUYEN_MAI.puml** - Module Khuyến mãi
9. **BCE_09_BAO_CAO.puml** - Module Báo cáo & Thống kê

## CÁCH SỬ DỤNG

### Phương pháp 1: PlantUML Online (Nhanh nhất)

1. Truy cập: **https://www.plantuml.com/plantuml/uml/**
2. Mở file `.puml` bất kỳ (ví dụ: `BCE_01_SAN_PHAM.puml`)
3. Copy toàn bộ nội dung từ `@startuml` đến `@enduml`
4. Paste vào editor trên website
5. Click **"Submit"**
6. Download ảnh bằng cách click **"PNG"** hoặc **"SVG"**

### Phương pháp 2: VS Code với PlantUML Extension

1. Cài đặt extension **"PlantUML"** trong VS Code
2. Mở file `.puml` bất kỳ
3. Press `Alt+D` để xem preview
4. Right-click → **"Export Current Diagram"** để lưu ảnh

### Phương pháp 3: PlantUML Desktop

1. Download PlantUML: https://plantuml.com/download
2. Chạy lệnh:
   ```bash
   java -jar plantuml.jar BCE_01_SAN_PHAM.puml
   ```
3. File PNG sẽ được tạo tự động

### Phương pháp 4: Batch Export (Xuất tất cả cùng lúc)

Nếu bạn muốn xuất tất cả 9 biểu đồ cùng lúc:

```bash
java -jar plantuml.jar BCE_*.puml
```

Hoặc trong VS Code:
- Select tất cả file `.puml`
- Right-click → **"Export Workspace Diagrams"**

## ĐẶC ĐIỂM CỦA TỪNG FILE

### Tất cả các file đều có:
- ✅ Layout ngang (left to right direction)
- ✅ Màu sắc phân biệt:
  - **Boundary** (xanh lá): #D5E8D4
  - **Control** (cam): #FFE6CC
  - **Entity** (xanh dương): #DAE8FC
- ✅ Actor bên trái
- ✅ Mũi tên thể hiện luồng dữ liệu
- ✅ Title rõ ràng cho từng module

## CHI TIẾT TỪNG MODULE

### 1. BCE_01_SAN_PHAM.puml
- **Actors**: Khách hàng, Nhân viên
- **Boundary**: ProductPage, ProductAPI
- **Control**: ProductController, ProductService
- **Entity**: Product, Category

### 2. BCE_02_DON_HANG.puml
- **Actors**: Khách hàng, Nhân viên
- **Boundary**: CheckoutPage, OrderAPI
- **Control**: OrderController, OrderService, PaymentService
- **Entity**: Order, OrderItem

### 3. BCE_03_XAC_THUC.puml
- **Actors**: Người dùng, Admin
- **Boundary**: LoginPage, RegisterPage, AuthAPI
- **Control**: AuthController, AuthService, UserService
- **Entity**: User, PendingRegistration

### 4. BCE_04_GIO_HANG.puml
- **Actors**: Khách hàng
- **Boundary**: CartPage, CartAPI
- **Control**: CartController, CartService
- **Entity**: CartItem, Product

### 5. BCE_05_CHATBOT.puml
- **Actors**: Khách hàng, Nhân viên
- **Boundary**: ChatWidget, ChatAPI
- **Control**: ChatController, ChatbotService, SocketService
- **Entity**: ChatSession, ChatMessage, ChatbotKnowledge

### 6. BCE_06_KHO.puml
- **Actors**: Nhân viên kho, Quản lý
- **Boundary**: StockPage, StockAPI
- **Control**: StockController, StockService
- **Entity**: StockTransaction, Product

### 7. BCE_07_DANH_GIA.puml
- **Actors**: Khách hàng, Nhân viên
- **Boundary**: ReviewPage, ReviewAPI
- **Control**: ReviewController, ReviewService
- **Entity**: Review, Product, User

### 8. BCE_08_KHUYEN_MAI.puml
- **Actors**: Nhân viên, Khách hàng
- **Boundary**: PromotionPage, PromotionAPI
- **Control**: PromotionController, PromotionService
- **Entity**: Promotion, PromotionUsage

### 9. BCE_09_BAO_CAO.puml
- **Actors**: Quản lý, Admin
- **Boundary**: ReportPage, ReportAPI
- **Control**: ReportController, ReportService
- **Entity**: Order, Product, User (sử dụng dữ liệu từ các entity khác)

## TỔNG HỢP THỐNG KÊ

| Module | Actors | Boundary | Control | Entity |
|--------|--------|----------|---------|--------|
| Sản phẩm | 2 | 2 | 2 | 2 |
| Đơn hàng | 2 | 2 | 3 | 2 |
| Xác thực | 2 | 3 | 3 | 2 |
| Giỏ hàng | 1 | 2 | 2 | 2 |
| Chatbot | 2 | 2 | 3 | 3 |
| Kho | 2 | 2 | 2 | 2 |
| Đánh giá | 2 | 2 | 2 | 3 |
| Khuyến mãi | 2 | 2 | 2 | 2 |
| Báo cáo | 2 | 2 | 2 | 3 |
| **TỔNG** | **4 unique** | **19** | **21** | **14 unique** |

## LƯU Ý

- Mỗi file độc lập, có thể sử dụng riêng lẻ
- Tất cả đều có layout ngang giống ảnh mẫu
- Có thể chỉnh sửa màu sắc bằng cách thay đổi giá trị `#D5E8D4`, `#FFE6CC`, `#DAE8FC`
- Để thay đổi khoảng cách, điều chỉnh `nodesep` và `ranksep`
- File SVG có chất lượng tốt hơn PNG cho in ấn

## TIPS

### Để ghép nhiều biểu đồ vào 1 file Word/PDF:
1. Export tất cả thành PNG hoặc SVG
2. Insert vào Word theo thứ tự
3. Thêm caption cho mỗi hình

### Để chỉnh sửa nhanh:
- Dùng Find & Replace để thay đổi màu sắc hàng loạt
- Copy/paste giữa các file để đồng bộ style

### Để tạo biểu đồ tổng hợp:
- Có thể merge nhiều file `.puml` lại
- Hoặc dùng `!include` để import file khác

