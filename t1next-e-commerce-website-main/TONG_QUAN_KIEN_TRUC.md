# TỔNG QUAN KIẾN TRÚC HỆ THỐNG NHH-COFFEE

Hệ thống NHH-Coffee được thiết kế theo mô hình kiến trúc 3 lớp (Three-tier Architecture), trong đó mỗi lớp đảm nhận một vai trò riêng biệt và giao tiếp với nhau thông qua các giao diện chuẩn. Kiến trúc này tuân theo nguyên tắc phân tách trách nhiệm (Separation of Concerns), giúp hệ thống dễ dàng bảo trì, mở rộng và nâng cấp.

## Lớp Client (Client Layer)

Lớp Client là tầng giao diện người dùng, được xây dựng bằng công nghệ web hiện đại Next.js và React. Lớp này đóng vai trò là cầu nối giữa người dùng cuối và hệ thống backend, cung cấp giao diện trực quan và dễ sử dụng cho cả khách hàng lẫn nhân viên quản lý.

Người dùng tương tác với hệ thống thông qua trình duyệt web (Web Browser), nơi họ có thể thực hiện các thao tác như xem sản phẩm, thêm vào giỏ hàng, đặt hàng, thanh toán và chat với nhân viên hỗ trợ. Đối với nhân viên, lớp này cung cấp các trang quản trị để quản lý sản phẩm, đơn hàng, kho hàng và xem báo cáo thống kê.

Lớp Client giao tiếp với lớp Controller thông qua hai phương thức chính: REST API cho các thao tác CRUD thông thường và WebSocket (Socket.IO) cho các tính năng real-time như chat và thông báo. Dữ liệu được trao đổi dưới dạng JSON, đảm bảo tính nhất quán và dễ dàng xử lý.

## Lớp Controller (Controller Layer)

Lớp Controller là tầng xử lý nghiệp vụ, được xây dựng bằng Express.js và TypeScript. Đây là lớp trung gian đóng vai trò điều phối giữa lớp Client và lớp Data Access, chịu trách nhiệm xử lý các yêu cầu từ người dùng, thực thi logic nghiệp vụ và trả về kết quả.

Lớp này bao gồm nhiều Handler (bộ xử lý) chuyên biệt, mỗi Handler đảm nhận một nhóm chức năng cụ thể. Auth Handler xử lý các vấn đề liên quan đến xác thực và phân quyền người dùng. Product Handler quản lý toàn bộ thông tin sản phẩm từ tạo mới, cập nhật đến xóa và tìm kiếm. Order Handler điều phối quy trình đặt hàng từ khâu tạo đơn, xử lý thanh toán đến cập nhật trạng thái giao hàng.

Bên cạnh các Handler chính, lớp Controller còn tích hợp một Service Layer chứa các service chuyên biệt xử lý các tác vụ phức tạp. Auth Service đảm nhận việc mã hóa mật khẩu, tạo và xác thực JWT token. Email Service gửi các email thông báo như xác nhận đăng ký, xác nhận đơn hàng. Chatbot Service tích hợp AI Gemini để cung cấp tính năng chatbot tự động hỗ trợ khách hàng. Cache Service sử dụng Redis để lưu cache, giảm tải cho database và tăng tốc độ phản hồi.

Lớp Controller cũng triển khai các middleware quan trọng để đảm bảo bảo mật và hiệu năng hệ thống. Middleware authentication kiểm tra JWT token để xác thực người dùng. Middleware authorization kiểm tra quyền truy cập dựa trên vai trò (role-based access control). Middleware validation đảm bảo dữ liệu đầu vào hợp lệ trước khi xử lý. Middleware rate limiting giới hạn số lượng request từ một IP để phòng chống tấn công DDoS.

## Lớp Data Access (Data Access Layer)

Lớp Data Access là tầng quản lý dữ liệu, sử dụng Prisma ORM để tương tác với cơ sở dữ liệu PostgreSQL. Lớp này đóng vai trò trừu tượng hóa các thao tác database, cung cấp interface đơn giản và type-safe cho các lớp phía trên.

Lớp này định nghĩa các Model đại diện cho các bảng trong database. User Model lưu trữ thông tin người dùng bao gồm thông tin cá nhân, vai trò, điểm tích lũy và cấp độ thành viên. Product Model quản lý thông tin sản phẩm như tên, giá, số lượng tồn kho, hình ảnh và đánh giá. Order Model lưu trữ thông tin đơn hàng bao gồm mã đơn, trạng thái, tổng tiền và thông tin giao hàng. Các Model khác như Category, CartItem, Review, Promotion, ChatSession đều được thiết kế với các quan hệ rõ ràng để đảm bảo tính toàn vẹn dữ liệu.

Prisma ORM cung cấp nhiều tính năng mạnh mẽ cho lớp này. Type-safe queries đảm bảo các truy vấn được kiểm tra kiểu dữ liệu ngay tại thời điểm compile. Auto-generated types tự động tạo TypeScript types từ database schema. Migration system quản lý các thay đổi cấu trúc database một cách có hệ thống. Transaction support đảm bảo tính nhất quán dữ liệu khi thực hiện nhiều thao tác liên quan.

Lớp Data Access giao tiếp với PostgreSQL database thông qua các câu lệnh SQL được Prisma tự động tạo ra. Tất cả các query đều được parameterized để phòng chống SQL injection. Database được tối ưu hóa với các index trên các trường thường xuyên truy vấn, đảm bảo hiệu năng cao ngay cả khi dữ liệu lớn.

## Luồng xử lý trong hệ thống

Khi người dùng thực hiện một thao tác trên hệ thống, dữ liệu sẽ đi qua các lớp theo một luồng xử lý có tổ chức. Đối với thao tác đọc dữ liệu như xem danh sách sản phẩm, request từ Client Layer được gửi đến Controller Layer, nơi Handler tương ứng nhận và xử lý request. Handler sau đó gọi Service Layer nếu cần xử lý logic phức tạp, rồi gọi Data Access Layer để truy vấn database. Kết quả từ database được trả về qua các lớp theo chiều ngược lại và cuối cùng hiển thị trên giao diện người dùng.

Đối với thao tác ghi dữ liệu như tạo đơn hàng, luồng xử lý phức tạp hơn. Request được validate ở nhiều mức, từ Client validation đến Server validation. Controller Layer khởi tạo transaction để đảm bảo tính toàn vẹn dữ liệu. Nhiều thao tác database được thực hiện trong cùng một transaction như tạo đơn hàng, tạo chi tiết đơn hàng, cập nhật tồn kho. Nếu có lỗi xảy ra, transaction sẽ rollback để đảm bảo dữ liệu không bị inconsistent. Sau khi hoàn tất, các service phụ trợ như Email Service được gọi để gửi thông báo.

Đối với các tính năng real-time như chat, hệ thống sử dụng WebSocket để duy trì kết nối liên tục giữa Client và Server. Khi có sự kiện mới như tin nhắn chat hoặc cập nhật đơn hàng, Server chủ động push thông báo đến tất cả các Client đang kết nối mà không cần Client phải polling. Điều này giúp giảm tải cho server và cải thiện trải nghiệm người dùng.

## Ưu điểm của kiến trúc

Kiến trúc 3 lớp mang lại nhiều lợi ích cho hệ thống NHH-Coffee. Về mặt bảo trì, việc phân tách rõ ràng giữa các lớp giúp developer dễ dàng tìm và sửa lỗi mà không ảnh hưởng đến các phần khác của hệ thống. Khi cần thay đổi giao diện, chỉ cần sửa đổi Client Layer. Khi cần thay đổi logic nghiệp vụ, chỉ cần sửa Controller Layer. Khi cần thay đổi cấu trúc database, chỉ cần sửa Data Access Layer.

Về khả năng mở rộng, kiến trúc này cho phép scale từng lớp độc lập. Client Layer có thể scale bằng CDN để phục vụ static assets. Controller Layer có thể scale horizontal bằng cách thêm nhiều server instance và sử dụng load balancer. Data Access Layer có thể scale bằng database replication và sharding. Mỗi lớp có thể được tối ưu hóa riêng biệt mà không ảnh hưởng đến các lớp khác.

Về bảo mật, kiến trúc nhiều lớp cung cấp nhiều điểm kiểm soát. Client Layer validate dữ liệu đầu vào từ người dùng. Controller Layer kiểm tra authentication và authorization. Data Access Layer sử dụng parameterized queries để phòng chống SQL injection. Mỗi lớp đều có cơ chế bảo vệ riêng, tạo thành nhiều lớp phòng thủ (defense in depth).

Về hiệu năng, hệ thống triển khai caching ở nhiều mức. Client Layer cache static assets và API responses. Controller Layer sử dụng Redis cache cho dữ liệu thường xuyên truy cập. Data Access Layer tận dụng database query cache và connection pooling. Điều này giúp giảm thiểu số lượng truy vấn database và cải thiện thời gian phản hồi.

## Kết luận

Kiến trúc 3 lớp của hệ thống NHH-Coffee được thiết kế với sự cân nhắc kỹ lưỡng về tính module hóa, khả năng mở rộng, bảo mật và hiệu năng. Mỗi lớp đảm nhận một trách nhiệm rõ ràng và giao tiếp với nhau thông qua các interface chuẩn. Kiến trúc này không chỉ đáp ứng được yêu cầu hiện tại mà còn dễ dàng mở rộng để đáp ứng nhu cầu tương lai khi hệ thống phát triển.
