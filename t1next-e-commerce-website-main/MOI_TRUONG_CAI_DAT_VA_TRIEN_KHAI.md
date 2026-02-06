# MÔI TRƯỜNG CÀI ĐẶT VÀ TRIỂN KHAI - HỆ THỐNG NHH-COFFEE

## 📋 MỤC LỤC

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Môi trường Development](#2-môi-trường-development)
3. [Môi trường Production](#3-môi-trường-production)
4. [Cài đặt Dependencies](#4-cài-đặt-dependencies)
5. [Cấu hình Environment Variables](#5-cấu-hình-environment-variables)
6. [Cài đặt Database](#6-cài-đặt-database)
7. [Khởi chạy ứng dụng](#7-khởi-chạy-ứng-dụng)
8. [Deployment](#8-deployment)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. YÊU CẦU HỆ THỐNG

### 1.1 Phần cứng tối thiểu

#### Development Environment
```
┌─────────────────────────────────────────────────────────────────┐
│                  DEVELOPMENT REQUIREMENTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CPU:        Intel Core i5 hoặc tương đương                     │
│  RAM:        8GB (khuyến nghị 16GB)                             │
│  Storage:    20GB SSD khả dụng                                  │
│  Network:    Kết nối Internet ổn định                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Production Environment
```
┌─────────────────────────────────────────────────────────────────┐
│                  PRODUCTION REQUIREMENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VPS/Server Specifications:                                      │
│  ├─ CPU:        4 cores (khuyến nghị 8 cores)                   │
│  ├─ RAM:        8GB (khuyến nghị 16GB)                          │
│  ├─ Storage:    100GB SSD                                       │
│  ├─ Bandwidth:  1TB/tháng                                       │
│  └─ OS:         Ubuntu 22.04 LTS hoặc CentOS 8                  │
│                                                                  │
│  Khuyến nghị VPS Providers:                                      │
│  ├─ DigitalOcean (Droplet $40-80/tháng)                         │
│  ├─ Vultr (Cloud Compute $40-80/tháng)                          │
│  ├─ Linode (Shared CPU $40-80/tháng)                            │
│  └─ AWS EC2 (t3.large hoặc t3.xlarge)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Phần mềm yêu cầu

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOFTWARE REQUIREMENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Core Software:                                                  │
│  ├─ Node.js:         v20.x hoặc v22.x (LTS)                     │
│  ├─ npm:             v10.x trở lên                               │
│  ├─ PostgreSQL:      v15.x hoặc v16.x                           │
│  ├─ Redis:           v7.x (optional, có fallback)               │
│  └─ Git:             v2.x trở lên                                │
│                                                                  │
│  Development Tools:                                              │
│  ├─ VS Code hoặc IDE tương đương                                │
│  ├─ Postman hoặc Thunder Client (API testing)                   │
│  ├─ pgAdmin hoặc DBeaver (Database management)                  │
│  └─ Redis Commander (Redis management, optional)                │
│                                                                  │
│  Production Tools:                                               │
│  ├─ Nginx:           v1.24.x (Reverse proxy)                    │
│  ├─ PM2:             v5.x (Process manager)                     │
│  ├─ Certbot:         Latest (SSL certificates)                  │
│  └─ UFW:             Firewall configuration                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. MÔI TRƯỜNG DEVELOPMENT

### 2.1 Cài đặt Node.js

#### Windows
```powershell
# Download từ https://nodejs.org/
# Chọn phiên bản LTS (20.x hoặc 22.x)
# Chạy installer và làm theo hướng dẫn

# Kiểm tra cài đặt
node --version
npm --version
```

#### macOS
```bash
# Sử dụng Homebrew
brew install node@20

# Hoặc download từ https://nodejs.org/
```

#### Linux (Ubuntu/Debian)
```bash
# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra
node --version
npm --version
```

### 2.2 Cài đặt PostgreSQL

#### Windows
```powershell
# Download từ https://www.postgresql.org/download/windows/
# Chạy installer
# Ghi nhớ password cho user postgres

# Hoặc sử dụng Docker
docker run --name postgres-nhh ^
  -e POSTGRES_PASSWORD=your_password ^
  -e POSTGRES_DB=nhh_coffee ^
  -p 5432:5432 ^
  -d postgres:16
```

#### macOS
```bash
# Sử dụng Homebrew
brew install postgresql@16
brew services start postgresql@16

# Tạo database
createdb nhh_coffee
```

#### Linux (Ubuntu/Debian)
```bash
# Cài đặt PostgreSQL 16
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16

# Khởi động service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Tạo database và user
sudo -u postgres psql
```


```sql
-- Trong PostgreSQL shell
CREATE DATABASE nhh_coffee;
CREATE USER nhh_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nhh_coffee TO nhh_user;
\q
```

### 2.3 Cài đặt Redis (Optional)

#### Windows
```powershell
# Sử dụng Docker (khuyến nghị)
docker run --name redis-nhh ^
  -p 6379:6379 ^
  -d redis:7-alpine

# Hoặc download từ https://github.com/microsoftarchive/redis/releases
```

#### macOS
```bash
# Sử dụng Homebrew
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
# Cài đặt Redis
sudo apt update
sudo apt install redis-server

# Khởi động service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Kiểm tra
redis-cli ping
# Kết quả: PONG
```

### 2.4 Clone Repository

```bash
# Clone project từ Git
git clone https://github.com/your-username/nhh-coffee.git
cd nhh-coffee

# Kiểm tra cấu trúc
ls -la
# Kết quả:
# client/          (Frontend - Next.js)
# server/          (Backend - Express)
# database_*.sql   (Database files)
```

---

## 3. MÔI TRƯỜNG PRODUCTION

### 3.1 Chuẩn bị VPS

```bash
# Kết nối SSH vào VPS
ssh root@your_server_ip

# Update hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt các công cụ cần thiết
sudo apt install -y curl wget git build-essential
```

### 3.2 Cài đặt Node.js trên Production

```bash
# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra
node --version  # v20.x.x
npm --version   # v10.x.x
```

### 3.3 Cài đặt PostgreSQL trên Production

```bash
# Cài đặt PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-16

# Cấu hình PostgreSQL
sudo -u postgres psql

# Trong PostgreSQL shell
CREATE DATABASE nhh_coffee;
CREATE USER nhh_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE nhh_coffee TO nhh_user;
ALTER DATABASE nhh_coffee OWNER TO nhh_user;
\q

# Cấu hình cho phép kết nối từ localhost
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Thêm dòng:
# local   all   nhh_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3.4 Cài đặt Redis trên Production

```bash
# Cài đặt Redis
sudo apt install -y redis-server

# Cấu hình Redis
sudo nano /etc/redis/redis.conf
# Tìm và sửa:
# supervised systemd
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Kiểm tra
redis-cli ping
```

### 3.5 Cài đặt Nginx

```bash
# Cài đặt Nginx
sudo apt install -y nginx

# Khởi động Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Kiểm tra
sudo systemctl status nginx
```

### 3.6 Cài đặt PM2

```bash
# Cài đặt PM2 globally
sudo npm install -g pm2

# Kiểm tra
pm2 --version
```

### 3.7 Cài đặt Certbot (SSL)

```bash
# Cài đặt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Sẽ sử dụng sau khi cấu hình domain
```

---

## 4. CÀI ĐẶT DEPENDENCIES

### 4.1 Backend Dependencies

```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt dependencies
npm install

# Dependencies chính:
# - express: Web framework
# - prisma: ORM
# - @prisma/client: Prisma client
# - bcrypt: Password hashing
# - jsonwebtoken: JWT authentication
# - zod: Validation
# - socket.io: Real-time communication
# - nodemailer: Email sending
# - ioredis: Redis client
# - @google/generative-ai: Gemini AI
# - cloudinary: Image storage
# - web-push: Push notifications
```

### 4.2 Frontend Dependencies

```bash
# Di chuyển vào thư mục client
cd ../client

# Cài đặt dependencies
npm install

# Dependencies chính:
# - next: Next.js framework
# - react: React library
# - react-dom: React DOM
# - typescript: TypeScript
# - tailwindcss: CSS framework
# - @radix-ui/*: UI components
# - socket.io-client: Socket.io client
# - zod: Validation
# - react-hook-form: Form handling
# - recharts: Charts
```

### 4.3 Prisma Setup

```bash
# Trong thư mục server
cd server

# Generate Prisma Client
npx prisma generate

# Chạy migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed
```

---

## 5. CẤU HÌNH ENVIRONMENT VARIABLES

### 5.1 Backend Environment (.env)

```bash
# Tạo file .env trong thư mục server
cd server
cp .env.example .env
nano .env
```

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://nhh_user:your_password@localhost:5432/nhh_coffee?schema=public"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="NHH Coffee <noreply@nhh-coffee.com>"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Web Push (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@nhh-coffee.com
```

### 5.2 Frontend Environment (.env.local)

```bash
# Tạo file .env.local trong thư mục client
cd ../client
cp .env.example .env.local
nano .env.local
```

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Cloudinary (for client-side uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key

# Site Configuration
NEXT_PUBLIC_SITE_NAME="NHH Coffee"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5.3 Production Environment Variables

```env
# Backend (.env)
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://nhh_user:strong_password@localhost:5432/nhh_coffee?schema=public"
JWT_SECRET=very_strong_secret_key_for_production_min_64_chars
CORS_ORIGIN=https://yourdomain.com
REDIS_URL=redis://localhost:6379

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 6. CÀI ĐẶT DATABASE

### 6.1 Import Database Schema

```bash
# Option 1: Sử dụng Prisma Migrate (Khuyến nghị)
cd server
npx prisma migrate deploy

# Option 2: Import từ SQL file
psql -U nhh_user -d nhh_coffee -f ../database_schema_only.sql

# Option 3: Import full backup (có data)
psql -U nhh_user -d nhh_coffee -f ../database_backup_full.sql
```

### 6.2 Seed Database

```bash
# Chạy seed script
cd server
npm run seed

# Hoặc
npx tsx src/db/seed.ts
```

### 6.3 Verify Database

```bash
# Kết nối vào database
psql -U nhh_user -d nhh_coffee

# Kiểm tra tables
\dt

# Kiểm tra data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM categories;

\q
```

---

## 7. KHỞI CHẠY ỨNG DỤNG

### 7.1 Development Mode

#### Terminal 1: Backend
```bash
cd server
npm run dev

# Server chạy tại: http://localhost:3001
# API Docs: http://localhost:3001/api-docs
```

#### Terminal 2: Frontend
```bash
cd client
npm run dev

# Client chạy tại: http://localhost:3000
```

### 7.2 Build cho Production

#### Backend
```bash
cd server

# Build TypeScript
npm run build

# Kết quả trong thư mục dist/
```

#### Frontend
```bash
cd client

# Build Next.js
npm run build

# Kết quả trong thư mục .next/
```

### 7.3 Chạy Production Mode (Local Test)

#### Backend
```bash
cd server
npm run start

# Hoặc
node dist/index.js
```

#### Frontend
```bash
cd client
npm run start
```


---

## 8. DEPLOYMENT

### 8.1 Chuẩn bị Code cho Production

```bash
# Trên máy local, push code lên Git
git add .
git commit -m "Ready for production deployment"
git push origin main

# Trên VPS, clone repository
cd /var/www
sudo git clone https://github.com/your-username/nhh-coffee.git
sudo chown -R $USER:$USER nhh-coffee
cd nhh-coffee
```

### 8.2 Setup Backend trên Production

```bash
cd /var/www/nhh-coffee/server

# Cài đặt dependencies
npm ci --production

# Tạo .env file
nano .env
# Copy nội dung production environment variables

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build TypeScript
npm run build

# Test chạy
node dist/index.js
# Ctrl+C để dừng
```

### 8.3 Setup Frontend trên Production

```bash
cd /var/www/nhh-coffee/client

# Cài đặt dependencies
npm ci --production

# Tạo .env.local file
nano .env.local
# Copy nội dung production environment variables

# Build Next.js
npm run build

# Test chạy
npm run start
# Ctrl+C để dừng
```

### 8.4 Cấu hình PM2

```bash
# Tạo PM2 ecosystem file
cd /var/www/nhh-coffee
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'nhh-coffee-api',
      script: './server/dist/index.js',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    },
    {
      name: 'nhh-coffee-web',
      script: 'npm',
      args: 'start',
      cwd: './client',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    }
  ]
};
```

```bash
# Tạo thư mục logs
mkdir -p logs

# Khởi động với PM2
pm2 start ecosystem.config.js

# Kiểm tra status
pm2 status

# Xem logs
pm2 logs

# Lưu PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Copy và chạy lệnh được hiển thị
```

### 8.5 Cấu hình Nginx

```bash
# Tạo Nginx configuration
sudo nano /etc/nginx/sites-available/nhh-coffee
```

```nginx
# /etc/nginx/sites-available/nhh-coffee

upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream api_upstream {
    server 127.0.0.1:3001;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (sẽ được Certbot tự động thêm)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API Routes
    location /api {
        proxy_pass http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Images caching
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://nextjs_upstream;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Client max body size (for file uploads)
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nhh-coffee /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 8.6 Cấu hình SSL với Certbot

```bash
# Cài đặt SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Làm theo hướng dẫn:
# 1. Nhập email
# 2. Đồng ý Terms of Service
# 3. Chọn redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run

# Certificate sẽ tự động renew
```

### 8.7 Cấu hình Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (chỉ từ localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Check status
sudo ufw status verbose
```

### 8.8 Kiểm tra Deployment

```bash
# Kiểm tra PM2
pm2 status
pm2 logs --lines 50

# Kiểm tra Nginx
sudo systemctl status nginx
sudo nginx -t

# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Kiểm tra Redis
sudo systemctl status redis-server

# Test API
curl https://yourdomain.com/api/health

# Test Frontend
curl https://yourdomain.com
```

---

## 9. MONITORING & MAINTENANCE

### 9.1 PM2 Monitoring

```bash
# Xem real-time monitoring
pm2 monit

# Xem logs
pm2 logs
pm2 logs nhh-coffee-api
pm2 logs nhh-coffee-web

# Xem thông tin chi tiết
pm2 show nhh-coffee-api

# Restart ứng dụng
pm2 restart nhh-coffee-api
pm2 restart nhh-coffee-web

# Reload (zero-downtime)
pm2 reload nhh-coffee-api

# Stop ứng dụng
pm2 stop nhh-coffee-api

# Delete ứng dụng
pm2 delete nhh-coffee-api
```

### 9.2 Database Backup

```bash
# Tạo script backup tự động
sudo nano /usr/local/bin/backup-nhh-db.sh
```

```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/var/backups/nhh-coffee"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nhh_coffee"
DB_USER="nhh_user"

# Tạo thư mục backup nếu chưa có
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Cho phép thực thi
sudo chmod +x /usr/local/bin/backup-nhh-db.sh

# Test backup
sudo /usr/local/bin/backup-nhh-db.sh

# Cấu hình cron job (backup hàng ngày lúc 2:00 AM)
sudo crontab -e
# Thêm dòng:
0 2 * * * /usr/local/bin/backup-nhh-db.sh >> /var/log/nhh-backup.log 2>&1
```

### 9.3 Log Rotation

```bash
# Cấu hình logrotate cho PM2 logs
sudo nano /etc/logrotate.d/nhh-coffee
```

```
/var/www/nhh-coffee/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 $USER $USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 9.4 System Monitoring

```bash
# Cài đặt htop
sudo apt install htop

# Monitor system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check PostgreSQL connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
redis-cli info memory
```

### 9.5 Application Health Check

```bash
# Tạo health check script
nano /var/www/nhh-coffee/health-check.sh
```

```bash
#!/bin/bash
# Health check script

API_URL="https://yourdomain.com/api/health"
WEB_URL="https://yourdomain.com"

# Check API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ $API_STATUS -eq 200 ]; then
    echo "✓ API is healthy"
else
    echo "✗ API is down (Status: $API_STATUS)"
    # Restart API
    pm2 restart nhh-coffee-api
fi

# Check Web
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $WEB_URL)
if [ $WEB_STATUS -eq 200 ]; then
    echo "✓ Web is healthy"
else
    echo "✗ Web is down (Status: $WEB_STATUS)"
    # Restart Web
    pm2 restart nhh-coffee-web
fi
```

```bash
# Cho phép thực thi
chmod +x /var/www/nhh-coffee/health-check.sh

# Cấu hình cron job (check mỗi 5 phút)
crontab -e
# Thêm dòng:
*/5 * * * * /var/www/nhh-coffee/health-check.sh >> /var/log/nhh-health.log 2>&1
```

---

## 10. TROUBLESHOOTING

### 10.1 Common Issues

#### Issue 1: Port already in use
```bash
# Tìm process đang sử dụng port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Hoặc restart PM2
pm2 restart all
```

#### Issue 2: Database connection error
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Kiểm tra connection string trong .env
cat server/.env | grep DATABASE_URL

# Test connection
psql -U nhh_user -d nhh_coffee -c "SELECT 1;"

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

#### Issue 3: Redis connection error
```bash
# Kiểm tra Redis đang chạy
sudo systemctl status redis-server

# Test connection
redis-cli ping

# Nếu Redis không có, app sẽ fallback sang memory cache
# Không cần thiết phải có Redis
```

#### Issue 4: Nginx 502 Bad Gateway
```bash
# Kiểm tra backend đang chạy
pm2 status

# Kiểm tra Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test backend directly
curl http://localhost:3001/api/health

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

#### Issue 5: SSL Certificate issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates

# Test SSL configuration
sudo nginx -t
```


### 10.2 Performance Issues

#### High CPU Usage
```bash
# Kiểm tra process sử dụng CPU cao
top
htop

# Kiểm tra PM2 metrics
pm2 monit

# Giảm số instances nếu cần
pm2 scale nhh-coffee-api 2

# Restart với memory limit
pm2 restart nhh-coffee-api --max-memory-restart 500M
```

#### High Memory Usage
```bash
# Check memory
free -h

# Check PM2 memory usage
pm2 list

# Restart app để clear memory
pm2 restart all

# Enable swap nếu cần
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Slow Database Queries
```bash
# Enable slow query log
sudo -u postgres psql -d nhh_coffee

# Trong PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

# Check slow queries
sudo tail -f /var/log/postgresql/postgresql-16-main.log | grep "duration:"

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'xxx';
```

### 10.3 Debugging Tips

```bash
# Enable debug mode temporarily
# Trong server/.env
NODE_ENV=development
DEBUG=*

# Restart app
pm2 restart nhh-coffee-api

# Xem detailed logs
pm2 logs nhh-coffee-api --lines 100

# Sau khi debug xong, đổi lại
NODE_ENV=production
# Xóa DEBUG=*

pm2 restart nhh-coffee-api
```

### 10.4 Update & Maintenance

```bash
# Update code từ Git
cd /var/www/nhh-coffee
git pull origin main

# Update backend
cd server
npm install
npm run build
pm2 restart nhh-coffee-api

# Update frontend
cd ../client
npm install
npm run build
pm2 restart nhh-coffee-web

# Run database migrations nếu có
cd ../server
npx prisma migrate deploy

# Clear cache
redis-cli FLUSHALL
```

---

## 📊 CHECKLIST TRIỂN KHAI

### Pre-Deployment Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                  PRE-DEPLOYMENT CHECKLIST                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☐ VPS đã được chuẩn bị và cấu hình                             │
│  ☐ Domain đã được trỏ về VPS IP                                 │
│  ☐ Node.js đã được cài đặt (v20.x)                              │
│  ☐ PostgreSQL đã được cài đặt và cấu hình                       │
│  ☐ Redis đã được cài đặt (optional)                             │
│  ☐ Nginx đã được cài đặt                                        │
│  ☐ PM2 đã được cài đặt globally                                 │
│  ☐ Firewall đã được cấu hình                                    │
│  ☐ Code đã được push lên Git repository                         │
│  ☐ Environment variables đã được chuẩn bị                       │
│  ☐ Database backup strategy đã được setup                       │
│  ☐ SSL certificate đã được cấu hình                             │
│  ☐ Monitoring tools đã được setup                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Post-Deployment Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                 POST-DEPLOYMENT CHECKLIST                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☐ Website accessible qua HTTPS                                 │
│  ☐ API endpoints hoạt động bình thường                          │
│  ☐ Database connections hoạt động                               │
│  ☐ Redis connections hoạt động (nếu có)                         │
│  ☐ Socket.io real-time features hoạt động                       │
│  ☐ Email sending hoạt động                                      │
│  ☐ File upload hoạt động (Cloudinary)                           │
│  ☐ AI Chatbot hoạt động (Gemini)                                │
│  ☐ Push notifications hoạt động                                 │
│  ☐ SSL certificate valid và auto-renew                          │
│  ☐ PM2 auto-restart on server reboot                            │
│  ☐ Database backup cron job hoạt động                           │
│  ☐ Log rotation đã được cấu hình                                │
│  ☐ Health check script hoạt động                                │
│  ☐ Monitoring dashboard accessible                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 USEFUL COMMANDS REFERENCE

### PM2 Commands
```bash
pm2 start ecosystem.config.js    # Start all apps
pm2 restart all                   # Restart all apps
pm2 reload all                    # Zero-downtime reload
pm2 stop all                      # Stop all apps
pm2 delete all                    # Delete all apps
pm2 list                          # List all apps
pm2 logs                          # View logs
pm2 monit                         # Monitor apps
pm2 save                          # Save PM2 list
pm2 startup                       # Generate startup script
pm2 unstartup                     # Remove startup script
```

### Nginx Commands
```bash
sudo nginx -t                     # Test configuration
sudo systemctl start nginx        # Start Nginx
sudo systemctl stop nginx         # Stop Nginx
sudo systemctl restart nginx      # Restart Nginx
sudo systemctl reload nginx       # Reload configuration
sudo systemctl status nginx       # Check status
sudo tail -f /var/log/nginx/error.log    # View error logs
sudo tail -f /var/log/nginx/access.log   # View access logs
```

### PostgreSQL Commands
```bash
sudo systemctl start postgresql   # Start PostgreSQL
sudo systemctl stop postgresql    # Stop PostgreSQL
sudo systemctl restart postgresql # Restart PostgreSQL
sudo systemctl status postgresql  # Check status
sudo -u postgres psql            # Connect as postgres user
psql -U nhh_user -d nhh_coffee   # Connect as nhh_user
pg_dump -U nhh_user nhh_coffee > backup.sql  # Backup database
psql -U nhh_user -d nhh_coffee < backup.sql  # Restore database
```

### Redis Commands
```bash
sudo systemctl start redis-server    # Start Redis
sudo systemctl stop redis-server     # Stop Redis
sudo systemctl restart redis-server  # Restart Redis
sudo systemctl status redis-server   # Check status
redis-cli                            # Connect to Redis
redis-cli ping                       # Test connection
redis-cli FLUSHALL                   # Clear all cache
redis-cli INFO                       # View Redis info
```

### Git Commands
```bash
git pull origin main              # Pull latest code
git status                        # Check status
git log --oneline -10             # View recent commits
git diff                          # View changes
git stash                         # Stash changes
git stash pop                     # Apply stashed changes
```

### System Commands
```bash
df -h                             # Check disk usage
free -h                           # Check memory usage
top                               # View processes
htop                              # Better process viewer
netstat -tulpn                    # View open ports
sudo ufw status                   # Check firewall status
sudo journalctl -u nginx          # View Nginx system logs
sudo journalctl -u postgresql     # View PostgreSQL system logs
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation Links

- **Node.js**: https://nodejs.org/docs/
- **Next.js**: https://nextjs.org/docs
- **Express.js**: https://expressjs.com/
- **Prisma**: https://www.prisma.io/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Redis**: https://redis.io/documentation
- **Nginx**: https://nginx.org/en/docs/
- **PM2**: https://pm2.keymetrics.io/docs/
- **Certbot**: https://certbot.eff.org/
- **Socket.io**: https://socket.io/docs/

### Recommended VPS Providers

1. **DigitalOcean**
   - Website: https://www.digitalocean.com/
   - Pricing: $40-80/month
   - Pros: Easy to use, good documentation

2. **Vultr**
   - Website: https://www.vultr.com/
   - Pricing: $40-80/month
   - Pros: Good performance, multiple locations

3. **Linode**
   - Website: https://www.linode.com/
   - Pricing: $40-80/month
   - Pros: Reliable, good support

4. **AWS EC2**
   - Website: https://aws.amazon.com/ec2/
   - Pricing: Variable
   - Pros: Scalable, many services

### Support & Community

- **GitHub Issues**: Report bugs và feature requests
- **Stack Overflow**: Tìm giải pháp cho các vấn đề kỹ thuật
- **Discord/Slack**: Community support (nếu có)

---

## 🎯 KẾT LUẬN

Tài liệu này cung cấp hướng dẫn chi tiết về:

✅ **Yêu cầu hệ thống**: Phần cứng và phần mềm cần thiết  
✅ **Môi trường Development**: Setup local development  
✅ **Môi trường Production**: Deploy lên VPS  
✅ **Cài đặt Dependencies**: Backend và Frontend  
✅ **Cấu hình Environment**: Development và Production  
✅ **Database Setup**: PostgreSQL và Redis  
✅ **Deployment**: Nginx, PM2, SSL  
✅ **Monitoring**: Logs, backups, health checks  
✅ **Troubleshooting**: Giải quyết các vấn đề thường gặp  

### Next Steps

1. **Development**: Bắt đầu với môi trường local
2. **Testing**: Test kỹ trước khi deploy
3. **Staging**: Deploy lên staging environment trước
4. **Production**: Deploy lên production
5. **Monitoring**: Theo dõi và maintain hệ thống

### Important Notes

⚠️ **Security**: Luôn sử dụng strong passwords và keep secrets an toàn  
⚠️ **Backup**: Backup database thường xuyên  
⚠️ **Updates**: Keep dependencies updated  
⚠️ **Monitoring**: Monitor system health regularly  
⚠️ **SSL**: Luôn sử dụng HTTPS trong production  

---

**Tài liệu được tạo cho đồ án tốt nghiệp**  
**Hệ thống: NHH-Coffee E-commerce & POS**  
**Ngày cập nhật: 2026-01-30**  
**Phiên bản: 1.0.0**
