# CHƯƠNG 3: MÔI TRƯỜNG CÀI ĐẶT VÀ TRIỂN KHAI

## 3.1. GIỚI THIỆU

Chương này trình bày môi trường cài đặt và triển khai hệ thống quản lý quán cà phê NHH-Coffee. Hệ thống được xây dựng trên kiến trúc Client-Server với frontend sử dụng Next.js 16 và backend sử dụng Express.js kết hợp PostgreSQL. Chương được chia thành hai phần chính: Môi trường cài đặt cho quá trình phát triển và Môi trường triển khai cho vận hành thực tế.

## 3.2. MÔI TRƯỜNG CÀI ĐẶT

Môi trường cài đặt (Development Environment) là nơi đội ngũ phát triển thực hiện công việc lập trình, kiểm thử và debug ứng dụng. Môi trường này được thiết lập trên máy tính cá nhân của lập trình viên với các công cụ và phần mềm hỗ trợ quá trình phát triển.

### 3.2.1. Yêu cầu phần cứng

Để đảm bảo quá trình phát triển diễn ra suôn sẻ, máy tính phát triển cần đáp ứng các yêu cầu sau:

**Cấu hình tối thiểu:**
- Bộ vi xử lý: Intel Core i5 thế hệ 8 trở lên hoặc AMD Ryzen 5 series 3000 trở lên
- Bộ nhớ RAM: 8GB
- Ổ cứng: SSD với 20GB dung lượng trống
- Kết nối mạng: Internet ổn định tốc độ 10Mbps trở lên

**Cấu hình khuyến nghị:**
- Bộ vi xử lý: Intel Core i7 hoặc AMD Ryzen 7 để tăng tốc độ biên dịch TypeScript và build ứng dụng
- Bộ nhớ RAM: 16GB để chạy đồng thời nhiều ứng dụng như IDE, trình duyệt, servers và database
- Ổ cứng: SSD NVMe để đạt hiệu suất tốt nhất
- Kết nối mạng: 20Mbps trở lên

Lý do lựa chọn: Cấu hình này đảm bảo lập trình viên có thể chạy đồng thời Visual Studio Code, trình duyệt với nhiều tabs, backend server, frontend server, PostgreSQL database và các công cụ phát triển khác mà không gặp tình trạng thiếu tài nguyên.

### 3.2.2. Yêu cầu phần mềm

**Hệ điều hành:**
- Windows 10 hoặc Windows 11
- macOS 12 trở lên
- Ubuntu 20.04 LTS trở lên

**Phần mềm cốt lõi:**

Node.js phiên bản 20.x hoặc 22.x LTS là nền tảng runtime cho cả frontend và backend. Phiên bản LTS được chọn vì tính ổn định, được hỗ trợ lâu dài và có các bản vá bảo mật thường xuyên. Node.js 20.x mang lại hiệu suất tốt hơn nhờ cải tiến V8 engine và hỗ trợ tốt hơn cho ES modules.

PostgreSQL phiên bản 15.x hoặc 16.x đóng vai trò là hệ quản trị cơ sở dữ liệu quan hệ chính. PostgreSQL được chọn vì là open-source, hiệu suất cao, hỗ trợ ACID transactions đầy đủ, có khả năng mở rộng tốt và hỗ trợ JSON data type phù hợp cho các trường dữ liệu linh hoạt.

Redis phiên bản 7.x được sử dụng cho caching và session storage. Redis là in-memory data store cung cấp tốc độ truy xuất cực nhanh. Tuy nhiên, Redis là optional vì hệ thống có cơ chế fallback sang memory cache khi Redis không khả dụng.

Git phiên bản 2.x trở lên được sử dụng để quản lý mã nguồn và version control. Git cho phép nhiều lập trình viên làm việc đồng thời, theo dõi lịch sử thay đổi code và dễ dàng rollback khi cần.

**Công cụ phát triển:**

Visual Studio Code là IDE được khuyến nghị vì cung cấp hỗ trợ tốt cho TypeScript, React và Node.js thông qua các extensions như ESLint, Prettier, TypeScript, React, Prisma và GitLens. VS Code có tính năng IntelliSense mạnh mẽ, integrated terminal, debugging tools và Git integration.

Postman hoặc Thunder Client được sử dụng để kiểm thử API. Các công cụ này cho phép gửi HTTP requests, xem responses, lưu trữ collections của API endpoints và tự động hóa testing.

pgAdmin hoặc DBeaver được sử dụng để quản lý cơ sở dữ liệu PostgreSQL. pgAdmin là công cụ chính thức của PostgreSQL cung cấp giao diện web-based để quản lý databases, tables, views và execute SQL queries.

### 3.2.3. Kiến trúc công nghệ

**Lớp Frontend (Presentation Layer):**

Next.js 16 với React 19 được sử dụng làm framework chính cho frontend. Next.js cung cấp Server-Side Rendering (SSR), Static Site Generation (SSG) và Incremental Static Regeneration (ISR), giúp cải thiện SEO và hiệu suất tải trang. TypeScript được sử dụng để đảm bảo type safety và giảm bugs. Radix UI kết hợp với Tailwind CSS tạo nên hệ thống UI components nhất quán và accessible.

React Context API được sử dụng để quản lý state toàn cục như authentication state, cart state, wishlist và chat state. Socket.io Client đảm nhận việc giao tiếp real-time với server để nhận updates về order status, messages và notifications. React Hook Form kết hợp với Zod validation xử lý forms và validation.

**Lớp Backend (Application Layer):**

Express.js làm framework chính cho RESTful API. Express.js là minimal và flexible Node.js web framework, cung cấp robust routing, middleware system và HTTP utility methods. Prisma ORM cung cấp type-safe database access, tự động generate TypeScript types từ database schema và hỗ trợ migrations.

Socket.io Server xử lý các kết nối WebSocket cho real-time features, tạo rooms cho các nhóm users khác nhau và emit events khi có updates. Zod validation được sử dụng để validate request data. JWT (JSON Web Token) được sử dụng cho authentication. Bcrypt được sử dụng để hash passwords.

**Lớp Dữ liệu (Data Layer):**

PostgreSQL lưu trữ dữ liệu chính với schema được thiết kế chuẩn hóa theo Third Normal Form (3NF). Database schema bao gồm 25+ tables như users, products, categories, orders, order_items, reviews, notifications, chat_sessions và các bảng khác. Mỗi table có primary key (UUID), foreign keys để maintain referential integrity, indexes để tối ưu query performance và constraints để đảm bảo data integrity.

Redis cache tăng tốc độ truy xuất dữ liệu bằng cách cache các dữ liệu frequently accessed như product lists, product details, categories và user carts. Cloudinary lưu trữ và phân phối hình ảnh qua CDN, cung cấp image upload API, automatic optimization và global CDN delivery.

**Dịch vụ bên ngoài:**

Google Gemini AI (gemini-1.5-flash model) cung cấp khả năng chatbot thông minh để xử lý customer inquiries, trả lời câu hỏi về products và provide recommendations. Nodemailer với SMTP được sử dụng để gửi email thông báo cho các events như registration OTP, password reset và order confirmation. Web Push API hỗ trợ push notifications để gửi notifications đến users ngay cả khi họ không mở website.

### 3.2.4. Cấu trúc dự án

Dự án NHH-Coffee có cấu trúc monorepo với hai thư mục chính:

**Thư mục client (Frontend):**
- app/: Next.js App Router với các routes và pages
- components/: React components được tổ chức theo modules (admin, auth, cart, chat, product, v.v.)
- contexts/: React Context providers cho state management
- hooks/: Custom React hooks
- lib/: Utilities, API client, types và constants
- public/: Static assets như images và icons
- styles/: Global CSS styles

**Thư mục server (Backend):**
- src/config/: Configuration files
- src/db/: Database related files (migrations, seed scripts)
- src/middleware/: Express middlewares (auth, rate-limit, security)
- src/routes/: API route handlers
- src/services/: Business logic services
- src/socket/: Socket.io handlers
- src/types/: TypeScript type definitions
- src/validations/: Zod validation schemas
- prisma/: Prisma schema và migrations

### 3.2.5. Quy trình phát triển

Trong môi trường development, lập trình viên chạy hai servers đồng thời: backend server trên port 5000 với nodemon tự động restart khi có file changes, và frontend server trên port 3000 với Next.js Fast Refresh tự động update UI. Backend expose RESTful API tại http://localhost:5000/api và Socket.io server tại http://localhost:5000. Frontend accessible tại http://localhost:3000.

Prisma ORM được sử dụng để quản lý database schema. Khi có thay đổi schema, lập trình viên update file prisma/schema.prisma và chạy prisma migrate dev để generate migration files và apply changes lên database. Prisma Client được tự động regenerate với types tương ứng.

Debugging được thực hiện bằng VS Code debugger cho backend với breakpoints và variable inspection, và browser DevTools cho frontend với React DevTools extension. Logs được output ra console và có thể view real-time trong terminal.

## 3.3. MÔI TRƯỜNG TRIỂN KHAI

Môi trường triển khai (Production Environment) là nơi hệ thống được đưa vào vận hành thực tế để phục vụ người dùng cuối. Môi trường này yêu cầu cấu hình mạnh mẽ hơn, tập trung vào hiệu suất, bảo mật và độ tin cậy.

### 3.3.1. Yêu cầu phần cứng

**Cấu hình VPS tối thiểu:**
- Bộ vi xử lý: 4 cores vCPU
- Bộ nhớ RAM: 8GB
- Ổ cứng: 100GB SSD
- Băng thông: 1TB/tháng với tốc độ 100Mbps
- Hệ điều hành: Ubuntu 22.04 LTS

**Phân bổ tài nguyên:**
- Hệ điều hành và services: 2GB RAM
- PostgreSQL database: 2GB RAM
- Redis cache: 512MB RAM
- Backend (Express API với 4 instances): 2GB RAM
- Frontend (Next.js với 2 instances): 1.5GB RAM

**Cấu hình khuyến nghị cho high traffic:**
- Bộ vi xử lý: 8 cores vCPU để xử lý 500+ concurrent users
- Bộ nhớ RAM: 16GB để có dư địa cho việc mở rộng
- Ổ cứng: 200GB SSD với phân bổ 30GB cho database, 20GB cho logs/backups

Lý do lựa chọn: Với 4 cores CPU, PM2 có thể chạy 4 instances của backend trong cluster mode, mỗi instance xử lý một phần traffic. SSD đảm bảo tốc độ truy xuất database nhanh, giảm latency cho người dùng. Ubuntu 22.04 LTS được chọn vì tính ổn định, bảo mật được cập nhật thường xuyên và được hỗ trợ đến năm 2027.

### 3.3.2. Nhà cung cấp VPS

**DigitalOcean:**
- Gói Droplet: $40-80/tháng
- Datacenter: Singapore (latency thấp cho Việt Nam)
- Ưu điểm: Giao diện quản lý đơn giản, tài liệu hướng dẫn chi tiết, community support tốt

**Vultr:**
- Gói Cloud Compute: $40-80/tháng
- Datacenter: Singapore, Tokyo
- Ưu điểm: Hiệu suất tốt, nhiều lựa chọn về vị trí datacenter, giá cạnh tranh

**Linode:**
- Gói Shared CPU: $40-80/tháng
- Datacenter: Singapore
- Ưu điểm: Độ tin cậy cao, hỗ trợ khách hàng tốt, uptime guarantee 99.9%

**AWS EC2:**
- Instance type: t3.large hoặc t3.xlarge
- Region: ap-southeast-1 (Singapore)
- Ưu điểm: Khả năng mở rộng linh hoạt, tích hợp với các dịch vụ AWS khác, auto-scaling

### 3.3.3. Yêu cầu phần mềm production

**Hệ điều hành và runtime:**
- Ubuntu 22.04 LTS: Hệ điều hành server ổn định với long-term support
- Node.js 20.x: Runtime cho backend và frontend
- npm 10.x: Package manager

**Database và caching:**
- PostgreSQL 15.x: Database chính với production-grade configuration
- Redis 7.x: Caching layer với persistence enabled

**Web server và process manager:**
- Nginx 1.24.x: Reverse proxy, load balancer và web server
- PM2 5.x: Process manager cho Node.js applications với cluster mode

**Security và SSL:**
- Certbot: Automated SSL certificate management từ Let's Encrypt
- UFW (Uncomplicated Firewall): Firewall management

**Monitoring và backup:**
- PM2 monitoring: Built-in process monitoring
- Cron jobs: Automated backup scheduling
- External uptime monitoring: UptimeRobot hoặc Pingdom

### 3.3.4. Kiến trúc triển khai

**Nginx Reverse Proxy:**

Nginx đóng vai trò là entry point cho tất cả requests từ Internet. Nginx listen trên port 80 (HTTP) và 443 (HTTPS), nhận requests và forward đến đúng backend services. Nginx cũng xử lý SSL/TLS termination, serving static files, gzip compression và caching.

Upstream configuration định nghĩa api_backend trỏ đến localhost:5000 cho Express API và web_backend trỏ đến localhost:3000 cho Next.js. Location blocks route requests: /api forward đến api_backend, /socket.io forward đến api_backend với WebSocket support, và / forward đến web_backend.

**PM2 Cluster Mode:**

PM2 quản lý Node.js processes với cluster mode để tận dụng multi-core CPU. Backend chạy 4 instances (bằng số CPU cores) trong cluster mode, mỗi instance là một separate process xử lý một phần traffic. PM2 tự động load balance requests giữa các instances. Frontend chạy 2 instances vì Next.js đã optimize cho SSR.

PM2 tự động restart processes khi crash, maintain logs, và cung cấp zero-downtime reload khi deploy updates. PM2 startup script đảm bảo applications tự động start khi server reboot.

**Database Configuration:**

PostgreSQL được cấu hình để chỉ accept connections từ localhost, không expose ra Internet. Connection pooling được enable với max connections 100. Shared buffers được set 25% của RAM (2GB), effective cache size 50% của RAM (4GB). Indexes được tạo cho các columns thường xuyên được query để optimize performance.

Redis được cấu hình với maxmemory 512MB và maxmemory-policy allkeys-lru để evict least recently used keys khi hết memory. Redis persistence được enable với RDB snapshots và AOF (Append Only File) để đảm bảo data không bị mất khi restart.

**SSL/TLS Configuration:**

Let's Encrypt cung cấp SSL certificates miễn phí với validity period 90 ngày. Certbot tự động obtain certificates, configure Nginx và setup renewal mechanism. Certificates được renew tự động trước khi expire. SSL configuration sử dụng TLS 1.2 và TLS 1.3, disable older protocols, và sử dụng strong cipher suites để đạt grade A trên SSL Labs test.

### 3.3.5. Bảo mật

**Infrastructure Security:**

SSH được hardened bằng cách disable root login, disable password authentication (chỉ cho phép SSH key), và thay đổi SSH port từ 22 sang port khác để tránh automated attacks. UFW firewall được enable với chỉ necessary ports open: SSH port, HTTP port 80 và HTTPS port 443. Tất cả ports khác bị block.

**Database Security:**

PostgreSQL restricted to localhost, không accept connections từ external IPs. Database user có strong password với minimum 16 characters. Redis password protected và chỉ listen trên localhost. Database backups được encrypt trước khi upload lên cloud storage.

**Application Security:**

Input validation với Zod đảm bảo request data đúng type và format. SQL injection prevention với Prisma ORM vì Prisma sử dụng parameterized queries. XSS prevention với sanitization của user-generated content. CSRF protection với tokens. Rate limiting cho API endpoints để prevent brute force attacks và DDoS. JWT authentication với secure tokens và short expiration time. Bcrypt password hashing với salt rounds 10. Secure cookies với httpOnly, secure và sameSite flags.

**HTTPS Enforcement:**

Tất cả HTTP traffic được redirect sang HTTPS. HSTS (HTTP Strict Transport Security) header được set để force browsers chỉ sử dụng HTTPS. Security headers như X-Frame-Options, X-Content-Type-Options và X-XSS-Protection được add vào responses.

### 3.3.6. Backup và Recovery

**Automated Database Backups:**

Cron job chạy daily lúc 2 AM để backup PostgreSQL database bằng pg_dump. Backup files được lưu với timestamp trong filename (ví dụ db_20260201_020000.sql). Script tự động xóa backups cũ hơn 7 ngày để tiết kiệm disk space. Backups được upload lên cloud storage như AWS S3 hoặc Google Cloud Storage để protect khỏi server failures.

**Backup Retention Policy:**
- Daily backups: Giữ 7 ngày
- Weekly backups: Giữ 4 tuần
- Monthly backups: Giữ 12 tháng

**Recovery Procedures:**

Trong trường hợp data loss, restore database từ latest backup bằng psql. Test restoration process định kỳ (monthly) để verify backups hoạt động. Document restoration procedures chi tiết để có thể quickly recover trong emergency. Recovery Time Objective (RTO) là 1 giờ, Recovery Point Objective (RPO) là 24 giờ.

### 3.3.7. Monitoring và Alerting

**Application Monitoring:**

PM2 monitoring cung cấp real-time metrics về CPU usage, memory usage, request rate và error rate của mỗi process. PM2 logs được centralized và có thể view bằng pm2 logs. Application logs được rotate daily để prevent disk space issues.

**System Monitoring:**

System resources (CPU, memory, disk, network) được monitor bằng htop hoặc monitoring tools. Disk space được check định kỳ để đảm bảo không bị full. Database performance được monitor bằng PostgreSQL pg_stat_statements extension để identify slow queries.

**Uptime Monitoring:**

External uptime monitoring services như UptimeRobot ping website mỗi 5 phút và send alerts qua email hoặc SMS khi website down. Response time được track để detect performance degradation. SSL certificate expiration được monitor để đảm bảo không bị expire.

**Alerting:**

Alerts được setup cho các conditions: website down hơn 5 phút, CPU usage trên 80% trong 10 phút, memory usage trên 90%, disk space dưới 10%, database connection errors, và SSL certificate sắp expire trong 7 ngày.

### 3.3.8. Deployment Workflow

**Zero-Downtime Deployment:**

Khi có code changes mới, pull latest code từ Git repository, install dependencies nếu có, build applications, apply database migrations nếu có, và reload PM2 bằng pm2 reload. PM2 reload thực hiện graceful reload bằng cách start new instances trước, wait cho chúng ready, sau đó shutdown old instances. Quá trình này đảm bảo không có downtime cho users.

**Rollback Strategy:**

Nếu deployment gặp issues, rollback về previous version bằng git checkout previous commit, rebuild applications và reload PM2. Rollback nên được thực hiện trong vòng 5 phút để minimize impact. Database migrations rollback cần được handle carefully vì có thể affect data integrity.

**Health Checks:**

Sau mỗi deployment, verify PM2 processes đang running, check application logs cho errors, test API endpoints, test frontend pages, verify database connections, và check SSL certificate. Automated health check scripts có thể được run để verify system health.

## 3.4. KẾT LUẬN

Chương 3 đã trình bày chi tiết về môi trường cài đặt và triển khai hệ thống NHH-Coffee. Môi trường cài đặt được thiết kế cho quá trình phát triển với các công cụ và phần mềm hỗ trợ lập trình viên làm việc hiệu quả. Môi trường triển khai được thiết kế cho vận hành thực tế với focus vào hiệu suất, bảo mật và độ tin cậy.

Việc sử dụng các công nghệ modern và proven như Next.js, Express.js, PostgreSQL, Redis, Nginx và PM2 đảm bảo hệ thống có performance tốt, scalable và maintainable. Kiến trúc được thiết kế cho phép dễ dàng scale horizontally bằng cách thêm servers vào load balancer khi traffic tăng. Các biện pháp bảo mật được implement ở nhiều layers đảm bảo hệ thống được protect khỏi common threats. Automated backups và monitoring đảm bảo data có thể recovered và issues có thể detected sớm.

Với môi trường đã được thiết lập theo mô tả trong chương này, hệ thống NHH-Coffee sẵn sàng phục vụ người dùng với đầy đủ tính năng quản lý bán hàng, quản lý kho, quản lý nhân viên và chatbot AI, hoạt động ổn định và có khả năng mở rộng trong tương lai.
