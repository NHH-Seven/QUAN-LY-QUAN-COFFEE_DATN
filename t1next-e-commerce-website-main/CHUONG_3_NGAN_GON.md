# CHƯƠNG 3: CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG

## 3.1. GIỚI THIỆU

Chương này trình bày quy trình cài đặt và triển khai hệ thống quản lý quán cà phê NHH-Coffee. Hệ thống được xây dựng trên kiến trúc Client-Server với frontend sử dụng Next.js 16 và backend sử dụng Express.js kết hợp PostgreSQL. Chương được chia thành hai phần chính: Cài đặt hệ thống trên môi trường phát triển và Triển khai hệ thống lên môi trường sản xuất.

## 3.2. CÀI ĐẶT HỆ THỐNG

### 3.2.1. Yêu cầu hệ thống

Môi trường phát triển yêu cầu máy tính với cấu hình tối thiểu bao gồm bộ vi xử lý Intel Core i5 hoặc AMD Ryzen 5, RAM 8GB (khuyến nghị 16GB), ổ cứng SSD với 20GB dung lượng trống, và kết nối Internet ổn định. Về phần mềm, cần cài đặt Node.js phiên bản 20.x hoặc 22.x LTS, PostgreSQL 15.x hoặc 16.x, Redis 7.x (optional), Git 2.x và IDE Visual Studio Code.

### 3.2.2. Cài đặt và cấu hình

**Cài đặt phần mềm cơ bản**

Node.js được cài đặt từ trang chủ nodejs.org cho Windows và macOS, hoặc từ NodeSource repository cho Linux. PostgreSQL được cài đặt từ postgresql.org, sau đó tạo database với tên nhh_coffee_dev và user nhh_user với password mạnh. Redis có thể cài đặt qua Homebrew trên macOS, apt trên Linux, hoặc Docker trên Windows. Git được cài đặt từ git-scm.com và cấu hình với user name và email.

**Cấu hình dự án**

Sau khi clone repository từ Git, cài đặt dependencies cho backend và frontend bằng lệnh npm ci. Tạo file .env trong thư mục server với các biến môi trường quan trọng bao gồm DATABASE_URL kết nối đến PostgreSQL, JWT_SECRET cho authentication, GEMINI_API_KEY cho chatbot AI, CLOUDINARY credentials cho upload images, và EMAIL SMTP settings. Tương tự, tạo file .env.local trong thư mục client với NEXT_PUBLIC_API_URL và NEXT_PUBLIC_SOCKET_URL trỏ đến backend.

**Thiết lập Database**

Sử dụng Prisma ORM để quản lý database schema. Chạy npx prisma generate để tạo Prisma Client, npx prisma migrate dev để tạo tables trong database, và npm run seed để tạo dữ liệu ban đầu bao gồm admin account với email admin@nhh-coffee.com và password Admin@123, các categories và sample products.

**Khởi chạy ứng dụng**

Backend được khởi chạy bằng npm run dev trong thư mục server, server sẽ listen trên port 5000 với nodemon tự động restart khi có thay đổi. Frontend được khởi chạy bằng npm run dev trong thư mục client, Next.js development server sẽ listen trên port 3000 với hot module replacement. Truy cập http://localhost:3000 để xem ứng dụng và http://localhost:5000/api để test API endpoints.

## 3.3. TRIỂN KHAI HỆ THỐNG

### 3.3.1. Yêu cầu và chuẩn bị

**Yêu cầu VPS**

Môi trường production yêu cầu VPS với cấu hình tối thiểu 4 cores CPU, 8GB RAM, 100GB SSD storage, băng thông 1TB/tháng và hệ điều hành Ubuntu 22.04 LTS. Các nhà cung cấp được khuyến nghị bao gồm DigitalOcean, Vultr, Linode hoặc AWS EC2 với datacenter tại Singapore hoặc Tokyo để giảm latency cho thị trường Việt Nam.

**Cấu hình bảo mật**

Sau khi tạo VPS và kết nối SSH, thực hiện các bước bảo mật cơ bản. Update toàn bộ system packages, tạo sudo user thay vì sử dụng root, cấu hình SSH để disable root login và password authentication, chỉ cho phép SSH key authentication, và thay đổi SSH port từ 22 sang port khác như 2222. Cài đặt UFW firewall và chỉ mở các ports cần thiết bao gồm SSH port, HTTP port 80 và HTTPS port 443.

**Cài đặt phần mềm**

Cài đặt Node.js 20.x từ NodeSource repository, PostgreSQL 15.x và tạo production database nhh_coffee_prod với user nhh_prod_user, Redis 7.x với password protection, Nginx làm web server và reverse proxy, PM2 làm process manager, Git để clone source code, và Certbot để quản lý SSL certificates.

### 3.3.2. Deploy ứng dụng

**Clone và build**

Clone source code vào thư mục /var/www/nhh-coffee, cài đặt dependencies bằng npm ci với flag --production cho cả backend và frontend. Cấu hình environment variables trong file .env cho backend và .env.local cho frontend với production credentials. Chạy Prisma migrations bằng npx prisma migrate deploy và seed initial data. Build backend bằng npm run build để compile TypeScript sang JavaScript, và build frontend bằng npm run build để tạo optimized production build.

**Cấu hình PM2**

Tạo file ecosystem.config.js để cấu hình PM2 với hai applications: backend chạy 4 instances trong cluster mode và frontend chạy 2 instances. Start applications bằng pm2 start ecosystem.config.js. Setup PM2 startup script để tự động start applications khi server reboot bằng pm2 startup và pm2 save.

### 3.3.3. Cấu hình Nginx và SSL

**Nginx Reverse Proxy**

Tạo Nginx configuration file trong /etc/nginx/sites-available/nhh-coffee. Cấu hình upstream blocks cho api_backend trỏ đến localhost:5000 và web_backend trỏ đến localhost:3000. Tạo server block cho HTTP port 80 redirect tất cả traffic sang HTTPS. Tạo server block cho HTTPS port 443 với các location blocks: /api forward đến api_backend, /socket.io forward đến api_backend với WebSocket support, và / forward đến web_backend. Enable gzip compression và static file caching để tối ưu performance. Enable configuration bằng symbolic link và reload Nginx.

**SSL/TLS Setup**

Cấu hình DNS records để point domain đến server IP address. Chạy Certbot để obtain SSL certificate từ Let's Encrypt, Certbot sẽ tự động verify domain ownership, obtain certificate và modify Nginx configuration để enable HTTPS. Certificates được lưu trong /etc/letsencrypt/live/domain/ và tự động renew trước khi expire. Test SSL configuration bằng SSL Labs để verify đạt grade A.

### 3.3.4. Backup và Monitoring

**Automated Backups**

Tạo backup script sử dụng pg_dump để backup PostgreSQL database daily vào thư mục /var/backups với timestamp trong filename. Setup cron job để chạy script tự động lúc 2 AM mỗi ngày. Script tự động xóa backups cũ hơn 7 ngày. Upload backups lên cloud storage như AWS S3 hoặc Google Cloud Storage để protect khỏi server failures. Định kỳ test backup restoration để verify backups hoạt động.

**Monitoring và Maintenance**

Monitor PM2 processes bằng pm2 monit và pm2 logs để xem real-time status và logs. Monitor system resources bằng htop. View Nginx logs trong /var/log/nginx/ để troubleshoot issues. Setup uptime monitoring bằng external services như UptimeRobot để nhận alerts khi website down. Định kỳ update system packages và npm packages để có latest security patches.

### 3.3.5. Deployment Workflow

**Update Process**

Khi có code changes mới, SSH vào server, pull latest code từ Git, cài đặt dependencies mới nếu có, build applications, apply database migrations nếu có, và reload PM2 bằng pm2 reload để thực hiện zero-downtime deployment. PM2 reload start new instances trước, chờ chúng ready, sau đó gracefully shutdown old instances, đảm bảo không có downtime cho users.

**Security Best Practices**

Maintain security posture thông qua regular updates của system packages và npm packages. Verify các security measures đã implement bao gồm SSH key authentication only, firewall enabled, database restricted to localhost, HTTPS enforced, rate limiting enabled, và strong passwords everywhere. Application security bao gồm input validation với Zod, SQL injection prevention với Prisma ORM, XSS prevention với sanitization, CSRF protection, JWT authentication, và bcrypt password hashing.

## 3.4. KẾT LUẬN

Chương 3 đã trình bày quy trình cài đặt và triển khai hệ thống NHH-Coffee từ môi trường phát triển đến môi trường sản xuất. Phần Cài đặt hướng dẫn thiết lập môi trường development với các công cụ cần thiết, cấu hình dự án, thiết lập database và khởi chạy ứng dụng. Phần Triển khai hướng dẫn đưa hệ thống lên production VPS với focus vào bảo mật, performance và reliability thông qua việc cấu hình Nginx, SSL/TLS, PM2 cluster mode, automated backups và monitoring.

Việc tuân thủ các best practices về security như SSH hardening, firewall configuration, database access control và HTTPS enforcement đảm bảo hệ thống được bảo vệ khỏi các threats phổ biến. Sử dụng PM2 cluster mode và Nginx load balancing cho phép hệ thống tận dụng multi-core CPU và xử lý high traffic. Automated backups và monitoring đảm bảo data có thể recovered và issues có thể detected sớm. Zero-downtime deployment workflow cho phép update hệ thống mà không gây gián đoạn service.

Với môi trường đã được thiết lập theo hướng dẫn trong chương này, hệ thống NHH-Coffee sẵn sàng phục vụ người dùng với các tính năng quản lý bán hàng, quản lý kho, quản lý nhân viên và chatbot AI, hoạt động ổn định, bảo mật và có khả năng mở rộng trong tương lai.
