# TRIỂN KHAI HỆ THỐNG NHH-COFFEE

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Môi trường triển khai](#2-môi-trường-triển-khai)
3. [Kiến trúc triển khai](#3-kiến-trúc-triển-khai)
4. [Bảo mật hệ thống](#4-bảo-mật-hệ-thống)
5. [Backup và Recovery](#5-backup-và-recovery)
6. [Monitoring và Maintenance](#6-monitoring-và-maintenance)
7. [Kết luận](#7-kết-luận)

---

## 1. GIỚI THIỆU

Triển khai hệ thống (System Deployment) là quá trình đưa ứng dụng từ môi trường phát triển lên môi trường sản xuất để phục vụ người dùng thực tế. Đây là giai đoạn quan trọng quyết định sự thành công của dự án, yêu cầu sự chuẩn bị kỹ lưỡng về cơ sở hạ tầng, bảo mật và quy trình vận hành.

Hệ thống NHH-Coffee được triển khai trên môi trường cloud computing sử dụng VPS (Virtual Private Server) với hệ điều hành Ubuntu 22.04 LTS. Kiến trúc triển khai được thiết kế theo mô hình phân tầng với Nginx làm reverse proxy, PM2 quản lý Node.js processes, PostgreSQL làm database chính và Redis làm caching layer. Tất cả các thành phần được cấu hình để hoạt động hiệu quả, bảo mật và có khả năng mở rộng.

Tài liệu này trình bày chi tiết về môi trường triển khai, kiến trúc hệ thống, các biện pháp bảo mật, chiến lược backup và recovery, cũng như quy trình monitoring và maintenance. Mục tiêu là cung cấp một hướng dẫn toàn diện để triển khai và vận hành hệ thống một cách chuyên nghiệp.

## 2. MÔI TRƯỜNG TRIỂN KHAI

### 2.1. Yêu cầu phần cứng

Môi trường production yêu cầu cấu hình phần cứng mạnh mẽ hơn môi trường development để đảm bảo khả năng xử lý đồng thời nhiều người dùng và duy trì hoạt động liên tục 24/7.

**Cấu hình VPS tối thiểu:**

Bộ vi xử lý cần có ít nhất 4 cores vCPU. Với cấu hình này, hệ thống có thể xử lý khoảng 100-200 concurrent users một cách ổn định. Số lượng cores ảnh hưởng trực tiếp đến khả năng xử lý đồng thời của PM2 cluster mode, nơi mỗi core có thể chạy một instance của ứng dụng. Khi traffic tăng cao, các instances này sẽ load balance requests giữa nhau, tận dụng tối đa sức mạnh của CPU.

Bộ nhớ RAM yêu cầu tối thiểu 8GB, được phân bổ như sau: khoảng 2GB dành cho hệ điều hành Ubuntu và các system services, 2GB cho PostgreSQL database với shared buffers và cache, 512MB cho Redis in-memory cache, 2GB cho backend Express API chạy 4 instances trong cluster mode, và 1.5GB cho frontend Next.js chạy 2 instances. Phân bổ này đảm bảo mỗi thành phần có đủ memory để hoạt động hiệu quả mà không gây swap, điều có thể làm giảm performance nghiêm trọng.

Ổ cứng yêu cầu 100GB SSD storage. SSD được chọn thay vì HDD vì tốc độ đọc/ghi nhanh hơn nhiều lần, điều quan trọng cho database operations và serving static files. Dung lượng 100GB được phân bổ: 20GB cho hệ điều hành và system files, 30GB cho PostgreSQL database bao gồm data và indexes, 10GB cho logs và backups, 20GB cho application code và node_modules, và 20GB dự phòng cho việc mở rộng trong tương lai.

Băng thông yêu cầu 1TB/tháng với tốc độ kết nối tối thiểu 100Mbps. Băng thông này đủ để phục vụ khoảng 50,000-100,000 page views mỗi tháng, tùy thuộc vào kích thước trung bình của mỗi page. Do hình ảnh được lưu trữ trên Cloudinary CDN, băng thông của server chủ yếu được sử dụng cho API responses và HTML/CSS/JavaScript, giúp tiết kiệm đáng kể.

**Cấu hình khuyến nghị cho high traffic:**

Đối với hệ thống có lượng truy cập cao hơn (500+ concurrent users), khuyến nghị nâng cấp lên 8 cores vCPU. Điều này cho phép chạy nhiều instances hơn của backend và frontend, tăng khả năng xử lý requests đồng thời. Bộ nhớ RAM nên nâng lên 16GB để có dư địa cho việc mở rộng và handle traffic spikes. Storage có thể nâng lên 200GB nếu database phát triển nhanh hoặc cần lưu trữ nhiều logs hơn.

**Lý do lựa chọn SSD:**

SSD (Solid State Drive) được chọn thay vì HDD (Hard Disk Drive) vì nhiều lý do quan trọng. Thứ nhất, tốc độ đọc/ghi của SSD nhanh hơn HDD từ 10-100 lần, điều này cực kỳ quan trọng cho database operations như SELECT, INSERT, UPDATE queries. Thứ hai, SSD có latency thấp hơn nhiều, giúp giảm response time cho users. Thứ ba, SSD đáng tin cậy hơn vì không có bộ phận cơ học chuyển động, giảm nguy cơ hardware failure. Thứ tư, SSD tiêu thụ ít điện năng hơn và tạo ít nhiệt hơn, giúp giảm chi phí vận hành datacenter.

### 2.2. Nhà cung cấp VPS

Việc lựa chọn nhà cung cấp VPS phù hợp ảnh hưởng đến performance, reliability và chi phí vận hành hệ thống. Dưới đây là phân tích chi tiết về các nhà cung cấp được khuyến nghị.

**DigitalOcean:**

DigitalOcean là một trong những nhà cung cấp cloud computing phổ biến nhất, đặc biệt phù hợp cho startups và small-to-medium businesses. Gói Droplet (tên gọi của VPS trên DigitalOcean) với cấu hình 4 cores, 8GB RAM có giá từ $40-48/tháng. DigitalOcean có datacenter tại Singapore, cung cấp latency thấp cho thị trường Việt Nam (khoảng 20-30ms).

Ưu điểm của DigitalOcean bao gồm giao diện quản lý đơn giản và trực quan, dễ sử dụng ngay cả cho người mới. Tài liệu hướng dẫn (tutorials) rất chi tiết và đầy đủ, cover hầu hết các use cases phổ biến. Community support mạnh với nhiều developers chia sẻ kinh nghiệm. Pricing transparent và predictable, không có hidden costs. API đầy đủ cho automation và infrastructure as code.

Nhược điểm là customer support không tốt bằng các nhà cung cấp enterprise-grade như AWS. Một số advanced features như auto-scaling phải setup manually. Network performance có thể không ổn định như AWS trong một số trường hợp.

**Vultr:**

Vultr là nhà cung cấp cloud computing với focus vào performance và giá cả cạnh tranh. Gói Cloud Compute với cấu hình tương đương có giá từ $40-48/tháng. Vultr có nhiều datacenter locations bao gồm Singapore, Tokyo và Seoul, cho phép chọn location gần nhất với target users.

Ưu điểm của Vultr bao gồm hiệu suất tốt với SSD NVMe thay vì SSD SATA thông thường, cho tốc độ đọc/ghi nhanh hơn. Nhiều lựa chọn về vị trí datacenter giúp optimize latency. Giá cả cạnh tranh, thường rẻ hơn DigitalOcean một chút. Hourly billing cho phép test và scale linh hoạt. Network performance ổn định với 100% uptime SLA.

Nhược điểm là giao diện quản lý không intuitive bằng DigitalOcean. Tài liệu hướng dẫn ít hơn. Community nhỏ hơn nên khó tìm support khi gặp issues.

**Linode:**

Linode là một trong những nhà cung cấp VPS lâu đời nhất, được biết đến với độ tin cậy cao. Gói Shared CPU với cấu hình 4 cores, 8GB RAM có giá khoảng $40-48/tháng. Linode có datacenter tại Singapore.

Ưu điểm của Linode bao gồm độ tin cậy cao với uptime guarantee 99.9%. Customer support tốt với response time nhanh. Infrastructure ổn định, ít downtime. Pricing đơn giản và transparent. Backup service tích hợp sẵn với giá hợp lý.

Nhược điểm là giao diện quản lý hơi outdated so với competitors. Ít features mới so với DigitalOcean và AWS. Community nhỏ hơn.

**AWS EC2:**

Amazon Web Services (AWS) EC2 là dịch vụ cloud computing của Amazon, phù hợp cho enterprises và applications cần scale lớn. Instance type t3.large (2 vCPU, 8GB RAM) hoặc t3.xlarge (4 vCPU, 16GB RAM) phù hợp cho hệ thống. Chi phí khoảng $60-120/tháng tùy theo usage. AWS có region ap-southeast-1 (Singapore).

Ưu điểm của AWS bao gồm khả năng mở rộng linh hoạt với auto-scaling groups. Tích hợp với nhiều dịch vụ AWS khác như RDS (managed database), ElastiCache (managed Redis), CloudFront (CDN), S3 (object storage). Global infrastructure với nhiều regions và availability zones. Advanced monitoring với CloudWatch. Security features mạnh mẽ với IAM, Security Groups, VPC.

Nhược điểm là pricing phức tạp với nhiều factors ảnh hưởng đến cost. Learning curve cao, khó sử dụng cho beginners. Overkill cho small applications. Chi phí cao hơn các alternatives nếu không optimize properly.

**Khuyến nghị:**

Cho hệ thống NHH-Coffee ở giai đoạn đầu, DigitalOcean hoặc Vultr là lựa chọn tốt nhất vì balance giữa performance, ease of use và cost. Khi hệ thống scale lớn hơn và cần advanced features, có thể migrate sang AWS.

### 2.3. Yêu cầu phần mềm

**Hệ điều hành:**

Ubuntu 22.04 LTS (Long Term Support) được chọn làm hệ điều hành cho production server. LTS version được Canonical hỗ trợ trong 5 năm (đến 2027) với security updates và bug fixes thường xuyên. Ubuntu được chọn vì nhiều lý do: thứ nhất, là distribution phổ biến nhất cho servers, có community support lớn và nhiều tài liệu hướng dẫn. Thứ hai, package management với apt đơn giản và reliable. Thứ ba, security updates được release nhanh chóng. Thứ tư, performance tốt và stable cho production workloads.

**Runtime và package manager:**

Node.js phiên bản 20.x LTS là runtime cho cả backend và frontend. Phiên bản 20.x được chọn vì là LTS version mới nhất tại thời điểm triển khai, được hỗ trợ đến 2026. Node.js 20.x mang lại nhiều cải tiến về performance nhờ V8 engine mới, hỗ trợ tốt hơn cho ES modules và async/await, và có các security patches mới nhất.

npm phiên bản 10.x đi kèm với Node.js 20.x, được sử dụng để quản lý dependencies. npm 10.x có cải thiện về tốc độ cài đặt packages, security audit tốt hơn, và hỗ trợ workspaces cho monorepo.

**Database và caching:**

PostgreSQL phiên bản 15.x hoặc 16.x được sử dụng làm database chính. PostgreSQL 15.x mang lại nhiều cải tiến về performance như improved sorting algorithms, better query planning, và enhanced indexing. PostgreSQL 16.x có thêm các features như parallel query improvements và better JSON support. Production configuration của PostgreSQL được tune để optimize cho workload của hệ thống với shared_buffers set 25% của RAM, effective_cache_size set 50% của RAM, và max_connections set 100.

Redis phiên bản 7.x được sử dụng cho caching layer. Redis 7.x có nhiều improvements như Redis Functions (alternative to Lua scripts), ACL improvements, và better memory efficiency. Redis được cấu hình với maxmemory 512MB và maxmemory-policy allkeys-lru để automatically evict least recently used keys khi memory full. Persistence được enable với both RDB snapshots và AOF (Append Only File) để đảm bảo data durability.

**Web server và process manager:**

Nginx phiên bản 1.24.x được sử dụng làm reverse proxy, load balancer và web server. Nginx được chọn thay vì Apache vì performance tốt hơn, sử dụng ít memory hơn, và có khả năng handle nhiều concurrent connections hơn. Nginx sử dụng event-driven architecture thay vì process-based như Apache, cho phép handle hàng nghìn connections với resource usage thấp.

PM2 phiên bản 5.x là process manager cho Node.js applications. PM2 quản lý lifecycle của Node.js processes, tự động restart khi crash, load balancing với cluster mode, log management, và monitoring. PM2 cluster mode cho phép chạy nhiều instances của application trên multiple CPU cores, tận dụng tối đa hardware resources.

**Security và SSL:**

Certbot là official tool của Let's Encrypt để obtain và renew SSL certificates. Let's Encrypt cung cấp SSL certificates miễn phí với automated renewal, giúp enable HTTPS mà không tốn chi phí. Certbot tích hợp với Nginx để automatically configure SSL và setup renewal cron jobs.

UFW (Uncomplicated Firewall) là firewall management tool trên Ubuntu. UFW cung cấp simple interface để manage iptables rules, cho phép easily allow hoặc deny traffic trên specific ports. UFW được configure để chỉ allow traffic trên SSH port, HTTP port 80, và HTTPS port 443, block tất cả traffic khác.


## 3. KIẾN TRÚC TRIỂN KHAI

### 3.1. Tổng quan kiến trúc

Kiến trúc triển khai của hệ thống NHH-Coffee được thiết kế theo mô hình phân tầng với các thành phần được tổ chức một cách logic và hiệu quả. Từ ngoài vào trong, kiến trúc bao gồm các layers sau:

**Layer 1 - Internet và DNS:**

Users truy cập hệ thống thông qua domain name (ví dụ nhh-coffee.com). DNS (Domain Name System) resolve domain name thành IP address của server. DNS records được cấu hình tại domain registrar hoặc DNS provider với A records trỏ domain và www subdomain đến server IP.

**Layer 2 - Firewall:**

UFW firewall là first line of defense, filter incoming traffic và chỉ allow traffic trên allowed ports (SSH, HTTP, HTTPS). Tất cả traffic khác bị block. Firewall rules được configure để prevent unauthorized access và common attacks.

**Layer 3 - Nginx Reverse Proxy:**

Nginx listen trên port 80 (HTTP) và 443 (HTTPS), nhận tất cả incoming requests. Nginx thực hiện nhiều functions: SSL/TLS termination (decrypt HTTPS traffic), request routing (forward requests đến đúng backend services), load balancing (distribute requests giữa multiple instances), static file serving, gzip compression, và caching.

**Layer 4 - Application Layer:**

PM2 quản lý Node.js applications với cluster mode. Backend Express API chạy 4 instances trên port 5000, mỗi instance là separate process. Frontend Next.js chạy 2 instances trên port 3000. PM2 automatically load balance requests giữa instances và restart crashed processes.

**Layer 5 - Data Layer:**

PostgreSQL database chạy trên port 5432, chỉ accept connections từ localhost. Redis cache chạy trên port 6379, cũng chỉ accept local connections. Data layer không expose ra Internet, chỉ accessible từ application layer.

**Layer 6 - External Services:**

Application tích hợp với external services như Cloudinary (image storage và CDN), Google Gemini AI (chatbot), SMTP servers (email), và Web Push services (notifications). Connections đến external services được encrypt và authenticate properly.

### 3.2. Nginx Configuration

Nginx đóng vai trò quan trọng trong kiến trúc triển khai, hoạt động như gateway giữa Internet và internal services.

**Upstream Configuration:**

Nginx upstream blocks định nghĩa backend servers. Upstream api_backend trỏ đến localhost:5000 cho Express API. Upstream web_backend trỏ đến localhost:3000 cho Next.js. Nginx sử dụng round-robin load balancing algorithm by default để distribute requests evenly giữa instances. Nếu một instance fail health check, Nginx automatically route traffic đến healthy instances.

**Server Blocks:**

HTTP server block (port 80) được configure để redirect tất cả traffic sang HTTPS với 301 permanent redirect. Điều này enforce HTTPS cho tất cả connections, đảm bảo data được encrypt in transit.

HTTPS server block (port 443) handle encrypted traffic. SSL certificate và private key được specify trong ssl_certificate và ssl_certificate_key directives. SSL protocols được restrict to TLSv1.2 và TLSv1.3, disable older insecure protocols. SSL ciphers được configure để use strong encryption algorithms.

**Location Blocks:**

Location block /api match tất cả requests bắt đầu với /api và forward đến api_backend. Proxy headers được set để preserve client information như real IP address, forwarded for chain, và protocol. Proxy buffering được configure để optimize performance.

Location block /socket.io handle WebSocket connections cho real-time features. WebSocket-specific headers (Upgrade và Connection) được set để upgrade HTTP connection sang WebSocket protocol. Proxy timeouts được increase để support long-lived WebSocket connections.

Location block / match tất cả requests không match previous blocks và forward đến web_backend. Next.js server handle routing internally và serve appropriate pages.

**Performance Optimizations:**

Gzip compression được enable để reduce response sizes. Gzip compression level được set 6 (balance giữa compression ratio và CPU usage). Gzip types include text/plain, text/css, application/json, application/javascript, text/xml, application/xml. Gzip có thể reduce response sizes 70-80%, significantly improve load times.

Static file caching được configure với location block matching static file extensions (jpg, png, css, js, etc.). Expires header được set 1 year để instruct browsers cache aggressively. Cache-Control header được set "public, immutable" để indicate files never change. Access logging được disable cho static files để reduce I/O.

Client body size limit được set 10MB để prevent large uploads. Proxy timeouts được configure: proxy_connect_timeout 60s, proxy_send_timeout 60s, proxy_read_timeout 60s. Keepalive timeout được set 65s để maintain persistent connections.

**Security Headers:**

Security headers được add vào responses để protect against common attacks. X-Frame-Options "SAMEORIGIN" prevent clickjacking attacks. X-Content-Type-Options "nosniff" prevent MIME type sniffing. X-XSS-Protection "1; mode=block" enable browser XSS protection. Strict-Transport-Security header enforce HTTPS với max-age 31536000 (1 year).

### 3.3. PM2 Cluster Mode

PM2 process manager cho phép tận dụng multi-core CPUs bằng cách chạy multiple instances của application.

**Cluster Mode Benefits:**

Cluster mode mang lại nhiều benefits quan trọng. Thứ nhất, load balancing: PM2 automatically distribute incoming requests giữa instances, ensure no single instance bị overload. Thứ hai, high availability: nếu một instance crash, other instances continue serving requests, minimize downtime. Thứ ba, zero-downtime reload: khi deploy updates, PM2 start new instances trước, wait cho chúng ready, sau đó gracefully shutdown old instances. Thứ tư, resource utilization: tận dụng tối đa multi-core CPUs, improve throughput.

**Instance Configuration:**

Backend được configure với 4 instances, bằng số CPU cores. Mỗi instance là separate Node.js process với own memory space. Instances share same port (5000) nhưng PM2 handle load balancing internally. Exec mode được set "cluster" để enable cluster mode.

Frontend được configure với 2 instances. Next.js đã optimize cho SSR nên không cần nhiều instances như backend. Instances share port 3000 với PM2 load balancing.

**Process Management:**

PM2 monitor processes continuously và automatically restart crashed processes. Restart delay được configure để prevent rapid restart loops. Max restarts được limit để prevent infinite restart cycles nếu application có persistent issues.

PM2 logs được centralize và rotate automatically. Error logs và output logs được separate để easy troubleshooting. Logs được merge từ tất cả instances để unified view. Timestamps được add vào log entries.

**Startup Script:**

PM2 startup script đảm bảo applications automatically start khi server reboot. Startup script được generate cho systemd (Ubuntu's init system). Script được install vào system startup sequence. PM2 save command save current process list để restore sau reboot.

### 3.4. Database Configuration

PostgreSQL database được configure để optimize cho production workload.

**Connection Settings:**

Listen addresses được restrict to localhost để prevent external connections. Port 5432 được use by default. Max connections được set 100, sufficient cho application needs. Connection pooling được handle bởi Prisma Client với pool size 10 connections.

**Memory Settings:**

Shared buffers được set 2GB (25% của 8GB RAM). Shared buffers là memory used by PostgreSQL để cache data. Larger shared buffers improve performance bằng cách reduce disk I/O.

Effective cache size được set 4GB (50% của RAM). Effective cache size là estimate của memory available cho disk caching bởi OS và PostgreSQL. Query planner use this để decide query plans.

Work mem được set 64MB. Work mem là memory used cho sort operations và hash tables. Larger work mem allow complex queries run faster nhưng too large có thể cause memory issues nếu many queries run simultaneously.

Maintenance work mem được set 512MB. Maintenance work mem được use cho maintenance operations như VACUUM, CREATE INDEX. Larger maintenance work mem speed up these operations.

**Performance Tuning:**

Random page cost được set 1.1 (default 4.0 for HDD). Lower value reflect SSD's faster random access. Effective I/O concurrency được set 200 (default 1). Higher value allow PostgreSQL issue more concurrent I/O operations, utilize SSD's parallelism.

Checkpoint completion target được set 0.9. Checkpoints spread over longer period, reduce I/O spikes. Max WAL size được set 2GB. Larger WAL size reduce checkpoint frequency.

**Indexes:**

Indexes được create cho columns frequently used trong WHERE clauses, JOIN conditions, và ORDER BY clauses. Composite indexes được create cho queries filter trên multiple columns. Partial indexes được create cho queries filter trên specific conditions. Index maintenance được perform regularly với REINDEX.

### 3.5. Redis Configuration

Redis được configure để optimize cho caching use case.

**Memory Management:**

Maxmemory được set 512MB. Maxmemory policy được set allkeys-lru (Least Recently Used). Khi memory limit reached, Redis automatically evict least recently used keys để make room cho new data. LRU algorithm ensure frequently accessed data remain trong cache.

**Persistence:**

RDB (Redis Database) snapshots được enable với save intervals: save after 900 seconds if at least 1 key changed, save after 300 seconds if at least 10 keys changed, save after 60 seconds if at least 10000 keys changed. RDB snapshots provide point-in-time backups.

AOF (Append Only File) được enable với appendfsync everysec. AOF log every write operation, provide better durability than RDB. Everysec fsync policy balance giữa performance và durability.

**Security:**

Bind address được restrict to 127.0.0.1 để chỉ accept local connections. Protected mode được enable để refuse connections từ external IPs. Requirepass được set với strong password để authenticate clients.

**Performance:**

TCP backlog được increase to 511. Timeout được set 300 seconds để close idle connections. TCP keepalive được set 300 seconds để detect dead connections.


## 4. BẢO MẬT HỆ THỐNG

Bảo mật là yếu tố quan trọng nhất trong production environment. Hệ thống implement security measures ở nhiều layers để protect khỏi various threats.

### 4.1. Infrastructure Security

**SSH Hardening:**

SSH (Secure Shell) là primary method để access server remotely. SSH được harden để prevent unauthorized access. Root login được disable hoàn toàn, force users login với non-root account và use sudo cho administrative tasks. Password authentication được disable, chỉ allow SSH key authentication. SSH keys provide stronger security than passwords vì không thể brute-force.

SSH port được change từ default 22 sang custom port (ví dụ 2222). Điều này reduce automated attacks targeting default SSH port. Fail2ban có thể được install để automatically ban IPs sau multiple failed login attempts.

SSH keys được generate với RSA algorithm và key size 4096 bits. Private key được protect với passphrase và store securely trên client machine. Public key được add vào server's authorized_keys file.

**Firewall Configuration:**

UFW firewall được configure với default deny policy cho incoming traffic và default allow policy cho outgoing traffic. Chỉ necessary ports được explicitly allow: SSH port cho remote access, port 80 cho HTTP traffic (redirect sang HTTPS), và port 443 cho HTTPS traffic.

Firewall rules được review regularly để ensure chỉ required ports open. Rate limiting có thể được add để prevent DDoS attacks. Logging được enable để track connection attempts.

**System Updates:**

System packages được update regularly để patch security vulnerabilities. Unattended upgrades có thể được configure để automatically install security updates. Kernel updates require reboot nhưng should be applied promptly.

Package sources được verify để ensure packages come từ trusted repositories. GPG keys được check để verify package authenticity.

### 4.2. Database Security

**Access Control:**

PostgreSQL được configure để chỉ accept connections từ localhost. Listen addresses trong postgresql.conf được set "localhost" hoặc "127.0.0.1". Điều này prevent external connections đến database.

pg_hba.conf (host-based authentication) được configure với strict rules. Local connections use peer authentication (trust Unix user). TCP connections từ localhost use md5 password authentication. No rules allow connections từ external IPs.

Database users được create với principle of least privilege. Application user chỉ có permissions cần thiết cho application operations. Superuser postgres chỉ được use cho administrative tasks.

**Password Security:**

Database passwords phải strong với minimum 16 characters, include uppercase, lowercase, numbers, và special characters. Passwords được store trong environment variables, không hardcode trong code.

Passwords được rotate regularly (ví dụ every 6 months). Old passwords không được reuse. Password history được maintain.

**Encryption:**

Data at rest encryption có thể được enable với PostgreSQL's built-in encryption features hoặc filesystem-level encryption. SSL/TLS được enable cho database connections nếu application và database trên separate servers.

Sensitive data như passwords, credit card numbers được encrypt trong database với application-level encryption. Encryption keys được manage securely.

**Backup Security:**

Database backups được encrypt trước khi store hoặc transfer. Backup files được protect với appropriate file permissions. Backups được store ở off-site location để protect khỏi server failures.

### 4.3. Application Security

**Input Validation:**

Tất cả user inputs được validate trước khi process. Zod validation library được use để define schemas cho request data. Validation check data types, formats, lengths, và ranges. Invalid inputs được reject với appropriate error messages.

Validation được perform ở both client-side (immediate feedback) và server-side (security). Client-side validation có thể được bypass nên server-side validation là mandatory.

**SQL Injection Prevention:**

Prisma ORM được use cho database access. Prisma automatically use parameterized queries, prevent SQL injection attacks. Raw SQL queries được avoid hoặc carefully sanitized nếu necessary.

User inputs không bao giờ được directly concatenate vào SQL queries. Prepared statements được use cho all database operations.

**XSS Prevention:**

User-generated content được sanitize trước khi display. HTML tags được escape để prevent script injection. Content Security Policy (CSP) headers được set để restrict sources của scripts, styles, và other resources.

React automatically escape values trong JSX, provide built-in XSS protection. Dangerous operations như dangerouslySetInnerHTML được avoid hoặc use với extreme caution.

**CSRF Protection:**

CSRF (Cross-Site Request Forgery) tokens được implement cho state-changing operations. Tokens được generate server-side và include trong forms. Server verify tokens trước khi process requests.

SameSite cookie attribute được set "strict" hoặc "lax" để prevent CSRF attacks. CORS (Cross-Origin Resource Sharing) được configure để only allow requests từ trusted origins.

**Authentication và Authorization:**

JWT (JSON Web Tokens) được use cho authentication. Tokens được sign với strong secret key và include expiration time. Tokens được store trong httpOnly cookies để prevent XSS attacks.

Passwords được hash với bcrypt algorithm và salt rounds 10. Bcrypt là slow hashing algorithm, make brute-force attacks impractical. Plain text passwords không bao giờ được store.

Authorization được implement với role-based access control (RBAC). Users có roles (user, admin, sales, warehouse) với different permissions. Middleware check user roles trước khi allow access đến protected routes.

**Rate Limiting:**

Rate limiting được implement để prevent brute-force attacks và abuse. Express-rate-limit middleware được use để limit requests từ single IP. Different limits được set cho different endpoints: login endpoints có strict limits (5 requests per 15 minutes), API endpoints có moderate limits (100 requests per 15 minutes).

Rate limit information được include trong response headers. Clients có thể check remaining requests và reset time.

**Security Headers:**

Security headers được add vào all responses. X-Frame-Options prevent clickjacking. X-Content-Type-Options prevent MIME sniffing. X-XSS-Protection enable browser XSS filter. Strict-Transport-Security enforce HTTPS. Content-Security-Policy restrict resource sources.

### 4.4. SSL/TLS Configuration

**Certificate Management:**

Let's Encrypt cung cấp free SSL certificates với 90-day validity. Certbot automatically obtain certificates, configure web server, và setup renewal. Certificates được renew automatically trước khi expire.

Certificate chain được verify để ensure proper trust chain. Private keys được protect với appropriate file permissions (readable only by root). Certificate transparency logs được monitor.

**Protocol Configuration:**

SSL protocols được restrict to TLSv1.2 và TLSv1.3. Older protocols (SSLv3, TLSv1.0, TLSv1.1) được disable vì security vulnerabilities. TLS 1.3 provide better security và performance than older versions.

Cipher suites được configure để prefer strong encryption algorithms. Weak ciphers được disable. Forward secrecy được enable với ECDHE key exchange.

**HTTPS Enforcement:**

All HTTP traffic được redirect sang HTTPS với 301 permanent redirect. HSTS (HTTP Strict Transport Security) header được set với max-age 31536000 (1 year). HSTS instruct browsers chỉ use HTTPS cho future requests.

Mixed content được prevent bằng cách ensure all resources (images, scripts, styles) loaded over HTTPS. Content Security Policy được set để block mixed content.

**SSL Testing:**

SSL configuration được test với SSL Labs SSL Test. Test analyze certificate validity, protocol support, cipher strength, và other security aspects. Target grade là A hoặc A+.

Certificate expiration được monitor để ensure timely renewal. Alerts được setup để notify trước khi certificates expire.

## 5. BACKUP VÀ RECOVERY

Backup strategy đảm bảo data có thể được recovered trong case của data loss, corruption, hoặc disasters.

### 5.1. Backup Strategy

**Backup Types:**

Full backups được perform daily, include toàn bộ database. Full backups provide complete snapshot của data tại specific point in time. Incremental backups có thể được implement để backup chỉ changes since last backup, reduce backup time và storage.

**Backup Schedule:**

Daily backups được schedule lúc 2 AM khi traffic thấp nhất. Backup script được run bởi cron job. Backup process use pg_dump để export PostgreSQL database sang SQL file.

Weekly backups được retain for 4 weeks. Monthly backups được retain for 12 months. Retention policy balance giữa storage costs và recovery needs.

**Backup Storage:**

Backups được store locally trên server trong /var/backups directory. Local backups provide quick recovery nhưng vulnerable to server failures.

Backups được upload sang off-site storage như AWS S3, Google Cloud Storage, hoặc Backblaze B2. Off-site backups protect khỏi server failures, datacenter disasters. Backups được encrypt trước khi upload.

**Backup Verification:**

Backup integrity được verify bằng cách test restore process. Monthly restore tests được perform trên separate test server. Restore process được document chi tiết.

Backup files được check for corruption. File checksums được calculate và verify. Backup logs được review để ensure successful completion.

### 5.2. Recovery Procedures

**Recovery Time Objective (RTO):**

RTO là maximum acceptable time để restore service sau disaster. Target RTO cho hệ thống là 1 giờ. Điều này nghĩa là hệ thống should be back online trong 1 giờ sau incident.

**Recovery Point Objective (RPO):**

RPO là maximum acceptable data loss measured in time. Target RPO là 24 giờ. Điều này nghĩa là maximum 24 giờ của data có thể bị lost (data từ last backup).

**Restore Process:**

Restore process bao gồm các steps: stop application services để prevent new data writes, drop existing database nếu corrupted, create new empty database, restore từ backup file using psql, verify data integrity, restart application services, test application functionality.

**Disaster Recovery Plan:**

Disaster recovery plan document procedures cho various disaster scenarios: server failure (migrate to new server), database corruption (restore from backup), security breach (isolate system, investigate, patch vulnerabilities), natural disasters (activate backup datacenter).

Contact information cho key personnel được maintain. Escalation procedures được define. Regular disaster recovery drills được conduct.

## 6. MONITORING VÀ MAINTENANCE

Monitoring đảm bảo hệ thống hoạt động properly và issues được detected sớm.

### 6.1. Application Monitoring

**PM2 Monitoring:**

PM2 provide built-in monitoring cho Node.js processes. PM2 monit command show real-time CPU và memory usage cho each process. PM2 list show process status, uptime, restarts. PM2 logs show application logs từ all instances.

Metrics được collect: CPU usage, memory usage, request rate, error rate, response time. Metrics được track over time để identify trends và anomalies.

**Log Management:**

Application logs được centralize và rotate automatically. Log rotation prevent logs từ consuming too much disk space. Logs được retain for 30 days.

Log levels được use appropriately: ERROR cho errors require attention, WARN cho potential issues, INFO cho important events, DEBUG cho detailed information (disabled trong production).

Logs được parse và analyze để identify patterns. Error logs được review daily. Unusual patterns được investigate.

### 6.2. System Monitoring

**Resource Monitoring:**

System resources được monitor continuously. CPU usage, memory usage, disk usage, network usage được track. Thresholds được set để trigger alerts: CPU > 80% for 10 minutes, memory > 90%, disk > 85%.

Htop hoặc similar tools được use để view real-time resource usage. Historical data được collect với monitoring tools.

**Database Monitoring:**

PostgreSQL performance được monitor với pg_stat_statements extension. Slow queries được identify và optimize. Query execution plans được analyze.

Database size được track. Table và index sizes được monitor. Vacuum và analyze operations được schedule regularly.

Connection pool usage được monitor. Connection leaks được detect và fix.

**Uptime Monitoring:**

External uptime monitoring services như UptimeRobot ping website every 5 minutes. Alerts được send qua email hoặc SMS khi website down.

Response time được track. Slow response times được investigate. SSL certificate expiration được monitor.

### 6.3. Maintenance Tasks

**Regular Updates:**

System packages được update monthly. Security updates được apply promptly. Kernel updates require reboot, schedule during maintenance windows.

Node.js packages được update regularly. npm audit được run để check for vulnerabilities. Vulnerable packages được update hoặc replaced.

**Database Maintenance:**

VACUUM được run regularly để reclaim storage và update statistics. ANALYZE được run để update query planner statistics. REINDEX được run để rebuild indexes.

Database backups được verify monthly. Old backups được cleanup theo retention policy.

**Performance Optimization:**

Slow queries được identify và optimize. Indexes được add cho frequently queried columns. Query plans được analyze.

Cache hit rates được monitor. Cache configuration được tune để improve hit rates. Stale cache entries được invalidate.

**Security Audits:**

Security configuration được review quarterly. Access logs được analyze cho suspicious activities. Firewall rules được review.

Penetration testing có thể được conduct annually. Vulnerabilities được identified và patched.

## 7. KẾT LUẬN

Triển khai hệ thống NHH-Coffee lên môi trường production yêu cầu sự chuẩn bị kỹ lưỡng về cơ sở hạ tầng, kiến trúc, bảo mật và quy trình vận hành. Tài liệu này đã trình bày chi tiết về các aspects quan trọng của deployment process.

Môi trường triển khai được thiết kế với VPS có cấu hình phù hợp, sử dụng Ubuntu 22.04 LTS làm hệ điều hành và các phần mềm production-grade như Nginx, PM2, PostgreSQL và Redis. Việc lựa chọn nhà cung cấp VPS phù hợp ảnh hưởng đến performance, reliability và cost.

Kiến trúc triển khai được organize theo layers với Nginx làm reverse proxy và load balancer, PM2 quản lý Node.js processes trong cluster mode, và database layer được isolate khỏi external access. Kiến trúc này provide high availability, scalability và security.

Bảo mật được implement ở multiple layers từ infrastructure (SSH hardening, firewall), database (access control, encryption), đến application (input validation, authentication, authorization). SSL/TLS được configure properly để encrypt data in transit. Security measures protect hệ thống khỏi common attacks như SQL injection, XSS, CSRF, và brute-force.

Backup strategy với automated daily backups và off-site storage đảm bảo data có thể được recovered trong disaster scenarios. Recovery procedures được document và test regularly. RTO và RPO targets được define clearly.

Monitoring và maintenance procedures đảm bảo hệ thống hoạt động smoothly và issues được detected sớm. Application monitoring, system monitoring, và uptime monitoring provide comprehensive visibility. Regular maintenance tasks keep hệ thống healthy và secure.

Với deployment strategy được trình bày trong tài liệu này, hệ thống NHH-Coffee có thể được triển khai successfully và vận hành reliably trong production environment, serving users với high performance, security và availability.
