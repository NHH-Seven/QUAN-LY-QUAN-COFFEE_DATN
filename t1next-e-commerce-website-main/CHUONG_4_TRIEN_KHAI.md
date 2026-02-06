# CHƯƠNG 4: TRIỂN KHAI HỆ THỐNG

## 4.1. GIỚI THIỆU

Chương này trình bày chi tiết quá trình triển khai hệ thống NHH-Coffee từ môi trường phát triển lên môi trường production. Quá trình triển khai được thực hiện theo các bước có hệ thống, đảm bảo tính ổn định, bảo mật và khả năng mở rộng của hệ thống.

## 4.2. MÔI TRƯỜNG TRIỂN KHAI

### 4.2.1. Yêu cầu phần cứng

**Server Production:**
- CPU: 4 cores trở lên (Intel Xeon hoặc AMD EPYC)
- RAM: 8GB trở lên (khuyến nghị 16GB)
- Ổ cứng: 100GB SSD (khuyến nghị 200GB)
- Băng thông: 100Mbps trở lên

**Database Server:**
- CPU: 4 cores trở lên
- RAM: 8GB trở lên (khuyến nghị 16GB)
- Ổ cứng: 200GB SSD với RAID 10
- Backup storage: 500GB

### 4.2.2. Yêu cầu phần mềm

**Hệ điều hành:**
- Ubuntu Server 22.04 LTS hoặc
- CentOS 8 Stream hoặc
- Windows Server 2022

**Runtime & Database:**
- Node.js 20.x LTS
- PostgreSQL 16.x
- Redis 7.x
- Nginx 1.24.x

**Công cụ hỗ trợ:**
- PM2 (Process Manager)
- Git
- Docker & Docker Compose (tùy chọn)

### 4.2.3. Nhà cung cấp VPS

**Các nhà cung cấp được khuyến nghị:**

1. **DigitalOcean**
   - Gói: Droplet 4GB RAM, 2 vCPUs, 80GB SSD
   - Giá: ~$24/tháng
   - Ưu điểm: Dễ sử dụng, tài liệu phong phú

2. **Vultr**
   - Gói: Cloud Compute 4GB RAM, 2 vCPUs, 80GB SSD
   - Giá: ~$24/tháng
   - Ưu điểm: Nhiều datacenter tại châu Á

3. **AWS Lightsail**
   - Gói: 4GB RAM, 2 vCPUs, 80GB SSD
   - Giá: ~$40/tháng
   - Ưu điểm: Tích hợp với hệ sinh thái AWS

4. **Linode (Akamai)**
   - Gói: Linode 4GB, 2 vCPUs, 80GB SSD
   - Giá: ~$24/tháng
   - Ưu điểm: Hiệu năng cao, hỗ trợ tốt

## 4.3. QUY TRÌNH TRIỂN KHAI

### 4.3.1. Chuẩn bị môi trường

**Bước 1: Cập nhật hệ thống**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

**Bước 2: Cài đặt Node.js**

```bash
# Cài đặt Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra phiên bản
node --version
npm --version
```

**Bước 3: Cài đặt PostgreSQL**

```bash
# Thêm repository PostgreSQL
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Cài đặt PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Khởi động service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Bước 4: Cài đặt Redis**

```bash
# Cài đặt Redis
sudo apt install -y redis-server

# Cấu hình Redis
sudo nano /etc/redis/redis.conf
# Thay đổi: supervised no -> supervised systemd

# Khởi động Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

**Bước 5: Cài đặt Nginx**

```bash
# Cài đặt Nginx
sudo apt install -y nginx

# Khởi động Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.3.2. Cấu hình Database

**Tạo database và user:**

```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Tạo database
CREATE DATABASE ecommerce;

# Tạo user
CREATE USER ecommerce_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO ecommerce_user;
ALTER DATABASE ecommerce OWNER TO ecommerce_user;

# Thoát
\q
```

**Cấu hình PostgreSQL cho production:**

```bash
# Chỉnh sửa postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Các thông số quan trọng:
- `max_connections = 200`
- `shared_buffers = 2GB`
- `effective_cache_size = 6GB`
- `maintenance_work_mem = 512MB`
- `checkpoint_completion_target = 0.9`
- `wal_buffers = 16MB`
- `default_statistics_target = 100`
- `random_page_cost = 1.1`
- `effective_io_concurrency = 200`

**Cấu hình pg_hba.conf:**

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Thêm dòng:
```
host    ecommerce    ecommerce_user    127.0.0.1/32    md5
```

Khởi động lại PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 4.3.3. Deploy ứng dụng

**Bước 1: Clone source code**

```bash
# Tạo thư mục cho ứng dụng
sudo mkdir -p /var/www/nhh-coffee
sudo chown -R $USER:$USER /var/www/nhh-coffee

# Clone repository
cd /var/www/nhh-coffee
git clone https://github.com/your-repo/nhh-coffee.git .
```

**Bước 2: Cấu hình Backend**

```bash
cd /var/www/nhh-coffee/server

# Cài đặt dependencies
npm install --production

# Tạo file .env
nano .env
```

Nội dung file `.env`:
```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://ecommerce_user:your_secure_password@localhost:5432/ecommerce

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=https://yourdomain.com
```

**Bước 3: Chạy migrations**

```bash
# Chạy Prisma migrations
npx prisma migrate deploy

# Seed dữ liệu mẫu (nếu cần)
npm run seed
```

**Bước 4: Build và khởi động Backend**

```bash
# Build TypeScript
npm run build

# Cài đặt PM2 global
sudo npm install -g pm2

# Khởi động ứng dụng với PM2
pm2 start dist/index.js --name nhh-coffee-api -i max

# Lưu cấu hình PM2
pm2 save

# Tự động khởi động PM2 khi reboot
pm2 startup
```

**Bước 5: Cấu hình Frontend**

```bash
cd /var/www/nhh-coffee/client

# Cài đặt dependencies
npm install

# Tạo file .env.local
nano .env.local
```

Nội dung file `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

**Build Frontend:**

```bash
# Build Next.js
npm run build

# Khởi động với PM2
pm2 start npm --name nhh-coffee-web -- start
pm2 save
```

### 4.3.4. Cấu hình Nginx

**Tạo file cấu hình cho API:**

```bash
sudo nano /etc/nginx/sites-available/nhh-coffee-api
```

Nội dung:
```nginx
upstream api_backend {
    least_conn;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/api.access.log;
    error_log /var/log/nginx/api.error.log;

    # Client body size
    client_max_body_size 10M;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Tạo file cấu hình cho Frontend:**

```bash
sudo nano /etc/nginx/sites-available/nhh-coffee-web
```

Nội dung:
```nginx
upstream web_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    access_log /var/log/nginx/web.access.log;
    error_log /var/log/nginx/web.error.log;

    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://web_backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

**Kích hoạt cấu hình:**

```bash
# Tạo symbolic links
sudo ln -s /etc/nginx/sites-available/nhh-coffee-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/nhh-coffee-web /etc/nginx/sites-enabled/

# Kiểm tra cấu hình
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4.3.5. Cài đặt SSL Certificate

**Sử dụng Let's Encrypt (Certbot):**

```bash
# Cài đặt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Tạo certificate cho API
sudo certbot --nginx -d api.yourdomain.com

# Tạo certificate cho Web
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Tự động gia hạn
sudo certbot renew --dry-run
```

## 4.4. BẢO MẬT HỆ THỐNG

### 4.4.1. Cấu hình Firewall

```bash
# Cài đặt UFW
sudo apt install -y ufw

# Cấu hình rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Kích hoạt firewall
sudo ufw enable

# Kiểm tra status
sudo ufw status
```

### 4.4.2. Bảo mật SSH

```bash
# Chỉnh sửa cấu hình SSH
sudo nano /etc/ssh/sshd_config
```

Các thay đổi quan trọng:
```
Port 2222                          # Đổi port mặc định
PermitRootLogin no                 # Tắt đăng nhập root
PasswordAuthentication no          # Chỉ dùng SSH key
PubkeyAuthentication yes
MaxAuthTries 3
```

Khởi động lại SSH:
```bash
sudo systemctl restart sshd
```

### 4.4.3. Fail2Ban

```bash
# Cài đặt Fail2Ban
sudo apt install -y fail2ban

# Tạo file cấu hình
sudo nano /etc/fail2ban/jail.local
```

Nội dung:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 2222

[nginx-http-auth]
enabled = true
```

Khởi động Fail2Ban:
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

## 4.5. BACKUP VÀ PHỤC HỒI

### 4.5.1. Backup Database

**Script tự động backup:**

```bash
# Tạo script backup
sudo nano /usr/local/bin/backup-db.sh
```

Nội dung:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ecommerce"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U ecommerce_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

Cấp quyền và tạo cron job:
```bash
sudo chmod +x /usr/local/bin/backup-db.sh

# Thêm vào crontab (backup hàng ngày lúc 2h sáng)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-db.sh
```

### 4.5.2. Backup Files

```bash
# Tạo script backup files
sudo nano /usr/local/bin/backup-files.sh
```

Nội dung:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
SOURCE_DIR="/var/www/nhh-coffee"

mkdir -p $BACKUP_DIR

# Backup uploads và .env
tar -czf $BACKUP_DIR/files_$DATE.tar.gz \
    $SOURCE_DIR/server/uploads \
    $SOURCE_DIR/server/.env \
    $SOURCE_DIR/client/.env.local

# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +7 -delete

echo "Files backup completed: files_$DATE.tar.gz"
```

### 4.5.3. Phục hồi dữ liệu

**Phục hồi database:**

```bash
# Giải nén và restore
gunzip backup_20240101_020000.sql.gz
psql -U ecommerce_user -d ecommerce < backup_20240101_020000.sql
```

**Phục hồi files:**

```bash
# Giải nén
tar -xzf files_20240101_020000.tar.gz -C /
```

## 4.6. MONITORING VÀ LOGGING

### 4.6.1. PM2 Monitoring

```bash
# Xem logs
pm2 logs nhh-coffee-api
pm2 logs nhh-coffee-web

# Xem monitoring
pm2 monit

# Xem status
pm2 status
```

### 4.6.2. Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/api.access.log
tail -f /var/log/nginx/web.access.log

# Error logs
tail -f /var/log/nginx/api.error.log
tail -f /var/log/nginx/web.error.log
```

### 4.6.3. System Monitoring

```bash
# CPU và RAM
htop

# Disk usage
df -h

# Network
netstat -tulpn
```

## 4.7. BẢO TRÌ VÀ CẬP NHẬT

### 4.7.1. Cập nhật ứng dụng

```bash
cd /var/www/nhh-coffee

# Pull code mới
git pull origin main

# Backend
cd server
npm install --production
npm run build
pm2 restart nhh-coffee-api

# Frontend
cd ../client
npm install
npm run build
pm2 restart nhh-coffee-web
```

### 4.7.2. Cập nhật hệ thống

```bash
# Cập nhật packages
sudo apt update && sudo apt upgrade -y

# Cập nhật Node.js (nếu cần)
sudo npm install -g n
sudo n lts

# Khởi động lại services
pm2 restart all
sudo systemctl restart nginx
```

## 4.8. KẾT LUẬN

Quá trình triển khai hệ thống NHH-Coffee đã được thực hiện đầy đủ và chi tiết, đảm bảo:

- **Tính ổn định**: Sử dụng PM2 cluster mode, Nginx load balancing
- **Bảo mật**: SSL/TLS, Firewall, Fail2Ban, SSH hardening
- **Khả năng mở rộng**: Kiến trúc microservices, horizontal scaling
- **Backup**: Tự động backup database và files hàng ngày
- **Monitoring**: PM2, Nginx logs, system monitoring

Hệ thống đã sẵn sàng phục vụ người dùng trong môi trường production với hiệu năng cao và độ tin cậy tốt.
