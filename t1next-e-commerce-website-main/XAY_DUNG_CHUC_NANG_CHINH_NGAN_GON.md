# XÂY DỰNG CÁC CHỨC NĂNG CHÍNH

## Giới thiệu

Hệ thống NHH-Coffee được xây dựng với hơn 30 modules chức năng, tuân theo kiến trúc 3 lớp BCE (Boundary-Control-Entity). Các chức năng được phát triển theo phương pháp Agile, ưu tiên tính năng cốt lõi trước rồi mở rộng dần.

## 1. Xác thực và Phân quyền

Module xác thực là nền tảng bảo mật với bốn vai trò: khách hàng, admin, nhân viên bán hàng và nhân viên kho. Đăng ký tài khoản sử dụng xác thực OTP qua email với mã 6 chữ số có hiệu lực 10 phút. Đăng nhập sử dụng JWT token với thời hạn 7 ngày, mật khẩu được hash bằng bcrypt. Quên mật khẩu cũng dùng cơ chế OTP tương tự. Phân quyền được thực hiện qua middleware kiểm tra role trước khi cho phép truy cập các chức năng.

## 2. Quản lý Sản phẩm

Module sản phẩm cung cấp CRUD đầy đủ với thông tin phong phú bao gồm tên, giá, hình ảnh, danh mục, thương hiệu, thông số kỹ thuật và tồn kho. Hỗ trợ tìm kiếm full-text, lọc theo danh mục/giá/thương hiệu, sắp xếp và phân trang. Slug được tự động tạo từ tên để URL thân thiện SEO. Hình ảnh upload lên server hoặc Cloudinary, thông số kỹ thuật lưu dạng JSON để linh hoạt.

## 3. Giỏ hàng và Đặt hàng

Giỏ hàng lưu trong database để đồng bộ giữa các thiết bị. Hỗ trợ thêm, xóa, cập nhật số lượng với kiểm tra tồn kho. Quy trình checkout thực hiện trong transaction bao gồm kiểm tra tồn kho, validate khuyến mãi, tính tổng tiền, tạo đơn hàng, trừ kho, xóa giỏ hàng và gửi thông báo. Đơn hàng có các trạng thái từ pending đến delivered, mỗi lần chuyển trạng thái đều thông báo cho khách hàng.

## 4. Đánh giá và Khuyến mãi

Khách hàng đánh giá sản phẩm đã mua với rating 1-5 sao, bình luận và hình ảnh. Hệ thống tự động tính rating trung bình sau mỗi đánh giá mới. Module khuyến mãi hỗ trợ giảm giá theo phần trăm hoặc cố định, với điều kiện giá trị đơn hàng tối thiểu, số lượt dùng và thời gian hiệu lực. Mã khuyến mãi được validate kỹ trong checkout trước khi áp dụng.


## 5. Quản lý Kho

Module kho theo dõi tồn kho và lịch sử giao dịch nhập xuất điều chỉnh. Mỗi giao dịch lưu số lượng trước/sau và lý do để audit. Cảnh báo tồn kho thấp chạy tự động mỗi giờ, so sánh stock với threshold và gửi thông báo cho admin. Hỗ trợ nhập kho từ nhà cung cấp, xuất kho thủ công và điều chỉnh khi kiểm kê.

## 6. Báo cáo và Thống kê

Hệ thống tạo báo cáo real-time từ database bao gồm doanh thu theo thời gian, sản phẩm bán chạy, doanh thu theo danh mục, trạng thái đơn hàng và phân tích khách hàng. Hỗ trợ xuất báo cáo Excel với format đẹp. Dữ liệu được tính toán bằng SQL với group by và aggregate functions, kết quả phù hợp để vẽ biểu đồ.

## 7. Chat và Chatbot AI

Chat real-time sử dụng WebSocket cho giao tiếp giữa khách hàng và nhân viên. Mỗi chat session có trạng thái waiting, active hoặc closed. Tin nhắn được lưu database và emit qua Socket.IO để cập nhật ngay lập tức. Chatbot AI tích hợp Google Gemini với knowledge base có thể quản lý. Chatbot tìm kiếm trong knowledge base trước, nếu không tìm thấy mới gọi Gemini API. Hỗ trợ chuyển sang chat với nhân viên khi cần.

## 8. Thông báo

Hệ thống hỗ trợ ba kênh thông báo: in-app notification lưu trong database với badge số lượng chưa đọc, email notification qua Nodemailer với template HTML, và push notification qua Web Push API. Notification service tập trung xử lý việc gửi thông báo qua cả ba kênh cho các sự kiện như đơn hàng mới, thay đổi trạng thái, khuyến mãi.

## 9. Điểm thưởng và Hạng thành viên

Khách hàng tích điểm từ đơn hàng delivered, mỗi 10,000 VND được 1 điểm. Lịch sử điểm được lưu để theo dõi. Hệ thống có ba hạng Bronze, Silver, Gold dựa trên tổng chi tiêu, mỗi hạng có ưu đãi khác nhau. Tự động nâng hạng khi đạt điều kiện và gửi thông báo chúc mừng.


## 10. Quản lý Bàn và Pha chế

Module quản lý bàn phục vụ mô hình quán cà phê với các khu vực và bàn có trạng thái available, occupied, reserved. Nhân viên tạo đơn tại chỗ, thêm món, bếp xem danh sách món cần làm và cập nhật trạng thái preparing/ready. WebSocket đảm bảo cập nhật real-time cho tất cả màn hình. Thanh toán tại quầy với các phương thức COD, chuyển khoản hoặc ví điện tử.

## 11. Ca làm việc

Admin phân công nhân viên vào các ca sáng/chiều/tối với lịch tuần hiển thị dạng bảng. Nhân viên check-in/check-out qua API, hệ thống ghi nhận thời gian thực tế và đánh dấu late nếu muộn. Hỗ trợ yêu cầu đổi ca giữa nhân viên với quy trình gửi request, đồng nghiệp phản hồi và admin phê duyệt.

## 12. Thanh toán và Vận chuyển

Hỗ trợ COD, chuyển khoản ngân hàng và ví điện tử (MoMo, ZaloPay, VNPay). Tích hợp qua API của payment gateway với verify signature để bảo mật. Vận chuyển tích hợp với GHN, GHTK, VNPost để tính phí và tracking. Webhook từ đơn vị vận chuyển cập nhật trạng thái tự động. Hỗ trợ miễn phí ship theo điều kiện.

## 13. Các chức năng bổ trợ

Wishlist cho phép lưu sản phẩm yêu thích và nhận thông báo khi giảm giá. Upload hỗ trợ local storage và Cloudinary với validate file type/size. Địa chỉ cho phép lưu nhiều địa chỉ giao hàng với địa chỉ mặc định. Hóa đơn tự động tạo khi giao hàng thành công, hỗ trợ xuất PDF và in nhiệt. Cài đặt hệ thống lưu trong database/JSON với cache Redis. Backup tự động database và files theo lịch với cleanup backup cũ.

## Kết luận

Hệ thống được xây dựng với kiến trúc module hóa cao, mỗi chức năng độc lập nhưng tích hợp chặt chẽ. Tuân thủ best practices về validation, error handling, transaction, logging và caching. Bảo mật được đặt lên hàng đầu với JWT, role-based authorization, input sanitization và rate limiting. Trải nghiệm người dùng được cải thiện với real-time updates, responsive design và thông báo rõ ràng. Hệ thống sẵn sàng đáp ứng nhu cầu kinh doanh từ bán hàng online đến quản lý quán cà phê tại chỗ.
