# TRIỂN KHAI HỆ THỐNG NHH-COFFEE

## 1. GIỚI THIỆU

Triển khai hệ thống là quá trình đưa ứng dụng từ môi trường phát triển lên môi trường sản xuất để phục vụ người dùng thực tế. Hệ thống NHH-Coffee được triển khai trên VPS với Ubuntu 22.04 LTS, sử dụng Nginx làm reverse proxy, PM2 quản lý processes, PostgreSQL làm database và Redis làm cache.

## 2. MÔI TRƯỜNG TRIỂN KHAI

### 2.1. Yêu cầu phần cứng

**Cấu hình VPS tối thiểu:**
- CPU: 4 cores vCPU
- RAM: 8GB
- Storage: 100GB SSD
- Bandwidth: 1TB/tháng, 100Mbps
- OS: Ubuntu 22.04 LTS

**Phân bổ tài nguyên:**
- Hệ điều hành: 2GB RAM
- PostgreSQL: 2GB RAM
- Redis: 512MB RAM
- Backend (4 instances): 2GB RAM
- Frontend (2 instances): 1.5GB RAM

**Cấu hình khuyến nghị (high traffic):**
- CPU: 8 cores vCPU
- RAM: 16GB
- Storage: 200GB SSD

### 2.2. Nhà cung cấp VPS

**DigitalOcean:**
- Giá: $40-80/tháng
- Datacenter: Singapore
- Ưu điểm: Giao diện đơn giản, tài liệu đầy đủ, community support tốt
- Nhược điểm: Customer support trung bình

**Vultr:**
- Giá: $40-80/tháng
- Datacenter: Singapore, Tokyo, Seoul
- Ưu điểm: Performance tốt, nhiều locations, giá cạnh tranh
- Nhược điểm: Giao diện không intuitive, tài liệu ít

**Linode:**
- Giá: $40-80/tháng
- Datacenter: Singapore
- Ưu điểm: Độ tin cậy cao, support tốt, uptime 99.9%
- Nhược điểm: Giao diện outdated, ít features mới

**AWS EC2:**
- Giá: $60-120/tháng
- Region: Singapore (ap-southeast-1)
- Ưu điểm: Scalable, nhiều services tích hợp, global infrastructure
- Nhược điểm: Pricing phức tạp, learning curve cao, chi phí cao

**Khuyến nghị:** DigitalOcean hoặc Vultr cho giai đoạn đầu, AWS khi cần scale lớn.

### 2.3. Yêu cầu phần mềm

**Hệ điều hành và runtime:**
- Ubuntu 22.04 LTS (hỗ trợ đến 2027)
- Node.js 20.x LTS
- npm 10.x

**Database và caching:**
- PostgreSQL 15.x hoặc 16.x
- Redis 7.x

**Web server và process manager:**
- Nginx 1.24.x (reverse proxy, load balancer)
- PM2 5.x (process manager, cluster mode)

**Security và SSL:**
- Certbot (Let's Encrypt SSL certificates)
- UFW (Uncomplicated Firewall)

## 3. KIẾN TRÚC TRIỂN KHAI

### 3.1. Tổng quan kiến trúc (6 layers)

**Layer 1 - Internet & DNS:**
- Users truy cập qua domain name
- DNS resolve domain → server IP

**Layer 2 - Firewall (UFW):**
- Filter incoming traffic
- Chỉ allow SSH, HTTP, HTTPS ports

**Layer 3 - Nginx Reverse Proxy:**
- Listen trên port 80 (HTTP) và 443 (HTTPS)
- SSL/TLS termination
- Request routing và load balancing
- Static file serving, gzip compression, caching

**Layer 4 - Application Layer (PM2):**
- Backend: 4 instances trên port 5000
- Frontend: 2 instances trên port 3000
- Auto restart, load balancing

**Layer 5 - Data Layer:**
- PostgreSQL: port 5432 (localhost only)
- Redis: port 6379 (localhost only)

**Layer 6 - External Services:**
- Cloudinary (images)
- Google Gemini AI (chatbot)
- SMTP (email)
- Web Push (notifications)

### 3.2. Nginx Configuration

**Upstream blocks:**
- api_backend → localhost:5000
- web_backend → localhost:3000

**Server blocks:**
- HTTP (port 80): Redirect tất cả sang HTTPS
- HTTPS (port 443): Handle encrypted traffic

**Location blocks:**
- `/api` → Forward đến api_backend
- `/socket.io` → Forward đến api_backend (WebSocket)
- `/` → Forward đến web_backend

**Performance optimizations:**
- Gzip compression (level 6, reduce 70-80% size)
- Static file caching (expires 1 year)
- Client body size limit: 10MB
- Proxy timeouts: 60s
- Keepalive timeout: 65s

**Security headers:**
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000

### 3.3. PM2 Cluster Mode

**Benefits:**
- Load balancing giữa instances
- High availability (auto restart crashed processes)
- Zero-downtime reload
- Tận dụng multi-core CPUs

**Configuration:**
- Backend: 4 instances (= số CPU cores)
- Frontend: 2 instances
- Exec mode: cluster
- Auto restart on crash
- Centralized logs

**Startup script:**
- Auto start khi server reboot
- Systemd integration
- Restore saved process list

### 3.4. Database Configuration

**PostgreSQL settings:**
- Listen: localhost only
- Max connections: 100
- Shared buffers: 2GB (25% RAM)
- Effective cache size: 4GB (50% RAM)
- Work mem: 64MB
- Maintenance work mem: 512MB

**Performance tuning:**
- Random page cost: 1.1 (SSD optimized)
- Effective I/O concurrency: 200
- Checkpoint completion target: 0.9
- Max WAL size: 2GB

**Indexes:**
- Primary keys: UUID
- Foreign keys: Maintain referential integrity
- Indexes trên columns frequently queried
- Composite indexes cho multi-column queries

### 3.5. Redis Configuration

**Memory management:**
- Maxmemory: 512MB
- Maxmemory policy: allkeys-lru
- Auto evict least recently used keys

**Persistence:**
- RDB snapshots: Point-in-time backups
- AOF (Append Only File): Log every write
- Appendfsync: everysec

**Security:**
- Bind: 127.0.0.1 (localhost only)
- Protected mode: enabled
- Requirepass: strong password

## 4. BẢO MẬT HỆ THỐNG

### 4.1. Infrastructure Security

**SSH Hardening:**
- Disable root login
- Disable password authentication (SSH key only)
- Change SSH port từ 22 → custom port
- SSH keys: RSA 4096 bits

**Firewall (UFW):**
- Default deny incoming traffic
- Allow SSH, HTTP (80), HTTPS (443) only
- Rate limiting cho DDoS protection

**System Updates:**
- Regular security patches
- Unattended upgrades cho security updates
- Verify package sources

### 4.2. Database Security

**Access Control:**
- PostgreSQL: localhost only
- No external connections
- Principle of least privilege
- Strong passwords (16+ characters)

**Encryption:**
- Data at rest encryption (optional)
- SSL/TLS cho connections
- Sensitive data encrypted trong database

**Backup Security:**
- Encrypt backups trước khi store
- Protect với file permissions
- Off-site storage

### 4.3. Application Security

**Input Validation:**
- Zod validation cho all inputs
- Server-side validation mandatory
- Reject invalid inputs

**Attack Prevention:**
- SQL Injection: Prisma ORM (parameterized queries)
- XSS: Sanitize user content, CSP headers
- CSRF: Tokens, SameSite cookies
- Brute-force: Rate limiting

**Authentication & Authorization:**
- JWT tokens (httpOnly cookies)
- Bcrypt password hashing (salt rounds 10)
- Role-based access control (RBAC)

**Rate Limiting:**
- Login: 5 requests/15 minutes
- API: 100 requests/15 minutes

### 4.4. SSL/TLS Configuration

**Certificate Management:**
- Let's Encrypt (free, 90-day validity)
- Certbot auto renewal
- Certificate transparency monitoring

**Protocol Configuration:**
- TLS 1.2 và 1.3 only
- Disable older protocols (SSLv3, TLS 1.0, 1.1)
- Strong cipher suites
- Forward secrecy enabled

**HTTPS Enforcement:**
- Redirect HTTP → HTTPS (301)
- HSTS header (max-age 1 year)
- Block mixed content

**SSL Testing:**
- SSL Labs test (target grade A/A+)
- Monitor certificate expiration

## 5. BACKUP VÀ RECOVERY

### 5.1. Backup Strategy

**Backup Types:**
- Full backups: Daily (toàn bộ database)
- Incremental backups: Changes only (optional)

**Backup Schedule:**
- Daily: 2 AM (low traffic time)
- Retention: 7 days local, 4 weeks weekly, 12 months monthly

**Backup Storage:**
- Local: /var/backups (quick recovery)
- Off-site: AWS S3, Google Cloud Storage (disaster protection)
- Encrypt trước khi upload

**Backup Verification:**
- Monthly restore tests
- Check file integrity (checksums)
- Review backup logs

### 5.2. Recovery Procedures

**Recovery Objectives:**
- RTO (Recovery Time Objective): 1 giờ
- RPO (Recovery Point Objective): 24 giờ

**Restore Process:**
1. Stop application services
2. Drop corrupted database
3. Create new database
4. Restore từ backup (psql)
5. Verify data integrity
6. Restart services
7. Test functionality

**Disaster Recovery Plan:**
- Server failure: Migrate to new server
- Database corruption: Restore from backup
- Security breach: Isolate, investigate, patch
- Natural disasters: Activate backup datacenter

## 6. MONITORING VÀ MAINTENANCE

### 6.1. Application Monitoring

**PM2 Monitoring:**
- Real-time CPU/memory usage
- Process status, uptime, restarts
- Centralized logs
- Metrics: Request rate, error rate, response time

**Log Management:**
- Centralized logs
- Auto rotation (prevent disk full)
- Retention: 30 days
- Log levels: ERROR, WARN, INFO, DEBUG

### 6.2. System Monitoring

**Resource Monitoring:**
- CPU, memory, disk, network usage
- Thresholds: CPU > 80%, memory > 90%, disk > 85%
- Historical data tracking

**Database Monitoring:**
- Slow queries (pg_stat_statements)
- Connection pool usage
- Database size tracking
- Vacuum và analyze operations

**Uptime Monitoring:**
- External services: UptimeRobot (ping every 5 minutes)
- Response time tracking
- SSL certificate expiration
- Alerts: Email/SMS khi down

### 6.3. Maintenance Tasks

**Regular Updates:**
- System packages: Monthly
- Security updates: Promptly
- Node.js packages: Regular npm audit
- Kernel updates: Schedule maintenance windows

**Database Maintenance:**
- VACUUM: Reclaim storage
- ANALYZE: Update statistics
- REINDEX: Rebuild indexes
- Verify backups monthly

**Performance Optimization:**
- Identify và optimize slow queries
- Add indexes cho frequently queried columns
- Monitor cache hit rates
- Invalidate stale cache

**Security Audits:**
- Review configuration quarterly
- Analyze access logs
- Review firewall rules
- Penetration testing annually

## 7. DEPLOYMENT WORKFLOW

### 7.1. Zero-Downtime Deployment

**Update Process:**
1. SSH vào server
2. Pull latest code (git pull)
3. Install dependencies (npm ci --production)
4. Build applications (npm run build)
5. Apply migrations (prisma migrate deploy)
6. Reload PM2 (pm2 reload)

**PM2 Reload Process:**
- Start new instances
- Wait cho ready
- Gracefully shutdown old instances
- No downtime cho users

### 7.2. Rollback Strategy

**Rollback Steps:**
1. View commit history (git log)
2. Checkout previous commit
3. Rebuild applications
4. Reload PM2
5. Verify functionality

**Rollback Time:** Target < 5 minutes

### 7.3. Health Checks

**Post-Deployment Verification:**
- PM2 status (pm2 list)
- Application logs (pm2 logs)
- Test API endpoints
- Test frontend pages
- Verify database connections
- Check SSL certificate

## 8. KẾT LUẬN

Triển khai hệ thống NHH-Coffee lên production yêu cầu chuẩn bị kỹ lưỡng về:

**Cơ sở hạ tầng:**
- VPS với cấu hình phù hợp (4 cores, 8GB RAM, 100GB SSD)
- Ubuntu 22.04 LTS, Node.js, PostgreSQL, Redis, Nginx, PM2

**Kiến trúc:**
- 6 layers từ Internet đến Data Layer
- Nginx reverse proxy và load balancing
- PM2 cluster mode (4 backend, 2 frontend instances)
- Database và cache isolated (localhost only)

**Bảo mật:**
- Infrastructure: SSH hardening, firewall
- Database: Access control, encryption
- Application: Input validation, attack prevention
- SSL/TLS: HTTPS enforcement, strong protocols

**Backup & Recovery:**
- Daily automated backups
- Off-site storage
- RTO 1 giờ, RPO 24 giờ
- Disaster recovery plan

**Monitoring & Maintenance:**
- Application, system, uptime monitoring
- Regular updates và maintenance
- Performance optimization
- Security audits

Với deployment strategy này, hệ thống NHH-Coffee hoạt động ổn định, bảo mật và có khả năng mở rộng, phục vụ người dùng với high performance và availability.
