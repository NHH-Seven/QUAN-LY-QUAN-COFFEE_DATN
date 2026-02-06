# TRIỂN KHAI HỆ THỐNG NHH-COFFEE

## Giới thiệu

Quá trình triển khai hệ thống NHH-Coffee được thực hiện theo một quy trình có hệ thống, từ việc chuẩn bị môi trường phát triển, xây dựng ứng dụng, đến triển khai lên môi trường production. Hệ thống được lưu trữ và quản lý mã nguồn trên GitHub tại repository NHH-Seven, cho phép theo dõi lịch sử thay đổi và làm việc nhóm hiệu quả.

## Môi trường phát triển

Hệ thống được phát triển trên nền tảng Windows với các công cụ và công nghệ hiện đại. Môi trường phát triển bao gồm Node.js phiên bản 20.x LTS làm runtime cho cả backend và frontend, PostgreSQL 16.x làm hệ quản trị cơ sở dữ liệu quan hệ, và Redis 7.x cho việc caching và quản lý session. Visual Studio Code được sử dụng làm IDE chính với các extension hỗ trợ TypeScript, Prisma và React.

Để bắt đầu phát triển, developer cần clone repository từ GitHub về máy local. Source code được tổ chức thành hai thư mục chính là server cho backend và client cho frontend. Sau khi clone, cần cài đặt dependencies cho cả hai phần bằng npm install. Đối với backend, cần tạo file .env chứa các biến môi trường như database connection string, JWT secret, email credentials và Gemini API key. Đối với frontend, cần tạo file .env.local chứa API URL và Socket URL.

Database được khởi tạo bằng Prisma migrations. Lệnh npx prisma migrate dev sẽ tạo các bảng trong PostgreSQL dựa trên schema đã định nghĩa. Sau đó, lệnh npm run seed sẽ import dữ liệu mẫu bao gồm categories, products, users và các dữ liệu cần thiết khác để phục vụ việc phát triển và testing.

Trong quá trình phát triển, backend chạy ở chế độ development với nodemon để tự động restart khi có thay đổi code. Frontend chạy với Next.js development server, hỗ trợ hot reload và fast refresh. Developer có thể truy cập ứng dụng qua localhost:3000 cho frontend và localhost:3001 cho backend API.

## Cấu trúc source code

Source code được tổ chức theo kiến trúc module hóa rõ ràng. Phần backend trong thư mục server sử dụng TypeScript với cấu trúc MVC. Thư mục src/routes chứa các route handlers, mỗi file tương ứng với một nhóm chức năng như auth.ts cho xác thực, products.ts cho sản phẩm, orders.ts cho đơn hàng. Thư mục src/services chứa các service xử lý logic phức tạp như email.service.ts, chatbot.service.ts, cache.service.ts. Thư mục src/middleware chứa các middleware như authentication, authorization, validation. Thư mục prisma chứa schema.prisma định nghĩa cấu trúc database.

Phần frontend trong thư mục client sử dụng Next.js 14 với App Router. Thư mục app chứa các pages và layouts, được tổ chức theo file-system routing. Thư mục components chứa các React components tái sử dụng, được phân loại theo chức năng như ui, auth, product, cart. Thư mục contexts chứa React Context cho state management toàn cục. Thư mục hooks chứa custom hooks. Thư mục lib chứa utilities và API client.

## Quản lý phiên bản

Mã nguồn được quản lý trên GitHub với repository NHH-Seven. Git được sử dụng để theo dõi lịch sử thay đổi, tạo branches cho các tính năng mới và merge code sau khi review. Main branch chứa code ổn định, sẵn sàng deploy. Development branch dùng cho việc phát triển tính năng mới. Mỗi tính năng lớn được phát triển trên feature branch riêng, sau đó tạo pull request để merge vào development branch.

Commit messages được viết theo convention rõ ràng, bắt đầu bằng prefix như feat: cho tính năng mới, fix: cho bug fix, refactor: cho refactoring code, docs: cho cập nhật documentation. Điều này giúp dễ dàng theo dõi lịch sử thay đổi và tạo changelog tự động.

## Triển khai lên production

Khi code đã được test kỹ lưỡng và sẵn sàng deploy, quá trình triển khai lên production được thực hiện theo các bước có hệ thống. Đầu tiên là chuẩn bị server production, thường là một VPS từ các nhà cung cấp như DigitalOcean, Vultr hoặc AWS Lightsail. Server cần có cấu hình tối thiểu 4GB RAM, 2 CPU cores và 80GB SSD để đảm bảo hiệu năng ổn định.

Trên server production, cần cài đặt các phần mềm cần thiết bao gồm Node.js, PostgreSQL, Redis và Nginx. Node.js được cài đặt từ NodeSource repository để đảm bảo phiên bản mới nhất. PostgreSQL được cài đặt từ official repository và cấu hình với các thông số tối ưu cho production như tăng shared_buffers, effective_cache_size và connection pool. Redis được cài đặt và cấu hình để chạy như một system service.

Database production được khởi tạo bằng cách tạo database mới, tạo user với quyền phù hợp và chạy Prisma migrations. Dữ liệu production có thể được import từ backup hoặc seed từ đầu tùy theo yêu cầu. Quan trọng là phải backup database thường xuyên để phòng tránh mất mát dữ liệu.

Source code được deploy lên server bằng cách clone từ GitHub repository. Trên server, chạy git clone với URL của repository, sau đó checkout branch main. Cài đặt dependencies với npm install --production để chỉ cài các packages cần thiết cho production, bỏ qua dev dependencies.

Backend được build từ TypeScript sang JavaScript bằng lệnh npm run build. Output được lưu trong thư mục dist. Ứng dụng được chạy với PM2 process manager, một công cụ mạnh mẽ cho việc quản lý Node.js applications trong production. PM2 chạy ứng dụng ở cluster mode với số instance bằng số CPU cores, tự động restart khi crash, và cung cấp monitoring built-in.

Frontend được build với Next.js production build bằng lệnh npm run build. Next.js tự động optimize code, minify JavaScript/CSS, optimize images và tạo static pages khi có thể. Build output được serve bằng Next.js production server hoặc có thể export thành static files để serve qua CDN.

Nginx được cấu hình làm reverse proxy, đứng trước Node.js applications. Nginx nhận requests từ internet, forward đến backend hoặc frontend tương ứng, và trả response về client. Nginx cũng xử lý SSL/TLS termination, serving static files, gzip compression và caching. Cấu hình Nginx bao gồm upstream blocks định nghĩa backend servers, server blocks cho từng domain, location blocks cho routing, và các directives cho SSL, caching, security headers.

SSL certificate được cài đặt bằng Let's Encrypt, một certificate authority miễn phí và tự động. Certbot tool được sử dụng để obtain và renew certificates. Certbot tự động cấu hình Nginx để sử dụng certificates và setup auto-renewal cron job. Sau khi cài SSL, tất cả HTTP traffic được redirect sang HTTPS để đảm bảo bảo mật.

## Bảo mật hệ thống

Bảo mật là ưu tiên hàng đầu trong quá trình triển khai. Firewall được cấu hình để chỉ mở các ports cần thiết như 22 cho SSH, 80 cho HTTP và 443 cho HTTPS. Tất cả các ports khác đều bị block. SSH được hardening bằng cách đổi port mặc định, disable root login, chỉ cho phép key-based authentication và giới hạn số lần thử đăng nhập.

Fail2Ban được cài đặt để tự động block các IP có hành vi đáng ngờ như brute force SSH, quá nhiều failed login attempts hoặc scanning ports. Fail2Ban monitor log files và tự động thêm iptables rules để block các IP vi phạm trong một khoảng thời gian.

Application level security bao gồm nhiều lớp bảo vệ. JWT tokens được sử dụng cho authentication với expiration time hợp lý. Passwords được hash bằng bcrypt với salt rounds cao. Input validation được thực hiện ở cả client và server side. SQL injection được phòng chống bằng Prisma ORM với parameterized queries. XSS được phòng chống bằng React's built-in escaping và Content Security Policy headers. CSRF được phòng chống bằng CSRF tokens. Rate limiting được implement để phòng chống DDoS và brute force attacks.

## Backup và recovery

Backup là một phần quan trọng của chiến lược triển khai. Database được backup tự động hàng ngày bằng cron job. Backup script sử dụng pg_dump để export database thành SQL file, compress bằng gzip để tiết kiệm dung lượng, và lưu vào thư mục backup với timestamp trong tên file. Backup cũ hơn 7 ngày được tự động xóa để tiết kiệm disk space.

Uploaded files như product images cũng được backup định kỳ. Backup script tạo tarball của uploads directory và lưu vào backup location. Backup files được sync lên cloud storage như AWS S3 hoặc Google Cloud Storage để đảm bảo an toàn ngay cả khi server bị hỏng hoàn toàn.

Recovery process được document rõ ràng và test định kỳ. Để restore database, chỉ cần gunzip backup file và import vào PostgreSQL bằng psql. Để restore files, extract tarball vào đúng location. Việc test recovery process thường xuyên đảm bảo rằng khi có sự cố thực sự xảy ra, team có thể restore hệ thống nhanh chóng.

## Monitoring và logging

Monitoring giúp phát hiện và xử lý vấn đề trước khi chúng ảnh hưởng đến người dùng. PM2 cung cấp monitoring built-in cho Node.js processes, hiển thị CPU usage, memory usage, request per minute và error rate. PM2 logs được lưu tự động và có thể xem bằng lệnh pm2 logs.

Nginx access logs và error logs được monitor để phát hiện các vấn đề như 404 errors, 500 errors, slow requests. Log rotation được cấu hình để tự động archive và compress old logs, tránh disk space đầy.

System monitoring bao gồm theo dõi CPU usage, memory usage, disk space và network traffic. Các tools như htop, iostat, netstat được sử dụng để monitor real-time. Alert được setup để thông báo qua email hoặc Slack khi có vấn đề như disk space thấp, memory usage cao, hoặc service down.

Application performance monitoring theo dõi response time, error rate, throughput. Slow queries được log và optimize. Cache hit rate được monitor để đảm bảo caching hiệu quả. Database connection pool được monitor để tránh connection exhaustion.

## Cập nhật và bảo trì

Hệ thống cần được cập nhật thường xuyên để fix bugs, thêm features mới và patch security vulnerabilities. Quy trình cập nhật bao gồm pull code mới từ GitHub, install dependencies mới nếu có, run database migrations nếu có thay đổi schema, build lại application và restart services.

Để minimize downtime, cập nhật được thực hiện trong maintenance window hoặc sử dụng blue-green deployment. Blue-green deployment chạy hai versions của application song song, switch traffic từ version cũ sang version mới sau khi verify version mới hoạt động tốt. Nếu có vấn đề, có thể rollback ngay lập tức bằng cách switch traffic về version cũ.

System updates bao gồm cập nhật OS packages, Node.js, PostgreSQL, Redis và các dependencies khác. Updates được test trên staging environment trước khi apply lên production. Security patches được apply càng sớm càng tốt để minimize risk.

## Kết luận

Quá trình triển khai hệ thống NHH-Coffee được thực hiện một cách chuyên nghiệp và có hệ thống, từ development environment đến production deployment. Việc sử dụng các công cụ và best practices hiện đại như Git, PM2, Nginx, Let's Encrypt, automated backups và monitoring đảm bảo hệ thống chạy ổn định, bảo mật và có khả năng scale. Source code được quản lý trên GitHub repository NHH-Seven, cho phép collaboration hiệu quả và version control tốt. Hệ thống đã sẵn sàng phục vụ người dùng với độ tin cậy cao và có thể dễ dàng maintain và upgrade trong tương lai.
