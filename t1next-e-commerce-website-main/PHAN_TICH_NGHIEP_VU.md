# PHÂN TÍCH NGHIỆP VỤ - HỆ THỐNG NHH-COFFEE

## 📋 MỤC LỤC

1. [Tổng quan nghiệp vụ](#1-tổng-quan-nghiệp-vụ)
2. [Phân tích Actor](#2-phân-tích-actor)
3. [Phân tích Use Case](#3-phân-tích-use-case)
4. [Quy trình nghiệp vụ chính](#4-quy-trình-nghiệp-vụ-chính)
5. [Luồng nghiệp vụ chi tiết](#5-luồng-nghiệp-vụ-chi-tiết)
6. [Ma trận truy xuất](#6-ma-trận-truy-xuất)
7. [Quy tắc nghiệp vụ](#7-quy-tắc-nghiệp-vụ)

---

## 1. TỔNG QUAN NGHIỆP VỤ

### 1.1 Giới thiệu

**NHH-Coffee** là hệ thống quản lý cửa hàng cà phê & trà toàn diện, tích hợp:
- Bán hàng online (E-commerce)
- Quản lý bán hàng tại quầy (POS)
- Quản lý bàn và phục vụ (Table Management)
- Quản lý bếp/pha chế (Kitchen Display)
- Hỗ trợ khách hàng với AI Chatbot
- Quản lý kho, nhân viên, báo cáo

### 1.2 Mục tiêu nghiệp vụ

1. **Tăng doanh thu**: Bán hàng đa kênh (online + offline)
2. **Tối ưu vận hành**: Tự động hóa quy trình bán hàng, pha chế
3. **Nâng cao trải nghiệm**: AI chatbot, real-time updates
4. **Quản lý hiệu quả**: Kho hàng, nhân viên, ca làm việc
5. **Phân tích dữ liệu**: Báo cáo doanh thu, sản phẩm bán chạy

### 1.3 Phạm vi nghiệp vụ

```
┌─────────────────────────────────────────────────────────────────┐
│                    HỆ THỐNG NHH-COFFEE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  BÁN HÀNG ONLINE │  │  BÁN HÀNG TẠI   │  │  QUẢN LÝ BÀN │ │
│  │  (E-commerce)    │  │  QUẦY (POS)      │  │  (Tables)    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  QUẢN LÝ BẾP    │  │  QUẢN LÝ KHO    │  │  QUẢN LÝ     │ │
│  │  (Kitchen)       │  │  (Inventory)     │  │  NHÂN VIÊN   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  AI CHATBOT      │  │  BÁO CÁO        │  │  KHUYẾN MÃI  │ │
│  │  (Support)       │  │  (Reports)       │  │  (Promotion) │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. PHÂN TÍCH ACTOR

### 2.1 Sơ đồ Actor

```
┌─────────────────────────────────────────────────────────────────┐
│                         ACTORS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │  KHÁCH HÀNG  │         │  KHÁCH VÃNG  │                     │
│  │  (Customer)  │         │  LAI (Guest) │                     │
│  └──────────────┘         └──────────────┘                     │
│         │                         │                              │
│         └─────────────┬───────────┘                             │
│                       │                                          │
│              ┌────────▼────────┐                                │
│              │   NGƯỜI DÙNG    │                                │
│              │   (User)        │                                │
│              └────────┬────────┘                                │
│                       │                                          │
│         ┌─────────────┼─────────────┐                           │
│         │             │             │                            │
│  ┌──────▼──────┐ ┌───▼────────┐ ┌─▼──────────┐                │
│  │  NHÂN VIÊN  │ │  NHÂN VIÊN │ │  QUẢN TRỊ  │                │
│  │  BÁN HÀNG   │ │  KHO       │ │  (Admin)   │                │
│  │  (Sales)    │ │ (Warehouse)│ └────────────┘                │
│  └─────────────┘ └────────────┘                                │
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │  HỆ THỐNG    │         │  HỆ THỐNG    │                     │
│  │  THANH TOÁN  │         │  EMAIL       │                     │
│  │  (External)  │         │  (External)  │                     │
│  └──────────────┘         └──────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Mô tả Actor

| Actor | Vai trò | Quyền hạn |
|-------|---------|-----------|
| **Khách hàng** | Người mua hàng đã đăng ký | Xem sản phẩm, đặt hàng, theo dõi đơn hàng, chat |
| **Khách vãng lai** | Người dùng chưa đăng ký | Xem sản phẩm, chat với AI |
| **Nhân viên bán hàng** | Phục vụ khách, bán hàng | POS, quản lý bàn, bếp, đơn hàng |
| **Nhân viên kho** | Quản lý kho hàng | Nhập/xuất kho, kiểm kê |
| **Quản trị** | Quản lý toàn bộ hệ thống | Tất cả quyền + cấu hình hệ thống |
| **Hệ thống thanh toán** | Xử lý thanh toán | Xác nhận giao dịch |
| **Hệ thống email** | Gửi thông báo | Gửi email xác nhận, thông báo |

---

## 3. PHÂN TÍCH USE CASE

### 3.1 Sơ đồ Use Case tổng quan

```
                    ┌─────────────────────────────────────┐
                    │    HỆ THỐNG NHH-COFFEE              │
                    └─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐          ┌──────▼───────┐          ┌───────▼────────┐
│  KHÁCH HÀNG    │          │  NHÂN VIÊN   │          │  QUẢN TRỊ      │
└───────┬────────┘          └──────┬───────┘          └───────┬────────┘
        │                           │                           │
        │                           │                           │
   ┌────┴────┐                 ┌───┴────┐                 ┌───┴────┐
   │         │                 │        │                 │        │
   ▼         ▼                 ▼        ▼                 ▼        ▼
[UC01]    [UC02]           [UC10]   [UC11]           [UC20]   [UC21]
Đăng ký   Đặt hàng         Bán      Quản lý          Quản lý  Xem
                           hàng     bàn              sản phẩm báo cáo
```

### 3.2 Danh sách Use Case

#### **Nhóm UC01: Quản lý tài khoản**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC01 | Đăng ký tài khoản | Khách vãng lai | Đăng ký với email + OTP |
| UC02 | Đăng nhập | Khách hàng, Nhân viên, Admin | Đăng nhập vào hệ thống |
| UC03 | Quên mật khẩu | Khách hàng | Reset mật khẩu qua OTP |
| UC04 | Quản lý hồ sơ | Khách hàng | Cập nhật thông tin cá nhân |
| UC05 | Xem điểm tích lũy | Khách hàng | Xem điểm và hạng thành viên |

#### **Nhóm UC10: Bán hàng online**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC10 | Xem sản phẩm | Khách hàng, Guest | Duyệt danh sách sản phẩm |
| UC11 | Tìm kiếm sản phẩm | Khách hàng, Guest | Tìm kiếm theo từ khóa |
| UC12 | Xem chi tiết sản phẩm | Khách hàng, Guest | Xem thông tin chi tiết |
| UC13 | Thêm vào giỏ hàng | Khách hàng | Thêm sản phẩm vào giỏ |
| UC14 | Đặt hàng | Khách hàng | Tạo đơn hàng mới |
| UC15 | Thanh toán | Khách hàng | Thanh toán đơn hàng |
| UC16 | Theo dõi đơn hàng | Khách hàng | Xem trạng thái đơn hàng |
| UC17 | Đánh giá sản phẩm | Khách hàng | Viết review sau khi mua |

#### **Nhóm UC20: Bán hàng tại quầy (POS)**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC20 | Tạo đơn POS | Nhân viên bán hàng | Tạo đơn bán tại quầy |
| UC21 | Quản lý bàn | Nhân viên bán hàng | Mở/đóng bàn, gọi món |
| UC22 | Gọi món | Nhân viên bán hàng | Thêm món vào bàn |
| UC23 | Thanh toán bàn | Nhân viên bán hàng | Thanh toán và đóng bàn |
| UC24 | Tách/gộp bàn | Nhân viên bán hàng | Quản lý nhiều bàn |

#### **Nhóm UC30: Quản lý bếp/pha chế**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC30 | Xem màn hình bếp | Nhân viên bán hàng | Xem danh sách món cần pha chế |
| UC31 | Cập nhật trạng thái món | Nhân viên bán hàng | Đánh dấu món đang làm/hoàn thành |
| UC32 | Hủy món | Nhân viên bán hàng | Hủy món theo yêu cầu |

#### **Nhóm UC40: Quản lý kho**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC40 | Nhập kho | Nhân viên kho | Nhập hàng mới vào kho |
| UC41 | Xuất kho | Nhân viên kho | Xuất hàng khi bán |
| UC42 | Kiểm kê kho | Nhân viên kho | Kiểm tra tồn kho |
| UC43 | Cảnh báo tồn kho thấp | Hệ thống | Tự động thông báo |

#### **Nhóm UC50: Quản lý nhân viên**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC50 | Quản lý ca làm việc | Admin | Tạo/sửa ca làm việc |
| UC51 | Đăng ký ca | Nhân viên | Đăng ký ca muốn làm |
| UC52 | Đổi ca | Nhân viên | Yêu cầu đổi ca với đồng nghiệp |
| UC53 | Chấm công | Hệ thống | Tự động chấm công |

#### **Nhóm UC60: Hỗ trợ khách hàng**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC60 | Chat với AI | Khách hàng, Guest | Hỏi đáp với chatbot |
| UC61 | Chat với nhân viên | Khách hàng | Chat trực tiếp với staff |
| UC62 | Quản lý chat | Nhân viên bán hàng | Trả lời chat khách hàng |

#### **Nhóm UC70: Quản trị hệ thống**

| ID | Use Case | Actor | Mô tả |
|----|----------|-------|-------|
| UC70 | Quản lý sản phẩm | Admin | CRUD sản phẩm |
| UC71 | Quản lý danh mục | Admin | CRUD danh mục |
| UC72 | Quản lý khuyến mãi | Admin | Tạo/sửa mã giảm giá |
| UC73 | Xem báo cáo | Admin, Nhân viên | Xem báo cáo doanh thu |
| UC74 | Quản lý AI Knowledge | Admin | Cập nhật kiến thức chatbot |
| UC75 | Backup/Restore | Admin | Sao lưu dữ liệu |

---

## 4. QUY TRÌNH NGHIỆP VỤ CHÍNH

### 4.1 Quy trình đặt hàng online

```
KHÁCH HÀNG                 HỆ THỐNG                  NHÂN VIÊN
    │                          │                          │
    │  1. Duyệt sản phẩm       │                          │
    ├─────────────────────────▶│                          │
    │                          │                          │
    │  2. Thêm vào giỏ hàng    │                          │
    ├─────────────────────────▶│                          │
    │                          │                          │
    │  3. Xem giỏ hàng         │                          │
    ├─────────────────────────▶│                          │
    │                          │                          │
    │  4. Nhập thông tin giao  │                          │
    │     hàng & thanh toán    │                          │
    ├─────────────────────────▶│                          │
    │                          │                          │
    │                          │  5. Validate đơn hàng    │
    │                          ├──────┐                   │
    │                          │      │                   │
    │                          │◀─────┘                   │
    │                          │                          │
    │                          │  6. Kiểm tra tồn kho     │
    │                          ├──────┐                   │
    │                          │      │                   │
    │                          │◀─────┘                   │
    │                          │                          │
    │                          │  7. Tạo đơn hàng         │
    │                          ├──────┐                   │
    │                          │      │                   │
    │                          │◀─────┘                   │
    │                          │                          │
    │                          │  8. Trừ tồn kho          │
    │                          ├──────┐                   │
    │                          │      │                   │
    │                          │◀─────┘                   │
    │                          │                          │
    │  9. Xác nhận đơn hàng    │                          │
    │◀─────────────────────────┤                          │
    │                          │                          │
    │  10. Email xác nhận      │                          │
    │◀─────────────────────────┤                          │
    │                          │                          │
    │                          │  11. Thông báo đơn mới   │
    │                          ├─────────────────────────▶│
    │                          │                          │
    │                          │  12. Xác nhận đơn        │
    │                          │◀─────────────────────────┤
    │                          │                          │
    │  13. Thông báo trạng thái│                          │
    │◀─────────────────────────┤                          │
    │                          │                          │
```


### 4.2 Quy trình bán hàng tại quầy (POS)

```
KHÁCH HÀNG         NHÂN VIÊN BÁN HÀNG        HỆ THỐNG           BẾP/PHA CHẾ
    │                      │                      │                   │
    │  1. Gọi món          │                      │                   │
    ├─────────────────────▶│                      │                   │
    │                      │                      │                   │
    │                      │  2. Tạo đơn POS      │                   │
    │                      ├─────────────────────▶│                   │
    │                      │                      │                   │
    │                      │  3. Chọn sản phẩm    │                   │
    │                      ├─────────────────────▶│                   │
    │                      │                      │                   │
    │                      │  4. Xác nhận đơn     │                   │
    │                      │◀─────────────────────┤                   │
    │                      │                      │                   │
    │                      │                      │  5. Gửi lệnh pha chế
    │                      │                      ├──────────────────▶│
    │                      │                      │                   │
    │                      │                      │  6. Nhận lệnh     │
    │                      │                      │◀──────────────────┤
    │                      │                      │                   │
    │                      │                      │  7. Bắt đầu pha chế
    │                      │                      │◀──────────────────┤
    │                      │                      │                   │
    │                      │  8. Cập nhật trạng thái                  │
    │                      │◀─────────────────────┤                   │
    │                      │                      │                   │
    │  9. Thông báo        │                      │                   │
    │     đang pha chế     │                      │                   │
    │◀─────────────────────┤                      │                   │
    │                      │                      │                   │
    │                      │                      │  10. Hoàn thành   │
    │                      │                      │◀──────────────────┤
    │                      │                      │                   │
    │                      │  11. Thông báo sẵn sàng                  │
    │                      │◀─────────────────────┤                   │
    │                      │                      │                   │
    │  12. Giao hàng       │                      │                   │
    │◀─────────────────────┤                      │                   │
    │                      │                      │                   │
    │  13. Yêu cầu        │                      │                   │
    │      thanh toán      │                      │                   │
    ├─────────────────────▶│                      │                   │
    │                      │                      │                   │
    │                      │  14. Xử lý thanh toán│                   │
    │                      ├─────────────────────▶│                   │
    │                      │                      │                   │
    │                      │  15. Xác nhận        │                   │
    │                      │◀─────────────────────┤                   │
    │                      │                      │                   │
    │  16. In hóa đơn      │                      │                   │
    │◀─────────────────────┤                      │                   │
    │                      │                      │                   │
```

### 4.3 Quy trình quản lý bàn

```
KHÁCH HÀNG         NHÂN VIÊN              HỆ THỐNG           BẾP
    │                  │                      │                │
    │  1. Đến quán     │                      │                │
    ├─────────────────▶│                      │                │
    │                  │                      │                │
    │                  │  2. Chọn bàn trống   │                │
    │                  ├─────────────────────▶│                │
    │                  │                      │                │
    │                  │  3. Mở bàn           │                │
    │                  ├─────────────────────▶│                │
    │                  │                      │                │
    │                  │  4. Cập nhật trạng thái bàn           │
    │                  │◀─────────────────────┤                │
    │                  │                      │                │
    │  5. Gọi món      │                      │                │
    ├─────────────────▶│                      │                │
    │                  │                      │                │
    │                  │  6. Thêm món vào bàn │                │
    │                  ├─────────────────────▶│                │
    │                  │                      │                │
    │                  │                      │  7. Gửi bếp    │
    │                  │                      ├───────────────▶│
    │                  │                      │                │
    │  8. Gọi thêm món │                      │                │
    ├─────────────────▶│                      │                │
    │                  │                      │                │
    │                  │  9. Thêm món         │                │
    │                  ├─────────────────────▶│                │
    │                  │                      │                │
    │  10. Yêu cầu     │                      │                │
    │      thanh toán  │                      │                │
    ├─────────────────▶│                      │                │
    │                  │                      │                │
    │                  │  11. Tính tổng tiền  │                │
    │                  ├─────────────────────▶│                │
    │                  │                      │                │
    │                  │  12. Thanh toán      │                │
    │                  ├─────────────────────▶│                │
    │                  │                      │                │
    │                  │  13. Đóng bàn        │                │
    │                  ├─────────────────────▶│                │
    │                  │                      │                │
    │  14. Hóa đơn     │                      │                │
    │◀─────────────────┤                      │                │
    │                  │                      │                │
```

### 4.4 Quy trình quản lý kho

```
NHÂN VIÊN KHO          HỆ THỐNG              DATABASE
    │                      │                      │
    │  1. Nhập thông tin   │                      │
    │     nhập kho         │                      │
    ├─────────────────────▶│                      │
    │                      │                      │
    │                      │  2. Validate dữ liệu │
    │                      ├──────┐               │
    │                      │      │               │
    │                      │◀─────┘               │
    │                      │                      │
    │                      │  3. Tạo giao dịch    │
    │                      │     nhập kho         │
    │                      ├─────────────────────▶│
    │                      │                      │
    │                      │  4. Cập nhật tồn kho │
    │                      ├─────────────────────▶│
    │                      │                      │
    │  5. Xác nhận         │                      │
    │◀─────────────────────┤                      │
    │                      │                      │
    │  6. Kiểm tra tồn kho │                      │
    │     thấp             │                      │
    ├─────────────────────▶│                      │
    │                      │                      │
    │                      │  7. Query sản phẩm   │
    │                      │     tồn kho < ngưỡng │
    │                      ├─────────────────────▶│
    │                      │                      │
    │                      │  8. Danh sách        │
    │                      │◀─────────────────────┤
    │                      │                      │
    │  9. Hiển thị cảnh báo│                      │
    │◀─────────────────────┤                      │
    │                      │                      │
    │                      │  10. Gửi thông báo   │
    │                      │      cho admin       │
    │                      ├──────┐               │
    │                      │      │               │
    │                      │◀─────┘               │
    │                      │                      │
```

---

## 5. LUỒNG NGHIỆP VỤ CHI TIẾT

### 5.1 UC14: Đặt hàng online (Chi tiết)

**Mô tả**: Khách hàng đặt hàng sản phẩm qua website

**Actor chính**: Khách hàng  
**Actor phụ**: Hệ thống thanh toán, Hệ thống email

**Tiền điều kiện**:
- Khách hàng đã đăng nhập
- Có sản phẩm trong giỏ hàng
- Sản phẩm còn hàng

**Hậu điều kiện**:
- Đơn hàng được tạo thành công
- Tồn kho được cập nhật
- Email xác nhận được gửi
- Nhân viên nhận thông báo

**Luồng chính**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LUỒNG ĐẶT HÀNG ONLINE                         │
└─────────────────────────────────────────────────────────────────┘

1. Khách hàng nhấn "Thanh toán" từ giỏ hàng
   │
   ▼
2. Hệ thống hiển thị form thông tin giao hàng
   │
   ▼
3. Khách hàng nhập:
   - Tên người nhận
   - Số điện thoại
   - Địa chỉ giao hàng
   - Ghi chú (optional)
   │
   ▼
4. Khách hàng chọn phương thức thanh toán:
   - Tiền mặt (COD)
   - Chuyển khoản (VietQR)
   - Thẻ tín dụng
   │
   ▼
5. Khách hàng nhập mã khuyến mãi (optional)
   │
   ▼
6. Hệ thống validate:
   ├─ Kiểm tra thông tin bắt buộc
   ├─ Kiểm tra mã khuyến mãi (nếu có)
   ├─ Kiểm tra tồn kho từng sản phẩm
   └─ Tính tổng tiền (subtotal + shipping - discount)
   │
   ▼
7. Hệ thống hiển thị tóm tắt đơn hàng
   │
   ▼
8. Khách hàng xác nhận đặt hàng
   │
   ▼
9. Hệ thống xử lý:
   ├─ Tạo đơn hàng (status: pending)
   ├─ Tạo các order_items
   ├─ Trừ tồn kho (stock_transactions)
   ├─ Xóa giỏ hàng
   ├─ Cộng điểm tích lũy (nếu có)
   └─ Lưu promotion_usage (nếu có)
   │
   ▼
10. Hệ thống gửi thông báo:
    ├─ Email xác nhận cho khách hàng
    ├─ Socket.io notification cho khách hàng
    └─ Socket.io notification cho nhân viên
    │
    ▼
11. Hệ thống hiển thị trang xác nhận đơn hàng
    │
    ▼
12. Khách hàng có thể:
    ├─ Xem chi tiết đơn hàng
    ├─ Theo dõi trạng thái
    └─ Hủy đơn (nếu status = pending)
```

**Luồng thay thế**:

```
A1. Sản phẩm hết hàng (tại bước 6)
    │
    ├─ Hệ thống hiển thị thông báo sản phẩm hết hàng
    ├─ Đề xuất xóa sản phẩm khỏi giỏ hoặc chọn sản phẩm khác
    └─ Quay lại bước 1

A2. Mã khuyến mãi không hợp lệ (tại bước 6)
    │
    ├─ Hệ thống hiển thị lỗi:
    │  - Mã không tồn tại
    │  - Mã đã hết hạn
    │  - Mã đã hết lượt sử dụng
    │  - Đơn hàng không đủ điều kiện
    └─ Khách hàng có thể nhập mã khác hoặc bỏ qua

A3. Thanh toán online thất bại (tại bước 9)
    │
    ├─ Hệ thống rollback:
    │  - Không tạo đơn hàng
    │  - Không trừ tồn kho
    │  - Giữ nguyên giỏ hàng
    ├─ Hiển thị thông báo lỗi
    └─ Đề xuất thử lại hoặc chọn phương thức khác
```

**Quy tắc nghiệp vụ**:

1. **BR-ORDER-01**: Đơn hàng tối thiểu 10,000đ
2. **BR-ORDER-02**: Phí ship cố định 30,000đ (có thể thay đổi theo khoảng cách)
3. **BR-ORDER-03**: Miễn phí ship cho đơn hàng > 200,000đ
4. **BR-ORDER-04**: Khách hàng chỉ được hủy đơn khi status = "pending"
5. **BR-ORDER-05**: Tự động hủy đơn COD sau 24h nếu không xác nhận
6. **BR-ORDER-06**: Cộng điểm = (Tổng tiền / 1000) điểm
7. **BR-ORDER-07**: Mỗi khách hàng chỉ dùng 1 mã khuyến mãi/đơn

### 5.2 UC20: Bán hàng POS (Chi tiết)

**Mô tả**: Nhân viên tạo đơn bán hàng tại quầy

**Actor chính**: Nhân viên bán hàng  
**Actor phụ**: Khách hàng, Hệ thống

**Tiền điều kiện**:
- Nhân viên đã đăng nhập
- Có sản phẩm trong hệ thống

**Hậu điều kiện**:
- Đơn hàng được tạo và thanh toán
- Tồn kho được cập nhật
- Hóa đơn được in

**Luồng chính**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LUỒNG BÁN HÀNG POS                            │
└─────────────────────────────────────────────────────────────────┘

1. Nhân viên mở màn hình POS
   │
   ▼
2. Nhân viên tìm kiếm sản phẩm:
   - Quét mã vạch (nếu có)
   - Tìm theo tên
   - Chọn từ danh mục
   │
   ▼
3. Nhân viên chọn sản phẩm và số lượng
   │
   ▼
4. Hệ thống thêm vào đơn tạm:
   ├─ Hiển thị tên sản phẩm
   ├─ Hiển thị giá
   ├─ Hiển thị số lượng
   └─ Tính tạm tổng tiền
   │
   ▼
5. Nhân viên có thể:
   ├─ Thêm sản phẩm khác (quay lại bước 2)
   ├─ Sửa số lượng
   ├─ Xóa sản phẩm
   └─ Tiếp tục thanh toán
   │
   ▼
6. Nhân viên nhấn "Thanh toán"
   │
   ▼
7. Hệ thống hiển thị:
   ├─ Tổng tiền
   ├─ Form nhập mã khuyến mãi (optional)
   └─ Chọn phương thức thanh toán
   │
   ▼
8. Nhân viên chọn phương thức:
   - Tiền mặt
   - Chuyển khoản
   - Thẻ
   │
   ▼
9. Nếu tiền mặt:
   ├─ Nhân viên nhập số tiền khách đưa
   └─ Hệ thống tính tiền thừa
   │
   ▼
10. Nhân viên xác nhận thanh toán
    │
    ▼
11. Hệ thống xử lý:
    ├─ Tạo đơn hàng (status: completed)
    ├─ Trừ tồn kho
    ├─ Lưu giao dịch
    └─ Tạo hóa đơn
    │
    ▼
12. Hệ thống in hóa đơn tự động
    │
    ▼
13. Nhân viên giao hàng cho khách
    │
    ▼
14. Màn hình POS reset, sẵn sàng đơn mới
```

**Luồng thay thế**:

```
A1. Sản phẩm không đủ số lượng (tại bước 3)
    │
    ├─ Hệ thống hiển thị số lượng tồn kho hiện tại
    ├─ Nhân viên điều chỉnh số lượng
    └─ Hoặc chọn sản phẩm khác

A2. Khách hàng hủy đơn (tại bước 6-10)
    │
    ├─ Nhân viên nhấn "Hủy đơn"
    ├─ Hệ thống xóa đơn tạm
    └─ Quay lại màn hình chính

A3. Tiền khách đưa không đủ (tại bước 9)
    │
    ├─ Hệ thống hiển thị cảnh báo
    ├─ Nhân viên yêu cầu khách đưa thêm tiền
    └─ Hoặc chọn phương thức thanh toán khác
```

### 5.3 UC21: Quản lý bàn (Chi tiết)

**Mô tả**: Nhân viên quản lý bàn ăn trong quán

**Actor chính**: Nhân viên bán hàng  
**Actor phụ**: Khách hàng, Bếp

**Luồng chính**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LUỒNG QUẢN LÝ BÀN                             │
└─────────────────────────────────────────────────────────────────┘

1. Nhân viên mở màn hình quản lý bàn
   │
   ▼
2. Hệ thống hiển thị sơ đồ bàn:
   ├─ Bàn trống (màu xanh)
   ├─ Bàn đang sử dụng (màu vàng)
   └─ Bàn đã gọi món (màu đỏ)
   │
   ▼
3. Khách hàng đến, nhân viên chọn bàn trống
   │
   ▼
4. Nhân viên nhấn "Mở bàn"
   │
   ▼
5. Hệ thống:
   ├─ Cập nhật trạng thái bàn = "occupied"
   ├─ Ghi thời gian mở bàn
   └─ Tạo session cho bàn
   │
   ▼
6. Khách hàng gọi món
   │
   ▼
7. Nhân viên chọn bàn và nhấn "Gọi món"
   │
   ▼
8. Hệ thống hiển thị menu
   │
   ▼
9. Nhân viên chọn món và số lượng
   │
   ▼
10. Nhân viên xác nhận gọi món
    │
    ▼
11. Hệ thống:
    ├─ Lưu món vào bàn
    ├─ Gửi lệnh đến màn hình bếp
    ├─ Cập nhật trạng thái bàn
    └─ Gửi notification real-time
    │
    ▼
12. Bếp nhận lệnh và bắt đầu pha chế
    │
    ▼
13. Bếp cập nhật trạng thái món:
    - Đang làm
    - Hoàn thành
    │
    ▼
14. Nhân viên phục vụ món cho khách
    │
    ▼
15. Khách hàng yêu cầu thanh toán
    │
    ▼
16. Nhân viên chọn bàn và nhấn "Thanh toán"
    │
    ▼
17. Hệ thống hiển thị:
    ├─ Danh sách món đã gọi
    ├─ Tổng tiền
    └─ Form thanh toán
    │
    ▼
18. Nhân viên xử lý thanh toán
    │
    ▼
19. Hệ thống:
    ├─ Tạo đơn hàng
    ├─ Trừ tồn kho
    ├─ Đóng bàn (status = "available")
    ├─ In hóa đơn
    └─ Reset session
    │
    ▼
20. Bàn sẵn sàng cho khách tiếp theo
```

**Chức năng bổ sung**:

```
TÁCH BÀN:
1. Nhân viên chọn bàn cần tách
2. Chọn các món muốn tách
3. Chọn bàn đích
4. Hệ thống di chuyển món sang bàn mới

GỘP BÀN:
1. Nhân viên chọn bàn nguồn
2. Chọn bàn đích
3. Hệ thống gộp tất cả món vào bàn đích
4. Đóng bàn nguồn

HỦY MÓN:
1. Nhân viên chọn bàn
2. Chọn món cần hủy
3. Nhập lý do hủy
4. Hệ thống cập nhật và thông báo bếp
```


### 5.4 UC60: Chat với AI Chatbot (Chi tiết)

**Mô tả**: Khách hàng chat với AI để được hỗ trợ

**Actor chính**: Khách hàng/Guest  
**Actor phụ**: AI Chatbot (Gemini), Hệ thống

**Luồng chính**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LUỒNG CHAT VỚI AI                             │
└─────────────────────────────────────────────────────────────────┘

1. Khách hàng nhấn icon chat ở góc màn hình
   │
   ▼
2. Hệ thống mở cửa sổ chat
   │
   ▼
3. Hệ thống kiểm tra:
   ├─ Nếu có session cũ → Load lịch sử chat
   └─ Nếu không → Tạo session mới
   │
   ▼
4. AI gửi tin nhắn chào mừng:
   "Xin chào! Tôi là trợ lý ảo của NHH-Coffee.
    Tôi có thể giúp gì cho bạn?"
   │
   ▼
5. Khách hàng nhập tin nhắn
   │
   ▼
6. Hệ thống gửi tin nhắn đến server
   │
   ▼
7. Server xử lý:
   ├─ Lưu tin nhắn của user
   ├─ Phân tích intent (ý định)
   ├─ Tìm kiếm trong knowledge base
   └─ Nếu không tìm thấy → Gọi Gemini AI
   │
   ▼
8. Gemini AI xử lý:
   ├─ Phân tích ngữ cảnh
   ├─ Tìm kiếm sản phẩm (nếu hỏi về sản phẩm)
   ├─ Tra cứu đơn hàng (nếu hỏi về đơn hàng)
   └─ Tạo câu trả lời phù hợp
   │
   ▼
9. Server nhận response từ AI
   │
   ▼
10. Server lưu response vào database
    │
    ▼
11. Server gửi response về client
    │
    ▼
12. Hệ thống hiển thị tin nhắn AI
    │
    ▼
13. Khách hàng có thể:
    ├─ Tiếp tục hỏi (quay lại bước 5)
    ├─ Chuyển sang chat với nhân viên
    └─ Đóng chat
```

**Các intent được hỗ trợ**:

```
1. PRODUCT_INQUIRY (Hỏi về sản phẩm)
   - "Có loại cà phê nào ngon?"
   - "Giá trà đào bao nhiêu?"
   - "Sản phẩm nào đang khuyến mãi?"
   
   → AI tìm sản phẩm và giới thiệu

2. ORDER_TRACKING (Tra cứu đơn hàng)
   - "Đơn hàng của tôi đến đâu rồi?"
   - "Kiểm tra đơn #12345"
   
   → AI tra cứu và thông báo trạng thái

3. PURCHASE_INTENT (Ý định mua hàng)
   - "Tôi muốn đặt cà phê"
   - "Làm sao để đặt hàng?"
   
   → AI hướng dẫn đặt hàng

4. STORE_INFO (Thông tin cửa hàng)
   - "Quán mở cửa mấy giờ?"
   - "Địa chỉ quán ở đâu?"
   
   → AI cung cấp thông tin

5. GENERAL_QUESTION (Câu hỏi chung)
   - "Cà phê có tác dụng gì?"
   - "Làm sao để pha cà phê ngon?"
   
   → AI trả lời dựa trên kiến thức
```

**Luồng thay thế**:

```
A1. AI không hiểu câu hỏi
    │
    ├─ AI trả lời: "Xin lỗi, tôi chưa hiểu câu hỏi của bạn.
    │   Bạn có thể diễn đạt lại hoặc chat với nhân viên không?"
    └─ Đề xuất chuyển sang chat với nhân viên

A2. Khách hàng muốn chat với nhân viên
    │
    ├─ Khách hàng nhấn "Chat với nhân viên"
    ├─ Hệ thống tạo chat session mới
    ├─ Thông báo cho nhân viên online
    └─ Chuyển sang chế độ chat trực tiếp
```

---

## 6. MA TRẬN TRUY XUẤT

### 6.1 Ma trận Actor - Use Case

```
┌──────────────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│      Use Case        │Guest│Cust │Sales│Ware │Admin│Email│Pay  │
├──────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ UC01: Đăng ký        │  X  │     │     │     │     │  S  │     │
│ UC02: Đăng nhập      │     │  X  │  X  │  X  │  X  │     │     │
│ UC10: Xem sản phẩm   │  X  │  X  │     │     │     │     │     │
│ UC11: Tìm kiếm       │  X  │  X  │     │     │     │     │     │
│ UC13: Thêm giỏ hàng  │     │  X  │     │     │     │     │     │
│ UC14: Đặt hàng       │     │  X  │     │     │     │  S  │  S  │
│ UC15: Thanh toán     │     │  X  │     │     │     │     │  X  │
│ UC16: Theo dõi đơn   │     │  X  │     │     │     │     │     │
│ UC17: Đánh giá       │     │  X  │     │     │     │     │     │
│ UC20: Bán hàng POS   │     │     │  X  │     │     │     │     │
│ UC21: Quản lý bàn    │     │     │  X  │     │     │     │     │
│ UC30: Màn hình bếp   │     │     │  X  │     │     │     │     │
│ UC40: Nhập kho       │     │     │     │  X  │     │     │     │
│ UC41: Xuất kho       │     │     │     │  X  │     │     │     │
│ UC50: Quản lý ca     │     │     │     │     │  X  │     │     │
│ UC60: Chat AI        │  X  │  X  │     │     │     │     │     │
│ UC61: Chat nhân viên │     │  X  │  X  │     │     │     │     │
│ UC70: Quản lý SP     │     │     │     │     │  X  │     │     │
│ UC73: Xem báo cáo    │     │     │  X  │     │  X  │     │     │
│ UC74: Quản lý AI KB  │     │     │     │     │  X  │     │     │
└──────────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Chú thích:
X = Actor chính (Primary Actor)
S = Actor phụ (Secondary Actor)
```

### 6.2 Ma trận Use Case - Entity

```
┌──────────────────────┬────┬────┬────┬────┬────┬────┬────┬────┐
│      Use Case        │User│Prod│Ord │Cart│Rev │Inv │Tabl│Chat│
├──────────────────────┼────┼────┼────┼────┼────┼────┼────┼────┤
│ UC01: Đăng ký        │ C  │    │    │    │    │    │    │    │
│ UC02: Đăng nhập      │ R  │    │    │    │    │    │    │    │
│ UC10: Xem sản phẩm   │    │ R  │    │    │    │    │    │    │
│ UC13: Thêm giỏ hàng  │ R  │ R  │    │ C  │    │    │    │    │
│ UC14: Đặt hàng       │ R  │ R  │ C  │ D  │    │ U  │    │    │
│ UC15: Thanh toán     │ U  │    │ U  │    │    │    │    │    │
│ UC16: Theo dõi đơn   │ R  │    │ R  │    │    │    │    │    │
│ UC17: Đánh giá       │ R  │ R  │ R  │    │ C  │    │    │    │
│ UC20: Bán hàng POS   │ R  │ R  │ C  │    │    │ U  │    │    │
│ UC21: Quản lý bàn    │ R  │ R  │ C  │    │    │    │ U  │    │
│ UC30: Màn hình bếp   │    │ R  │ R  │    │    │    │ R  │    │
│ UC40: Nhập kho       │ R  │ R  │    │    │    │ C  │    │    │
│ UC60: Chat AI        │ R  │ R  │ R  │    │    │    │    │ C  │
│ UC70: Quản lý SP     │    │CRUD│    │    │    │    │    │    │
│ UC73: Xem báo cáo    │ R  │ R  │ R  │    │    │ R  │    │    │
└──────────────────────┴────┴────┴────┴────┴────┴────┴────┴────┘

Chú thích:
C = Create (Tạo mới)
R = Read (Đọc)
U = Update (Cập nhật)
D = Delete (Xóa)
```

### 6.3 Ma trận Use Case - Requirement

```
┌──────────────────────┬────┬────┬────┬────┬────┬────┬────┐
│      Use Case        │FR01│FR02│FR03│NFR1│NFR2│NFR3│NFR4│
├──────────────────────┼────┼────┼────┼────┼────┼────┼────┤
│ UC01: Đăng ký        │ X  │    │    │  X │  X │    │    │
│ UC02: Đăng nhập      │ X  │    │    │  X │  X │    │    │
│ UC14: Đặt hàng       │    │ X  │    │  X │  X │  X │    │
│ UC15: Thanh toán     │    │ X  │    │  X │  X │  X │    │
│ UC20: Bán hàng POS   │    │ X  │    │  X │    │  X │    │
│ UC21: Quản lý bàn    │    │    │ X  │  X │    │  X │    │
│ UC30: Màn hình bếp   │    │    │ X  │  X │    │  X │    │
│ UC60: Chat AI        │    │    │    │  X │    │    │  X │
│ UC73: Xem báo cáo    │    │    │    │  X │    │    │    │
└──────────────────────┴────┴────┴────┴────┴────┴────┴────┘

Chú thích:
FR01 = Quản lý người dùng
FR02 = Quản lý bán hàng
FR03 = Quản lý vận hành
NFR1 = Performance (< 2s response time)
NFR2 = Security (Authentication, Authorization)
NFR3 = Real-time (Socket.io)
NFR4 = AI Integration (Gemini)
```

---

## 7. QUY TẮC NGHIỆP VỤ

### 7.1 Quy tắc về Đơn hàng

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-ORDER-01 | Giá trị đơn hàng tối thiểu | Đơn hàng phải >= 10,000đ |
| BR-ORDER-02 | Phí ship cố định | 30,000đ cho mọi đơn hàng |
| BR-ORDER-03 | Miễn phí ship | Đơn hàng > 200,000đ được miễn phí ship |
| BR-ORDER-04 | Thời gian hủy đơn | Chỉ hủy được khi status = "pending" |
| BR-ORDER-05 | Tự động hủy COD | Hủy sau 24h nếu không xác nhận |
| BR-ORDER-06 | Thời gian xác nhận | Admin phải xác nhận trong 2h |
| BR-ORDER-07 | Giới hạn số lượng | Tối đa 10 sản phẩm/đơn hàng |
| BR-ORDER-08 | Trạng thái đơn hàng | pending → confirmed → shipping → delivered |

### 7.2 Quy tắc về Sản phẩm

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-PROD-01 | Giá sản phẩm | Giá phải > 0 |
| BR-PROD-02 | Tồn kho tối thiểu | Cảnh báo khi stock < lowStockThreshold |
| BR-PROD-03 | Giảm giá | Discount phải từ 0-100% |
| BR-PROD-04 | Hình ảnh | Tối thiểu 1 hình, tối đa 5 hình |
| BR-PROD-05 | Slug unique | Slug phải duy nhất trong hệ thống |
| BR-PROD-06 | Xóa sản phẩm | Không xóa được nếu có trong đơn hàng |

### 7.3 Quy tắc về Khuyến mãi

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-PROMO-01 | Mã khuyến mãi unique | Code phải duy nhất |
| BR-PROMO-02 | Thời gian hiệu lực | startDate < endDate |
| BR-PROMO-03 | Giới hạn sử dụng | usedCount <= usageLimit |
| BR-PROMO-04 | Giá trị đơn tối thiểu | Đơn hàng >= minOrderValue |
| BR-PROMO-05 | Giảm tối đa | Giảm không quá maxDiscount |
| BR-PROMO-06 | Một mã/đơn | Mỗi đơn chỉ dùng 1 mã |
| BR-PROMO-07 | Loại giảm giá | percentage (%) hoặc fixed (đ) |

### 7.4 Quy tắc về Điểm tích lũy

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-POINT-01 | Tích điểm | 1,000đ = 1 điểm |
| BR-POINT-02 | Hạng Bronze | 0 - 999 điểm |
| BR-POINT-03 | Hạng Silver | 1,000 - 4,999 điểm |
| BR-POINT-04 | Hạng Gold | 5,000 - 9,999 điểm |
| BR-POINT-05 | Hạng Platinum | >= 10,000 điểm |
| BR-POINT-06 | Quyền lợi Silver | Giảm 5% mọi đơn hàng |
| BR-POINT-07 | Quyền lợi Gold | Giảm 10% + ưu tiên hỗ trợ |
| BR-POINT-08 | Quyền lợi Platinum | Giảm 15% + miễn phí ship |

### 7.5 Quy tắc về Bàn

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-TABLE-01 | Trạng thái bàn | available, occupied, reserved |
| BR-TABLE-02 | Mở bàn | Chỉ mở được bàn available |
| BR-TABLE-03 | Gọi món | Chỉ gọi món cho bàn occupied |
| BR-TABLE-04 | Thanh toán | Phải thanh toán hết mới đóng bàn |
| BR-TABLE-05 | Tách bàn | Chỉ tách được bàn có >= 2 món |
| BR-TABLE-06 | Gộp bàn | Chỉ gộp được bàn cùng trạng thái |

### 7.6 Quy tắc về Kho

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-INV-01 | Nhập kho | Quantity phải > 0 |
| BR-INV-02 | Xuất kho | Không xuất quá tồn kho |
| BR-INV-03 | Tự động trừ kho | Trừ khi đơn hàng confirmed |
| BR-INV-04 | Hoàn kho | Cộng lại khi đơn hàng cancelled |
| BR-INV-05 | Cảnh báo tồn kho | Thông báo khi < lowStockThreshold |
| BR-INV-06 | Kiểm kê | Phải kiểm kê ít nhất 1 tháng/lần |

### 7.7 Quy tắc về Ca làm việc

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-SHIFT-01 | Thời gian ca | Ca sáng: 6h-14h, Ca chiều: 14h-22h |
| BR-SHIFT-02 | Đăng ký ca | Đăng ký trước ít nhất 1 ngày |
| BR-SHIFT-03 | Đổi ca | Phải có người nhận ca |
| BR-SHIFT-04 | Hủy ca | Hủy trước ít nhất 4 giờ |
| BR-SHIFT-05 | Giới hạn ca | Tối đa 6 ca/tuần/nhân viên |
| BR-SHIFT-06 | Nghỉ giữa ca | Ít nhất 8 giờ giữa 2 ca |

### 7.8 Quy tắc về AI Chatbot

| ID | Quy tắc | Mô tả |
|----|---------|-------|
| BR-CHAT-01 | Session timeout | Đóng session sau 30 phút không hoạt động |
| BR-CHAT-02 | Chuyển nhân viên | Tự động đề xuất sau 3 câu không hiểu |
| BR-CHAT-03 | Lưu lịch sử | Lưu tối đa 50 tin nhắn/session |
| BR-CHAT-04 | Response time | AI phải trả lời trong 3 giây |
| BR-CHAT-05 | Fallback | Nếu AI lỗi, hiển thị "Vui lòng thử lại" |

---

## 8. BIỂU ĐỒ TRẠNG THÁI

### 8.1 Trạng thái Đơn hàng

```
┌─────────────────────────────────────────────────────────────────┐
│                  BIỂU ĐỒ TRẠNG THÁI ĐƠN HÀNG                     │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   [START]    │
                    └──────┬───────┘
                           │
                           │ Khách đặt hàng
                           ▼
                    ┌──────────────┐
              ┌────▶│   PENDING    │◀────┐
              │     │ (Chờ xác nhận)│     │
              │     └──────┬───────┘     │
              │            │              │
              │            │ Admin xác nhận│
              │            ▼              │
              │     ┌──────────────┐     │
              │     │ AWAITING_    │     │
              │     │ PAYMENT      │     │ Hủy đơn
              │     │(Chờ thanh toán)    │
              │     └──────┬───────┘     │
              │            │              │
              │            │ Thanh toán   │
              │            ▼              │
              │     ┌──────────────┐     │
              │     │  CONFIRMED   │     │
              │     │ (Đã xác nhận) │     │
              │     └──────┬───────┘     │
              │            │              │
              │            │ Bắt đầu giao│
              │            ▼              │
              │     ┌──────────────┐     │
              │     │  SHIPPING    │     │
              │     │ (Đang giao)   │     │
              │     └──────┬───────┘     │
              │            │              │
              │            │ Giao thành công
              │            ▼              │
              │     ┌──────────────┐     │
              │     │  DELIVERED   │     │
              │     │ (Đã giao)     │     │
              │     └──────────────┘     │
              │                           │
              │                           │
              │     ┌──────────────┐     │
              └────▶│  CANCELLED   │◀────┘
                    │  (Đã hủy)     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    [END]     │
                    └──────────────┘
```

### 8.2 Trạng thái Bàn

```
┌─────────────────────────────────────────────────────────────────┐
│                  BIỂU ĐỒ TRẠNG THÁI BÀN                          │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
              ┌────▶│  AVAILABLE   │◀────┐
              │     │ (Bàn trống)   │     │
              │     └──────┬───────┘     │
              │            │              │
              │            │ Mở bàn       │
              │            ▼              │
              │     ┌──────────────┐     │
              │     │  OCCUPIED    │     │
              │     │(Đang sử dụng)│     │
              │     └──────┬───────┘     │
              │            │              │
              │            │ Gọi món      │
              │            ▼              │
              │     ┌──────────────┐     │
              │     │  ORDERING    │     │
              │     │ (Đã gọi món)  │     │
              │     └──────┬───────┘     │
              │            │              │
              │            │ Thanh toán   │
              │            ▼              │
              │     ┌──────────────┐     │
              └─────│  PAYING      │     │
                    │(Đang thanh toán)   │
                    └──────┬───────┘     │
                           │              │
                           │ Hoàn tất     │
                           └──────────────┘
```

### 8.3 Trạng thái Món ăn (Kitchen)

```
┌─────────────────────────────────────────────────────────────────┐
│                  BIỂU ĐỒ TRẠNG THÁI MÓN ĂN                       │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   PENDING    │
                    │ (Chờ xử lý)   │
                    └──────┬───────┘
                           │
                           │ Bếp nhận
                           ▼
                    ┌──────────────┐
              ┌────▶│ PREPARING    │
              │     │ (Đang làm)    │
              │     └──────┬───────┘
              │            │
              │            │ Hoàn thành
              │            ▼
              │     ┌──────────────┐
              │     │   READY      │
              │     │  (Sẵn sàng)   │
              │     └──────┬───────┘
              │            │
              │            │ Phục vụ
              │            ▼
              │     ┌──────────────┐
              │     │   SERVED     │
              │     │ (Đã phục vụ)  │
              │     └──────────────┘
              │
              │     ┌──────────────┐
              └────▶│  CANCELLED   │
                    │   (Đã hủy)    │
                    └──────────────┘
```

---

## 9. TỔNG KẾT PHÂN TÍCH NGHIỆP VỤ

### 9.1 Các nghiệp vụ chính

1. **Bán hàng đa kênh**: Online (E-commerce) + Offline (POS + Tables)
2. **Quản lý vận hành**: Bếp, Kho, Nhân viên, Ca làm việc
3. **Hỗ trợ khách hàng**: AI Chatbot + Chat trực tiếp
4. **Phân tích dữ liệu**: Báo cáo doanh thu, sản phẩm, khách hàng

### 9.2 Điểm mạnh của hệ thống

✅ **Real-time**: Socket.io cho cập nhật tức thời  
✅ **AI Integration**: Chatbot thông minh với Gemini  
✅ **Đa kênh**: Hỗ trợ nhiều hình thức bán hàng  
✅ **Tự động hóa**: Tự động trừ kho, tính điểm, gửi thông báo  
✅ **Quản lý toàn diện**: Từ sản phẩm đến nhân viên  

### 9.3 Các quy trình được tối ưu

1. **Quy trình đặt hàng**: Nhanh chóng, ít bước
2. **Quy trình bán hàng**: POS đơn giản, dễ sử dụng
3. **Quy trình quản lý bàn**: Trực quan, real-time
4. **Quy trình hỗ trợ**: AI trả lời tức thì

---

**Ngày tạo**: 26/01/2026  
**Phiên bản**: 1.0.0  
**Tác giả**: NHH-Coffee Development Team  
**Người phê duyệt**: [Tên giảng viên hướng dẫn]
