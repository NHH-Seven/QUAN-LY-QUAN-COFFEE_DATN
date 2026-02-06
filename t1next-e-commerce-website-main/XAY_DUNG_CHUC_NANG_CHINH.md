# XÂY DỰNG CÁC CHỨC NĂNG CHÍNH

## Giới thiệu

Hệ thống NHH-Coffee được xây dựng với hơn 30 modules chức năng, mỗi module được thiết kế để đáp ứng một nhóm nghiệp vụ cụ thể. Quá trình xây dựng tuân theo kiến trúc 3 lớp với sự phân tách rõ ràng giữa Boundary (giao diện), Control (xử lý nghiệp vụ) và Entity (dữ liệu). Các chức năng được phát triển theo phương pháp Agile, ưu tiên các tính năng cốt lõi trước, sau đó mở rộng dần các tính năng nâng cao.

## 1. Module Xác thực và Phân quyền

Module xác thực là nền tảng bảo mật của toàn bộ hệ thống, đảm bảo chỉ những người dùng hợp lệ mới có thể truy cập và thực hiện các thao tác phù hợp với vai trò của họ. Hệ thống hỗ trợ bốn vai trò chính là khách hàng (user), quản trị viên (admin), nhân viên bán hàng (sales) và nhân viên kho (warehouse).

Quy trình đăng ký tài khoản được thiết kế với cơ chế xác thực hai bước để đảm bảo email người dùng là thật. Khi người dùng điền thông tin đăng ký bao gồm email, mật khẩu và họ tên, hệ thống sẽ kiểm tra email đã tồn tại hay chưa. Nếu email hợp lệ, một mã OTP gồm 6 chữ số được tạo ngẫu nhiên và gửi đến email của người dùng. Thông tin đăng ký tạm thời được lưu vào bảng pending_registrations cùng với mã OTP đã được hash bằng bcrypt. Mã OTP có thời hạn 10 phút và người dùng được phép thử tối đa 5 lần. Sau khi nhập đúng mã OTP, tài khoản chính thức được tạo trong bảng users với mật khẩu đã được hash, và bản ghi tạm thời bị xóa.


Quy trình đăng nhập sử dụng JWT (JSON Web Token) để quản lý phiên làm việc. Người dùng cung cấp email và mật khẩu, hệ thống kiểm tra thông tin trong database bằng cách so sánh mật khẩu đã hash với bcrypt. Nếu thông tin đúng, server tạo một JWT token chứa userId, email và role với thời hạn 7 ngày. Token này được gửi về client và lưu trong localStorage hoặc cookie. Mỗi request sau đó đều gửi kèm token trong header Authorization với format "Bearer [token]". Middleware authentication ở server sẽ verify token, giải mã để lấy thông tin user và gắn vào request object để các handler sử dụng.

Chức năng quên mật khẩu cũng sử dụng cơ chế OTP tương tự đăng ký. Người dùng nhập email, hệ thống kiểm tra email có tồn tại không, sau đó gửi mã OTP và lưu vào bảng password_resets. Sau khi xác thực OTP thành công, người dùng được phép đặt mật khẩu mới. Mật khẩu mới được hash và cập nhật vào database, đồng thời bản ghi trong password_resets bị xóa.

Middleware phân quyền được triển khai ở nhiều cấp độ. Middleware authMiddleware kiểm tra user đã đăng nhập hay chưa, áp dụng cho tất cả các route cần authentication. Middleware adminMiddleware kiểm tra role phải là admin, dùng cho các chức năng quản trị như quản lý sản phẩm, danh mục, khuyến mãi. Middleware staffMiddleware cho phép cả admin, sales và warehouse truy cập, dùng cho các chức năng nhân viên như xử lý đơn hàng, quản lý kho. Middleware warehouseMiddleware chỉ cho phép admin và warehouse, dùng riêng cho các chức năng quản lý kho hàng.

## 2. Module Quản lý Sản phẩm

Module quản lý sản phẩm là trung tâm của hệ thống thương mại điện tử, cung cấp đầy đủ các chức năng từ hiển thị, tìm kiếm đến quản lý thông tin sản phẩm. Mỗi sản phẩm trong hệ thống chứa thông tin phong phú bao gồm tên, slug, mô tả, giá, giá gốc, hình ảnh, danh mục, thương hiệu, thông số kỹ thuật, số lượng tồn kho, đánh giá và số lượt đánh giá.


Chức năng hiển thị danh sách sản phẩm hỗ trợ nhiều tùy chọn lọc và sắp xếp. API GET /api/products nhận các query parameters như category để lọc theo danh mục, search để tìm kiếm theo tên, minPrice và maxPrice để lọc theo khoảng giá, brand để lọc theo thương hiệu, sort để sắp xếp theo giá hoặc đánh giá, page và limit để phân trang. Hệ thống sử dụng Prisma ORM để xây dựng query động dựa trên các tham số này. Kết quả trả về bao gồm danh sách sản phẩm, tổng số sản phẩm, số trang và thông tin phân trang.

Trang chi tiết sản phẩm được truy cập qua slug thay vì id để URL thân thiện với SEO. API GET /api/products/:slug trả về đầy đủ thông tin sản phẩm bao gồm cả thông tin danh mục, danh sách đánh giá với phân trang, và các sản phẩm liên quan cùng danh mục. Hệ thống cũng tự động cập nhật lượt xem sản phẩm để phục vụ cho tính năng sản phẩm đã xem gần đây.

Chức năng quản lý sản phẩm dành cho admin cho phép tạo mới, cập nhật và xóa sản phẩm. Khi tạo sản phẩm mới, admin điền đầy đủ thông tin và upload hình ảnh. Hệ thống tự động tạo slug từ tên sản phẩm, đảm bảo slug là duy nhất bằng cách thêm số thứ tự nếu trùng. Hình ảnh được upload lên server hoặc cloud storage như Cloudinary, URL được lưu vào database dưới dạng mảng. Thông số kỹ thuật được lưu dưới dạng JSON để linh hoạt với các loại sản phẩm khác nhau.

Chức năng tìm kiếm sản phẩm sử dụng full-text search trên các trường name, description và brand. API GET /api/products/search nhận query parameter q chứa từ khóa tìm kiếm. Hệ thống sử dụng ILIKE trong PostgreSQL để tìm kiếm không phân biệt hoa thường. Kết quả được sắp xếp theo độ liên quan, ưu tiên các sản phẩm có từ khóa xuất hiện trong tên. Tính năng autocomplete cũng được hỗ trợ để gợi ý sản phẩm khi người dùng đang gõ.

## 3. Module Giỏ hàng

Module giỏ hàng quản lý các sản phẩm mà khách hàng dự định mua, cho phép thêm, xóa, cập nhật số lượng và xem tổng giá trị. Giỏ hàng được lưu trữ trong database thay vì localStorage để đồng bộ giữa các thiết bị và tránh mất dữ liệu khi xóa cache trình duyệt.


Khi người dùng thêm sản phẩm vào giỏ hàng, API POST /api/cart nhận productId và quantity. Hệ thống kiểm tra sản phẩm có tồn tại không, số lượng có đủ trong kho không. Nếu sản phẩm đã có trong giỏ hàng, hệ thống cộng thêm số lượng thay vì tạo mục mới. Mỗi user chỉ có một giỏ hàng duy nhất, được định danh bằng userId. Bảng cart_items có unique constraint trên cặp userId và productId để đảm bảo không trùng lặp.

Chức năng xem giỏ hàng API GET /api/cart trả về danh sách các mục trong giỏ kèm theo thông tin chi tiết sản phẩm như tên, giá, hình ảnh, số lượng tồn kho. Hệ thống tính tổng giá trị giỏ hàng bằng cách nhân giá với số lượng của từng mục rồi cộng lại. Nếu có sản phẩm hết hàng hoặc không đủ số lượng, hệ thống hiển thị cảnh báo để người dùng biết.

Cập nhật số lượng sản phẩm trong giỏ hàng sử dụng API PUT /api/cart/:productId với body chứa quantity mới. Hệ thống kiểm tra số lượng mới có hợp lệ không, có đủ hàng trong kho không, sau đó cập nhật vào database. Nếu quantity là 0 hoặc âm, hệ thống tự động xóa mục đó khỏi giỏ hàng.

Xóa sản phẩm khỏi giỏ hàng sử dụng API DELETE /api/cart/:productId. Hệ thống xóa bản ghi tương ứng trong bảng cart_items. Chức năng xóa toàn bộ giỏ hàng API DELETE /api/cart xóa tất cả các mục của user, thường được gọi sau khi đặt hàng thành công.

## 4. Module Đặt hàng

Module đặt hàng xử lý toàn bộ quy trình từ khi khách hàng checkout đến khi đơn hàng được giao thành công. Đơn hàng trong hệ thống có nhiều trạng thái bao gồm pending (chờ xử lý), awaiting_payment (chờ thanh toán), confirmed (đã xác nhận), shipping (đang giao), delivered (đã giao) và cancelled (đã hủy).

Quy trình tạo đơn hàng bắt đầu từ trang checkout. Khách hàng điền thông tin giao hàng bao gồm tên người nhận, số điện thoại, địa chỉ, chọn phương thức thanh toán và có thể nhập mã khuyến mãi. API POST /api/checkout/create nhận các thông tin này cùng với danh sách sản phẩm từ giỏ hàng.


Hệ thống thực hiện một loạt các bước xử lý trong một transaction để đảm bảo tính toàn vẹn dữ liệu. Đầu tiên, kiểm tra tất cả sản phẩm trong giỏ hàng có đủ số lượng trong kho không. Nếu có mã khuyến mãi, kiểm tra mã có hợp lệ không, còn hạn sử dụng không, đã hết lượt dùng chưa, giá trị đơn hàng có đạt yêu cầu tối thiểu không. Tính toán tổng tiền bao gồm subtotal (tổng giá sản phẩm), discount (giảm giá từ khuyến mãi), shipping fee (phí vận chuyển) và total (tổng cộng).

Sau khi tính toán xong, hệ thống tạo bản ghi trong bảng orders với trạng thái pending hoặc awaiting_payment tùy phương thức thanh toán. Tạo các bản ghi trong bảng order_items cho từng sản phẩm, lưu lại giá tại thời điểm đặt hàng để tránh thay đổi khi giá sản phẩm cập nhật sau này. Trừ số lượng tồn kho của các sản phẩm và tạo các bản ghi stock_transactions với type là order để theo dõi lịch sử xuất kho. Nếu có dùng mã khuyến mãi, tạo bản ghi trong promotion_usage và tăng used_count của promotion. Xóa các mục trong giỏ hàng sau khi tạo đơn thành công.

Nếu bất kỳ bước nào thất bại, toàn bộ transaction được rollback để đảm bảo dữ liệu không bị inconsistent. Sau khi tạo đơn thành công, hệ thống gửi email xác nhận đơn hàng cho khách hàng, tạo thông báo trong hệ thống và gửi push notification nếu khách hàng đã đăng ký.

Quản lý đơn hàng cho phép admin và nhân viên xem danh sách đơn hàng với các bộ lọc theo trạng thái, ngày tạo, khách hàng. API GET /api/orders hỗ trợ phân trang và sắp xếp. Chi tiết đơn hàng API GET /api/orders/:id hiển thị đầy đủ thông tin bao gồm danh sách sản phẩm, thông tin khách hàng, lịch sử thay đổi trạng thái.

Cập nhật trạng thái đơn hàng API PUT /api/orders/:id/status cho phép nhân viên chuyển đơn hàng qua các trạng thái tiếp theo. Hệ thống kiểm tra trạng thái mới có hợp lệ không, ví dụ không thể chuyển từ delivered về pending. Mỗi lần thay đổi trạng thái, hệ thống gửi thông báo cho khách hàng qua email và push notification. Khi đơn hàng chuyển sang delivered, hệ thống tự động cộng điểm thưởng cho khách hàng dựa trên giá trị đơn hàng.


Chức năng hủy đơn hàng cho phép khách hàng hủy đơn khi còn ở trạng thái pending hoặc awaiting_payment. API POST /api/orders/:id/cancel thực hiện hoàn trả số lượng sản phẩm về kho, tạo stock_transactions với type là return, hoàn lại lượt sử dụng khuyến mãi nếu có. Nếu đơn hàng đã thanh toán, hệ thống tạo yêu cầu hoàn tiền và thông báo cho admin xử lý.

## 5. Module Đánh giá và Hỏi đáp

Module đánh giá cho phép khách hàng chia sẻ trải nghiệm về sản phẩm đã mua, giúp khách hàng khác có thêm thông tin để quyết định mua hàng. Mỗi đánh giá bao gồm rating từ 1 đến 5 sao, nội dung bình luận và có thể kèm theo hình ảnh.

Chức năng tạo đánh giá API POST /api/reviews yêu cầu người dùng phải đã mua sản phẩm đó. Hệ thống kiểm tra trong bảng orders và order_items xem user có đơn hàng nào chứa sản phẩm này với trạng thái delivered không. Nếu hợp lệ, tạo bản ghi trong bảng reviews. Nếu có upload hình ảnh, lưu vào bảng review_images với foreign key tới review. Sau khi tạo đánh giá, hệ thống tự động tính lại rating trung bình và tổng số đánh giá của sản phẩm bằng cách query tất cả reviews của sản phẩm đó, tính trung bình rating và cập nhật vào bảng products.

Hiển thị đánh giá API GET /api/reviews/:productId trả về danh sách đánh giá của sản phẩm với phân trang, sắp xếp theo thời gian mới nhất. Mỗi đánh giá kèm theo thông tin người đánh giá như tên, avatar và danh sách hình ảnh nếu có. Hệ thống cũng cung cấp thống kê phân bố rating, ví dụ có bao nhiêu đánh giá 5 sao, 4 sao, để khách hàng có cái nhìn tổng quan.

Module hỏi đáp cho phép khách hàng đặt câu hỏi về sản phẩm và nhân viên hoặc admin trả lời. API POST /api/qa tạo câu hỏi mới trong bảng product_questions với trạng thái chưa trả lời. Nhân viên xem danh sách câu hỏi chưa trả lời qua API GET /api/qa/unanswered, chọn câu hỏi và trả lời qua API PUT /api/qa/:id/answer. Hệ thống lưu lại người trả lời và thời gian trả lời, gửi thông báo cho người hỏi. Câu hỏi và câu trả lời được hiển thị trên trang chi tiết sản phẩm để khách hàng khác cũng có thể xem.


## 6. Module Khuyến mãi

Module khuyến mãi cung cấp các công cụ marketing mạnh mẽ để thu hút và giữ chân khách hàng. Hệ thống hỗ trợ hai loại khuyến mãi chính là giảm giá theo phần trăm (percentage) và giảm giá cố định (fixed).

Tạo chương trình khuyến mãi API POST /api/promotions cho phép admin thiết lập các thông số như mã code duy nhất, tên chương trình, loại giảm giá, giá trị giảm (phần trăm hoặc số tiền), giá trị đơn hàng tối thiểu để áp dụng, giảm giá tối đa (cho loại phần trăm), số lượt sử dụng tối đa, thời gian bắt đầu và kết thúc. Hệ thống validate các thông số này, đảm bảo code không trùng, thời gian hợp lệ, giá trị giảm hợp lý.

Áp dụng mã khuyến mãi trong quá trình checkout, API POST /api/promotions/validate nhận mã code và giá trị đơn hàng. Hệ thống kiểm tra mã có tồn tại không, có đang active không, có trong thời gian hiệu lực không, đã hết lượt dùng chưa, giá trị đơn hàng có đạt yêu cầu tối thiểu không. Nếu tất cả điều kiện thỏa mãn, tính toán số tiền được giảm. Với loại percentage, số tiền giảm bằng giá trị đơn hàng nhân với phần trăm, nhưng không vượt quá max_discount nếu có. Với loại fixed, số tiền giảm là giá trị cố định nhưng không vượt quá tổng đơn hàng.

Quản lý khuyến mãi cho phép admin xem danh sách các chương trình đang chạy, sắp diễn ra và đã kết thúc. API GET /api/promotions hỗ trợ lọc theo trạng thái và thời gian. Chi tiết khuyến mãi hiển thị thống kê số lượt đã sử dụng, tổng số tiền đã giảm, danh sách đơn hàng đã áp dụng. Admin có thể tạm dừng chương trình bằng cách set is_active thành false, hoặc xóa chương trình nếu chưa có đơn hàng nào sử dụng.

## 7. Module Quản lý Kho

Module quản lý kho theo dõi số lượng tồn kho của từng sản phẩm và lịch sử các giao dịch nhập xuất. Mỗi sản phẩm có trường stock lưu số lượng hiện tại và low_stock_threshold để cảnh báo khi sắp hết hàng.


Nhập kho API POST /api/warehouse/import cho phép nhân viên kho nhập hàng mới về. Request body chứa danh sách sản phẩm với productId và quantity. Hệ thống thực hiện trong transaction, với mỗi sản phẩm tăng số lượng stock, tạo bản ghi stock_transaction với type là import, lưu lại stock_before và stock_after để audit. Có thể thêm trường reason để ghi chú lý do nhập kho như "Nhập hàng từ nhà cung cấp" hoặc "Hoàn trả từ khách hàng".

Xuất kho thủ công API POST /api/warehouse/export dùng khi cần xuất hàng không qua đơn hàng, ví dụ xuất hàng mẫu, xuất hủy. Tương tự nhập kho nhưng trừ số lượng stock và type là export. Hệ thống kiểm tra số lượng tồn kho có đủ không trước khi xuất.

Điều chỉnh tồn kho API POST /api/warehouse/adjust dùng khi cần sửa số lượng do kiểm kê phát hiện sai lệch. Nhân viên nhập số lượng thực tế, hệ thống tính chênh lệch và cập nhật stock, tạo stock_transaction với type là adjust. Lý do điều chỉnh phải được ghi rõ để audit sau này.

Cảnh báo tồn kho thấp được thực hiện tự động. Hệ thống có một cron job chạy mỗi giờ, query tất cả sản phẩm có stock nhỏ hơn hoặc bằng low_stock_threshold. Với mỗi sản phẩm như vậy, tạo thông báo cho admin và nhân viên kho. API GET /api/stock-alerts trả về danh sách sản phẩm sắp hết hàng với các thông tin như tên sản phẩm, số lượng hiện tại, ngưỡng cảnh báo, số lượng đã bán trong 30 ngày qua để ước tính thời gian hết hàng.

Lịch sử giao dịch kho API GET /api/warehouse/transactions hiển thị tất cả các giao dịch nhập xuất điều chỉnh với phân trang và lọc theo loại giao dịch, sản phẩm, thời gian. Mỗi giao dịch hiển thị người thực hiện, thời gian, số lượng trước và sau, lý do. Dữ liệu này quan trọng cho việc audit và phát hiện sai sót.

## 8. Module Báo cáo và Thống kê

Module báo cáo cung cấp các số liệu quan trọng giúp quản lý đưa ra quyết định kinh doanh. Hệ thống tạo báo cáo theo thời gian thực từ dữ liệu trong database, không cần lưu trữ báo cáo trước.


Báo cáo doanh thu API GET /api/reports/revenue nhận tham số start_date và end_date, trả về doanh thu theo ngày trong khoảng thời gian đó. Hệ thống query bảng orders, lọc theo created_at và status là delivered, group by ngày và sum total. Kết quả được format thành mảng các điểm dữ liệu với date và revenue, phù hợp để vẽ biểu đồ đường. Báo cáo cũng tính tổng doanh thu, số đơn hàng, giá trị đơn hàng trung bình trong khoảng thời gian.

Báo cáo sản phẩm bán chạy API GET /api/reports/top-products trả về danh sách sản phẩm có doanh số cao nhất. Hệ thống join bảng order_items với orders, lọc đơn hàng delivered trong khoảng thời gian, group by product_id, tính tổng quantity và tổng revenue, sắp xếp giảm dần theo revenue. Kết quả bao gồm thông tin sản phẩm, số lượng bán, doanh thu, phần trăm đóng góp vào tổng doanh thu.

Báo cáo theo danh mục API GET /api/reports/category-revenue phân tích doanh thu theo từng danh mục sản phẩm. Query join order_items với products và categories, group by category, tính tổng doanh thu mỗi danh mục. Kết quả hiển thị dưới dạng biểu đồ tròn hoặc cột, giúp nhận biết danh mục nào đang kinh doanh tốt.

Báo cáo trạng thái đơn hàng API GET /api/reports/order-status thống kê số lượng đơn hàng ở mỗi trạng thái. Query đơn giản count orders group by status. Kết quả giúp theo dõi quy trình xử lý đơn hàng, phát hiện tắc nghẽn nếu có quá nhiều đơn pending hoặc shipping.

Báo cáo khách hàng API GET /api/reports/customers phân tích hành vi khách hàng. Thống kê số khách hàng mới đăng ký theo thời gian, khách hàng có giá trị cao nhất (top spenders), khách hàng mua nhiều lần nhất (loyal customers). Dữ liệu này giúp xây dựng chiến lược chăm sóc khách hàng và marketing.

Xuất báo cáo API GET /api/reports/export cho phép tải báo cáo dưới dạng Excel hoặc PDF. Hệ thống sử dụng thư viện như exceljs để tạo file Excel với các sheet chứa dữ liệu báo cáo, format đẹp với header, border, màu sắc. File được trả về dưới dạng binary stream với header Content-Disposition để trình duyệt tự động download.


## 9. Module Chat và Hỗ trợ

Module chat cung cấp kênh giao tiếp trực tiếp giữa khách hàng và nhân viên hỗ trợ. Hệ thống sử dụng WebSocket (Socket.IO) để đảm bảo tin nhắn được gửi và nhận ngay lập tức mà không cần refresh trang.

Khi khách hàng bắt đầu chat, hệ thống tạo một chat session mới trong bảng chat_sessions với status là waiting. Session này chứa userId của khách hàng và chưa có staffId. Khách hàng có thể gửi tin nhắn ngay, các tin nhắn được lưu vào bảng chat_messages với sessionId tương ứng. Tin nhắn được emit qua WebSocket đến tất cả các client đang kết nối với session đó.

Nhân viên hỗ trợ xem danh sách các session đang chờ qua API GET /api/chat/sessions?status=waiting. Khi nhân viên nhận một session, API POST /api/chat/sessions/:id/accept cập nhật staffId và chuyển status thành active. Từ đây nhân viên và khách hàng có thể chat qua lại. Mỗi tin nhắn được lưu database và emit qua WebSocket để cả hai bên đều nhận được real-time.

Khi vấn đề được giải quyết, nhân viên đóng session qua API POST /api/chat/sessions/:id/close. Status chuyển thành closed và lưu thời gian đóng. Khách hàng có thể xem lại lịch sử chat qua API GET /api/chat/sessions/:id/messages.

Hệ thống cũng hỗ trợ typing indicator, khi một bên đang gõ tin nhắn, bên kia sẽ thấy thông báo "đang gõ...". Điều này được thực hiện bằng cách emit event typing qua WebSocket, không lưu vào database.

## 10. Module Chatbot AI

Module chatbot AI tích hợp Google Gemini để cung cấp hỗ trợ tự động 24/7. Chatbot có thể trả lời các câu hỏi thường gặp về sản phẩm, chính sách, hướng dẫn sử dụng mà không cần nhân viên can thiệp.

Hệ thống xây dựng knowledge base trong bảng chatbot_knowledge, mỗi bản ghi chứa một câu hỏi và câu trả lời mẫu. Admin có thể thêm, sửa, xóa các mục trong knowledge base qua giao diện quản trị. API GET /api/chatbot-knowledge trả về danh sách kiến thức, API POST /api/chatbot-knowledge tạo mới, API PUT /api/chatbot-knowledge/:id cập nhật, API DELETE /api/chatbot-knowledge/:id xóa.


Khi khách hàng gửi tin nhắn cho chatbot qua API POST /api/chatbot/chat, hệ thống thực hiện các bước sau. Đầu tiên tìm kiếm trong knowledge base xem có câu hỏi tương tự không bằng cách so sánh độ tương đồng văn bản. Nếu tìm thấy câu hỏi khớp với độ tin cậy cao, trả về câu trả lời có sẵn. Nếu không tìm thấy hoặc độ tin cậy thấp, gửi câu hỏi đến Gemini API.

Gemini API nhận câu hỏi cùng với context về hệ thống như danh sách sản phẩm, chính sách, thông tin công ty. Gemini xử lý và trả về câu trả lời. Hệ thống parse response, format lại nếu cần và trả về cho khách hàng. Nếu Gemini không thể trả lời hoặc câu hỏi quá phức tạp, chatbot gợi ý khách hàng chuyển sang chat với nhân viên.

Lịch sử chat với chatbot được lưu trong bảng riêng để phân tích và cải thiện. Hệ thống theo dõi các câu hỏi mà chatbot không trả lời được để admin bổ sung vào knowledge base. Chatbot cũng có thể thực hiện một số tác vụ đơn giản như tra cứu đơn hàng, kiểm tra tồn kho sản phẩm bằng cách gọi các API nội bộ.

## 11. Module Thông báo

Module thông báo đảm bảo người dùng luôn được cập nhật về các sự kiện quan trọng như đơn hàng mới, thay đổi trạng thái đơn hàng, khuyến mãi mới. Hệ thống hỗ trợ ba kênh thông báo là in-app notification, email và push notification.

In-app notification được lưu trong bảng notifications. Mỗi thông báo có userId, type (order, promotion, system), title, message, data (JSON chứa thông tin bổ sung), is_read và created_at. API GET /api/notifications trả về danh sách thông báo của user với phân trang, sắp xếp theo thời gian mới nhất. Thông báo chưa đọc được highlight. API PUT /api/notifications/:id/read đánh dấu thông báo đã đọc. API GET /api/notifications/unread-count trả về số thông báo chưa đọc để hiển thị badge trên icon chuông.

Email notification sử dụng service email.service.ts với Nodemailer. Hệ thống có các template email cho từng loại sự kiện như xác nhận đăng ký, xác nhận đơn hàng, thay đổi trạng thái đơn hàng, quên mật khẩu. Template được viết bằng HTML với CSS inline để đảm bảo hiển thị tốt trên mọi email client. Khi cần gửi email, service render template với dữ liệu cụ thể và gửi qua SMTP server.


Push notification sử dụng Web Push API. Khách hàng đăng ký nhận push notification trên trình duyệt, browser tạo subscription object chứa endpoint, p256dh key và auth key. API POST /api/push/subscribe lưu subscription vào bảng push_subscriptions. Khi có sự kiện cần thông báo, hệ thống query tất cả subscriptions của user, dùng web-push library để gửi notification đến từng endpoint. Nếu endpoint không còn hợp lệ (user đã unsubscribe hoặc đổi browser), xóa subscription khỏi database.

Hệ thống có một notification service tập trung xử lý việc gửi thông báo qua cả ba kênh. Khi có sự kiện như tạo đơn hàng mới, code chỉ cần gọi notificationService.sendOrderNotification(userId, orderId) và service sẽ tự động tạo in-app notification, gửi email và push notification nếu user đã đăng ký.

## 12. Module Điểm thưởng và Hạng thành viên

Module điểm thưởng khuyến khích khách hàng mua sắm thường xuyên. Khách hàng tích lũy điểm từ các đơn hàng và có thể đổi điểm lấy voucher hoặc giảm giá.

Khi đơn hàng chuyển sang trạng thái delivered, hệ thống tự động cộng điểm cho khách hàng. Số điểm được tính dựa trên giá trị đơn hàng, ví dụ mỗi 10,000 VND được 1 điểm. Hệ thống cập nhật trường points trong bảng users và tạo bản ghi trong points_history với type là earn, lưu lại orderId để tham chiếu.

Khách hàng có thể xem lịch sử điểm qua API GET /api/points/history. Mỗi bản ghi hiển thị số điểm thay đổi (dương nếu cộng, âm nếu trừ), loại giao dịch, mô tả và thời gian. Điều này giúp khách hàng theo dõi được nguồn gốc của điểm.

Hệ thống có ba hạng thành viên là Bronze, Silver và Gold. Hạng được xác định dựa trên tổng chi tiêu (total_spent) hoặc số điểm tích lũy. Ví dụ Bronze cho khách hàng mới, Silver khi chi tiêu trên 5 triệu, Gold khi chi tiêu trên 20 triệu. Mỗi hạng có các ưu đãi khác nhau như tỷ lệ tích điểm cao hơn, giảm giá độc quyền, miễn phí vận chuyển.


Khi khách hàng đạt đủ điều kiện lên hạng, hệ thống tự động cập nhật trường tier và gửi thông báo chúc mừng. API GET /api/points/tier-info trả về thông tin hạng hiện tại, điều kiện lên hạng tiếp theo, các ưu đãi của từng hạng.

## 13. Module Quản lý Bàn và Pha chế

Module quản lý bàn phục vụ cho mô hình kinh doanh quán cà phê, cho phép nhân viên quản lý các bàn, tạo đơn hàng tại chỗ và theo dõi trạng thái pha chế.

Hệ thống có bảng table_areas để quản lý các khu vực như tầng 1, tầng 2, khu vườn. Mỗi khu vực chứa nhiều bàn. Bảng tables lưu thông tin bàn bao gồm số bàn, khu vực, sức chứa, trạng thái (available, occupied, reserved). API GET /api/tables trả về danh sách bàn có thể lọc theo khu vực và trạng thái.

Khi khách đến, nhân viên chọn bàn trống và tạo đơn hàng qua API POST /api/tables/:id/orders. Đơn hàng này khác với đơn hàng online ở chỗ không có địa chỉ giao hàng và thanh toán tại quầy. Trạng thái bàn chuyển thành occupied. Nhân viên thêm món vào đơn qua API POST /api/tables/orders/:orderId/items, mỗi món được lưu vào order_items với trạng thái pha chế.

Bếp hoặc quầy pha chế xem danh sách món cần làm qua API GET /api/kitchen/items?status=pending. Khi bắt đầu làm món, cập nhật trạng thái thành preparing qua API PUT /api/kitchen/items/:id/status. Khi hoàn thành, chuyển thành ready. Nhân viên phục vụ thấy món ready và mang ra cho khách. Hệ thống sử dụng WebSocket để cập nhật real-time, khi có món mới hoặc thay đổi trạng thái, tất cả các màn hình bếp và phục vụ đều được cập nhật ngay lập tức.

Khi khách thanh toán, nhân viên gọi API POST /api/tables/orders/:orderId/checkout với payment_method. Hệ thống tính tổng tiền, có thể áp dụng khuyến mãi, tạo hóa đơn và chuyển trạng thái đơn hàng thành completed. Trạng thái bàn chuyển về available để sẵn sàng cho khách tiếp theo.


## 14. Module Quản lý Ca làm việc

Module quản lý ca làm việc giúp admin phân công nhân viên vào các ca làm việc và theo dõi giờ làm. Hệ thống có bảng shifts định nghĩa các ca như ca sáng (7h-15h), ca chiều (15h-23h), ca tối (23h-7h). Mỗi ca có tên, thời gian bắt đầu, thời gian kết thúc, mô tả và màu sắc để dễ phân biệt trên lịch.

Admin tạo lịch làm việc qua API POST /api/shifts/schedule với staff_id, shift_id và work_date. Hệ thống kiểm tra nhân viên có bị trùng ca không, nếu hợp lệ tạo bản ghi trong shift_schedules. API GET /api/shifts/schedule/week trả về lịch làm việc của tất cả nhân viên trong tuần, hiển thị dưới dạng bảng với các ngày là cột và nhân viên là hàng.

Nhân viên check-in khi bắt đầu ca qua API POST /api/shifts/check-in. Hệ thống tìm ca làm việc được phân công cho nhân viên trong ngày, tạo bản ghi trong shift_attendances với actual_check_in là thời gian hiện tại. Nếu check-in muộn hơn thời gian bắt đầu ca, hệ thống đánh dấu là late. Khi kết thúc ca, nhân viên check-out qua API POST /api/shifts/check-out, cập nhật actual_check_out. Hệ thống tính tổng giờ làm việc thực tế để tính lương.

Nhân viên có thể yêu cầu đổi ca với đồng nghiệp qua API POST /api/shifts/swap-requests. Request chứa ca muốn đổi và ca muốn nhận. Đồng nghiệp nhận được thông báo và có thể chấp nhận hoặc từ chối qua API PUT /api/shifts/swap-requests/:id/respond. Nếu chấp nhận, admin phê duyệt và hệ thống tự động hoán đổi ca của hai nhân viên trong shift_schedules.

## 15. Module Danh mục và Thương hiệu

Module danh mục tổ chức sản phẩm thành các nhóm logic, giúp khách hàng dễ dàng tìm kiếm và duyệt sản phẩm. Mỗi danh mục có tên, slug, icon, mô tả và số lượng sản phẩm.

API GET /api/categories trả về danh sách tất cả danh mục kèm theo số lượng sản phẩm trong mỗi danh mục. Danh mục được sắp xếp theo tên hoặc số lượng sản phẩm. Trên giao diện, danh mục thường được hiển thị dưới dạng menu hoặc grid với icon đại diện.


Admin quản lý danh mục qua các API CRUD. API POST /api/categories tạo danh mục mới, tự động tạo slug từ tên và kiểm tra trùng lặp. API PUT /api/categories/:id cập nhật thông tin danh mục. Khi xóa danh mục qua API DELETE /api/categories/:id, hệ thống kiểm tra có sản phẩm nào thuộc danh mục này không. Nếu có, yêu cầu admin chuyển các sản phẩm sang danh mục khác hoặc xóa sản phẩm trước.

Trường product_count trong bảng categories được cập nhật tự động mỗi khi thêm hoặc xóa sản phẩm. Hệ thống có trigger hoặc application logic để đảm bảo số lượng luôn chính xác. Điều này giúp tránh phải count sản phẩm mỗi lần hiển thị danh mục, cải thiện hiệu năng.

Thương hiệu (brand) được lưu dưới dạng text field trong bảng products thay vì bảng riêng để đơn giản hóa. API GET /api/products/brands trả về danh sách các thương hiệu duy nhất từ tất cả sản phẩm, dùng để hiển thị bộ lọc thương hiệu. Khách hàng có thể lọc sản phẩm theo thương hiệu qua query parameter brand trong API GET /api/products.

## 16. Module Danh sách Yêu thích

Module danh sách yêu thích cho phép khách hàng lưu lại các sản phẩm quan tâm để xem sau hoặc theo dõi giá. Mỗi user có một wishlist riêng lưu trong bảng wishlist với các bản ghi chứa userId và productId.

Thêm sản phẩm vào wishlist qua API POST /api/wishlist với productId. Hệ thống kiểm tra sản phẩm có tồn tại không, user đã thêm sản phẩm này chưa. Nếu chưa có, tạo bản ghi mới. Nếu đã có, trả về thông báo sản phẩm đã trong wishlist. Bảng wishlist có unique constraint trên cặp userId và productId để tránh trùng lặp.

Xem wishlist qua API GET /api/wishlist trả về danh sách sản phẩm trong wishlist kèm theo thông tin chi tiết như tên, giá, hình ảnh, trạng thái còn hàng. Nếu sản phẩm đang có khuyến mãi hoặc giảm giá, hiển thị thông tin này để khách hàng biết.

Xóa sản phẩm khỏi wishlist qua API DELETE /api/wishlist/:productId. Hệ thống xóa bản ghi tương ứng. Chức năng kiểm tra sản phẩm có trong wishlist không qua API GET /api/wishlist/check/:productId trả về boolean, dùng để hiển thị icon trái tim đầy hoặc rỗng trên trang sản phẩm.


Hệ thống có tính năng thông báo giảm giá cho sản phẩm trong wishlist. Một cron job chạy định kỳ kiểm tra các sản phẩm trong wishlist của tất cả users, so sánh giá hiện tại với giá trước đó. Nếu phát hiện giảm giá, gửi thông báo cho user qua email và push notification. Service wishlist-sale.service.ts xử lý logic này, query tất cả wishlist items, join với products để lấy giá, so sánh và gửi thông báo.

## 17. Module Upload và Quản lý File

Module upload xử lý việc tải lên và quản lý các file như hình ảnh sản phẩm, avatar người dùng, hình ảnh đánh giá. Hệ thống hỗ trợ hai phương thức lưu trữ là local storage và cloud storage (Cloudinary).

API POST /api/upload nhận file qua multipart/form-data. Middleware multer xử lý việc parse file từ request. Hệ thống validate file type (chỉ cho phép image), file size (tối đa 5MB), sau đó lưu file. Với local storage, file được lưu vào thư mục uploads với tên file được hash để tránh trùng lặp. Với Cloudinary, file được upload lên cloud và nhận về URL cùng public_id.

API POST /api/upload/multiple cho phép upload nhiều file cùng lúc, tối đa 10 files. Hệ thống xử lý từng file một, validate và lưu, trả về mảng các URL. Chức năng này dùng cho upload nhiều hình ảnh sản phẩm hoặc hình ảnh đánh giá.

Xóa file qua API DELETE /api/upload/:identifier với identifier có thể là filename (local) hoặc public_id (Cloudinary). Hệ thống xác định loại storage dựa trên format của identifier, sau đó xóa file tương ứng. Với local storage, xóa file khỏi thư mục uploads. Với Cloudinary, gọi API delete với public_id.

Hệ thống có cơ chế cleanup tự động xóa các file không được sử dụng. Một cron job chạy hàng ngày, quét thư mục uploads, so sánh với các URL trong database (products, users, reviews), xóa các file không có trong database. Điều này giúp tiết kiệm dung lượng lưu trữ.


## 18. Module Thanh toán

Module thanh toán xử lý các giao dịch tài chính khi khách hàng đặt hàng. Hệ thống hỗ trợ nhiều phương thức thanh toán bao gồm thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng và ví điện tử.

Với phương thức COD, khách hàng chọn "Thanh toán khi nhận hàng" trong checkout. Đơn hàng được tạo với trạng thái pending và payment_method là COD. Không có giao dịch thanh toán nào được thực hiện ngay. Khi giao hàng thành công, nhân viên giao hàng thu tiền và cập nhật trạng thái đơn hàng thành delivered.

Với chuyển khoản ngân hàng, hệ thống hiển thị thông tin tài khoản ngân hàng của cửa hàng. Khách hàng thực hiện chuyển khoản và nhập mã giao dịch hoặc upload ảnh chuyển khoản. Đơn hàng được tạo với trạng thái awaiting_payment. Nhân viên kiểm tra giao dịch trong ngân hàng, nếu đúng thì xác nhận thanh toán và chuyển đơn hàng sang confirmed.

Tích hợp ví điện tử như MoMo, ZaloPay, VNPay được thực hiện qua API của các nhà cung cấp. Khi khách hàng chọn thanh toán qua ví, hệ thống tạo đơn hàng tạm thời và redirect khách hàng đến trang thanh toán của ví. Sau khi thanh toán thành công, ví gọi callback URL của hệ thống với thông tin giao dịch. Hệ thống verify chữ ký, cập nhật trạng thái đơn hàng và thông báo cho khách hàng.

API POST /api/payment/verify nhận thông tin từ payment gateway, validate signature để đảm bảo request thật sự từ gateway, không phải giả mạo. Sau khi verify thành công, cập nhật trạng thái thanh toán của đơn hàng, lưu transaction_id để tham chiếu sau này.

Hoàn tiền được xử lý khi khách hàng hủy đơn hàng đã thanh toán hoặc trả hàng. Với COD không cần hoàn tiền. Với chuyển khoản, nhân viên thực hiện chuyển tiền lại cho khách hàng thủ công. Với ví điện tử, gọi API refund của gateway với transaction_id gốc. Hệ thống tạo bản ghi refund_transactions để theo dõi các giao dịch hoàn tiền.


## 19. Module Vận chuyển

Module vận chuyển quản lý thông tin giao hàng và tính phí vận chuyển. Hệ thống tích hợp với các đơn vị vận chuyển như Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, VNPost để tính phí và theo dõi đơn hàng.

Tính phí vận chuyển dựa trên địa chỉ giao hàng và trọng lượng đơn hàng. API POST /api/shipping/calculate nhận địa chỉ và tổng giá trị đơn hàng, trả về danh sách các phương thức vận chuyển khả dụng với phí tương ứng. Hệ thống có thể gọi API của các đơn vị vận chuyển để lấy giá thực tế, hoặc sử dụng bảng giá cố định được cấu hình trong database.

Khi tạo đơn hàng, khách hàng chọn phương thức vận chuyển. Thông tin này được lưu vào trường shipping_carrier và shipping_fee trong bảng orders. Sau khi đơn hàng được xác nhận, hệ thống tạo đơn vận chuyển qua API của đơn vị vận chuyển, nhận về mã vận đơn (tracking_code) và lưu vào database.

Theo dõi đơn hàng qua API GET /api/shipping/track/:trackingCode. Hệ thống gọi API tracking của đơn vị vận chuyển với mã vận đơn, nhận về thông tin trạng thái hiện tại, lịch sử di chuyển, vị trí hiện tại. Thông tin này được hiển thị cho khách hàng dưới dạng timeline với các mốc thời gian và địa điểm.

Webhook từ đơn vị vận chuyển được xử lý qua API POST /api/shipping/webhook. Khi có cập nhật trạng thái đơn hàng, đơn vị vận chuyển gọi webhook này với thông tin mới. Hệ thống cập nhật trạng thái đơn hàng trong database và gửi thông báo cho khách hàng. Ví dụ khi đơn hàng đang giao, chuyển trạng thái thành shipping. Khi giao thành công, chuyển thành delivered.

Miễn phí vận chuyển có thể được áp dụng dựa trên giá trị đơn hàng hoặc khuyến mãi. Hệ thống kiểm tra điều kiện miễn phí ship trong quá trình checkout, nếu thỏa mãn thì set shipping_fee thành 0. Thông tin về chính sách miễn phí ship được lấy từ bảng settings hoặc hardcode trong code.


## 20. Module Địa chỉ

Module địa chỉ cho phép khách hàng lưu nhiều địa chỉ giao hàng để sử dụng cho các đơn hàng khác nhau. Mỗi địa chỉ bao gồm tên người nhận, số điện thoại, địa chỉ chi tiết và có thể đánh dấu là địa chỉ mặc định.

API GET /api/addresses trả về danh sách địa chỉ của user. Địa chỉ mặc định được đánh dấu is_default và hiển thị đầu tiên. Trong checkout, địa chỉ mặc định được tự động chọn sẵn, khách hàng có thể đổi sang địa chỉ khác hoặc nhập địa chỉ mới.

Thêm địa chỉ mới qua API POST /api/addresses với thông tin đầy đủ. Nếu khách hàng chọn đặt làm địa chỉ mặc định, hệ thống tự động bỏ đánh dấu mặc định của các địa chỉ khác. Bảng user_addresses chỉ cho phép một địa chỉ mặc định cho mỗi user.

Cập nhật địa chỉ qua API PUT /api/addresses/:id cho phép sửa thông tin hoặc đổi địa chỉ mặc định. Xóa địa chỉ qua API DELETE /api/addresses/:id. Nếu xóa địa chỉ mặc định, hệ thống tự động chọn một địa chỉ khác làm mặc định, hoặc không có địa chỉ mặc định nếu đây là địa chỉ duy nhất.

## 21. Module Hóa đơn

Module hóa đơn tạo và quản lý hóa đơn cho các đơn hàng. Hóa đơn chứa đầy đủ thông tin về sản phẩm, giá, thuế, giảm giá và tổng tiền, phục vụ cho mục đích kế toán và pháp lý.

Hóa đơn được tự động tạo khi đơn hàng chuyển sang trạng thái delivered hoặc khi nhân viên thủ công tạo hóa đơn. API POST /api/invoice/generate/:orderId tạo hóa đơn cho đơn hàng. Hệ thống lấy thông tin từ bảng orders và order_items, tính toán các khoản thuế nếu có, format thành template hóa đơn.

Xem hóa đơn qua API GET /api/invoice/:orderId trả về thông tin hóa đơn dưới dạng JSON hoặc HTML. Khách hàng có thể xem hóa đơn trên web hoặc tải về. API GET /api/invoice/:orderId/pdf tạo file PDF từ template HTML sử dụng thư viện như puppeteer hoặc pdfkit. File PDF được trả về dưới dạng binary stream để download.


Hóa đơn điện tử tuân thủ quy định của Tổng cục Thuế được tích hợp qua API của các nhà cung cấp dịch vụ hóa đơn điện tử. Khi tạo hóa đơn, hệ thống gửi thông tin đến nhà cung cấp, nhận về mã hóa đơn và link tra cứu. Thông tin này được lưu vào database và gửi cho khách hàng qua email.

In hóa đơn tại quầy sử dụng chức năng print của trình duyệt hoặc kết nối trực tiếp với máy in nhiệt. Template hóa đơn được thiết kế phù hợp với khổ giấy in nhiệt 80mm, chứa logo cửa hàng, thông tin đơn hàng, mã QR để tra cứu online.

## 22. Module Cài đặt Hệ thống

Module cài đặt cho phép admin cấu hình các thông số của hệ thống mà không cần sửa code. Các cài đặt được lưu trong bảng settings hoặc file JSON, bao gồm thông tin cửa hàng, chính sách, cấu hình email, cấu hình thanh toán.

API GET /api/settings trả về tất cả cài đặt hiện tại. Mỗi cài đặt có key và value, ví dụ store_name, store_address, store_phone, store_email. Cài đặt được cache trong Redis để tránh query database mỗi lần cần dùng.

Cập nhật cài đặt qua API PUT /api/settings với body chứa các cặp key-value cần thay đổi. Hệ thống validate giá trị hợp lệ, cập nhật vào database và xóa cache. Một số cài đặt quan trọng như payment gateway credentials được mã hóa trước khi lưu để bảo mật.

Cài đặt email bao gồm SMTP host, port, username, password, from address. Admin nhập thông tin này vào giao diện, hệ thống test kết nối bằng cách gửi email thử. Nếu thành công, lưu cài đặt. Nếu thất bại, hiển thị lỗi để admin sửa.

Cài đặt thanh toán cho từng payment gateway bao gồm merchant ID, API key, secret key, webhook URL. Mỗi gateway có form riêng với các trường phù hợp. Hệ thống cũng cho phép bật/tắt từng phương thức thanh toán để linh hoạt trong vận hành.


## 23. Module Backup và Restore

Module backup đảm bảo dữ liệu hệ thống được sao lưu định kỳ và có thể phục hồi khi cần. Hệ thống hỗ trợ backup cả database và files.

Backup database được thực hiện qua API POST /api/admin/backup/create hoặc tự động theo lịch. Hệ thống sử dụng pg_dump để export toàn bộ database thành file SQL, compress bằng gzip để tiết kiệm dung lượng. File backup được lưu vào thư mục backups với tên chứa timestamp, ví dụ backup_2024-01-15_14-30-00.sql.gz.

Danh sách backup qua API GET /api/admin/backup/list hiển thị tất cả các file backup với thông tin kích thước, thời gian tạo. Admin có thể download backup qua API GET /api/admin/backup/download/:filename hoặc xóa backup cũ qua API DELETE /api/admin/backup/:filename.

Restore database từ backup qua API POST /api/admin/backup/restore/:filename. Hệ thống giải nén file backup, dừng tất cả các kết nối đến database, drop database hiện tại, tạo database mới và import dữ liệu từ file SQL. Quá trình này nguy hiểm nên yêu cầu xác nhận nhiều lần và chỉ admin mới có quyền thực hiện.

Backup files bao gồm thư mục uploads chứa hình ảnh sản phẩm, avatar, hình ảnh đánh giá. Hệ thống tạo tarball của thư mục uploads và lưu vào backups. Backup files thường lớn hơn backup database nên có thể upload lên cloud storage như S3 để tiết kiệm dung lượng server.

Lịch backup tự động được cấu hình trong cron job hoặc scheduled task. Ví dụ backup database mỗi ngày lúc 2 giờ sáng, backup files mỗi tuần một lần. Backup cũ hơn 30 ngày được tự động xóa để tiết kiệm dung lượng, trừ backup đầu tháng được giữ lại lâu hơn.

## Kết luận

Hệ thống NHH-Coffee được xây dựng với hơn 20 modules chức năng, mỗi module được thiết kế kỹ lưỡng để đáp ứng các yêu cầu nghiệp vụ cụ thể. Quá trình phát triển tuân theo kiến trúc 3 lớp với sự phân tách rõ ràng giữa giao diện, xử lý nghiệp vụ và dữ liệu. Các chức năng được xây dựng với tính module hóa cao, dễ dàng bảo trì và mở rộng.


Mỗi chức năng đều được implement với các best practices như validation dữ liệu đầu vào, xử lý lỗi đầy đủ, sử dụng transaction cho các thao tác phức tạp, logging để audit và debug. Hệ thống cũng chú trọng đến hiệu năng với việc sử dụng caching, indexing database, pagination cho danh sách lớn.

Bảo mật được đặt lên hàng đầu với authentication bằng JWT, authorization dựa trên role, validation và sanitization input, parameterized queries để phòng SQL injection, rate limiting để phòng DDoS. Các thông tin nhạy cảm như mật khẩu, API keys đều được mã hóa trước khi lưu trữ.

Trải nghiệm người dùng được cải thiện với các tính năng real-time như chat, thông báo push, cập nhật trạng thái đơn hàng. Giao diện được thiết kế responsive, hoạt động tốt trên cả desktop và mobile. Các thông báo lỗi và thành công được hiển thị rõ ràng để người dùng hiểu được trạng thái của hành động.

Hệ thống đã sẵn sàng đáp ứng nhu cầu kinh doanh thực tế với đầy đủ các chức năng từ cơ bản đến nâng cao, từ bán hàng online đến quản lý quán cà phê tại chỗ. Kiến trúc linh hoạt cho phép dễ dàng thêm các chức năng mới hoặc tích hợp với các hệ thống bên ngoài trong tương lai.
