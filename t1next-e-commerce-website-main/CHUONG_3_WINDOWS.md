# CHƯƠNG 3: CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG

## 3.1. GIỚI THIỆU

Chương này trình bày quy trình cài đặt và triển khai hệ thống quản lý quán cà phê NHH-Coffee trên hệ điều hành Windows. Hệ thống được xây dựng trên kiến trúc Client-Server với frontend sử dụng Next.js 16 và backend sử dụng Express.js kết hợp PostgreSQL. Chương được chia thành hai phần chính: Cài đặt hệ thống trên môi trường phát triển Windows và Triển khai hệ thống lên môi trường sản xuất trên VPS Ubuntu.

## 3.2. CÀI ĐẶT HỆ THỐNG TRÊN WINDOWS

### 3.2.1. Yêu cầu hệ thống

Để cài đặt và chạy hệ thống trên Windows, máy tính cần đáp ứng các yêu cầu sau:

**Yêu cầu phần cứng:**
- CPU: Intel Core i5 thế hệ 8 trở lên hoặc AMD Ryzen 5 3000+ (khuyến nghị i7/Ryzen 7)
- RAM: 8GB tối thiểu (khuyến nghị 16GB)
- Ổ cứng: SSD với 20GB dung lượng trống
- Kết nối mạng: Internet ổn định tốc độ 10Mbps trở lên

**Yêu cầu phần mềm:**
- Hệ điều hành: Windows 10 hoặc Windows 11
- Node.js: Phiên bản 20.x hoặc 22.x LTS
- PostgreSQL: Phiên bản 15.x hoặc 16.x
- Git: Phiên bản 2.x trở lên
- IDE: Visual Studio Code (khuyến nghị)

### 3.2.2. Cài đặt phần mềm cơ bản

**Cài đặt Node.js**

Node.js là nền tảng runtime cho cả frontend và backend của hệ thống. Quy trình cài đặt trên Windows như sau:

- Truy cập trang chủ nodejs.org
- Tải Node.js installer phiên bản LTS (20.x hoặc 22.x) cho Windows
- Chạy file installer đã tải về
- Trong quá trình cài đặt, chọn các tùy chọn mặc định
- Đảm bảo tích chọn "Automatically install the necessary tools" nếu có
- Hoàn tất cài đặt và khởi động lại Command Prompt nếu cần

Sau khi cài đặt, mở Command Prompt hoặc PowerShell và kiểm tra phiên bản để đảm bảo cài đặt thành công. Gõ lệnh node --version để kiểm tra Node.js và npm --version để kiểm tra npm. Nếu hiển thị số phiên bản nghĩa là cài đặt thành công.

**Cài đặt PostgreSQL**

PostgreSQL là hệ quản trị cơ sở dữ liệu chính của hệ thống. Quy trình cài đặt trên Windows:

- Truy cập trang postgresql.org
- Tải PostgreSQL installer phiên bản 15.x hoặc 16.x cho Windows
- Chạy file installer
- Chọn thư mục cài đặt (mặc định C:\Program Files\PostgreSQL\15)
- Chọn các components cần cài đặt (PostgreSQL Server, pgAdmin 4, Command Line Tools)
- Đặt password cho superuser postgres (ghi nhớ password này)
- Chọn port mặc định 5432
- Chọn locale mặc định
- Hoàn tất cài đặt

Sau khi cài đặt, PostgreSQL service sẽ tự động chạy. Có thể kiểm tra bằng cách mở Services (services.msc) và tìm postgresql-x64-15.

**Tạo database cho dự án:**

- Mở pgAdmin 4 từ Start Menu
- Kết nối đến PostgreSQL server với password đã đặt
- Click chuột phải vào Databases, chọn Create > Database
- Đặt tên database là nhh_coffee_dev
- Chọn Encoding là UTF8
- Click Save để tạo database

**Tạo user cho dự án:**

- Trong pgAdmin, click chuột phải vào Login/Group Roles
- Chọn Create > Login/Group Role
- Trong tab General, đặt tên là nhh_user
- Trong tab Definition, đặt password mạnh
- Trong tab Privileges, tích chọn Can login
- Click Save để tạo user

**Grant quyền cho user:**

- Click chuột phải vào database nhh_coffee_dev
- Chọn Properties > Security
- Click dấu + để thêm privilege
- Chọn nhh_user và grant ALL privileges
- Click Save

**Cài đặt Git**

Git được sử dụng để quản lý mã nguồn:

- Truy cập trang git-scm.com
- Tải Git installer cho Windows
- Chạy file installer
- Chọn các tùy chọn mặc định trong quá trình cài đặt
- Khuyến nghị chọn "Use Git from the Windows Command Prompt"
- Hoàn tất cài đặt

Sau khi cài đặt, mở Command Prompt và cấu hình Git với user name và email bằng các lệnh git config --global user.name "Your Name" và git config --global user.email "your.email@example.com".

**Cài đặt Visual Studio Code**

Visual Studio Code là IDE được khuyến nghị:

- Truy cập trang code.visualstudio.com
- Tải VS Code installer cho Windows
- Chạy file installer
- Chọn các tùy chọn mặc định
- Khuyến nghị tích chọn "Add to PATH" và "Add Open with Code action"
- Hoàn tất cài đặt

Sau khi cài đặt, mở VS Code và cài đặt các extensions hữu ích như ESLint, Prettier, TypeScript, React, Prisma.

### 3.2.3. Cấu hình dự án

**Clone repository**

Mở Command Prompt hoặc PowerShell, navigate đến thư mục muốn lưu dự án (ví dụ C:\Projects), và clone repository bằng lệnh git clone. Sau khi clone xong, navigate vào thư mục dự án.

Dự án có cấu trúc với hai thư mục chính:
- client: Chứa Next.js frontend
- server: Chứa Express.js backend

**Cài đặt dependencies**

Mở Command Prompt trong thư mục dự án:

**Cho backend:**
- Navigate vào thư mục server: cd server
- Chạy lệnh: npm ci
- Quá trình cài đặt có thể mất vài phút
- Sau khi hoàn tất, thư mục node_modules sẽ được tạo

**Cho frontend:**
- Navigate vào thư mục client: cd ..\client
- Chạy lệnh: npm ci
- Quá trình cài đặt có thể mất lâu hơn backend
- Sau khi hoàn tất, thư mục node_modules sẽ được tạo

**Cấu hình Environment Variables**

**Cho backend:**

Trong thư mục server, tạo file .env (có thể copy từ .env.example nếu có). Mở file .env bằng Notepad hoặc VS Code và điền các giá trị sau:

Các biến quan trọng cần cấu hình:
- DATABASE_URL: Connection string đến PostgreSQL, format postgresql://nhh_user:your_password@localhost:5432/nhh_coffee_dev (thay your_password bằng password đã đặt)
- JWT_SECRET: Secret key để sign JWT tokens, cần là chuỗi random dài ít nhất 32 ký tự
- JWT_EXPIRES_IN: Thời gian hết hạn token, đặt là 7d cho development
- PORT: Port cho backend server, đặt là 5000
- NODE_ENV: Đặt là development
- FRONTEND_URL: URL của frontend, đặt là http://localhost:3000
- GEMINI_API_KEY: API key từ Google AI Studio để sử dụng chatbot (đăng ký tại ai.google.dev)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET: Credentials từ Cloudinary để upload images (đăng ký miễn phí tại cloudinary.com)
- EMAIL_HOST: SMTP host, ví dụ smtp.gmail.com
- EMAIL_PORT: SMTP port, ví dụ 587
- EMAIL_USER: Email address để gửi email
- EMAIL_PASSWORD: App password (với Gmail cần tạo App Password từ Google Account settings)
- EMAIL_FROM: Tên hiển thị khi gửi email

**Cho frontend:**

Trong thư mục client, tạo file .env.local. Mở file và điền các giá trị:
- NEXT_PUBLIC_API_URL: URL của backend API, đặt là http://localhost:5000
- NEXT_PUBLIC_SOCKET_URL: URL của Socket.io server, đặt là http://localhost:5000
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: Cloud name từ Cloudinary

**Thiết lập Database Schema**

Trong thư mục server, thực hiện các bước sau:

**Generate Prisma Client:**
- Chạy lệnh: npx prisma generate
- Prisma sẽ tạo type-safe query builder

**Chạy migrations:**
- Chạy lệnh: npx prisma migrate dev
- Prisma sẽ đọc schema.prisma và tạo tables trong database
- Nếu được hỏi tên migration, có thể đặt là "init"

**Seed initial data:**
- Chạy lệnh: npm run seed
- Script sẽ tạo admin account với email admin@nhh-coffee.com và password Admin@123
- Script cũng tạo categories (Cà phê, Trà sữa, Bánh ngọt, v.v.) và sample products

**Xem database:**
- Chạy lệnh: npx prisma studio
- Prisma Studio sẽ mở tại http://localhost:5555
- Có thể browse và edit data trực tiếp

### 3.2.4. Khởi chạy ứng dụng

**Khởi chạy Backend**

Mở Command Prompt hoặc Terminal trong VS Code:
- Navigate vào thư mục server: cd server
- Chạy lệnh: npm run dev
- Backend server sẽ start với nodemon
- Console sẽ hiển thị "Server running on port 5000" và "Database connected successfully"
- Backend API có sẵn tại http://localhost:5000/api

**Khởi chạy Frontend**

Mở Command Prompt hoặc Terminal mới (giữ terminal backend đang chạy):
- Navigate vào thư mục client: cd client
- Chạy lệnh: npm run dev
- Next.js development server sẽ start
- Console sẽ hiển thị "ready - started server on 0.0.0.0:3000"
- Mở trình duyệt và truy cập http://localhost:3000

**Test ứng dụng:**
- Trang chủ hiển thị products, categories, hero section
- Login với admin account: admin@nhh-coffee.com / Admin@123
- Truy cập admin panel tại http://localhost:3000/staff
- Test API bằng Postman hoặc Thunder Client


## 3.3. TRIỂN KHAI HỆ THỐNG LÊN VPS

### 3.3.1. Yêu cầu môi trường production

**Cấu hình VPS:**
- CPU: 4 cores vCPU (khuyến nghị 8 cores cho high traffic)
- RAM: 8GB (khuyến nghị 16GB)
- Storage: 100GB SSD
- Bandwidth: 1TB/tháng, tốc độ 100Mbps
- OS: Ubuntu 22.04 LTS

**Nhà cung cấp VPS khuyến nghị:**
- DigitalOcean: Droplet $40-80/tháng, datacenter Singapore
- Vultr: Cloud Compute $40-80/tháng
- Linode: Shared CPU $40-80/tháng
- AWS EC2: Instance type t3.large hoặc t3.xlarge

### 3.3.2. Chuẩn bị máy chủ

**Tạo VPS và kết nối SSH**

Sau khi tạo VPS trên nhà cung cấp, nhận được IP address và root credentials. Kết nối SSH từ Windows:

**Sử dụng Windows Terminal hoặc PowerShell:**
- Mở Windows Terminal hoặc PowerShell
- Gõ lệnh: ssh root@your_server_ip
- Nhập password khi được yêu cầu
- Lần đầu kết nối sẽ hỏi xác nhận fingerprint, gõ yes

**Hoặc sử dụng PuTTY:**
- Tải PuTTY từ putty.org
- Mở PuTTY, nhập IP address vào Host Name
- Port 22, Connection type SSH
- Click Open
- Nhập username root và password

**Cấu hình bảo mật cơ bản**

Sau khi kết nối SSH thành công, thực hiện các bước sau:

**Update system packages:**
- Chạy lệnh: apt update
- Chạy lệnh: apt upgrade -y
- Quá trình có thể mất vài phút

**Tạo sudo user:**
- Chạy lệnh: adduser deploy
- Nhập password mạnh cho user mới
- Điền thông tin hoặc Enter để skip
- Chạy lệnh: usermod -aG sudo deploy
- User deploy giờ có sudo privileges

**Cấu hình SSH security:**
- Chạy lệnh: nano /etc/ssh/sshd_config
- Tìm và thay đổi: PermitRootLogin no
- Tìm và thay đổi: Port 2222 (hoặc port khác)
- Lưu file: Ctrl+O, Enter, Ctrl+X
- Restart SSH: systemctl restart sshd

**Setup SSH key từ Windows:**
- Trên Windows, mở PowerShell
- Generate SSH key: ssh-keygen -t rsa -b 4096
- Copy public key lên server: type $env:USERPROFILE\.ssh\id_rsa.pub | ssh -p 2222 deploy@your_server_ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
- Test login: ssh -p 2222 deploy@your_server_ip

**Cấu hình firewall:**
- Chạy lệnh: ufw allow 2222/tcp (SSH port)
- Chạy lệnh: ufw allow 80/tcp (HTTP)
- Chạy lệnh: ufw allow 443/tcp (HTTPS)
- Chạy lệnh: ufw enable
- Chạy lệnh: ufw status để verify

**Cài đặt phần mềm hệ thống**

Login với user deploy và cài đặt các phần mềm:

**Node.js:**
- Chạy lệnh: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
- Chạy lệnh: sudo apt-get install -y nodejs
- Verify: node --version và npm --version

**PostgreSQL:**
- Chạy lệnh: sudo apt install postgresql postgresql-contrib -y
- Switch to postgres user: sudo -i -u postgres
- Chạy psql để vào PostgreSQL console
- Tạo database: CREATE DATABASE nhh_coffee_prod WITH ENCODING 'UTF8';
- Tạo user: CREATE USER nhh_prod_user WITH PASSWORD 'strong_password_here';
- Grant privileges: GRANT ALL PRIVILEGES ON DATABASE nhh_coffee_prod TO nhh_prod_user;
- Thoát: \q và exit

**Redis:**
- Chạy lệnh: sudo apt install redis-server -y
- Edit config: sudo nano /etc/redis/redis.conf
- Tìm và set: bind 127.0.0.1
- Tìm và set: requirepass your_redis_password
- Lưu và restart: sudo systemctl restart redis-server

**Nginx:**
- Chạy lệnh: sudo apt install nginx -y
- Verify: sudo systemctl status nginx

**PM2:**
- Chạy lệnh: sudo npm install -g pm2
- Verify: pm2 --version

**Git:**
- Chạy lệnh: sudo apt install git -y
- Config: git config --global user.name "Your Name"
- Config: git config --global user.email "your.email@example.com"

**Certbot:**
- Chạy lệnh: sudo apt install certbot python3-certbot-nginx -y

### 3.3.3. Deploy ứng dụng

**Clone source code**

Tạo thư mục và clone repository:
- Chạy lệnh: sudo mkdir -p /var/www/nhh-coffee
- Chạy lệnh: sudo chown -R deploy:deploy /var/www/nhh-coffee
- Chạy lệnh: cd /var/www/nhh-coffee
- Chạy lệnh: git clone <repository-url> .

**Cài đặt dependencies:**
- Backend: cd server && npm ci --production
- Frontend: cd ../client && npm ci --production

**Cấu hình Environment Variables**

Tạo file .env cho backend:
- Chạy lệnh: cd /var/www/nhh-coffee/server
- Chạy lệnh: nano .env
- Điền các giá trị production (DATABASE_URL, JWT_SECRET, API keys, v.v.)
- Lưu file: Ctrl+O, Enter, Ctrl+X

Tạo file .env.local cho frontend:
- Chạy lệnh: cd /var/www/nhh-coffee/client
- Chạy lệnh: nano .env.local
- Điền NEXT_PUBLIC_API_URL và các biến khác
- Lưu file

**Setup Database:**
- Chạy lệnh: cd /var/www/nhh-coffee/server
- Generate Prisma Client: npx prisma generate
- Run migrations: npx prisma migrate deploy
- Seed data: npm run seed

**Build applications:**
- Backend: cd /var/www/nhh-coffee/server && npm run build
- Frontend: cd /var/www/nhh-coffee/client && npm run build

**Cấu hình PM2**

Tạo file ecosystem.config.js:
- Chạy lệnh: cd /var/www/nhh-coffee
- Chạy lệnh: nano ecosystem.config.js
- Copy nội dung cấu hình PM2 (định nghĩa 2 apps: backend và frontend)
- Lưu file

Start applications:
- Chạy lệnh: pm2 start ecosystem.config.js
- Verify: pm2 list
- View logs: pm2 logs

Setup auto-start:
- Chạy lệnh: pm2 startup
- Copy và chạy command được hiển thị
- Chạy lệnh: pm2 save

### 3.3.4. Cấu hình Nginx và SSL

**Cấu hình Nginx**

Tạo Nginx configuration:
- Chạy lệnh: sudo nano /etc/nginx/sites-available/nhh-coffee
- Copy nội dung cấu hình Nginx (upstream blocks, server blocks, location blocks)
- Lưu file

Enable configuration:
- Chạy lệnh: sudo ln -s /etc/nginx/sites-available/nhh-coffee /etc/nginx/sites-enabled/
- Test config: sudo nginx -t
- Reload Nginx: sudo systemctl reload nginx

**Cấu hình SSL/TLS**

Point domain to server:
- Vào domain registrar hoặc DNS provider
- Tạo A record: nhh-coffee.com → your_server_ip
- Tạo A record: www.nhh-coffee.com → your_server_ip
- Đợi DNS propagate (vài phút đến vài giờ)

Obtain SSL certificate:
- Chạy lệnh: sudo certbot --nginx -d nhh-coffee.com -d www.nhh-coffee.com
- Nhập email để nhận renewal reminders
- Agree to Terms of Service
- Chọn option 2 để redirect HTTP to HTTPS
- Certbot sẽ tự động cấu hình Nginx

Verify SSL:
- Truy cập https://nhh-coffee.com trong browser
- Kiểm tra padlock icon
- Test tại ssllabs.com/ssltest

Test auto-renewal:
- Chạy lệnh: sudo certbot renew --dry-run

### 3.3.5. Backup và Monitoring

**Setup automated backups**

Tạo backup script:
- Chạy lệnh: sudo nano /usr/local/bin/backup-db.sh
- Copy nội dung script (pg_dump, cleanup old backups)
- Lưu file
- Make executable: sudo chmod +x /usr/local/bin/backup-db.sh

Setup cron job:
- Chạy lệnh: sudo crontab -e
- Thêm dòng: 0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1
- Lưu file

**Monitoring**

Monitor PM2:
- Chạy lệnh: pm2 monit (real-time monitoring)
- Chạy lệnh: pm2 logs (view logs)

Monitor system:
- Chạy lệnh: htop (system resources)

View logs:
- Nginx access: sudo tail -f /var/log/nginx/access.log
- Nginx error: sudo tail -f /var/log/nginx/error.log

Setup uptime monitoring:
- Đăng ký UptimeRobot (uptimerobot.com) - miễn phí
- Thêm monitor cho website
- Cấu hình alerts qua email

### 3.3.6. Deployment Workflow

**Update ứng dụng**

Khi có code changes mới:
- SSH vào server: ssh -p 2222 deploy@your_server_ip
- Navigate to project: cd /var/www/nhh-coffee
- Pull latest code: git pull origin main
- Update backend: cd server && npm ci --production && npm run build
- Update frontend: cd ../client && npm ci --production && npm run build
- Apply migrations: cd ../server && npx prisma migrate deploy
- Reload PM2: cd .. && pm2 reload ecosystem.config.js

**Health checks sau deployment:**
- Check PM2 status: pm2 list
- View logs: pm2 logs --lines 50
- Test API: curl https://nhh-coffee.com/api/health
- Test frontend: Truy cập website trong browser

**Rollback nếu có issues:**
- View commit history: git log
- Checkout previous commit: git checkout <commit-hash>
- Rebuild: npm run build
- Reload: pm2 reload all

## 3.4. KẾT LUẬN

Chương 3 đã trình bày quy trình cài đặt và triển khai hệ thống NHH-Coffee trên Windows và VPS Ubuntu. Phần đầu hướng dẫn chi tiết cài đặt môi trường phát triển trên Windows với các bước:

**Các bước chính trong Cài đặt:**
- Cài đặt Node.js, PostgreSQL, Git và VS Code trên Windows
- Clone repository và cài đặt dependencies cho backend và frontend
- Cấu hình environment variables với database credentials và API keys
- Thiết lập database schema với Prisma migrations và seed initial data
- Khởi chạy backend server trên port 5000 và frontend server trên port 3000

**Các bước chính trong Triển khai:**
- Tạo VPS với Ubuntu 22.04 LTS và cấu hình bảo mật cơ bản
- Cài đặt Node.js, PostgreSQL, Redis, Nginx, PM2 và Certbot
- Deploy ứng dụng với build optimization và PM2 cluster mode
- Cấu hình Nginx làm reverse proxy với gzip compression và caching
- Setup SSL/TLS certificates từ Let's Encrypt với automated renewal
- Thiết lập automated backups và monitoring
- Quy trình update với zero-downtime deployment

Việc tuân thủ các bước được trình bày đảm bảo hệ thống được cài đặt đúng cách trên Windows cho development và triển khai an toàn lên production VPS. Các biện pháp bảo mật như SSH hardening, firewall configuration, HTTPS enforcement và database access control bảo vệ hệ thống khỏi các threats. PM2 cluster mode và Nginx load balancing cho phép hệ thống xử lý high traffic và tận dụng multi-core CPU. Automated backups và monitoring đảm bảo data có thể recovered và issues có thể detected sớm.

Với môi trường đã được thiết lập theo hướng dẫn, hệ thống NHH-Coffee sẵn sàng phục vụ người dùng với đầy đủ tính năng quản lý bán hàng, quản lý kho, quản lý nhân viên và chatbot AI, hoạt động ổn định và có khả năng mở rộng.
