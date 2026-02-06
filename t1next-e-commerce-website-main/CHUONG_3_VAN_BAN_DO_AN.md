# CHƯƠNG 3: CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG

## 3.1. GIỚI THIỆU

Chương này trình bày chi tiết quy trình cài đặt và triển khai hệ thống quản lý quán cà phê NHH-Coffee từ môi trường phát triển đến môi trường sản xuất. Việc thiết lập đúng cách môi trường làm việc và triển khai hệ thống theo quy trình chuẩn hóa đóng vai trò quan trọng trong việc đảm bảo hệ thống hoạt động ổn định, bảo mật và có khả năng mở rộng trong tương lai.

Hệ thống NHH-Coffee được xây dựng dựa trên kiến trúc Client-Server hiện đại với frontend sử dụng framework Next.js phiên bản 16 kết hợp React 19, và backend sử dụng Express.js kết hợp với hệ quản trị cơ sở dữ liệu PostgreSQL. Kiến trúc này được lựa chọn dựa trên các ưu điểm về hiệu suất, khả năng mở rộng và tính bảo mật cao.

Chương được chia thành hai phần chính tương ứng với hai giai đoạn quan trọng trong vòng đời phát triển phần mềm. Phần đầu tiên hướng dẫn chi tiết quy trình cài đặt hệ thống trên môi trường phát triển, nơi các lập trình viên thực hiện công việc coding, testing và debugging. Phần thứ hai trình bày quy trình triển khai hệ thống lên môi trường sản xuất trên máy chủ VPS, nơi hệ thống được đưa vào vận hành thực tế để phục vụ người dùng cuối.

Mỗi phần được trình bày theo trình tự logic từ chuẩn bị môi trường, cài đặt các phần mềm cần thiết, cấu hình hệ thống, đến khởi chạy và kiểm thử. Các bước được mô tả chi tiết với giải thích rõ ràng về mục đích và tầm quan trọng của từng thao tác, giúp người đọc không chỉ biết cách thực hiện mà còn hiểu được lý do tại sao cần thực hiện như vậy.

## 3.2. CÀI ĐẶT HỆ THỐNG

Phần này trình bày chi tiết quy trình cài đặt hệ thống trên môi trường phát triển, bao gồm việc xác định yêu cầu hệ thống, cài đặt các phần mềm cần thiết, cấu hình dự án, thiết lập cơ sở dữ liệu và khởi chạy ứng dụng để bắt đầu quá trình phát triển.

### 3.2.1. Yêu cầu hệ thống

Để đảm bảo quá trình phát triển diễn ra suôn sẻ và hiệu quả, máy tính của lập trình viên cần đáp ứng các yêu cầu về phần cứng và phần mềm được xác định dựa trên đặc điểm kỹ thuật của các công nghệ được sử dụng.

Về phần cứng, yêu cầu tối thiểu bao gồm bộ vi xử lý Intel Core i5 thế hệ thứ 8 trở lên hoặc AMD Ryzen 5 series 3000 trở lên. Tuy nhiên, để tăng tốc độ biên dịch TypeScript và build ứng dụng Next.js, chúng tôi khuyến nghị sử dụng bộ vi xử lý mạnh hơn như Intel Core i7 hoặc AMD Ryzen 7. Bộ nhớ RAM tối thiểu là 8GB, nhưng do cần chạy đồng thời nhiều ứng dụng như IDE, trình duyệt, server backend, server frontend và database, chúng tôi khuyến nghị sử dụng 16GB RAM để đảm bảo hiệu suất làm việc tốt nhất. Về lưu trữ, ổ cứng SSD là bắt buộc với ít nhất 20GB dung lượng trống cho dự án và các thư viện phụ thuộc. SSD giúp tăng đáng kể tốc độ đọc ghi file và cải thiện tốc độ khởi động các ứng dụng. Cuối cùng, cần có kết nối Internet ổn định với tốc độ tối thiểu 10Mbps để tải các thư viện từ npm registry và tương tác với các dịch vụ bên ngoài.

Về phần mềm, hệ điều hành có thể là Windows 10 trở lên, macOS 12 trở lên, hoặc Ubuntu 20.04 trở lên. Node.js phiên bản 20.x hoặc 22.x LTS là nền tảng runtime cho cả frontend và backend. PostgreSQL phiên bản 15.x hoặc 16.x được sử dụng làm hệ quản trị cơ sở dữ liệu chính. Redis phiên bản 7.x được sử dụng cho caching nhưng là optional vì hệ thống có cơ chế fallback sang memory cache. Git phiên bản 2.x trở lên được sử dụng để quản lý mã nguồn. IDE được khuyến nghị là Visual Studio Code do hỗ trợ tốt cho TypeScript, React và Node.js.

### 3.2.2. Cài đặt phần mềm cơ bản

Quá trình cài đặt phần mềm cơ bản bao gồm việc cài đặt các công cụ và thư viện cần thiết để chạy và phát triển ứng dụng.

**Cài đặt Node.js và npm**

Node.js là nền tảng cốt lõi của dự án, cần được cài đặt đầu tiên. Trên hệ điều hành Windows, lập trình viên có thể tải Node.js installer từ trang chủ nodejs.org, chọn phiên bản LTS như 20.x hoặc 22.x, và chạy file installer. Quá trình cài đặt sẽ tự động thêm Node.js và npm vào system PATH. Sau khi cài đặt, cần mở Command Prompt hoặc PowerShell và kiểm tra phiên bản để đảm bảo cài đặt thành công.

Trên hệ điều hành macOS, có thể sử dụng Homebrew package manager để cài đặt Node.js. Nếu chưa có Homebrew, cần cài đặt Homebrew trước. Sau đó, cài đặt Node.js bằng Homebrew sẽ tự động cài đặt phiên bản LTS mới nhất và cấu hình PATH.

Trên hệ điều hành Linux như Ubuntu hoặc Debian, có thể cài đặt Node.js từ NodeSource repository để có phiên bản mới nhất. Đầu tiên, thêm NodeSource repository cho phiên bản mong muốn, sau đó update package list và cài đặt Node.js. Phương pháp này đảm bảo cài đặt phiên bản LTS chính thức từ NodeSource thay vì phiên bản cũ từ Ubuntu repository.

npm được cài đặt tự động cùng với Node.js. Tuy nhiên, nên cập nhật npm lên phiên bản mới nhất để có các tính năng mới nhất, bug fixes và security patches.

**Cài đặt PostgreSQL**

PostgreSQL là hệ quản trị cơ sở dữ liệu quan hệ chính của hệ thống, cần được cài đặt và cấu hình trên máy phát triển.

Trên Windows, tải PostgreSQL installer từ trang postgresql.org, chọn phiên bản 15.x hoặc 16.x phù hợp với hệ điều hành. Chạy installer và làm theo hướng dẫn, chọn thư mục cài đặt, đặt password cho superuser postgres, chọn port mặc định 5432, và chọn locale. Installer cũng cài đặt pgAdmin 4, công cụ quản lý database với giao diện đồ họa. Sau khi cài đặt, PostgreSQL service sẽ tự động chạy và khởi động cùng Windows.

Trên macOS, sử dụng Homebrew để cài đặt PostgreSQL. Sau khi cài đặt, khởi động PostgreSQL service. PostgreSQL sẽ chạy ở background và tự động khởi động khi boot.

Trên Linux như Ubuntu, cài đặt PostgreSQL từ apt repository. PostgreSQL service sẽ tự động start sau khi cài đặt.

Sau khi cài đặt PostgreSQL, cần tạo database cho dự án. Sử dụng pgAdmin hoặc psql command line, kết nối đến PostgreSQL server với user postgres. Tạo database mới với tên nhh_coffee_dev sử dụng UTF8 encoding. Tạo user mới với tên nhh_user và password mạnh. Grant tất cả privileges trên database nhh_coffee_dev cho user nhh_user. User này sẽ được sử dụng trong connection string của ứng dụng.

**Cài đặt Redis**

Redis là optional dependency, hệ thống có thể hoạt động mà không cần Redis nhờ memory cache fallback. Tuy nhiên, cài đặt Redis giúp test đầy đủ chức năng caching trong môi trường development.

Trên Windows, Redis không có official support. Khuyến nghị sử dụng Redis trên Docker hoặc WSL2. Với Docker, sau khi cài đặt Docker Desktop, có thể chạy Redis container. Redis sẽ chạy ở background và listen trên port 6379.

Trên macOS, sử dụng Homebrew để cài đặt Redis. Khởi động Redis service và Redis sẽ chạy ở background và listen trên port mặc định 6379.

Trên Linux như Ubuntu, cài đặt Redis từ apt repository. Redis service sẽ tự động start và enable để khởi động cùng system.

**Cài đặt Git**

Git được sử dụng để quản lý mã nguồn và version control. Trên Windows, tải Git installer từ git-scm.com và chạy installer với các tùy chọn mặc định. Trên macOS, có thể cài đặt Git qua Homebrew. Trên Linux như Ubuntu, cài đặt Git từ apt repository.

Sau khi cài đặt Git, cần cấu hình user name và email để Git có thể track author của các commits.


### 3.2.3. Cấu hình dự án

Sau khi cài đặt các phần mềm cơ bản, bước tiếp theo là clone source code từ Git repository và cấu hình dự án để sẵn sàng cho quá trình phát triển.

**Clone repository và cài đặt dependencies**

Đầu tiên, clone repository từ GitHub hoặc GitLab về máy local bằng Git. Lệnh git clone sẽ tạo thư mục mới chứa toàn bộ source code của dự án. Dự án NHH-Coffee có cấu trúc monorepo với hai thư mục chính: client chứa Next.js frontend và server chứa Express.js backend. Mỗi thư mục có file package.json riêng, liệt kê các dependencies cần thiết.

Để cài đặt dependencies cho backend, navigate vào thư mục server và chạy lệnh npm ci. Lệnh npm ci thay vì npm install được khuyến nghị cho việc cài đặt trong môi trường development vì nó cài đặt chính xác các phiên bản được liệt kê trong package-lock.json, đảm bảo tính nhất quán giữa các máy phát triển khác nhau. npm sẽ đọc file package.json, tải tất cả các packages từ npm registry, và cài đặt vào thư mục node_modules. Quá trình này có thể mất vài phút tùy thuộc vào tốc độ Internet.

Tương tự, để cài đặt dependencies cho frontend, navigate vào thư mục client và chạy lệnh npm ci. Frontend có nhiều dependencies hơn backend do bao gồm React, Next.js, UI libraries và các tools khác, nên quá trình cài đặt có thể mất lâu hơn.

**Cấu hình Environment Variables**

Environment variables chứa các thông tin cấu hình nhạy cảm như database credentials, API keys và secrets. Các biến này không được commit vào Git repository vì lý do bảo mật, thay vào đó được lưu trong file .env và .env.local.

Trong thư mục server, tạo file .env dựa trên file .env.example có sẵn. File .env.example chứa template của tất cả environment variables cần thiết với giá trị mẫu. Copy file này thành .env và điền các giá trị thực tế.

Các biến quan trọng cần cấu hình cho backend bao gồm DATABASE_URL là connection string đến PostgreSQL database, có format postgresql://username:password@localhost:5432/database_name. Thay username, password và database_name bằng thông tin đã tạo ở bước cài đặt PostgreSQL. REDIS_URL là connection string đến Redis, thường là redis://localhost:6379. Nếu không cài Redis, có thể comment out hoặc để trống, hệ thống sẽ fallback sang memory cache.

JWT_SECRET là secret key dùng để sign JWT tokens, cần là chuỗi random dài và phức tạp. Có thể generate bằng Node.js crypto module. JWT_EXPIRES_IN xác định thời gian hết hạn của token, thường đặt là 7d (7 ngày) cho development.

GEMINI_API_KEY là API key để sử dụng Google Gemini AI cho chatbot. Cần đăng ký tài khoản Google AI Studio và tạo API key. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET là credentials để upload images lên Cloudinary. Cần đăng ký tài khoản Cloudinary miễn phí và lấy thông tin từ dashboard.

EMAIL_HOST, EMAIL_PORT, EMAIL_USER và EMAIL_PASSWORD là cấu hình SMTP để gửi email. Có thể sử dụng Gmail SMTP với App Password, hoặc các dịch vụ như SendGrid, Mailgun. FRONTEND_URL là URL của frontend application, trong development thường là http://localhost:3000.

Trong thư mục client, tạo file .env.local với các biến cần thiết cho frontend. NEXT_PUBLIC_API_URL là URL của backend API, trong development là http://localhost:5000. Prefix NEXT_PUBLIC_ cho phép biến này được expose ra browser. NEXT_PUBLIC_SOCKET_URL là URL của Socket.io server, cũng là http://localhost:5000. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME là cloud name của Cloudinary, cần thiết để display images từ Cloudinary CDN.

**Thiết lập Database Schema**

Sau khi cấu hình database connection, cần tạo tables và seed initial data. Hệ thống sử dụng Prisma ORM để quản lý database schema và migrations. File prisma/schema.prisma định nghĩa toàn bộ data models của hệ thống.

Đầu tiên, generate Prisma Client bằng lệnh npx prisma generate. Prisma Client là một type-safe query builder được sử dụng trong code để tương tác với database.

Để tạo tables trong database, chạy lệnh npx prisma migrate dev. Prisma sẽ đọc schema.prisma, generate SQL migration files và execute chúng trên database. Lệnh này cũng tự động generate Prisma Client mới với các types tương ứng với schema hiện tại.

Sau khi tạo tables, cần seed initial data để có dữ liệu test. File src/db/seed.ts chứa script để tạo sample data bao gồm admin user, categories, products và các data khác. Chạy seed script bằng lệnh npm run seed. Script sẽ tạo một admin account với email admin@nhh-coffee.com và password Admin@123, các categories như Cà phê, Trà sữa, Bánh ngọt, và một số sample products với images và thông tin chi tiết. Thông tin login admin này sẽ được sử dụng để truy cập admin panel.

Để xem database schema và data, có thể sử dụng Prisma Studio bằng lệnh npx prisma studio. Prisma Studio sẽ mở web interface tại localhost:5555, cho phép browse tables, view records và edit data trực tiếp. Đây là công cụ hữu ích để debug và kiểm tra data trong quá trình development.

### 3.2.4. Khởi chạy ứng dụng

Sau khi hoàn tất cấu hình, có thể khởi chạy ứng dụng trong development mode để bắt đầu quá trình phát triển.

**Khởi chạy Backend Server**

Mở terminal, navigate vào thư mục server và chạy lệnh npm run dev. Lệnh này sẽ start Express.js server với nodemon, một tool tự động restart server khi có file changes. Backend server sẽ listen trên port 5000 hoặc port được định nghĩa trong PORT environment variable.

Khi server khởi động thành công, console sẽ hiển thị các thông tin như Server running on port 5000, Database connected successfully và Redis connected nếu Redis được cấu hình. Nếu có lỗi kết nối database hoặc Redis, error messages sẽ được hiển thị, cần kiểm tra lại cấu hình environment variables và đảm bảo PostgreSQL và Redis đang chạy.

Backend server expose RESTful API endpoints tại http://localhost:5000/api. Có thể test API bằng Postman hoặc Thunder Client. Ví dụ, gửi GET request đến http://localhost:5000/api/products sẽ trả về danh sách products. Gửi POST request đến http://localhost:5000/api/auth/login với email và password trong request body sẽ trả về JWT token nếu credentials đúng.

Socket.io server cũng được khởi động cùng Express server, listen trên cùng port. Socket.io endpoint là http://localhost:5000, clients có thể kết nối đến đây để nhận real-time updates.

**Khởi chạy Frontend Application**

Mở terminal mới, giữ terminal của backend đang chạy, navigate vào thư mục client và chạy lệnh npm run dev. Lệnh này sẽ start Next.js development server với hot module replacement (HMR), tự động reload browser khi có code changes.

Next.js development server sẽ listen trên port 3000. Khi khởi động thành công, console sẽ hiển thị ready - started server on 0.0.0.0:3000, url: http://localhost:3000. Mở trình duyệt và truy cập http://localhost:3000 để xem ứng dụng.

Trang chủ sẽ hiển thị hero section, featured products, categories và các sections khác. Có thể navigate đến các trang khác như products, login, register để test chức năng. Khi click vào một product, trang product detail sẽ load với thông tin chi tiết, images, reviews và related products.

Development mode của Next.js cung cấp nhiều tính năng hữu ích cho developers như Fast Refresh tự động update UI khi save file mà không mất state, Error Overlay hiển thị errors và stack traces trực tiếp trên browser, và Source Maps cho phép debug TypeScript code trong browser DevTools.

### 3.2.5. Workflow phát triển

Trong quá trình phát triển, lập trình viên thường mở hai terminals: một cho backend server và một cho frontend application. Cả hai servers đều chạy ở watch mode, tự động reload khi có changes.

Khi thay đổi backend code, ví dụ thêm API endpoint mới, nodemon sẽ detect file change và restart server. Sau khi server restart, có thể test API endpoint mới ngay lập tức. Khi thay đổi frontend code, ví dụ update UI component, Next.js Fast Refresh sẽ update browser trong vài giây mà không cần full page reload.

Để debug backend code, có thể sử dụng console.log statements hoặc Node.js debugger. Visual Studio Code có built-in debugger support cho Node.js, cho phép set breakpoints, step through code và inspect variables. Để debug frontend code, sử dụng browser DevTools, có thể set breakpoints trong Sources tab, inspect React components với React DevTools extension và monitor network requests trong Network tab.

Khi gặp errors, cần đọc error messages cẩn thận. Backend errors thường hiển thị trong terminal console với stack traces. Frontend errors hiển thị trong browser console hoặc Next.js Error Overlay. Common errors bao gồm database connection errors cần kiểm tra DATABASE_URL và PostgreSQL service, CORS errors cần đảm bảo backend CORS middleware được cấu hình đúng, authentication errors cần kiểm tra JWT token và authentication middleware, và TypeScript type errors cần fix type mismatches hoặc add type assertions.

Để test real-time features như chat và notifications, cần mở nhiều browser windows hoặc tabs. Ví dụ, để test chat giữa customer và staff, mở một window login với customer account và một window khác login với staff account. Gửi message từ customer window, message sẽ appear real-time trong staff window nhờ Socket.io.


## 3.3. TRIỂN KHAI HỆ THỐNG

Phần này trình bày chi tiết quy trình triển khai hệ thống lên môi trường production trên VPS (Virtual Private Server), bao gồm chuẩn bị máy chủ, cấu hình bảo mật, deploy ứng dụng và setup các services cần thiết để đưa hệ thống vào vận hành thực tế.

### 3.3.1. Yêu cầu môi trường production

Môi trường production yêu cầu cấu hình mạnh mẽ hơn môi trường development để đảm bảo khả năng xử lý đồng thời nhiều người dùng và duy trì hoạt động liên tục 24/7.

Về phần cứng, chúng tôi khuyến nghị sử dụng VPS với cấu hình tối thiểu 4 cores vCPU, 8GB RAM và 100GB SSD storage. Với cấu hình này, hệ thống có thể xử lý khoảng 100-200 concurrent users. Đối với hệ thống có lượng truy cập cao hơn, khuyến nghị nâng cấp lên 8 cores CPU và 16GB RAM. Về băng thông, yêu cầu 1TB mỗi tháng với tốc độ kết nối tối thiểu 100Mbps, đủ để phục vụ khoảng 50,000-100,000 page views mỗi tháng.

Về hệ điều hành, chúng tôi khuyến nghị sử dụng Ubuntu 22.04 LTS (Long Term Support) vì tính ổn định, bảo mật được cập nhật thường xuyên, cộng đồng hỗ trợ lớn và được hỗ trợ đến năm 2027.

Các nhà cung cấp VPS uy tín được khuyến nghị bao gồm DigitalOcean với gói Droplet từ 40-80 đô la mỗi tháng, cung cấp giao diện quản lý đơn giản và datacenter tại Singapore phù hợp cho thị trường Việt Nam. Vultr với gói Cloud Compute từ 40-80 đô la mỗi tháng, có hiệu suất tốt và nhiều lựa chọn về vị trí datacenter. Linode với gói Shared CPU từ 40-80 đô la mỗi tháng, nổi tiếng về độ tin cậy và hỗ trợ khách hàng tốt. AWS EC2 với instance type t3.large hoặc t3.xlarge, phù hợp cho doanh nghiệp cần khả năng mở rộng linh hoạt.

### 3.3.2. Chuẩn bị máy chủ

Quá trình chuẩn bị máy chủ bao gồm việc tạo VPS, cấu hình bảo mật cơ bản và cài đặt các phần mềm hệ thống cần thiết.

**Tạo VPS và kết nối SSH**

Bước đầu tiên là tạo VPS trên nhà cung cấp đã chọn. Quá trình tạo VPS thường bao gồm việc chọn datacenter location, khuyến nghị chọn Singapore hoặc Tokyo cho thị trường Việt Nam để giảm latency, chọn hệ điều hành Ubuntu 22.04 LTS, chọn cấu hình server về CPU, RAM và storage, và thiết lập SSH authentication.

Sau khi VPS được tạo, nhà cung cấp sẽ cung cấp IP address công khai và SSH credentials bao gồm username root và password hoặc SSH key. Sử dụng SSH client để kết nối đến server lần đầu tiên. Trên macOS và Linux, có thể sử dụng Terminal với lệnh ssh. Trên Windows, có thể sử dụng PuTTY hoặc Windows Terminal.

**Cấu hình bảo mật cơ bản**

Ngay sau khi truy cập server lần đầu, cần thực hiện các bước bảo mật cơ bản để bảo vệ server khỏi các cuộc tấn công.

Đầu tiên, update toàn bộ system packages lên phiên bản mới nhất để có các security patches. Chạy lệnh apt update để update package list và apt upgrade để upgrade tất cả packages. Quá trình này có thể mất vài phút.

Tiếp theo, tạo user mới với sudo privileges thay vì sử dụng root user trực tiếp. Sử dụng root user cho mọi operations là không an toàn vì một lỗi có thể gây hại nghiêm trọng cho hệ thống. Tạo user mới với tên deploy, nhập password mạnh và điền các thông tin tùy chọn. Sau đó, thêm user vào sudo group. User này có thể execute commands với sudo privileges khi cần.

Cấu hình SSH để tăng cường bảo mật. Mở file cấu hình SSH tại /etc/ssh/sshd_config bằng text editor như nano hoặc vim. Thay đổi các settings: disable root login bằng cách set PermitRootLogin no, disable password authentication và chỉ cho phép SSH key authentication bằng PasswordAuthentication no sau khi đã setup SSH key cho user mới, và thay đổi SSH port từ 22 sang port khác như 2222 để tránh automated attacks. Sau khi thay đổi, restart SSH service.

Trước khi logout khỏi root session, cần test login với user mới. Mở terminal mới và SSH vào server với user mới. Nếu đã disable password authentication, cần copy SSH public key lên server trước. Sau khi confirm user mới có thể login và sử dụng sudo, có thể logout khỏi root session.

**Cài đặt phần mềm hệ thống**

Sau khi cấu hình bảo mật cơ bản, login với user deploy và cài đặt các phần mềm cần thiết cho hệ thống.

Cài đặt Node.js từ NodeSource repository để có phiên bản LTS mới nhất. Chạy curl command để download và execute NodeSource setup script cho Node.js 20.x, sau đó cài đặt Node.js bằng apt. Verify cài đặt bằng cách check version của node và npm.

Cài đặt PostgreSQL database server bằng apt. PostgreSQL service sẽ tự động start sau khi cài đặt. Switch sang postgres user và sử dụng psql để tạo database và user cho production. Tạo database nhh_coffee_prod, tạo user nhh_prod_user với password mạnh và grant privileges.

Cấu hình PostgreSQL để chỉ accept connections từ localhost, không expose ra Internet. Mở file postgresql.conf và đảm bảo listen_addresses được set thành localhost. Mở file pg_hba.conf và chỉ cho phép local connections. Restart PostgreSQL service để apply changes.

Cài đặt Redis cho caching bằng apt. Cấu hình Redis trong file redis.conf, set bind 127.0.0.1 để Redis chỉ listen trên localhost, set protected-mode yes, set requirepass với password mạnh, set maxmemory limit ví dụ 512MB và maxmemory-policy ví dụ allkeys-lru để evict least recently used keys khi hết memory. Restart Redis service để apply changes.

Cài đặt Nginx web server bằng apt. Nginx service sẽ tự động start và enable. Verify Nginx đang chạy bằng cách truy cập IP address của server trong browser, sẽ thấy Nginx welcome page.

Cài đặt PM2 process manager globally bằng npm. PM2 sẽ được sử dụng để quản lý Node.js applications, đảm bảo chúng chạy liên tục và tự động restart khi crash.

Cài đặt Git để clone source code bằng apt. Cấu hình Git với user name và email.

Cài đặt Certbot để tự động hóa việc cấp phát và gia hạn SSL certificates từ Let's Encrypt bằng apt.

**Cấu hình Firewall**

Cấu hình UFW (Uncomplicated Firewall) để control traffic đến và đi từ server. Enable UFW, allow SSH port, allow HTTP port 80 và HTTPS port 443. Check status để verify chỉ các ports cần thiết được mở.

### 3.3.3. Deploy ứng dụng

Sau khi chuẩn bị xong server, bước tiếp theo là deploy ứng dụng lên server.

**Clone source code và cài đặt dependencies**

Tạo thư mục để chứa ứng dụng. Thông thường, applications được đặt trong /var/www. Tạo thư mục bằng mkdir và thay đổi ownership sang deploy user.

Navigate vào thư mục và clone repository từ Git. Nếu repository là private, cần setup SSH key hoặc personal access token để authenticate. Sau khi clone xong, sẽ có cấu trúc thư mục với client và server folders.

Cài đặt dependencies cho backend. Navigate vào thư mục server và chạy npm ci với flag --production. Lệnh npm ci được khuyến nghị cho production thay vì npm install vì nó cài đặt chính xác các phiên bản trong package-lock.json, nhanh hơn và đảm bảo tính nhất quán.

Cài đặt dependencies cho frontend. Navigate vào thư mục client và chạy npm ci với flag --production.

**Cấu hình Environment Variables**

Tạo file .env trong thư mục server với các environment variables cho production. Các giá trị cần khác với development environment.

DATABASE_URL sử dụng credentials của production database đã tạo ở bước trước. REDIS_URL trỏ đến Redis server trên localhost với password. JWT_SECRET cần generate một secret key mới, khác với development, sử dụng crypto.randomBytes để tạo chuỗi random 64 characters. JWT_EXPIRES_IN có thể set ngắn hơn development, ví dụ 1d hoặc 3d để tăng bảo mật.

NODE_ENV phải được set thành production. Biến này ảnh hưởng đến behavior của nhiều libraries, ví dụ Express sẽ cache views, React sẽ optimize performance và remove development warnings. PORT có thể set thành 5000 hoặc port khác, Nginx sẽ proxy requests đến port này.

GEMINI_API_KEY, CLOUDINARY credentials và EMAIL SMTP settings sử dụng production credentials. Đảm bảo các API keys này có rate limits và quotas phù hợp cho production usage. FRONTEND_URL set thành domain name thực tế của website.

Tương tự, tạo file .env.local trong thư mục client. NEXT_PUBLIC_API_URL và NEXT_PUBLIC_SOCKET_URL set thành production domain. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME set thành production Cloudinary cloud name.

**Setup Database**

Navigate vào thư mục server và generate Prisma Client bằng npx prisma generate. Run migrations bằng npx prisma migrate deploy. Lệnh này apply tất cả pending migrations lên production database. Seed initial data bằng npm run seed để tạo admin account và sample data.

**Build applications**

Trước khi chạy ứng dụng trong production mode, cần build chúng để optimize performance.

Build backend bằng cách navigate vào thư mục server và chạy npm run build. Lệnh này compile TypeScript code sang JavaScript và đặt output trong thư mục dist. TypeScript compiler sẽ check types và báo errors nếu có.

Build frontend bằng cách navigate vào thư mục client và chạy npm run build. Next.js sẽ thực hiện production build, bao gồm compile TypeScript, optimize React components, generate static pages, bundle và minify JavaScript/CSS, optimize images và generate build manifest. Quá trình build có thể mất vài phút. Sau khi hoàn tất, Next.js sẽ hiển thị build summary với thông tin về page sizes và load times.


**Cấu hình PM2**

PM2 được sử dụng để quản lý Node.js processes trong production. Tạo file ecosystem.config.js trong thư mục root của dự án để cấu hình PM2.

File ecosystem.config.js export một object với apps array, mỗi element định nghĩa một application. Cho backend, cấu hình name là nhh-coffee-api, script là dist/index.js (compiled JavaScript file), cwd là ./server (working directory), instances là 4 (số instances chạy song song, nên bằng số CPU cores), exec_mode là cluster cho phép load balancing giữa các instances, env object chứa environment variables, error_log và out_log để lưu logs, và merge_logs để merge logs từ tất cả instances.

Cho frontend, cấu hình name là nhh-coffee-web, script là node_modules/next/dist/bin/next, args là start để chạy Next.js production server, cwd là ./client, instances là 2 (frontend thường cần ít instances hơn backend), exec_mode là cluster, env object với NODE_ENV production và PORT 3000, và log files.

Sau khi tạo ecosystem.config.js, start applications bằng PM2. Chạy pm2 start ecosystem.config.js từ thư mục root. PM2 sẽ start tất cả applications được định nghĩa trong config file. Sử dụng pm2 list để xem danh sách processes đang chạy, pm2 logs để xem logs real-time, pm2 monit để monitor CPU và memory usage, và pm2 describe để xem chi tiết về một process.

Để đảm bảo PM2 tự động start applications khi server reboot, chạy pm2 startup. PM2 sẽ generate startup script cho system init. Copy và chạy command được hiển thị để install startup script. Sau đó, chạy pm2 save để save current process list, PM2 sẽ restore các processes này khi server restart.

### 3.3.4. Cấu hình Nginx

Nginx đóng vai trò quan trọng trong production environment, hoạt động như reverse proxy, load balancer và web server. Nginx nhận requests từ Internet, forward đến đúng backend services và trả responses về clients.

**Cấu hình Reverse Proxy**

Tạo file cấu hình Nginx cho ứng dụng trong thư mục /etc/nginx/sites-available. Tạo file mới với tên nhh-coffee bằng text editor.

Cấu hình upstream blocks để định nghĩa backend servers. Tạo upstream block cho API server với tên api_backend, liệt kê các backend servers localhost:5000. Nginx sẽ load balance requests giữa các servers này. Tạo upstream block cho Next.js server với tên web_backend, trỏ đến localhost:3000.

Cấu hình server block cho HTTP port 80. Server block này sẽ redirect tất cả HTTP requests sang HTTPS để đảm bảo bảo mật. Directive listen 80 cho Nginx listen trên port 80. Directive server_name set domain name. Directive return 301 redirect tất cả requests sang HTTPS với status code 301 (permanent redirect).

Cấu hình server block cho HTTPS port 443 sẽ được thêm sau khi setup SSL certificate. Server block này chứa các location blocks để route requests đến đúng backend services.

Location block cho API requests với pattern /api sẽ match tất cả requests bắt đầu với /api. Bên trong block này, sử dụng proxy_pass để forward requests đến API backend. Thêm các proxy headers để preserve client information như Host, X-Real-IP, X-Forwarded-For và X-Forwarded-Proto. Thêm proxy_http_version 1.1 để support HTTP/1.1 và keep-alive connections.

Location block cho Socket.io với pattern /socket.io để handle WebSocket connections. Sử dụng proxy_pass để forward đến backend. Thêm WebSocket-specific headers như Upgrade và Connection upgrade để upgrade HTTP connection sang WebSocket. Thêm proxy_cache_bypass để bypass cache cho WebSocket connections.

Location block cho Next.js với pattern / sẽ match tất cả requests không match các location blocks trước đó. Sử dụng proxy_pass để forward đến Next.js server. Thêm các proxy headers tương tự như API location.

**Tối ưu hóa hiệu suất**

Thêm các directives để tối ưu hóa hiệu suất Nginx.

Enable gzip compression để giảm kích thước responses. Trong server block, thêm gzip on, gzip_vary on, gzip_proxied any, gzip_comp_level 6 (compression level từ 1-9, 6 là balance tốt giữa compression ratio và CPU usage), gzip_types với danh sách MIME types cần compress như text/plain, text/css, application/json, application/javascript. Gzip có thể giảm response size 70-80%, cải thiện load times đáng kể.

Cấu hình caching cho static assets. Thêm location block để match static files như jpg, jpeg, png, gif, ico, css, js, svg, woff, woff2, ttf, eot. Bên trong block, set expires 1y để set cache expiration 1 năm, add_header Cache-Control public immutable để instruct browsers cache aggressively, và access_log off để disable access logging cho static files giảm I/O.

Set client body size limit để prevent large uploads. Thêm client_max_body_size 10M trong server block. Giá trị này nên đủ lớn cho product images và user avatars nhưng không quá lớn để tránh abuse.

Cấu hình timeouts phù hợp. Set proxy_connect_timeout, proxy_send_timeout và proxy_read_timeout 60 seconds để avoid premature timeouts cho slow requests. Set keepalive_timeout 65 để maintain keep-alive connections trong 65 seconds, giảm overhead của việc tạo connections mới.

**Enable cấu hình và restart Nginx**

Sau khi tạo file cấu hình, cần enable nó và restart Nginx. Tạo symbolic link từ sites-available sang sites-enabled. Nginx chỉ load configs từ sites-enabled.

Test cấu hình Nginx bằng nginx -t. Lệnh này check syntax errors và configuration issues. Nếu test thành công, sẽ hiển thị syntax is ok và test is successful. Nếu có errors, đọc error messages và fix issues trong config file.

Reload Nginx để apply changes. Reload graceful hơn restart, không drop existing connections. Nếu có major changes, có thể restart.

Verify Nginx đang serve ứng dụng bằng cách truy cập IP address của server trong browser. Nếu cấu hình đúng, sẽ thấy Next.js application.

### 3.3.5. Cấu hình SSL/TLS

SSL/TLS certificate đảm bảo kết nối HTTPS an toàn giữa clients và server, mã hóa dữ liệu truyền tải và xác thực identity của server. Let's Encrypt cung cấp SSL certificates miễn phí với automated renewal.

**Cài đặt Certbot và obtain certificate**

Certbot là tool chính thức của Let's Encrypt để obtain và renew SSL certificates. Certbot đã được cài đặt ở bước chuẩn bị server. Plugin Nginx cho phép Certbot tự động cấu hình Nginx với SSL certificate.

Trước khi chạy Certbot, cần đảm bảo domain name đã được point đến server IP address. Cấu hình DNS records tại domain registrar hoặc DNS provider: tạo A record trỏ domain đến server IP và tạo A record cho www subdomain đến cùng IP. DNS propagation có thể mất vài phút đến vài giờ. Verify DNS đã propagate bằng nslookup hoặc online DNS checker tools.

Chạy Certbot để obtain certificate. Certbot sẽ thực hiện các bước sau: verify domain ownership bằng cách tạo temporary file trên server và request Let's Encrypt servers truy cập file đó qua HTTP, obtain certificate từ Let's Encrypt nếu verification thành công, tự động modify Nginx configuration để enable HTTPS và setup redirect từ HTTP sang HTTPS.

Trong quá trình chạy, Certbot sẽ hỏi một số questions: email address để nhận renewal reminders và security notices, agree to Terms of Service, và có muốn share email với EFF không (optional). Certbot cũng hỏi có muốn redirect tất cả HTTP traffic sang HTTPS không, chọn option Redirect để force HTTPS.

Sau khi hoàn tất, Certbot sẽ hiển thị success message với thông tin về certificate location và expiration date. Certificates được lưu trong /etc/letsencrypt/live/domain/. Nginx config file sẽ được update với SSL directives.

**Verify SSL Configuration**

Mở Nginx config file để xem changes do Certbot thêm vào. Certbot đã thêm server block mới cho HTTPS port 443 với các directives: listen 443 ssl để listen trên port 443 với SSL, ssl_certificate trỏ đến fullchain.pem (certificate chain), ssl_certificate_key trỏ đến privkey.pem (private key), và include options-ssl-nginx.conf để include SSL best practices configuration. File options-ssl-nginx.conf chứa các settings như SSL protocols TLSv1.2 và TLSv1.3, SSL ciphers và SSL session settings.

Test HTTPS bằng cách truy cập domain trong browser. Browser sẽ hiển thị padlock icon trong address bar, indicating secure connection. Click vào padlock để xem certificate details, verify certificate được issued bởi Let's Encrypt và valid cho domain.

Test SSL configuration quality bằng online tools như SSL Labs SSL Test. Tool này analyze SSL/TLS configuration và cho điểm từ A+ đến F. Với Certbot default configuration, thường đạt grade A.

**Automated Certificate Renewal**

Let's Encrypt certificates có validity period 90 ngày. Certbot tự động setup renewal mechanism khi cài đặt. Certbot tạo systemd timer hoặc cron job để chạy renewal command hai lần mỗi ngày. Renewal command check xem certificate có sắp expire không (trong vòng 30 ngày), nếu có thì renew certificate và reload Nginx.

Verify renewal mechanism đang hoạt động bằng systemctl status certbot.timer cho systemd timer hoặc cat /etc/cron.d/certbot cho cron job. Timer hoặc cron job nên được enabled và active.

Test renewal process bằng certbot renew --dry-run. Lệnh này simulate renewal process mà không thực sự renew certificate. Nếu dry run thành công, nghĩa là automated renewal sẽ hoạt động khi certificate sắp expire.

Certbot logs được lưu trong /var/log/letsencrypt/. Có thể check logs để troubleshoot renewal issues nếu cần. Certbot cũng gửi email notifications đến email address đã đăng ký khi certificate sắp expire và renewal fails, cho phép admin can thiệp kịp thời.

### 3.3.6. Backup và Monitoring

Việc thiết lập backup và monitoring là cần thiết để đảm bảo hệ thống có thể recover từ disasters và phát hiện issues sớm.

**Setup automated database backups**

Tạo backup script để tự động backup database. Script sử dụng pg_dump để backup PostgreSQL database vào file SQL với timestamp trong tên file. Script cũng tự động xóa các backup files cũ hơn 7 ngày để tiết kiệm disk space.

Make script executable và setup cron job để chạy script tự động. Cron job được cấu hình để chạy daily lúc 2 AM. Mỗi lần chạy, script sẽ tạo backup file mới và log output vào file log.

Ngoài local backups, nên upload backups lên off-site location như cloud storage (AWS S3, Google Cloud Storage, Backblaze B2) để protect data khỏi server failures. Có thể sử dụng tools như rclone để automate upload process.

Định kỳ test backup restoration để verify backup files không corrupt và restoration process hoạt động. Document restoration procedures để có thể quickly recover trong emergency.

**Monitoring**

Monitor PM2 processes bằng pm2 monit để xem real-time CPU và memory usage của các applications. Monitor system resources bằng htop để xem overall system performance.

View logs để troubleshoot issues. PM2 logs có thể xem bằng pm2 logs. Nginx logs bao gồm access.log và error.log có thể xem bằng tail. System logs có thể xem bằng journalctl.

Setup uptime monitoring bằng external services như UptimeRobot (miễn phí), Pingdom hoặc StatusCake. Các services này ping website định kỳ và gửi alerts qua email hoặc SMS khi website down. Uptime monitoring giúp phát hiện downtime nhanh chóng ngay cả khi không actively monitoring server.


### 3.3.7. Deployment workflow

Sau khi hệ thống được deploy lần đầu, cần có quy trình chuẩn để update ứng dụng khi có code changes mới.

**Update ứng dụng với zero-downtime deployment**

Khi có code changes cần deploy, SSH vào server và navigate to project directory. Pull latest code từ Git repository bằng git pull. Cài đặt dependencies mới nếu có bằng npm ci với flag --production cho cả backend và frontend. Build applications bằng npm run build cho cả backend và frontend.

Nếu có database migrations, chạy npx prisma migrate deploy để apply migrations lên production database. Migrations cần được test kỹ trong development environment trước khi apply lên production.

Reload PM2 để apply changes bằng pm2 reload ecosystem.config.js. PM2 reload thực hiện zero-downtime deployment bằng cách start new instances trước, chờ chúng ready, sau đó gracefully shutdown old instances. Quá trình này đảm bảo không có downtime cho users.

**Rollback nếu có issues**

Nếu deployment gặp issues, cần có khả năng rollback nhanh chóng về version trước đó. Sử dụng git log để xem commit history và identify commit trước đó. Checkout về commit đó bằng git checkout. Rebuild applications và reload PM2. Rollback nên được thực hiện càng nhanh càng tốt để minimize impact lên users.

**Health checks**

Sau mỗi deployment, cần kiểm tra hệ thống hoạt động bình thường. Check PM2 status bằng pm2 list để verify tất cả processes đang running. View application logs bằng pm2 logs để check for errors. Test API bằng curl hoặc Postman để verify endpoints hoạt động. Test frontend bằng cách truy cập website trong browser và navigate qua các pages chính.

### 3.3.8. Security best practices

Bảo mật là yếu tố quan trọng nhất trong production environment. Ngoài các biện pháp bảo mật đã implement ở các bước trước, cần maintain security posture thông qua regular updates và audits.

**Regular updates**

Update system packages monthly bằng apt update và apt upgrade để có latest security patches. Update Node.js packages bằng npm audit để scan dependencies cho known vulnerabilities. npm audit fix có thể tự động fix một số vulnerabilities. Cho vulnerabilities không thể auto-fix, cần manually update vulnerable packages hoặc find alternatives.

Subscribe to security advisories của các libraries chính như Express, Next.js, Prisma để được notify về vulnerabilities sớm và có thể patch kịp thời.

**Security checklist**

Verify các security measures đã được implement: SSH key authentication only không cho phép passwords, custom SSH port không phải 22, UFW firewall enabled với chỉ necessary ports open, PostgreSQL restricted to localhost không expose ra Internet, Redis password protected, strong passwords everywhere với minimum 16 characters, HTTPS enforced với HTTP redirects to HTTPS, security headers in Nginx như X-Frame-Options và X-Content-Type-Options, rate limiting in application để prevent brute force attacks, regular backups được test, và monitoring and alerts setup.

**Application security**

Các security measures đã implement trong application code bao gồm: input validation với Zod để ensure request data đúng type và format, SQL injection prevention với Prisma ORM vì Prisma sử dụng parameterized queries, XSS prevention với sanitization của user-generated content, CSRF protection với tokens, rate limiting cho API endpoints để prevent abuse, JWT authentication với secure tokens, bcrypt password hashing để protect passwords, và secure cookies với httpOnly, secure và sameSite flags.

Định kỳ review code để identify security issues, test authentication và authorization mechanisms, check for common vulnerabilities, và có thể sử dụng automated security scanning tools hoặc hire security professionals cho comprehensive audits.

## 3.4. KẾT LUẬN

Chương 3 đã trình bày đầy đủ và chi tiết quy trình cài đặt và triển khai hệ thống quản lý quán cà phê NHH-Coffee từ môi trường phát triển đến môi trường sản xuất. Việc tuân thủ các quy trình và best practices được trình bày trong chương này đảm bảo hệ thống được thiết lập đúng cách, hoạt động ổn định và bảo mật trong môi trường thực tế.

Phần Cài đặt hệ thống đã hướng dẫn chi tiết việc thiết lập môi trường phát triển trên máy local. Bắt đầu từ việc xác định yêu cầu hệ thống về phần cứng và phần mềm, chương đã trình bày từng bước cài đặt các công cụ cần thiết bao gồm Node.js, PostgreSQL, Redis và Git. Quá trình cấu hình dự án được mô tả chi tiết từ clone repository, cài đặt dependencies, cấu hình environment variables, đến thiết lập database schema với Prisma ORM. Việc sử dụng Prisma migrations đảm bảo database schema được quản lý một cách có hệ thống và có thể reproduce trên các môi trường khác nhau. Phần này cũng hướng dẫn cách khởi chạy ứng dụng trong development mode với nodemon cho backend và Next.js development server cho frontend, cung cấp hot reload và các tính năng hỗ trợ phát triển. Workflow phát triển được trình bày với các best practices về debugging, testing và xử lý common errors, giúp lập trình viên làm việc hiệu quả hơn.

Phần Triển khai hệ thống đã trình bày quy trình đưa hệ thống lên môi trường production trên VPS một cách chuyên nghiệp và bảo mật. Quá trình bắt đầu với việc lựa chọn VPS phù hợp về cấu hình và nhà cung cấp, sau đó là các bước chuẩn bị máy chủ với focus mạnh vào bảo mật. Việc cấu hình SSH security, tạo sudo user thay vì sử dụng root, và setup firewall là những biện pháp bảo mật cơ bản nhưng quan trọng. Cài đặt và cấu hình các services như PostgreSQL, Redis, Nginx và PM2 được thực hiện theo best practices để đảm bảo hiệu suất và bảo mật. Quá trình deploy ứng dụng với PM2 cluster mode cho phép tận dụng multi-core CPU và đảm bảo high availability. Cấu hình Nginx làm reverse proxy và load balancer với các optimizations như gzip compression và static file caching giúp cải thiện performance đáng kể. Setup SSL/TLS certificates từ Let's Encrypt với automated renewal đảm bảo kết nối HTTPS an toàn mà không tốn chi phí. Phần này cũng trình bày về automated backups, monitoring và deployment workflow với zero-downtime updates, đảm bảo hệ thống có thể được maintain và update một cách an toàn.

Các biện pháp bảo mật được implement ở nhiều layers khác nhau. Ở infrastructure level, firewall và SSH hardening bảo vệ server khỏi unauthorized access. Ở database level, restricted access và strong passwords bảo vệ dữ liệu. Ở application level, input validation, rate limiting và secure authentication bảo vệ khỏi common attacks. Ở operational level, monitoring và backup strategy đảm bảo có thể phát hiện và recover từ issues nhanh chóng.

Quy trình cài đặt và triển khai được document chi tiết trong chương này cung cấp foundation vững chắc cho việc phát triển và vận hành hệ thống NHH-Coffee. Việc sử dụng các công nghệ modern và proven như Next.js, Express.js, PostgreSQL, Redis, Nginx và PM2 đảm bảo hệ thống có performance tốt, scalable và maintainable. Kiến trúc được thiết kế cho phép dễ dàng scale horizontally bằng cách thêm servers vào load balancer khi lượng traffic tăng.

Với môi trường đã được thiết lập đầy đủ theo hướng dẫn trong chương này, hệ thống NHH-Coffee sẵn sàng để phục vụ người dùng với các tính năng quản lý bán hàng, quản lý kho, quản lý nhân viên, chatbot AI và các chức năng khác. Các quy trình deployment và maintenance được chuẩn hóa giúp team có thể quickly deploy updates và fix issues khi cần. Monitoring và alerting cho phép proactive detection của problems trước khi chúng impact users. Backup strategy đảm bảo data có thể được recovered trong worst-case scenarios.

Tóm lại, chương 3 đã cung cấp một hướng dẫn toàn diện và thực tế về cài đặt và triển khai hệ thống, từ development environment trên máy local đến production environment trên VPS. Việc follow các best practices về performance, security và reliability được trình bày trong chương này đảm bảo hệ thống NHH-Coffee có thể hoạt động ổn định, bảo mật và hiệu quả trong môi trường thực tế, đáp ứng nhu cầu của người dùng và có khả năng mở rộng trong tương lai.
