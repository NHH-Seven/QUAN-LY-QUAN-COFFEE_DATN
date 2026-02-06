# CHƯƠNG 3: CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG

## 3.1. GIỚI THIỆU

Chương này trình bày quy trình cài đặt và triển khai hệ thống NHH-Coffee từ môi trường phát triển đến môi trường sản xuất. Việc thiết lập đúng cách môi trường làm việc và triển khai hệ thống theo quy trình chuẩn hóa là yếu tố quan trọng để đảm bảo hệ thống hoạt động ổn định, bảo mật và có khả năng mở rộng.

Hệ thống NHH-Coffee được xây dựng trên kiến trúc Client-Server với frontend sử dụng Next.js 16 (React 19) và backend sử dụng Express.js kết hợp PostgreSQL database. Chương này được chia thành hai phần chính: Phần Cài đặt hướng dẫn thiết lập môi trường phát triển trên máy local, và Phần Triển khai hướng dẫn đưa hệ thống lên môi trường production trên VPS.

---

## 3.2. CÀI ĐẶT HỆ THỐNG

Phần này hướng dẫn chi tiết quy trình cài đặt hệ thống trên môi trường phát triển (Development Environment), bao gồm cài đặt các phần mềm cần thiết, cấu hình dự án, thiết lập database, và khởi chạy ứng dụng.

### 3.2.1. Yêu cầu hệ thống

**Phần cứng:**
- CPU: Intel Core i5 thế hệ 8+ hoặc AMD Ryzen 5 3000+ (khuyến nghị i7/Ryzen 7)
- RAM: 8GB tối thiểu (khuyến nghị 16GB)
- Ổ cứng: SSD với 20GB dung lượng trống
- Kết nối mạng: Internet ổn định tốc độ 10Mbps+

**Phần mềm:**
- Hệ điều hành: Windows 10/11, macOS 12+, hoặc Ubuntu 20.04+
- Node.js: Phiên bản 20.x hoặc 22.x LTS
- PostgreSQL: Phiên bản 15.x hoặc 16.x
- Redis: Phiên bản 7.x (optional, có memory fallback)
- Git: Phiên bản 2.x+
- IDE: Visual Studio Code (khuyến nghị)

### 3.2.2. Cài đặt phần mềm cơ bản

**A. Cài đặt Node.js và npm**

Node.js là nền tảng runtime cho cả frontend và backend của hệ thống.

*Trên Windows:*
- Tải Node.js installer từ nodejs.org (chọn phiên bản LTS 20.x hoặc 22.x)
- Chạy file installer và làm theo hướng dẫn
- Mở Command Prompt và kiểm tra: `node --version` và `npm --version`

*Trên macOS:*
- Sử dụng Homebrew: `brew install node`
- Hoặc tải installer từ nodejs.org
- Kiểm tra cài đặt: `node --version` và `npm --version`

*Trên Linux (Ubuntu/Debian):*
```bash
# Thêm NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Cài đặt Node.js
sudo apt-get install -y nodejs

# Kiểm tra
node --version
npm --version
```

Sau khi cài đặt, cập nhật npm lên phiên bản mới nhất:
```bash
npm install -g npm@latest
```


**B. Cài đặt PostgreSQL**

PostgreSQL là hệ quản trị cơ sở dữ liệu chính của hệ thống.

*Trên Windows:*
- Tải PostgreSQL installer từ postgresql.org (phiên bản 15.x hoặc 16.x)
- Chạy installer, chọn thư mục cài đặt
- Đặt password cho superuser `postgres` (ghi nhớ password này)
- Chọn port mặc định 5432
- Installer sẽ cài đặt kèm pgAdmin 4 (công cụ quản lý database)

*Trên macOS:*
```bash
# Cài đặt qua Homebrew
brew install postgresql@15

# Khởi động PostgreSQL service
brew services start postgresql@15
```

*Trên Linux (Ubuntu):*
```bash
# Cài đặt PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL service tự động start
sudo systemctl status postgresql
```

**Tạo database và user cho dự án:**

```bash
# Kết nối PostgreSQL (Windows: dùng pgAdmin hoặc psql từ Start Menu)
sudo -u postgres psql

# Trong psql console:
CREATE DATABASE nhh_coffee_dev WITH ENCODING 'UTF8';
CREATE USER nhh_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE nhh_coffee_dev TO nhh_user;
\q
```

**C. Cài đặt Redis (Optional)**

Redis được sử dụng cho caching, nhưng hệ thống có memory fallback nên không bắt buộc.

*Trên Windows:*
- Khuyến nghị dùng Docker: `docker run -d -p 6379:6379 redis:7`
- Hoặc cài đặt Redis trên WSL2

*Trên macOS:*
```bash
brew install redis
brew services start redis
```

*Trên Linux (Ubuntu):*
```bash
sudo apt install redis-server
sudo systemctl start redis-server
redis-cli ping  # Kiểm tra, phải trả về PONG
```

**D. Cài đặt Git**

*Trên Windows:*
- Tải Git installer từ git-scm.com
- Chạy installer với các tùy chọn mặc định

*Trên macOS:*
```bash
brew install git
```

*Trên Linux (Ubuntu):*
```bash
sudo apt install git
```

Cấu hình Git:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3.2.3. Cấu hình dự án

**A. Clone repository**

```bash
# Clone source code từ Git repository
git clone <repository-url> nhh-coffee
cd nhh-coffee
```

Cấu trúc thư mục dự án:
```
nhh-coffee/
├── client/          # Next.js frontend
│   ├── app/         # Next.js App Router
│   ├── components/  # React components
│   ├── lib/         # Utilities
│   └── package.json
├── server/          # Express.js backend
│   ├── src/         # Source code
│   ├── prisma/      # Database schema
│   └── package.json
└── README.md
```

**B. Cài đặt dependencies**

Cài đặt dependencies cho backend:
```bash
cd server
npm ci
```

Lệnh `npm ci` (clean install) cài đặt chính xác các phiên bản trong package-lock.json, đảm bảo tính nhất quán.

Cài đặt dependencies cho frontend:
```bash
cd ../client
npm ci
```

Quá trình cài đặt có thể mất vài phút tùy thuộc vào tốc độ Internet.


**C. Cấu hình Environment Variables**

Environment variables chứa thông tin cấu hình nhạy cảm và không được commit vào Git.

**Backend (.env):**

Trong thư mục `server`, tạo file `.env` từ template `.env.example`:

```bash
cd server
cp .env.example .env
```

Chỉnh sửa file `.env` với các giá trị thực tế:

```env
# Database
DATABASE_URL="postgresql://nhh_user:your_password@localhost:5432/nhh_coffee_dev"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here-min-32-chars"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Google Gemini AI (cho chatbot)
GEMINI_API_KEY="your-gemini-api-key"

# Cloudinary (cho upload images)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email SMTP
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="NHH Coffee <noreply@nhh-coffee.com>"
```

**Lưu ý quan trọng:**
- `JWT_SECRET`: Generate bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `GEMINI_API_KEY`: Lấy từ Google AI Studio (ai.google.dev)
- `CLOUDINARY_*`: Đăng ký tài khoản miễn phí tại cloudinary.com
- `EMAIL_PASSWORD`: Với Gmail, cần tạo App Password từ Google Account settings

**Frontend (.env.local):**

Trong thư mục `client`, tạo file `.env.local`:

```bash
cd ../client
touch .env.local
```

Nội dung file `.env.local`:

```env
# API URL
NEXT_PUBLIC_API_URL="http://localhost:5000"

# Socket.io URL
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

**D. Thiết lập Database**

Sử dụng Prisma ORM để tạo database schema và seed initial data.

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Chạy migrations để tạo tables
npx prisma migrate dev --name init

# Seed initial data (admin user, categories, sample products)
npm run seed
```

Sau khi seed thành công, hệ thống sẽ có:
- Admin account: `admin@nhh-coffee.com` / `Admin@123`
- Categories: Cà phê, Trà sữa, Bánh ngọt, v.v.
- Sample products với images và thông tin chi tiết

**Xem database với Prisma Studio:**

```bash
npx prisma studio
```

Prisma Studio mở tại `http://localhost:5555`, cho phép browse và edit data trực tiếp.

### 3.2.4. Khởi chạy ứng dụng

**A. Khởi chạy Backend**

Mở terminal trong thư mục `server`:

```bash
cd server
npm run dev
```

Backend server sẽ start với nodemon (auto-restart khi có file changes) và listen trên port 5000.

Console output khi thành công:
```
Server running on port 5000
Database connected successfully
Redis connected (hoặc Using memory cache fallback)
```

API endpoints có sẵn tại `http://localhost:5000/api`

**B. Khởi chạy Frontend**

Mở terminal mới trong thư mục `client`:

```bash
cd client
npm run dev
```

Next.js development server sẽ start với Hot Module Replacement và listen trên port 3000.

Console output:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**C. Truy cập ứng dụng**

Mở trình duyệt và truy cập:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Prisma Studio: `http://localhost:5555` (nếu đang chạy)

**D. Test chức năng cơ bản**

1. Trang chủ hiển thị products, categories, hero section
2. Login với admin account: `admin@nhh-coffee.com` / `Admin@123`
3. Truy cập admin panel: `http://localhost:3000/staff`
4. Test API với Postman/Thunder Client:
   - GET `http://localhost:5000/api/products`
   - POST `http://localhost:5000/api/auth/login`

### 3.2.5. Workflow phát triển

**Development workflow:**

1. **Hai terminals**: Một cho backend (`npm run dev`), một cho frontend (`npm run dev`)
2. **Auto-reload**: Nodemon restart backend khi có changes, Next.js Fast Refresh update UI
3. **Debugging**:
   - Backend: Console.log hoặc VS Code debugger
   - Frontend: Browser DevTools (F12), React DevTools extension
4. **Database changes**:
   - Update `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Prisma auto-generate migration SQL và update Prisma Client

**Common issues và solutions:**

| Issue | Solution |
|-------|----------|
| Database connection error | Kiểm tra DATABASE_URL, đảm bảo PostgreSQL đang chạy |
| Port already in use | Kill process: `lsof -ti:5000 \| xargs kill` (Mac/Linux) |
| CORS errors | Kiểm tra CORS middleware trong backend |
| Module not found | Chạy `npm ci` lại để cài đặt dependencies |
| TypeScript errors | Chạy `npm run build` để check type errors |

---


## 3.3. TRIỂN KHAI HỆ THỐNG

Phần này hướng dẫn chi tiết quy trình triển khai hệ thống lên môi trường production trên VPS (Virtual Private Server), bao gồm chuẩn bị server, cấu hình bảo mật, deploy ứng dụng, và setup các services cần thiết.

### 3.3.1. Yêu cầu môi trường production

**Phần cứng (VPS):**
- CPU: 4 cores vCPU (khuyến nghị 8 cores cho high traffic)
- RAM: 8GB (khuyến nghị 16GB)
- Storage: 100GB SSD
- Bandwidth: 1TB/tháng, 100Mbps
- OS: Ubuntu 22.04 LTS

**Nhà cung cấp VPS khuyến nghị:**
- DigitalOcean: Droplet $40-80/tháng, datacenter Singapore
- Vultr: Cloud Compute $40-80/tháng
- Linode: Shared CPU $40-80/tháng
- AWS EC2: t3.large hoặc t3.xlarge

### 3.3.2. Chuẩn bị máy chủ

**A. Tạo VPS và kết nối SSH**

1. Tạo VPS trên nhà cung cấp (chọn Ubuntu 22.04 LTS, datacenter gần Việt Nam)
2. Nhận IP address và root credentials
3. Kết nối SSH:

```bash
ssh root@your_server_ip
```

**B. Cấu hình bảo mật cơ bản**

```bash
# Update system packages
apt update && apt upgrade -y

# Tạo sudo user (thay vì dùng root)
adduser deploy
usermod -aG sudo deploy

# Cấu hình SSH security
nano /etc/ssh/sshd_config
```

Trong file `sshd_config`, thay đổi:
```
PermitRootLogin no
PasswordAuthentication no  # Sau khi setup SSH key
Port 2222  # Thay đổi port SSH
```

Restart SSH:
```bash
systemctl restart sshd
```

**Setup SSH key cho user mới:**

Trên máy local:
```bash
# Generate SSH key (nếu chưa có)
ssh-keygen -t rsa -b 4096

# Copy public key lên server
ssh-copy-id -p 2222 deploy@your_server_ip
```

Test login với user mới trước khi logout root:
```bash
ssh -p 2222 deploy@your_server_ip
```

**C. Cài đặt phần mềm hệ thống**

Login với user `deploy` và cài đặt các phần mềm cần thiết:

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 15
sudo apt install postgresql postgresql-contrib -y

# Redis
sudo apt install redis-server -y

# Nginx
sudo apt install nginx -y

# PM2 (Process Manager)
sudo npm install -g pm2

# Git
sudo apt install git -y

# Certbot (SSL certificates)
sudo apt install certbot python3-certbot-nginx -y
```

Verify installations:
```bash
node --version
npm --version
psql --version
redis-cli --version
nginx -v
pm2 --version
```

**D. Cấu hình PostgreSQL**

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database and user
psql
```

Trong psql console:
```sql
CREATE DATABASE nhh_coffee_prod WITH ENCODING 'UTF8';
CREATE USER nhh_prod_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE nhh_coffee_prod TO nhh_prod_user;
\q
```

Exit postgres user:
```bash
exit
```

**Hardening PostgreSQL:**

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Đảm bảo:
```
listen_addresses = 'localhost'
```

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Chỉ cho phép local connections:
```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

**E. Cấu hình Redis**

```bash
sudo nano /etc/redis/redis.conf
```

Cấu hình:
```
bind 127.0.0.1
protected-mode yes
requirepass your_redis_password_here
maxmemory 512mb
maxmemory-policy allkeys-lru
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

**F. Cấu hình Firewall (UFW)**

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (custom port)
sudo ufw allow 2222/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status verbose
```

### 3.3.3. Deploy ứng dụng

**A. Clone source code**

```bash
# Tạo thư mục cho application
sudo mkdir -p /var/www/nhh-coffee
sudo chown -R deploy:deploy /var/www/nhh-coffee

# Clone repository
cd /var/www/nhh-coffee
git clone <repository-url> .
```

**B. Cài đặt dependencies**

```bash
# Backend
cd server
npm ci --production

# Frontend
cd ../client
npm ci --production
```

**C. Cấu hình Environment Variables**

**Backend (.env):**

```bash
cd /var/www/nhh-coffee/server
nano .env
```

```env
DATABASE_URL="postgresql://nhh_prod_user:password@localhost:5432/nhh_coffee_prod"
REDIS_URL="redis://:redis_password@localhost:6379"
JWT_SECRET="production-secret-key-64-chars-long"
JWT_EXPIRES_IN="1d"
PORT=5000
NODE_ENV="production"
FRONTEND_URL="https://nhh-coffee.com"
GEMINI_API_KEY="production-gemini-key"
CLOUDINARY_CLOUD_NAME="prod-cloud-name"
CLOUDINARY_API_KEY="prod-api-key"
CLOUDINARY_API_SECRET="prod-api-secret"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="production-email@gmail.com"
EMAIL_PASSWORD="app-password"
EMAIL_FROM="NHH Coffee <noreply@nhh-coffee.com>"
```

**Frontend (.env.local):**

```bash
cd /var/www/nhh-coffee/client
nano .env.local
```

```env
NEXT_PUBLIC_API_URL="https://nhh-coffee.com"
NEXT_PUBLIC_SOCKET_URL="https://nhh-coffee.com"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="prod-cloud-name"
```

**D. Setup Database**

```bash
cd /var/www/nhh-coffee/server

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
```

**E. Build applications**

```bash
# Build backend (TypeScript -> JavaScript)
cd /var/www/nhh-coffee/server
npm run build

# Build frontend (Next.js production build)
cd /var/www/nhh-coffee/client
npm run build
```

Next.js sẽ hiển thị build summary với page sizes và load times.


**F. Cấu hình PM2**

Tạo file `ecosystem.config.js` trong thư mục root:

```bash
cd /var/www/nhh-coffee
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'nhh-coffee-api',
      script: './server/dist/index.js',
      cwd: './server',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_log: './logs/api-error.log',
      out_log: './logs/api-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'nhh-coffee-web',
      script: './client/node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './client',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_log: './logs/web-error.log',
      out_log: './logs/web-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
```

Tạo thư mục logs:
```bash
mkdir -p logs
```

Start applications với PM2:
```bash
pm2 start ecosystem.config.js
```

Các lệnh PM2 hữu ích:
```bash
pm2 list              # Xem danh sách processes
pm2 logs              # Xem logs real-time
pm2 monit             # Monitor CPU/Memory
pm2 restart all       # Restart tất cả apps
pm2 stop all          # Stop tất cả apps
pm2 delete all        # Xóa tất cả apps
```

Setup PM2 auto-start khi server reboot:
```bash
pm2 startup
# Copy và chạy command được hiển thị

pm2 save
```

### 3.3.4. Cấu hình Nginx

**A. Tạo Nginx configuration**

```bash
sudo nano /etc/nginx/sites-available/nhh-coffee
```

```nginx
# Upstream backends
upstream api_backend {
    server localhost:5000;
}

upstream web_backend {
    server localhost:3000;
}

# HTTP server (redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name nhh-coffee.com www.nhh-coffee.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name nhh-coffee.com www.nhh-coffee.com;
    
    # SSL certificates (sẽ được Certbot tự động thêm)
    # ssl_certificate /etc/letsencrypt/live/nhh-coffee.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/nhh-coffee.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Client settings
    client_max_body_size 10M;
    
    # API routes
    location /api {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.io
    location /socket.io {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Next.js frontend
    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://web_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

**B. Enable configuration**

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/nhh-coffee /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3.3.5. Cấu hình SSL/TLS

**A. Point domain to server**

Trước khi setup SSL, cần cấu hình DNS:
- Tại domain registrar/DNS provider, tạo A record:
  - `nhh-coffee.com` → `your_server_ip`
  - `www.nhh-coffee.com` → `your_server_ip`

Đợi DNS propagate (vài phút đến vài giờ).

Verify DNS:
```bash
nslookup nhh-coffee.com
```

**B. Obtain SSL certificate với Certbot**

```bash
sudo certbot --nginx -d nhh-coffee.com -d www.nhh-coffee.com
```

Certbot sẽ:
1. Verify domain ownership
2. Obtain certificate từ Let's Encrypt
3. Tự động modify Nginx config để enable HTTPS
4. Setup redirect từ HTTP sang HTTPS

Trả lời các câu hỏi:
- Email: Nhập email để nhận renewal reminders
- Terms of Service: Agree
- Redirect HTTP to HTTPS: Chọn Yes (option 2)

**C. Verify SSL**

Truy cập `https://nhh-coffee.com` trong browser, kiểm tra padlock icon.

Test SSL configuration tại: `https://www.ssllabs.com/ssltest/`

**D. Auto-renewal**

Certbot tự động setup renewal. Verify:

```bash
sudo systemctl status certbot.timer
```

Test renewal:
```bash
sudo certbot renew --dry-run
```

### 3.3.6. Backup và Monitoring

**A. Setup automated database backups**

Tạo backup script:

```bash
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/nhh-coffee"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U nhh_prod_user -h localhost nhh_coffee_prod > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
```

Setup cron job (chạy daily lúc 2 AM):
```bash
sudo crontab -e
```

Thêm dòng:
```
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1
```

**B. Monitoring**

Monitor PM2 processes:
```bash
pm2 monit
```

Monitor system resources:
```bash
htop
```

View logs:
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

**C. Uptime monitoring**

Sử dụng external services như:
- UptimeRobot (uptimerobot.com) - Free
- Pingdom
- StatusCake

Setup để nhận alerts khi website down.


### 3.3.7. Deployment workflow

**A. Update ứng dụng (Zero-downtime deployment)**

Khi có code changes cần deploy:

```bash
# SSH vào server
ssh -p 2222 deploy@your_server_ip

# Navigate to project directory
cd /var/www/nhh-coffee

# Pull latest code
git pull origin main

# Backend updates
cd server
npm ci --production
npm run build

# Frontend updates
cd ../client
npm ci --production
npm run build

# Database migrations (nếu có)
cd ../server
npx prisma migrate deploy

# Reload PM2 (zero-downtime)
cd ..
pm2 reload ecosystem.config.js
```

**B. Rollback nếu có issues**

```bash
# Rollback git
git log  # Xem commit history
git checkout <previous-commit-hash>

# Rebuild và reload
npm run build
pm2 reload all
```

**C. Health checks**

Sau mỗi deployment, kiểm tra:

```bash
# PM2 status
pm2 list

# Application logs
pm2 logs --lines 50

# Test API
curl https://nhh-coffee.com/api/health

# Test frontend
curl -I https://nhh-coffee.com
```

### 3.3.8. Security best practices

**A. Regular updates**

```bash
# Update system packages monthly
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm audit
npm audit fix
```

**B. Security checklist**

- ✅ SSH key authentication only (no passwords)
- ✅ Custom SSH port (not 22)
- ✅ UFW firewall enabled
- ✅ PostgreSQL restricted to localhost
- ✅ Redis password protected
- ✅ Strong passwords everywhere (min 16 chars)
- ✅ HTTPS enforced (HTTP redirects to HTTPS)
- ✅ Security headers in Nginx
- ✅ Rate limiting in application
- ✅ Regular backups
- ✅ Monitoring and alerts

**C. Application security**

Đã implement trong code:
- Input validation với Zod
- SQL injection prevention với Prisma ORM
- XSS prevention với sanitization
- CSRF protection
- Rate limiting cho API endpoints
- JWT authentication
- Bcrypt password hashing
- Secure cookies (httpOnly, secure, sameSite)

---

## 3.4. KẾT LUẬN

Chương 3 đã trình bày đầy đủ quy trình cài đặt và triển khai hệ thống NHH-Coffee từ môi trường phát triển đến môi trường sản xuất.

**Phần Cài đặt** hướng dẫn chi tiết việc thiết lập môi trường phát triển trên máy local, bao gồm:
- Cài đặt các phần mềm cần thiết: Node.js, PostgreSQL, Redis, Git
- Clone repository và cài đặt dependencies
- Cấu hình environment variables cho backend và frontend
- Thiết lập database với Prisma migrations và seed data
- Khởi chạy ứng dụng trong development mode
- Workflow phát triển và debugging

**Phần Triển khai** hướng dẫn chi tiết việc đưa hệ thống lên production trên VPS, bao gồm:
- Chuẩn bị máy chủ với Ubuntu 22.04 LTS
- Cấu hình bảo mật cơ bản: SSH hardening, firewall, user management
- Cài đặt và cấu hình các services: PostgreSQL, Redis, Nginx, PM2
- Deploy ứng dụng với build optimization
- Cấu hình Nginx làm reverse proxy và load balancer
- Setup SSL/TLS certificates với Let's Encrypt
- Automated backups và monitoring
- Zero-downtime deployment workflow

Hệ thống được triển khai với các best practices về:
- **Performance**: PM2 cluster mode, Nginx caching, gzip compression
- **Security**: Firewall, SSH hardening, HTTPS, input validation, rate limiting
- **Reliability**: Automated backups, monitoring, health checks
- **Scalability**: Load balancing, database indexing, Redis caching

Với quy trình cài đặt và triển khai được document chi tiết, hệ thống NHH-Coffee có thể được setup nhanh chóng và vận hành ổn định trong môi trường production, phục vụ người dùng với hiệu suất cao và bảo mật tốt.

---

## PHỤ LỤC

### A. Sơ đồ quy trình triển khai

```
┌─────────────────────────────────────────────────────────────┐
│                  QUY TRÌNH TRIỂN KHAI                       │
└─────────────────────────────────────────────────────────────┘

BƯỚC 1: CHUẨN BỊ SERVER
├─ Tạo VPS (Ubuntu 22.04 LTS)
├─ Cấu hình SSH security
├─ Tạo sudo user
├─ Setup firewall (UFW)
└─ Cài đặt phần mềm (Node.js, PostgreSQL, Redis, Nginx, PM2)

BƯỚC 2: CẤU HÌNH SERVICES
├─ PostgreSQL: Tạo database và user
├─ Redis: Set password và memory limit
├─ Nginx: Tạo server blocks
└─ Firewall: Mở ports 80, 443, SSH

BƯỚC 3: DEPLOY APPLICATION
├─ Clone source code
├─ Cài đặt dependencies (npm ci)
├─ Cấu hình environment variables
├─ Setup database (migrations + seed)
├─ Build applications (backend + frontend)
└─ Start với PM2 (cluster mode)

BƯỚC 4: SETUP SSL
├─ Point domain to server IP
├─ Run Certbot
├─ Verify HTTPS working
└─ Test auto-renewal

BƯỚC 5: MONITORING & BACKUP
├─ Setup automated backups (cron)
├─ Configure monitoring (PM2, logs)
├─ Setup uptime monitoring
└─ Test disaster recovery

                    ↓
            ┌───────────────┐
            │  PRODUCTION   │
            │     READY     │
            └───────────────┘
```

### B. Checklist triển khai

```
☐ SERVER SETUP
  ☐ VPS created with correct specs
  ☐ Ubuntu 22.04 LTS installed
  ☐ Sudo user created
  ☐ SSH hardened (key-only, custom port)
  ☐ UFW firewall enabled
  ☐ System packages updated

☐ SOFTWARE INSTALLATION
  ☐ Node.js 20.x installed
  ☐ PostgreSQL 15.x installed
  ☐ Redis 7.x installed
  ☐ Nginx installed
  ☐ PM2 installed globally
  ☐ Git installed
  ☐ Certbot installed

☐ DATABASE SETUP
  ☐ PostgreSQL database created
  ☐ Database user created with strong password
  ☐ PostgreSQL restricted to localhost
  ☐ Redis password configured
  ☐ Prisma migrations applied
  ☐ Initial data seeded

☐ APPLICATION DEPLOYMENT
  ☐ Repository cloned
  ☐ Dependencies installed
  ☐ Environment variables configured
  ☐ Backend built successfully
  ☐ Frontend built successfully
  ☐ PM2 configured and started
  ☐ PM2 startup script enabled

☐ NGINX CONFIGURATION
  ☐ Server blocks created
  ☐ Reverse proxy configured
  ☐ Gzip compression enabled
  ☐ Static file caching configured
  ☐ Configuration tested (nginx -t)
  ☐ Nginx reloaded

☐ SSL/TLS SETUP
  ☐ Domain DNS configured
  ☐ SSL certificate obtained
  ☐ HTTPS working
  ☐ HTTP to HTTPS redirect working
  ☐ Auto-renewal tested

☐ SECURITY
  ☐ Only necessary ports open (SSH, 80, 443)
  ☐ Strong passwords used everywhere
  ☐ SSH key authentication only
  ☐ Database restricted to localhost
  ☐ Redis password protected

☐ BACKUP & MONITORING
  ☐ Automated backups configured
  ☐ Backup restoration tested
  ☐ PM2 monitoring working
  ☐ Log rotation configured
  ☐ Uptime monitoring setup

☐ FINAL VERIFICATION
  ☐ Website accessible via HTTPS
  ☐ API endpoints working
  ☐ Real-time features working (Socket.io)
  ☐ Admin panel accessible
  ☐ Performance acceptable
  ☐ No security warnings
  ☐ SSL test grade A or higher
```

### C. Useful commands reference

**PM2 Commands:**
```bash
pm2 start ecosystem.config.js    # Start apps
pm2 list                          # List processes
pm2 logs                          # View logs
pm2 monit                         # Monitor resources
pm2 restart all                   # Restart all apps
pm2 reload all                    # Zero-downtime reload
pm2 stop all                      # Stop all apps
pm2 delete all                    # Delete all apps
pm2 save                          # Save process list
pm2 startup                       # Generate startup script
```

**Nginx Commands:**
```bash
sudo nginx -t                     # Test configuration
sudo systemctl start nginx        # Start Nginx
sudo systemctl stop nginx         # Stop Nginx
sudo systemctl restart nginx      # Restart Nginx
sudo systemctl reload nginx       # Reload config
sudo systemctl status nginx       # Check status
```

**PostgreSQL Commands:**
```bash
sudo -u postgres psql             # Connect as postgres
\l                                # List databases
\c database_name                  # Connect to database
\dt                               # List tables
\q                                # Quit
pg_dump dbname > backup.sql       # Backup database
psql dbname < backup.sql          # Restore database
```

**System Commands:**
```bash
htop                              # Monitor resources
df -h                             # Disk usage
free -h                           # Memory usage
sudo ufw status                   # Firewall status
sudo systemctl status service     # Service status
journalctl -u service -f          # View service logs
```

### D. Troubleshooting

**Issue: Cannot connect to database**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string in .env
cat server/.env | grep DATABASE_URL

# Test connection
psql -U nhh_prod_user -h localhost -d nhh_coffee_prod
```

**Issue: PM2 apps not starting**
```bash
# Check logs
pm2 logs

# Check if ports are available
sudo lsof -i :5000
sudo lsof -i :3000

# Restart apps
pm2 restart all
```

**Issue: Nginx 502 Bad Gateway**
```bash
# Check backend is running
pm2 list

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://localhost:5000/api/health
```

**Issue: SSL certificate not renewing**
```bash
# Check certbot timer
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run

# Check logs
sudo journalctl -u certbot
```

---

**Tài liệu tham khảo:**
- Node.js Documentation: https://nodejs.org/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs
- Nginx Documentation: https://nginx.org/en/docs
- PM2 Documentation: https://pm2.keymetrics.io/docs
- Let's Encrypt: https://letsencrypt.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- Next.js Documentation: https://nextjs.org/docs

**Liên hệ hỗ trợ:**
- Email: support@nhh-coffee.com
- GitHub Issues: [repository-url]/issues
