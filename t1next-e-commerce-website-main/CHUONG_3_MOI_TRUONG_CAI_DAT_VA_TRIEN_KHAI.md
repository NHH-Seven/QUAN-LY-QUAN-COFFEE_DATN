# CHƯƠNG 3: MÔI TRƯỜNG CÀI ĐẶT VÀ TRIỂN KHAI

## 3.1. GIỚI THIỆU

Chương này trình bày chi tiết về môi trường cài đặt và quy trình triển khai hệ thống NHH-Coffee. Việc lựa chọn và cấu hình môi trường phát triển cũng như triển khai phù hợp đóng vai trò quan trọng trong việc đảm bảo hệ thống hoạt động ổn định, hiệu quả và có khả năng mở rộng trong tương lai.

Hệ thống NHH-Coffee được xây dựng dựa trên kiến trúc Client-Server với frontend sử dụng Next.js và backend sử dụng Express.js. Để đảm bảo tính nhất quán giữa môi trường phát triển và môi trường sản xuất, chúng tôi đã thiết lập quy trình cài đặt và triển khai chuẩn hóa, bao gồm việc lựa chọn công nghệ, cấu hình hệ thống và các bước triển khai cụ thể.

Chương này được chia thành ba phần chính: Yêu cầu hệ thống, Môi trường phát triển, và Môi trường sản xuất. Mỗi phần sẽ trình bày chi tiết các yêu cầu kỹ thuật, quy trình cài đặt, và các bước cấu hình cần thiết để đưa hệ thống vào hoạt động.

## 3.2. YÊU CẦU HỆ THỐNG

### 3.2.1. Yêu cầu phần cứng

Để đảm bảo hệ thống hoạt động ổn định và hiệu quả, chúng tôi đã xác định các yêu cầu phần cứng tối thiểu cho cả môi trường phát triển và môi trường sản xuất dựa trên đặc điểm kỹ thuật của các công nghệ được sử dụng và dự kiến về tải hệ thống.

**Môi trường phát triển (Development Environment):**

Môi trường phát triển được thiết kế để phục vụ công việc lập trình và kiểm thử của đội ngũ phát triển. Máy tính cá nhân của lập trình viên cần đáp ứng các yêu cầu cơ bản sau để đảm bảo quá trình phát triển diễn ra suôn sẻ:

Về bộ vi xử lý, yêu cầu tối thiểu là Intel Core i5 thế hệ thứ 8 trở lên hoặc AMD Ryzen 5 series 3000 trở lên. Tuy nhiên, để tăng tốc độ biên dịch TypeScript và build ứng dụng Next.js, chúng tôi khuyến nghị sử dụng Intel Core i7 hoặc AMD Ryzen 7. Bộ vi xử lý mạnh hơn sẽ giúp giảm đáng kể thời gian chờ đợi trong quá trình phát triển, đặc biệt khi làm việc với các dự án lớn.

Về bộ nhớ RAM, yêu cầu tối thiểu là 8GB. Tuy nhiên, do cần chạy đồng thời nhiều ứng dụng như IDE (Visual Studio Code), trình duyệt với nhiều tab, server backend, server frontend, database PostgreSQL, và các công cụ phát triển khác, chúng tôi khuyến nghị sử dụng 16GB RAM để đảm bảo hiệu suất làm việc tốt nhất. Với 16GB RAM, lập trình viên có thể làm việc mượt mà mà không gặp tình trạng thiếu bộ nhớ.

Về lưu trữ, ổ cứng SSD là bắt buộc với ít nhất 20GB dung lượng trống cho dự án và các dependencies. SSD giúp tăng tốc độ đọc/ghi file, rút ngắn thời gian cài đặt dependencies (node_modules thường chiếm vài GB), và cải thiện tốc độ khởi động các ứng dụng. Chúng tôi khuyến nghị sử dụng SSD NVMe để đạt hiệu suất tốt nhất.

Về kết nối mạng, cần có kết nối Internet ổn định với tốc độ tối thiểu 10Mbps. Kết nối Internet được sử dụng để tải các thư viện từ npm registry, tương tác với các dịch vụ bên ngoài như Google Gemini AI, Cloudinary, và đồng bộ code với Git repository. Kết nối ổn định giúp tránh gián đoạn trong quá trình phát triển.

**Môi trường sản xuất (Production Environment):**

Môi trường sản xuất yêu cầu cấu hình mạnh mẽ hơn để đảm bảo khả năng xử lý đồng thời nhiều người dùng và duy trì hoạt động liên tục 24/7. Chúng tôi khuyến nghị sử dụng máy chủ VPS (Virtual Private Server) với các thông số kỹ thuật sau:

Về bộ vi xử lý, yêu cầu tối thiểu là 4 cores vCPU. Với cấu hình này, hệ thống có thể xử lý khoảng 100-200 concurrent users. Đối với hệ thống có lượng truy cập cao hơn (500+ concurrent users), chúng tôi khuyến nghị nâng cấp lên 8 cores. Số lượng cores ảnh hưởng trực tiếp đến khả năng xử lý đồng thời của PM2 cluster mode, nơi mỗi core có thể chạy một instance của ứng dụng.

Về bộ nhớ RAM, yêu cầu tối thiểu là 8GB. Trong đó, khoảng 2GB dành cho hệ điều hành và các services hệ thống, 2GB cho PostgreSQL, 512MB cho Redis, 2GB cho backend (Express API với 4 instances), và 1.5GB cho frontend (Next.js với 2 instances). Đối với hệ thống có database lớn hoặc lượng truy cập cao, khuyến nghị nâng cấp lên 16GB RAM để đảm bảo hiệu suất ổn định và có dư địa cho việc mở rộng.

Về lưu trữ, yêu cầu ổ cứng SSD 100GB. Trong đó, khoảng 20GB cho hệ điều hành, 30GB cho database (bao gồm cả dữ liệu và indexes), 10GB cho logs và backups, 20GB cho ứng dụng và dependencies, và 20GB dự phòng cho việc mở rộng. SSD đảm bảo tốc độ truy xuất database nhanh, giảm latency cho người dùng.

Về băng thông, yêu cầu 1TB/tháng với tốc độ kết nối tối thiểu 100Mbps. Băng thông này đủ để phục vụ khoảng 50,000-100,000 page views/tháng, tùy thuộc vào kích thước trung bình của mỗi page. Hình ảnh được lưu trữ trên Cloudinary CDN nên không tiêu tốn nhiều băng thông của server.

Về hệ điều hành, chúng tôi khuyến nghị sử dụng Ubuntu 22.04 LTS (Long Term Support) hoặc CentOS 8. Ubuntu 22.04 LTS được chọn vì tính ổn định, bảo mật được cập nhật thường xuyên, cộng đồng hỗ trợ lớn, và được hỗ trợ đến năm 2027. Hệ điều hành Linux được ưu tiên hơn Windows Server do hiệu suất tốt hơn, chi phí thấp hơn, và phù hợp hơn với stack công nghệ Node.js.

Về nhà cung cấp VPS, chúng tôi khuyến nghị các nhà cung cấp uy tín sau: DigitalOcean với gói Droplet từ $40-80/tháng, cung cấp giao diện quản lý đơn giản, tài liệu hướng dẫn chi tiết, và datacenter tại Singapore phù hợp cho thị trường Việt Nam. Vultr với gói Cloud Compute từ $40-80/tháng, có hiệu suất tốt và nhiều lựa chọn về vị trí datacenter. Linode với gói Shared CPU từ $40-80/tháng, nổi tiếng về độ tin cậy và hỗ trợ khách hàng tốt. AWS EC2 với instance type t3.large hoặc t3.xlarge, phù hợp cho doanh nghiệp cần khả năng mở rộng linh hoạt và tích hợp với các dịch vụ AWS khác.

### 3.2.2. Yêu cầu phần mềm

Hệ thống NHH-Coffee được xây dựng trên nền tảng công nghệ hiện đại, yêu cầu các phần mềm cốt lõi và công cụ hỗ trợ sau:

**Phần mềm cốt lõi (Core Software):**

Node.js là môi trường runtime JavaScript cho cả frontend và backend. Chúng tôi yêu cầu phiên bản 20.x hoặc 22.x (LTS - Long Term Support). Phiên bản LTS được chọn vì tính ổn định, được hỗ trợ lâu dài, và có các bản vá bảo mật thường xuyên. Node.js 20.x mang lại hiệu suất tốt hơn so với các phiên bản cũ nhờ cải tiến V8 engine và hỗ trợ tốt hơn cho ES modules. Việc sử dụng cùng phiên bản Node.js trên cả môi trường development và production đảm bảo tính nhất quán và tránh các lỗi không mong muốn.

npm (Node Package Manager) phiên bản 10.x trở lên được sử dụng làm trình quản lý gói. npm đi kèm với Node.js và được sử dụng để cài đặt, quản lý các thư viện JavaScript. Phiên bản 10.x mang lại tốc độ cài đặt nhanh hơn, cải thiện security audit, và hỗ trợ tốt hơn cho workspaces. npm cũng quản lý file package-lock.json để đảm bảo các dependencies được cài đặt với phiên bản chính xác trên mọi môi trường.

PostgreSQL phiên bản 15.x hoặc 16.x đóng vai trò là hệ quản trị cơ sở dữ liệu quan hệ chính. PostgreSQL được chọn vì là open-source, hiệu suất cao, hỗ trợ ACID transactions đầy đủ, có khả năng mở rộng tốt, và hỗ trợ JSON data type phù hợp cho các trường dữ liệu linh hoạt. Phiên bản 15.x và 16.x mang lại cải thiện về hiệu suất query, hỗ trợ tốt hơn cho parallel queries, và các tính năng bảo mật nâng cao. PostgreSQL lưu trữ toàn bộ dữ liệu nghiệp vụ của hệ thống bao gồm users, products, orders, và các bảng liên quan.

Redis phiên bản 7.x được sử dụng cho caching và session storage. Redis là in-memory data store, cung cấp tốc độ truy xuất cực nhanh (microseconds), hỗ trợ nhiều data structures (strings, hashes, lists, sets), và có khả năng persistence. Trong hệ thống NHH-Coffee, Redis cache các dữ liệu thường xuyên được truy cập như danh sách sản phẩm, thông tin categories, và user sessions. Tuy nhiên, Redis là optional vì hệ thống có cơ chế fallback sang memory cache khi Redis không khả dụng, đảm bảo hệ thống vẫn hoạt động bình thường.

Git phiên bản 2.x trở lên được sử dụng để quản lý mã nguồn và version control. Git cho phép nhiều lập trình viên làm việc đồng thời, theo dõi lịch sử thay đổi code, và dễ dàng rollback khi cần. Chúng tôi sử dụng Git với remote repository trên GitHub hoặc GitLab để lưu trữ code an toàn và hỗ trợ CI/CD pipeline.

**Công cụ phát triển (Development Tools):**

Visual Studio Code là IDE được khuyến nghị cho dự án. VS Code cung cấp hỗ trợ tốt cho TypeScript, React, và Node.js thông qua các extensions như ESLint, Prettier, TypeScript, React, Prisma, và GitLens. VS Code có tính năng IntelliSense mạnh mẽ, integrated terminal, debugging tools, và Git integration giúp tăng năng suất phát triển. Các IDE khác như WebStorm, Sublime Text, hoặc Atom cũng có thể được sử dụng tùy theo sở thích của lập trình viên.

Postman hoặc Thunder Client được sử dụng để kiểm thử API. Các công cụ này cho phép gửi HTTP requests với các methods khác nhau (GET, POST, PUT, DELETE), xem responses, lưu trữ collections của API endpoints, và tự động hóa testing. Thunder Client là extension của VS Code, thuận tiện cho việc test API ngay trong IDE. Postman cung cấp nhiều tính năng nâng cao hơn như automated testing, mock servers, và collaboration features.

pgAdmin hoặc DBeaver được sử dụng để quản lý cơ sở dữ liệu PostgreSQL. pgAdmin là công cụ chính thức của PostgreSQL, cung cấp giao diện web-based để quản lý databases, tables, views, và execute SQL queries. DBeaver là universal database tool, hỗ trợ nhiều loại database, có giao diện desktop, và cung cấp nhiều tính năng như ER diagrams, data export/import, và SQL editor với syntax highlighting. Các công cụ này giúp lập trình viên dễ dàng xem cấu trúc database, query data, và debug các vấn đề liên quan đến database.

Redis Commander là công cụ tùy chọn để quản lý Redis. Đây là web-based management tool cho Redis, cho phép xem keys, values, set TTL, và execute Redis commands thông qua giao diện đồ họa. Redis Commander hữu ích cho việc debug cache issues và monitor Redis memory usage.

**Công cụ triển khai (Deployment Tools):**

Nginx phiên bản 1.24.x đóng vai trò là reverse proxy và load balancer trong môi trường production. Nginx nhận requests từ Internet, forward đến đúng ứng dụng (Next.js hoặc Express API), và trả responses về client. Nginx cũng xử lý SSL/TLS termination, serving static files, gzip compression, và caching. Nginx được chọn vì hiệu suất cao, sử dụng ít tài nguyên, và có khả năng xử lý hàng nghìn concurrent connections.

PM2 phiên bản 5.x là process manager cho Node.js applications. PM2 quản lý các Node.js processes, tự động restart khi crash, load balancing với cluster mode, log management, và monitoring. PM2 cho phép chạy nhiều instances của ứng dụng để tận dụng multi-core CPU, đảm bảo zero-downtime deployment với reload command, và cung cấp startup script để tự động khởi động ứng dụng khi server reboot.

Certbot phiên bản mới nhất được sử dụng để tự động hóa việc cấp phát và gia hạn chứng chỉ SSL từ Let's Encrypt. SSL certificate đảm bảo kết nối HTTPS an toàn giữa client và server, mã hóa dữ liệu truyền tải, và tăng độ tin cậy của website. Certbot tích hợp với Nginx, tự động cấu hình SSL, và setup cron job để auto-renew certificate trước khi hết hạn.

UFW (Uncomplicated Firewall) được sử dụng để cấu hình firewall trên Ubuntu. UFW cung cấp interface đơn giản để quản lý iptables rules, cho phép hoặc chặn traffic đến các ports cụ thể. UFW giúp bảo vệ server khỏi các truy cập không mong muốn, chỉ mở các ports cần thiết (22 cho SSH, 80 cho HTTP, 443 cho HTTPS), và block tất cả các ports khác.

### 3.2.3. Kiến trúc công nghệ

Hệ thống NHH-Coffee được xây dựng dựa trên kiến trúc phân lớp (Layered Architecture) với sự phân tách rõ ràng giữa các thành phần, đảm bảo tính module hóa, dễ bảo trì, và khả năng mở rộng.

**Lớp Frontend (Presentation Layer):**

Lớp Frontend chịu trách nhiệm hiển thị giao diện người dùng và xử lý tương tác với người dùng. Next.js 16 (React 19) được sử dụng làm framework chính. Next.js là React framework cung cấp Server-Side Rendering (SSR), Static Site Generation (SSG), và Incremental Static Regeneration (ISR), giúp cải thiện SEO và hiệu suất tải trang. Next.js 16 với React 19 mang lại các tính năng mới như React Server Components, improved hydration, và better performance.

TypeScript được sử dụng thay vì JavaScript thuần để đảm bảo type safety, giảm bugs, và cải thiện developer experience với IntelliSense. TypeScript compile sang JavaScript trước khi chạy, giúp phát hiện lỗi sớm trong quá trình phát triển.

Radix UI kết hợp với Tailwind CSS tạo nên hệ thống UI components nhất quán và accessible. Radix UI cung cấp unstyled, accessible components như Dialog, Dropdown, Tabs, tuân thủ WAI-ARIA standards. Tailwind CSS là utility-first CSS framework, cho phép styling nhanh chóng với các utility classes, đảm bảo design system nhất quán, và tối ưu hóa CSS bundle size với PurgeCSS.

React Context API được sử dụng để quản lý state toàn cục như authentication state (user info, login status), cart state (items, total), wishlist, và chat state. Context API là built-in solution của React, đơn giản hơn Redux, phù hợp cho ứng dụng có state management requirements vừa phải.

Socket.io Client đảm nhận việc giao tiếp real-time với server. Socket.io Client kết nối đến Socket.io Server qua WebSocket protocol, nhận real-time updates về order status, new messages, notifications, và kitchen updates. Socket.io tự động fallback sang long-polling khi WebSocket không khả dụng, đảm bảo tính tương thích với mọi trình duyệt.

React Hook Form kết hợp với Zod validation xử lý forms và validation. React Hook Form giảm re-renders, cải thiện performance, và cung cấp API đơn giản để quản lý form state. Zod là TypeScript-first schema validation library, đảm bảo data integrity và cung cấp type inference tự động.

**Lớp Backend (Application Layer):**

Lớp Backend chịu trách nhiệm xử lý business logic, quản lý dữ liệu, và cung cấp API cho Frontend. Express.js làm framework chính cho RESTful API. Express.js là minimal và flexible Node.js web framework, cung cấp robust routing, middleware system, và HTTP utility methods. Express.js được chọn vì đơn giản, hiệu suất cao, có cộng đồng lớn, và nhiều middleware có sẵn.

Prisma ORM cung cấp type-safe database access. Prisma là next-generation ORM, tự động generate TypeScript types từ database schema, cung cấp intuitive query API, và hỗ trợ migrations. Prisma Client đảm bảo type safety cho mọi database query, giảm runtime errors và cải thiện developer experience. Prisma cũng cung cấp Prisma Studio, một database GUI để xem và edit data.

Socket.io Server xử lý các kết nối WebSocket cho real-time features. Socket.io Server tạo rooms cho các nhóm users khác nhau (staff room, user rooms, kitchen room), emit events khi có updates (new order, status changed, new message), và handle reconnection tự động khi connection bị gián đoạn.

Zod validation được sử dụng để validate request data. Mọi API endpoint đều có validation middleware sử dụng Zod schemas để đảm bảo request body, query parameters, và URL parameters đúng format và type. Validation errors được trả về với status code 400 và error messages chi tiết.

JWT (JSON Web Token) được sử dụng cho authentication. Khi user login thành công, server generate JWT token chứa user info (userId, email, role) và sign với secret key. Token được gửi về client và lưu trong localStorage. Mọi subsequent requests đều gửi token trong Authorization header. Server verify token để authenticate user và extract user info. JWT stateless, không cần lưu session trên server, phù hợp cho distributed systems.

Bcrypt được sử dụng để hash passwords. Bcrypt là password hashing function với salt và cost factor, đảm bảo passwords được lưu trữ an toàn. Ngay cả khi database bị breach, attackers không thể reverse bcrypt hash để lấy plain text passwords.

**Lớp Dữ liệu (Data Layer):**

Lớp Dữ liệu chịu trách nhiệm lưu trữ và quản lý dữ liệu của hệ thống. PostgreSQL lưu trữ dữ liệu chính với schema được thiết kế chuẩn hóa theo Third Normal Form (3NF). Database schema bao gồm 20+ tables như users, products, categories, orders, order_items, cart_items, reviews, notifications, chat_sessions, chat_messages, promotions, và các bảng khác. Mỗi table có primary key (UUID), foreign keys để maintain referential integrity, indexes để tối ưu query performance, và constraints để đảm bảo data integrity.

Redis cache (với memory fallback) tăng tốc độ truy xuất dữ liệu. Redis cache các dữ liệu frequently accessed như product lists (TTL 5 minutes), product details (TTL 10 minutes), categories (TTL 1 hour), và user carts (TTL 5 minutes). Khi data được request, system check Redis cache trước, nếu có (cache hit) thì return ngay, nếu không (cache miss) thì query từ PostgreSQL và cache result. Cache invalidation được thực hiện khi data thay đổi để đảm bảo consistency. Memory cache fallback đảm bảo hệ thống vẫn hoạt động khi Redis không khả dụng.

Cloudinary lưu trữ và phân phối hình ảnh qua CDN. Cloudinary là cloud-based image and video management service, cung cấp image upload API, automatic optimization (format conversion, compression), responsive images với different sizes, và global CDN delivery. Product images, user avatars, và review images được upload lên Cloudinary thay vì lưu trên server, giảm load cho server và cải thiện image loading speed cho users ở khắp nơi.

**Dịch vụ bên ngoài (External Services):**

Hệ thống tích hợp với các dịch vụ bên ngoài để mở rộng chức năng. Google Gemini AI cung cấp khả năng chatbot thông minh. Gemini AI (gemini-1.5-flash model) được sử dụng để xử lý customer inquiries, trả lời câu hỏi về products, track orders, và provide recommendations. Chatbot service tích hợp với Gemini API, maintain conversation context, detect user intent, và search knowledge base trước khi query Gemini để giảm API calls.

Nodemailer với SMTP được sử dụng để gửi email thông báo. Nodemailer là Node.js module để send emails, hỗ trợ SMTP transport. Hệ thống gửi emails cho các events như registration OTP, password reset, order confirmation, order status updates, và promotional emails. Email templates được design với HTML và inline CSS để đảm bảo hiển thị tốt trên mọi email clients.

Web Push API hỗ trợ push notifications. Web Push cho phép gửi notifications đến users ngay cả khi họ không mở website. Users subscribe to push notifications bằng cách grant permission trong browser. Subscription info được lưu trong database. Khi có events như order status changed hoặc new promotion, system gửi push notifications đến subscribed users. Push notifications cải thiện user engagement và retention.

VietQR tích hợp thanh toán qua mã QR. VietQR là standard QR code format cho bank transfers tại Việt Nam. Khi user chọn payment method là QR, system generate QR code chứa bank account info, amount, và order reference. User scan QR code bằng banking app và transfer money. Staff confirm payment manually sau khi nhận tiền và update order status.

## 3.3. MÔI TRƯỜNG PHÁT TRIỂN

Môi trường phát triển (Development Environment) là nơi đội ngũ lập trình viên thực hiện công việc coding, testing, và debugging. Việc thiết lập môi trường phát triển đúng cách và nhất quán giữa các thành viên trong team là yếu tố quan trọng để đảm bảo năng suất làm việc và giảm thiểu các vấn đề phát sinh do sự khác biệt về môi trường.

### 3.3.1. Cài đặt môi trường cơ bản

**Cài đặt Node.js và npm:**

Node.js là nền tảng cốt lõi của dự án, cần được cài đặt đầu tiên. Chúng tôi khuyến nghị sử dụng Node Version Manager (nvm) để quản lý phiên bản Node.js, cho phép dễ dàng chuyển đổi giữa các phiên bản khác nhau khi cần thiết.

Trên hệ điều hành Windows, lập trình viên có thể tải Node.js installer từ trang chủ nodejs.org, chọn phiên bản LTS (Long Term Support) như 20.x hoặc 22.x, và chạy file installer. Quá trình cài đặt sẽ tự động thêm Node.js và npm vào system PATH. Sau khi cài đặt, cần mở Command Prompt hoặc PowerShell và kiểm tra phiên bản bằng lệnh "node --version" và "npm --version" để đảm bảo cài đặt thành công.

Trên hệ điều hành macOS, có thể sử dụng Homebrew package manager để cài đặt Node.js. Nếu chưa có Homebrew, cần cài đặt Homebrew trước bằng cách chạy script từ trang brew.sh. Sau đó, cài đặt Node.js bằng lệnh "brew install node". Homebrew sẽ tự động cài đặt phiên bản LTS mới nhất và cấu hình PATH. Kiểm tra cài đặt tương tự như trên Windows.

Trên hệ điều hành Linux (Ubuntu/Debian), có thể cài đặt Node.js từ NodeSource repository để có phiên bản mới nhất. Đầu tiên, thêm NodeSource repository cho phiên bản 20.x bằng lệnh curl và setup script. Sau đó, update package list và cài đặt Node.js bằng apt-get. Phương pháp này đảm bảo cài đặt phiên bản LTS chính thức từ NodeSource thay vì phiên bản cũ từ Ubuntu repository.

npm được cài đặt tự động cùng với Node.js. Tuy nhiên, nên cập nhật npm lên phiên bản mới nhất bằng lệnh "npm install -g npm@latest". Việc cập nhật npm đảm bảo có các tính năng mới nhất, bug fixes, và security patches.

**Cài đặt PostgreSQL:**

PostgreSQL là hệ quản trị cơ sở dữ liệu chính của hệ thống, cần được cài đặt và cấu hình trên máy phát triển.

Trên Windows, tải PostgreSQL installer từ trang postgresql.org, chọn phiên bản 15.x hoặc 16.x phù hợp với hệ điều hành. Chạy installer và làm theo hướng dẫn, chọn thư mục cài đặt, đặt password cho superuser postgres (cần ghi nhớ password này), chọn port mặc định 5432, và chọn locale. Installer cũng cài đặt pgAdmin 4, công cụ quản lý database với giao diện đồ họa. Sau khi cài đặt, PostgreSQL service sẽ tự động chạy và khởi động cùng Windows.

Trên macOS, sử dụng Homebrew để cài đặt PostgreSQL bằng lệnh "brew install postgresql@15". Sau khi cài đặt, khởi động PostgreSQL service bằng "brew services start postgresql@15". PostgreSQL sẽ chạy ở background và tự động khởi động khi boot. Tạo database user và database bằng psql command line tool.

Trên Linux (Ubuntu), cài đặt PostgreSQL từ apt repository. Update package list, cài đặt postgresql và postgresql-contrib packages. PostgreSQL service sẽ tự động start sau khi cài đặt. Switch sang postgres user và sử dụng psql để tạo database và user cho dự án.

Sau khi cài đặt PostgreSQL, cần tạo database cho dự án. Sử dụng pgAdmin hoặc psql command line, kết nối đến PostgreSQL server với user postgres. Tạo database mới với tên "nhh_coffee_dev" sử dụng UTF8 encoding. Tạo user mới với tên "nhh_user" và password mạnh. Grant tất cả privileges trên database "nhh_coffee_dev" cho user "nhh_user". User này sẽ được sử dụng trong connection string của ứng dụng.

**Cài đặt Redis (Optional):**

Redis là optional dependency, hệ thống có thể hoạt động mà không cần Redis nhờ memory cache fallback. Tuy nhiên, cài đặt Redis giúp test đầy đủ chức năng caching trong môi trường development.

Trên Windows, Redis không có official support. Khuyến nghị sử dụng Redis trên Docker hoặc WSL2 (Windows Subsystem for Linux). Với Docker, cài đặt Docker Desktop, sau đó chạy Redis container bằng lệnh "docker run -d -p 6379:6379 redis:7". Redis sẽ chạy ở background và listen trên port 6379. Với WSL2, cài đặt Ubuntu từ Microsoft Store, sau đó cài đặt Redis trong Ubuntu environment.

Trên macOS, sử dụng Homebrew để cài đặt Redis bằng lệnh "brew install redis". Khởi động Redis service bằng "brew services start redis". Redis sẽ chạy ở background và listen trên port mặc định 6379.

Trên Linux (Ubuntu), cài đặt Redis từ apt repository. Update package list và cài đặt redis-server package. Redis service sẽ tự động start và enable để khởi động cùng system. Kiểm tra Redis đang chạy bằng lệnh "redis-cli ping", nếu trả về "PONG" nghĩa là Redis hoạt động bình thường.


### 3.3.2. Cấu hình dự án

**Clone repository và cài đặt dependencies:**

Sau khi cài đặt các phần mềm cơ bản, bước tiếp theo là clone source code từ Git repository và cài đặt các thư viện phụ thuộc.

Đầu tiên, clone repository từ GitHub hoặc GitLab về máy local. Mở terminal hoặc command prompt, navigate đến thư mục muốn lưu dự án, và chạy lệnh git clone với URL của repository. Lệnh này sẽ tạo thư mục mới chứa toàn bộ source code của dự án. Sau khi clone xong, navigate vào thư mục dự án.

Dự án NHH-Coffee có cấu trúc monorepo với hai thư mục chính: "client" chứa Next.js frontend và "server" chứa Express.js backend. Mỗi thư mục có file package.json riêng, liệt kê các dependencies cần thiết. Cần cài đặt dependencies cho cả hai phần.

Để cài đặt dependencies cho backend, navigate vào thư mục server và chạy lệnh "npm install". npm sẽ đọc file package.json, tải tất cả các packages được liệt kê trong dependencies và devDependencies từ npm registry, và cài đặt vào thư mục node_modules. Quá trình này có thể mất vài phút tùy thuộc vào tốc độ Internet. Sau khi hoàn tất, thư mục node_modules sẽ chứa hàng nghìn files và folders của các thư viện. File package-lock.json sẽ được tạo hoặc cập nhật, ghi lại chính xác phiên bản của mỗi package được cài đặt.

Tương tự, để cài đặt dependencies cho frontend, navigate vào thư mục client và chạy lệnh "npm install". Frontend có nhiều dependencies hơn backend do bao gồm React, Next.js, UI libraries, và các tools khác. Quá trình cài đặt có thể mất lâu hơn và chiếm nhiều dung lượng hơn.

**Cấu hình Environment Variables:**

Environment variables chứa các thông tin cấu hình nhạy cảm như database credentials, API keys, và secrets. Các biến này không được commit vào Git repository vì lý do bảo mật, thay vào đó được lưu trong file .env và .env.local.

Trong thư mục server, tạo file .env dựa trên file .env.example có sẵn. File .env.example chứa template của tất cả environment variables cần thiết với giá trị mẫu. Copy file này thành .env và điền các giá trị thực tế.

Các biến quan trọng cần cấu hình cho backend bao gồm: DATABASE_URL là connection string đến PostgreSQL database, có format "postgresql://username:password@localhost:5432/database_name". Thay username, password, và database_name bằng thông tin đã tạo ở bước cài đặt PostgreSQL. REDIS_URL là connection string đến Redis, thường là "redis://localhost:6379". Nếu không cài Redis, có thể comment out hoặc để trống, hệ thống sẽ fallback sang memory cache.

JWT_SECRET là secret key dùng để sign JWT tokens, cần là chuỗi random dài và phức tạp. Có thể generate bằng lệnh "node -e console.log(require('crypto').randomBytes(32).toString('hex'))". JWT_EXPIRES_IN xác định thời gian hết hạn của token, thường đặt là "7d" (7 ngày) cho development.

GEMINI_API_KEY là API key để sử dụng Google Gemini AI cho chatbot. Cần đăng ký tài khoản Google AI Studio và tạo API key. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, và CLOUDINARY_API_SECRET là credentials để upload images lên Cloudinary. Cần đăng ký tài khoản Cloudinary miễn phí và lấy thông tin từ dashboard.

EMAIL_HOST, EMAIL_PORT, EMAIL_USER, và EMAIL_PASSWORD là cấu hình SMTP để gửi email. Có thể sử dụng Gmail SMTP (smtp.gmail.com, port 587) với App Password, hoặc các dịch vụ như SendGrid, Mailgun. FRONTEND_URL là URL của frontend application, trong development thường là "http://localhost:3000".

Trong thư mục client, tạo file .env.local với các biến cần thiết cho frontend. NEXT_PUBLIC_API_URL là URL của backend API, trong development là "http://localhost:5000". Prefix NEXT_PUBLIC_ cho phép biến này được expose ra browser. NEXT_PUBLIC_SOCKET_URL là URL của Socket.io server, cũng là "http://localhost:5000". NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME là cloud name của Cloudinary, cần thiết để display images từ Cloudinary CDN.

**Thiết lập Database Schema:**

Sau khi cấu hình database connection, cần tạo tables và seed initial data.

Prisma ORM được sử dụng để quản lý database schema và migrations. File prisma/schema.prisma định nghĩa toàn bộ data models của hệ thống. Để tạo tables trong database, navigate vào thư mục server và chạy lệnh "npx prisma migrate dev". Prisma sẽ đọc schema.prisma, generate SQL migration files, và execute chúng trên database. Lệnh này cũng generate Prisma Client, một type-safe query builder được sử dụng trong code.

Nếu đã có database với data và muốn sync Prisma schema với database hiện tại, sử dụng lệnh "npx prisma db pull" để introspect database và update schema.prisma. Ngược lại, nếu muốn push schema changes lên database mà không tạo migration files, sử dụng "npx prisma db push".

Sau khi tạo tables, cần seed initial data để có dữ liệu test. File src/db/seed.ts chứa script để tạo sample data bao gồm admin user, categories, products, và các data khác. Chạy seed script bằng lệnh "npm run seed". Script sẽ tạo một admin account với email "admin@nhh-coffee.com" và password "Admin@123", các categories như "Cà phê", "Trà sữa", "Bánh ngọt", và một số sample products. Thông tin login admin này sẽ được sử dụng để truy cập admin panel.

Để xem database schema và data, có thể sử dụng Prisma Studio bằng lệnh "npx prisma studio". Prisma Studio sẽ mở web interface tại localhost:5555, cho phép browse tables, view records, và edit data trực tiếp. Đây là công cụ hữu ích để debug và kiểm tra data trong quá trình development.

**Cấu trúc Database Schema:**

Hệ thống NHH-Coffee sử dụng PostgreSQL với schema được thiết kế theo chuẩn Third Normal Form (3NF). Database bao gồm 25+ bảng được nhóm thành các module chức năng chính:

Module Quản lý Người dùng bao gồm bảng users lưu trữ thông tin người dùng với các trường như id (UUID), email (unique), password (bcrypt hash), name, role (ENUM: user/admin/sales/warehouse), và các trường loyalty program như points, tier, total_spent. Bảng pending_registrations lưu trữ thông tin đăng ký chờ xác thực OTP, và password_resets quản lý quy trình reset mật khẩu.

Module Sản phẩm & Danh mục bao gồm bảng categories với các trường id, name, slug (unique cho SEO), icon, và product_count. Bảng products lưu trữ chi tiết sản phẩm với các trường như id, name, slug, description, price (DECIMAL 15,2), images (array), category_id (foreign key), specs (JSONB cho flexible specifications), stock, rating, review_count, và các flags như is_new, is_featured. Bảng stock_transactions theo dõi lịch sử nhập xuất kho với type (ENUM: import/export/adjust/order/return), quantity, stock_before, và stock_after.

Module Đơn hàng bao gồm bảng orders với order_number (unique identifier), user_id, status (ENUM: pending/awaiting_payment/confirmed/shipping/delivered/cancelled), customer information (name, email, phone, address), pricing fields (subtotal, shipping_fee, discount, total), payment information, và promotion tracking. Bảng order_items lưu trữ chi tiết sản phẩm trong đơn hàng với product snapshot (name, image, price tại thời điểm mua) để đảm bảo order history không thay đổi khi product info update.

Module Khuyến mãi bao gồm bảng promotions định nghĩa các chương trình khuyến mãi với code, discount type (percentage/fixed), conditions, và validity period. Bảng promotion_usage tracking việc sử dụng promotion codes. Bảng flash_sales quản lý các đợt flash sale với start_time, end_time, và discounted_price.

Module Tương tác Khách hàng bao gồm bảng reviews với rating (1-5), comment, is_verified flag, và helpful_count. Bảng review_images lưu trữ hình ảnh đính kèm reviews. Bảng product_questions và product_answers quản lý Q&A về sản phẩm. Bảng cart_items và wishlist tracking giỏ hàng và danh sách yêu thích của users.

Module Chat & Support bao gồm bảng chat_sessions quản lý phiên chat với status (waiting/active/closed), và chat_messages lưu trữ tin nhắn. Bảng chatbot_knowledge chứa knowledge base cho AI chatbot với questions, answers, và keywords.

Module Quản lý Bàn & Khu vực bao gồm bảng areas định nghĩa các khu vực trong quán, bảng tables quản lý bàn với capacity và status, và table_orders liên kết orders với tables. Bảng reservations quản lý đặt bàn trước.

Các quan hệ chính trong database: One-to-Many relationships giữa users và orders, orders và order_items, categories và products, products và reviews. Many-to-Many relationships giữa products và suppliers thông qua bảng product_suppliers, và giữa users và products thông qua cart_items và wishlist. Database sử dụng UUID làm primary keys thay vì auto-increment integers để tăng bảo mật và dễ dàng merge data. Foreign keys với ON DELETE CASCADE hoặc SET NULL được sử dụng để maintain referential integrity. Indexes được tạo cho các trường thường xuyên được query như email, slug, category_id, user_id, status, và created_at để tối ưu performance.

Prisma ORM cung cấp type-safe database access với auto-generated TypeScript types, migration management, và query optimization. Việc sử dụng Prisma đảm bảo tính nhất quán giữa database schema và application code, giảm runtime errors, và cải thiện developer experience.

*Lưu ý: Để xem phân tích chi tiết về database schema, các bảng, quan hệ, và SQL scripts, tham khảo file PHAN_TICH_DATABASE.md trong thư mục dự án.*

### 3.3.3. Khởi chạy ứng dụng

Sau khi hoàn tất cấu hình, có thể khởi chạy ứng dụng trong development mode để bắt đầu phát triển.

**Khởi chạy Backend Server:**

Mở terminal, navigate vào thư mục server, và chạy lệnh "npm run dev". Lệnh này sẽ start Express.js server với nodemon, một tool tự động restart server khi có file changes. Backend server sẽ listen trên port 5000 (hoặc port được định nghĩa trong PORT environment variable).

Khi server khởi động thành công, console sẽ hiển thị các thông tin như "Server running on port 5000", "Database connected successfully", và "Redis connected" (nếu Redis được cấu hình). Nếu có lỗi kết nối database hoặc Redis, error messages sẽ được hiển thị, cần kiểm tra lại cấu hình environment variables và đảm bảo PostgreSQL/Redis đang chạy.

Backend server expose RESTful API endpoints tại http://localhost:5000/api. Có thể test API bằng Postman hoặc Thunder Client. Ví dụ, gửi GET request đến http://localhost:5000/api/products sẽ trả về danh sách products. Gửi POST request đến http://localhost:5000/api/auth/login với email và password trong request body sẽ trả về JWT token nếu credentials đúng.

Socket.io server cũng được khởi động cùng Express server, listen trên cùng port. Socket.io endpoint là http://localhost:5000, clients có thể kết nối đến đây để nhận real-time updates.

**Khởi chạy Frontend Application:**

Mở terminal mới (giữ terminal của backend đang chạy), navigate vào thư mục client, và chạy lệnh "npm run dev". Lệnh này sẽ start Next.js development server với hot module replacement (HMR), tự động reload browser khi có code changes.

Next.js development server sẽ listen trên port 3000. Khi khởi động thành công, console sẽ hiển thị "ready - started server on 0.0.0.0:3000, url: http://localhost:3000". Mở trình duyệt và truy cập http://localhost:3000 để xem ứng dụng.

Trang chủ sẽ hiển thị hero section, featured products, categories, và các sections khác. Có thể navigate đến các trang khác như products, login, register để test chức năng. Khi click vào một product, trang product detail sẽ load với thông tin chi tiết, images, reviews, và related products.

Development mode của Next.js cung cấp nhiều tính năng hữu ích cho developers như Fast Refresh (tự động update UI khi save file mà không mất state), Error Overlay (hiển thị errors và stack traces trực tiếp trên browser), và Source Maps (cho phép debug TypeScript code trong browser DevTools).

**Workflow phát triển:**

Trong quá trình phát triển, lập trình viên thường mở hai terminals: một cho backend server và một cho frontend application. Cả hai servers đều chạy ở watch mode, tự động reload khi có changes.

Khi thay đổi backend code (ví dụ thêm API endpoint mới), nodemon sẽ detect file change và restart server. Sau khi server restart, có thể test API endpoint mới ngay lập tức. Khi thay đổi frontend code (ví dụ update UI component), Next.js Fast Refresh sẽ update browser trong vài giây mà không cần full page reload.

Để debug backend code, có thể sử dụng console.log statements hoặc Node.js debugger. VS Code có built-in debugger support cho Node.js, cho phép set breakpoints, step through code, và inspect variables. Để debug frontend code, sử dụng browser DevTools (F12), có thể set breakpoints trong Sources tab, inspect React components với React DevTools extension, và monitor network requests trong Network tab.

Khi gặp errors, cần đọc error messages cẩn thận. Backend errors thường hiển thị trong terminal console với stack traces. Frontend errors hiển thị trong browser console hoặc Next.js Error Overlay. Common errors bao gồm: database connection errors (kiểm tra DATABASE_URL và PostgreSQL service), CORS errors (đảm bảo backend CORS middleware được cấu hình đúng), authentication errors (kiểm tra JWT token và authentication middleware), và TypeScript type errors (fix type mismatches hoặc add type assertions).

Để test real-time features như chat và notifications, cần mở nhiều browser windows hoặc tabs. Ví dụ, để test chat giữa customer và staff, mở một window login với customer account và một window khác login với staff account. Gửi message từ customer window, message sẽ appear real-time trong staff window nhờ Socket.io.


## 3.4. MÔI TRƯỜNG SẢN XUẤT

Môi trường sản xuất (Production Environment) là nơi hệ thống được triển khai để phục vụ người dùng thực tế. Khác với môi trường phát triển, môi trường sản xuất yêu cầu cấu hình tối ưu về hiệu suất, bảo mật, và độ tin cậy. Quá trình triển khai cần được thực hiện cẩn thận để đảm bảo hệ thống hoạt động ổn định 24/7 và có khả năng xử lý lượng truy cập cao.

### 3.4.1. Chuẩn bị máy chủ

**Lựa chọn và thiết lập VPS:**

Bước đầu tiên trong việc triển khai production là lựa chọn và thiết lập máy chủ VPS (Virtual Private Server). Dựa trên yêu cầu hệ thống đã phân tích, chúng tôi khuyến nghị sử dụng VPS với cấu hình tối thiểu 4 cores CPU, 8GB RAM, và 100GB SSD storage.

Các nhà cung cấp VPS uy tín như DigitalOcean, Vultr, Linode, hoặc AWS EC2 đều cung cấp giao diện web để tạo và quản lý servers. Quá trình tạo VPS thường bao gồm việc chọn datacenter location (khuyến nghị chọn Singapore hoặc Tokyo cho thị trường Việt Nam để giảm latency), chọn hệ điều hành (Ubuntu 22.04 LTS), chọn cấu hình server (CPU, RAM, storage), và thiết lập SSH authentication.

Sau khi VPS được tạo, nhà cung cấp sẽ cung cấp IP address công khai và SSH credentials (username root và password hoặc SSH key). Sử dụng SSH client (Terminal trên macOS/Linux hoặc PuTTY trên Windows) để kết nối đến server lần đầu tiên. Lệnh SSH có dạng "ssh root@your_server_ip". Sau khi nhập password hoặc sử dụng SSH key, sẽ được đăng nhập vào server với quyền root.

**Cấu hình bảo mật cơ bản:**

Ngay sau khi truy cập server lần đầu, cần thực hiện các bước bảo mật cơ bản để bảo vệ server khỏi các cuộc tấn công.

Đầu tiên, update toàn bộ system packages lên phiên bản mới nhất để có các security patches. Chạy lệnh "apt update" để update package list và "apt upgrade -y" để upgrade tất cả packages. Quá trình này có thể mất vài phút.

Tiếp theo, tạo user mới với sudo privileges thay vì sử dụng root user trực tiếp. Sử dụng root user cho mọi operations là không an toàn vì một lỗi có thể gây hại nghiêm trọng cho hệ thống. Tạo user mới bằng lệnh "adduser deploy" (có thể đặt tên khác), nhập password mạnh, và điền các thông tin tùy chọn. Sau đó, thêm user vào sudo group bằng lệnh "usermod -aG sudo deploy". User này có thể execute commands với sudo privileges khi cần.

Cấu hình SSH để tăng cường bảo mật. Mở file cấu hình SSH tại /etc/ssh/sshd_config bằng text editor như nano hoặc vim. Thay đổi các settings: disable root login bằng cách set "PermitRootLogin no", disable password authentication và chỉ cho phép SSH key authentication bằng "PasswordAuthentication no" (sau khi đã setup SSH key cho user mới), và thay đổi SSH port từ 22 sang port khác (ví dụ 2222) để tránh automated attacks. Sau khi thay đổi, restart SSH service bằng "systemctl restart sshd".

Trước khi logout khỏi root session, cần test login với user mới. Mở terminal mới và SSH vào server với user mới: "ssh deploy@your_server_ip". Nếu đã disable password authentication, cần copy SSH public key lên server trước. Sau khi confirm user mới có thể login và sử dụng sudo, có thể logout khỏi root session.

**Cài đặt phần mềm hệ thống:**

Sau khi cấu hình bảo mật cơ bản, cài đặt các phần mềm cần thiết cho hệ thống.

Cài đặt Node.js từ NodeSource repository để có phiên bản LTS mới nhất. Chạy curl command để download và execute NodeSource setup script cho Node.js 20.x, sau đó cài đặt Node.js bằng apt. Verify cài đặt bằng "node --version" và "npm --version".

Cài đặt PostgreSQL database server. Chạy "apt install postgresql postgresql-contrib -y". PostgreSQL service sẽ tự động start sau khi cài đặt. Switch sang postgres user bằng "sudo -i -u postgres" và sử dụng psql để tạo database và user cho production. Tạo database "nhh_coffee_prod", tạo user "nhh_prod_user" với password mạnh, và grant privileges. Cấu hình PostgreSQL để accept connections từ localhost và tối ưu hóa performance settings trong file postgresql.conf như shared_buffers, effective_cache_size, và max_connections.

Cài đặt Redis cho caching. Chạy "apt install redis-server -y". Cấu hình Redis trong file /etc/redis/redis.conf, set maxmemory limit (ví dụ 512MB) và maxmemory-policy (ví dụ allkeys-lru để evict least recently used keys khi hết memory). Restart Redis service để apply changes.

Cài đặt Nginx web server. Chạy "apt install nginx -y". Nginx service sẽ tự động start và enable. Verify Nginx đang chạy bằng cách truy cập http://your_server_ip trong browser, sẽ thấy Nginx welcome page.

Cài đặt PM2 process manager globally. Chạy "npm install -g pm2". PM2 sẽ được sử dụng để quản lý Node.js applications, đảm bảo chúng chạy liên tục và tự động restart khi crash.

Cài đặt Git để clone source code. Chạy "apt install git -y". Cấu hình Git với user name và email bằng "git config --global user.name" và "git config --global user.email".


### 3.4.2. Triển khai ứng dụng

**Clone source code và cài đặt dependencies:**

Sau khi chuẩn bị xong server, bước tiếp theo là deploy ứng dụng lên server.

Tạo thư mục để chứa ứng dụng. Thông thường, applications được đặt trong /var/www hoặc /home/deploy. Tạo thư mục bằng "sudo mkdir -p /var/www/nhh-coffee" và thay đổi ownership sang deploy user bằng "sudo chown -R deploy:deploy /var/www/nhh-coffee".

Navigate vào thư mục và clone repository từ Git. Nếu repository là private, cần setup SSH key hoặc personal access token để authenticate. Chạy "git clone repository_url ." để clone code vào thư mục hiện tại. Sau khi clone xong, sẽ có cấu trúc thư mục với client và server folders.

Cài đặt dependencies cho backend. Navigate vào thư mục server và chạy "npm ci". Lệnh "npm ci" (clean install) được khuyến nghị cho production thay vì "npm install" vì nó cài đặt chính xác các phiên bản trong package-lock.json, nhanh hơn, và đảm bảo tính nhất quán. Quá trình cài đặt có thể mất vài phút.

Cài đặt dependencies cho frontend. Navigate vào thư mục client và chạy "npm ci". Frontend có nhiều dependencies hơn nên quá trình này mất lâu hơn.

**Cấu hình Environment Variables:**

Tạo file .env trong thư mục server với các environment variables cho production. Các giá trị cần khác với development environment.

DATABASE_URL sử dụng credentials của production database đã tạo ở bước trước. REDIS_URL trỏ đến Redis server trên localhost. JWT_SECRET cần generate một secret key mới, khác với development, sử dụng crypto.randomBytes để tạo chuỗi random 64 characters. JWT_EXPIRES_IN có thể set ngắn hơn development, ví dụ "1d" hoặc "3d" để tăng bảo mật.

NODE_ENV phải được set thành "production". Biến này ảnh hưởng đến behavior của nhiều libraries, ví dụ Express sẽ cache views, React sẽ optimize performance và remove development warnings. PORT có thể set thành 5000 hoặc port khác, Nginx sẽ proxy requests đến port này.

GEMINI_API_KEY, CLOUDINARY credentials, và EMAIL SMTP settings sử dụng production credentials. Đảm bảo các API keys này có rate limits và quotas phù hợp cho production usage. FRONTEND_URL set thành domain name thực tế của website, ví dụ "https://nhh-coffee.com".

Tương tự, tạo file .env.local trong thư mục client. NEXT_PUBLIC_API_URL và NEXT_PUBLIC_SOCKET_URL set thành production domain, ví dụ "https://api.nhh-coffee.com" hoặc "https://nhh-coffee.com" nếu API và frontend cùng domain. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME set thành production Cloudinary cloud name.

**Build ứng dụng:**

Trước khi chạy ứng dụng trong production mode, cần build chúng để optimize performance.

Build backend bằng cách navigate vào thư mục server và chạy "npm run build". Lệnh này compile TypeScript code sang JavaScript và đặt output trong thư mục dist. TypeScript compiler (tsc) sẽ check types và báo errors nếu có. Nếu build thành công, thư mục dist sẽ chứa compiled JavaScript files với cấu trúc tương tự source code.

Build frontend bằng cách navigate vào thư mục client và chạy "npm run build". Next.js sẽ thực hiện production build, bao gồm: compile TypeScript, optimize React components, generate static pages cho các routes có getStaticProps, bundle và minify JavaScript/CSS, optimize images, và generate build manifest. Quá trình build có thể mất vài phút. Sau khi hoàn tất, Next.js sẽ hiển thị build summary với thông tin về page sizes và load times. Build output được lưu trong thư mục .next.

**Cấu hình PM2:**

PM2 được sử dụng để quản lý Node.js processes trong production. Tạo file ecosystem.config.js trong thư mục root của dự án để cấu hình PM2.

File ecosystem.config.js export một object với apps array, mỗi element định nghĩa một application. Cho backend, cấu hình: name là "nhh-coffee-api", script là "dist/index.js" (compiled JavaScript file), cwd là "./server" (working directory), instances là 4 (số instances chạy song song, nên bằng số CPU cores), exec_mode là "cluster" (cho phép load balancing giữa các instances), env object chứa environment variables (hoặc có thể load từ .env file), error_log và out_log để lưu logs, và merge_logs để merge logs từ tất cả instances.

Cho frontend, cấu hình: name là "nhh-coffee-web", script là "node_modules/next/dist/bin/next", args là "start" (chạy Next.js production server), cwd là "./client", instances là 2 (frontend thường cần ít instances hơn backend), exec_mode là "cluster", env object với NODE_ENV production và PORT 3000, và log files.

Sau khi tạo ecosystem.config.js, start applications bằng PM2. Chạy "pm2 start ecosystem.config.js" từ thư mục root. PM2 sẽ start tất cả applications được định nghĩa trong config file. Sử dụng "pm2 list" để xem danh sách processes đang chạy, "pm2 logs" để xem logs real-time, "pm2 monit" để monitor CPU và memory usage, và "pm2 describe app_name" để xem chi tiết về một process.

Để đảm bảo PM2 tự động start applications khi server reboot, chạy "pm2 startup". PM2 sẽ generate startup script cho system init (systemd trên Ubuntu). Copy và chạy command được hiển thị để install startup script. Sau đó, chạy "pm2 save" để save current process list, PM2 sẽ restore các processes này khi server restart.


### 3.4.3. Cấu hình Nginx

Nginx đóng vai trò quan trọng trong production environment, hoạt động như reverse proxy, load balancer, và web server. Nginx nhận requests từ Internet, forward đến đúng backend services, và trả responses về clients.

**Cấu hình Reverse Proxy:**

Tạo file cấu hình Nginx cho ứng dụng trong thư mục /etc/nginx/sites-available. Tạo file mới với tên "nhh-coffee" bằng text editor. File cấu hình Nginx sử dụng directive-based syntax.

Cấu hình upstream blocks để định nghĩa backend servers. Tạo upstream block cho API server với tên "api_backend", liệt kê các backend servers (localhost:5000). Nginx sẽ load balance requests giữa các servers này. Tạo upstream block cho Next.js server với tên "web_backend", trỏ đến localhost:3000.

Cấu hình server block cho HTTP (port 80). Server block này sẽ redirect tất cả HTTP requests sang HTTPS để đảm bảo bảo mật. Directive "listen 80" cho Nginx listen trên port 80. Directive "server_name" set domain name, ví dụ "nhh-coffee.com www.nhh-coffee.com". Directive "return 301 https://$server_name$request_uri" redirect tất cả requests sang HTTPS với status code 301 (permanent redirect).

Cấu hình server block cho HTTPS (port 443) sẽ được thêm sau khi setup SSL certificate. Server block này chứa các location blocks để route requests đến đúng backend services.

Location block cho API requests: "location /api" sẽ match tất cả requests bắt đầu với /api. Bên trong block này, sử dụng "proxy_pass http://api_backend" để forward requests đến API backend. Thêm các proxy headers như "proxy_set_header Host $host", "proxy_set_header X-Real-IP $remote_addr", "proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for", và "proxy_set_header X-Forwarded-Proto $scheme" để preserve client information. Thêm "proxy_http_version 1.1" và "proxy_set_header Connection ''" để support HTTP/1.1 và keep-alive connections.

Location block cho Socket.io: "location /socket.io" để handle WebSocket connections. Sử dụng "proxy_pass http://api_backend" để forward đến backend. Thêm WebSocket-specific headers: "proxy_set_header Upgrade $http_upgrade" và "proxy_set_header Connection 'upgrade'" để upgrade HTTP connection sang WebSocket. Thêm "proxy_cache_bypass $http_upgrade" để bypass cache cho WebSocket connections.

Location block cho Next.js: "location /" sẽ match tất cả requests không match các location blocks trước đó. Sử dụng "proxy_pass http://web_backend" để forward đến Next.js server. Thêm các proxy headers tương tự như API location.

**Tối ưu hóa hiệu suất:**

Thêm các directives để tối ưu hóa hiệu suất Nginx.

Enable gzip compression để giảm kích thước responses. Trong server block hoặc http block, thêm "gzip on", "gzip_vary on", "gzip_proxied any", "gzip_comp_level 6" (compression level từ 1-9, 6 là balance tốt giữa compression ratio và CPU usage), "gzip_types" với danh sách MIME types cần compress như text/plain, text/css, application/json, application/javascript, text/xml, application/xml. Gzip có thể giảm response size 70-80%, cải thiện load times đáng kể.

Cấu hình caching cho static assets. Thêm location block "location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$" để match static files. Bên trong block, set "expires 1y" để set cache expiration 1 năm, "add_header Cache-Control 'public, immutable'" để instruct browsers cache aggressively, và "access_log off" để disable access logging cho static files (giảm I/O).

Set client body size limit để prevent large uploads. Thêm "client_max_body_size 10M" trong server block. Giá trị này nên đủ lớn cho product images và user avatars nhưng không quá lớn để tránh abuse.

Cấu hình timeouts phù hợp. Set "proxy_connect_timeout 60s", "proxy_send_timeout 60s", và "proxy_read_timeout 60s" để avoid premature timeouts cho slow requests. Set "keepalive_timeout 65" để maintain keep-alive connections trong 65 seconds, giảm overhead của việc tạo connections mới.

**Enable cấu hình và restart Nginx:**

Sau khi tạo file cấu hình, cần enable nó và restart Nginx. Tạo symbolic link từ sites-available sang sites-enabled bằng "sudo ln -s /etc/nginx/sites-available/nhh-coffee /etc/nginx/sites-enabled/". Nginx chỉ load configs từ sites-enabled.

Test cấu hình Nginx bằng "sudo nginx -t". Lệnh này check syntax errors và configuration issues. Nếu test thành công, sẽ hiển thị "syntax is ok" và "test is successful". Nếu có errors, đọc error messages và fix issues trong config file.

Reload Nginx để apply changes bằng "sudo systemctl reload nginx". Reload graceful hơn restart, không drop existing connections. Nếu có major changes, có thể restart bằng "sudo systemctl restart nginx".

Verify Nginx đang serve ứng dụng bằng cách truy cập http://your_server_ip trong browser. Nếu cấu hình đúng, sẽ thấy Next.js application. Test API bằng cách gửi request đến http://your_server_ip/api/products.


### 3.4.4. Cấu hình SSL/TLS

SSL/TLS certificate đảm bảo kết nối HTTPS an toàn giữa clients và server, mã hóa dữ liệu truyền tải và xác thực identity của server. Let's Encrypt cung cấp SSL certificates miễn phí với automated renewal.

**Cài đặt Certbot:**

Certbot là tool chính thức của Let's Encrypt để obtain và renew SSL certificates. Cài đặt Certbot và Nginx plugin bằng "sudo apt install certbot python3-certbot-nginx -y". Plugin này cho phép Certbot tự động cấu hình Nginx với SSL certificate.

**Obtain SSL Certificate:**

Trước khi chạy Certbot, cần đảm bảo domain name đã được point đến server IP address. Cấu hình DNS records tại domain registrar hoặc DNS provider: tạo A record trỏ domain (ví dụ nhh-coffee.com) đến server IP, và tạo A record cho www subdomain (www.nhh-coffee.com) đến cùng IP. DNS propagation có thể mất vài phút đến vài giờ. Verify DNS đã propagate bằng "nslookup nhh-coffee.com" hoặc online DNS checker tools.

Chạy Certbot để obtain certificate bằng "sudo certbot --nginx -d nhh-coffee.com -d www.nhh-coffee.com". Certbot sẽ thực hiện các bước sau: verify domain ownership bằng cách tạo temporary file trên server và request Let's Encrypt servers truy cập file đó qua HTTP, obtain certificate từ Let's Encrypt nếu verification thành công, tự động modify Nginx configuration để enable HTTPS, và setup redirect từ HTTP sang HTTPS.

Trong quá trình chạy, Certbot sẽ hỏi một số questions: email address để nhận renewal reminders và security notices (nhập email hợp lệ), agree to Terms of Service (chọn Yes), và có muốn share email với EFF không (optional). Certbot cũng hỏi có muốn redirect tất cả HTTP traffic sang HTTPS không, chọn option 2 (Redirect) để force HTTPS.

Sau khi hoàn tất, Certbot sẽ hiển thị success message với thông tin về certificate location và expiration date. Certificates được lưu trong /etc/letsencrypt/live/nhh-coffee.com/. Nginx config file sẽ được update với SSL directives.

**Verify SSL Configuration:**

Mở Nginx config file để xem changes do Certbot thêm vào. Certbot đã thêm server block mới cho HTTPS (port 443) với các directives: "listen 443 ssl" để listen trên port 443 với SSL, "ssl_certificate" trỏ đến fullchain.pem (certificate chain), "ssl_certificate_key" trỏ đến privkey.pem (private key), và "include /etc/letsencrypt/options-ssl-nginx.conf" để include SSL best practices configuration. File options-ssl-nginx.conf chứa các settings như SSL protocols (TLSv1.2, TLSv1.3), SSL ciphers, và SSL session settings.

Test HTTPS bằng cách truy cập https://nhh-coffee.com trong browser. Browser sẽ hiển thị padlock icon trong address bar, indicating secure connection. Click vào padlock để xem certificate details, verify certificate được issued bởi Let's Encrypt và valid cho domain.

Test SSL configuration quality bằng online tools như SSL Labs SSL Test (ssllabs.com/ssltest). Tool này analyze SSL/TLS configuration và cho điểm từ A+ đến F. Với Certbot default configuration, thường đạt grade A. Tool cũng cung cấp recommendations để improve security nếu cần.

**Automated Certificate Renewal:**

Let's Encrypt certificates có validity period 90 ngày. Certbot tự động setup renewal mechanism khi cài đặt. Certbot tạo systemd timer hoặc cron job để chạy renewal command hai lần mỗi ngày. Renewal command check xem certificate có sắp expire không (trong vòng 30 ngày), nếu có thì renew certificate và reload Nginx.

Verify renewal mechanism đang hoạt động bằng "sudo systemctl status certbot.timer" (cho systemd timer) hoặc "sudo cat /etc/cron.d/certbot" (cho cron job). Timer hoặc cron job nên được enabled và active.

Test renewal process bằng "sudo certbot renew --dry-run". Lệnh này simulate renewal process mà không thực sự renew certificate. Nếu dry run thành công, nghĩa là automated renewal sẽ hoạt động khi certificate sắp expire. Nếu có errors, cần fix issues để đảm bảo renewal không fail khi certificate thực sự expire.

Certbot logs được lưu trong /var/log/letsencrypt/. Có thể check logs để troubleshoot renewal issues nếu cần. Certbot cũng gửi email notifications đến email address đã đăng ký khi certificate sắp expire và renewal fails, cho phép admin can thiệp kịp thời.


### 3.4.5. Bảo mật hệ thống

Bảo mật là yếu tố quan trọng nhất trong production environment. Ngoài các biện pháp bảo mật cơ bản đã thực hiện ở bước chuẩn bị server, cần implement thêm các layers bảo mật để protect hệ thống khỏi các threats.

**Cấu hình UFW Firewall:**

UFW (Uncomplicated Firewall) cung cấp interface đơn giản để quản lý iptables firewall rules. Firewall control traffic đến và đi từ server, chỉ allow traffic trên các ports cần thiết và block tất cả traffic khác.

Enable UFW bằng "sudo ufw enable". Trước khi enable, cần đảm bảo SSH port được allow để tránh bị lock out khỏi server. Nếu SSH đang chạy trên port 22, chạy "sudo ufw allow 22/tcp". Nếu đã thay đổi SSH port (ví dụ 2222), chạy "sudo ufw allow 2222/tcp".

Allow HTTP và HTTPS traffic để users có thể truy cập website. Chạy "sudo ufw allow 80/tcp" cho HTTP và "sudo ufw allow 443/tcp" cho HTTPS. Có thể sử dụng service names thay vì port numbers: "sudo ufw allow 'Nginx Full'" sẽ allow cả HTTP và HTTPS.

Deny tất cả incoming traffic khác. UFW default policy là deny incoming, allow outgoing. Verify policies bằng "sudo ufw status verbose". Output sẽ hiển thị firewall status (active), default policies, và list of rules. Chỉ nên thấy rules cho SSH, HTTP, và HTTPS.

Nếu cần allow traffic từ specific IP addresses (ví dụ office IP để access admin panel), có thể add rules như "sudo ufw allow from office_ip to any port 443". Rule này chỉ allow HTTPS traffic từ office IP, block traffic từ IPs khác.

**Hardening PostgreSQL:**

PostgreSQL cần được cấu hình để chỉ accept connections từ localhost, không expose ra Internet.

Mở file pg_hba.conf (thường ở /etc/postgresql/15/main/pg_hba.conf) và verify connection rules. File này control authentication methods cho different connection types. Đảm bảo chỉ có rules cho local connections và localhost. Ví dụ: "local all all peer" cho Unix socket connections và "host all all 127.0.0.1/32 md5" cho localhost TCP connections. Không nên có rules cho 0.0.0.0/0 (all IPs).

Mở file postgresql.conf và verify "listen_addresses" setting. Nên set thành "localhost" hoặc "127.0.0.1" để PostgreSQL chỉ listen trên localhost interface. Nếu set thành "*", PostgreSQL sẽ listen trên tất cả network interfaces, potentially exposing database ra Internet.

Restart PostgreSQL sau khi thay đổi config bằng "sudo systemctl restart postgresql". Verify PostgreSQL chỉ listen trên localhost bằng "sudo netstat -plnt | grep postgres". Output nên show PostgreSQL listening trên 127.0.0.1:5432, không phải 0.0.0.0:5432.

Sử dụng strong passwords cho database users. Password nên dài ít nhất 16 characters, bao gồm uppercase, lowercase, numbers, và special characters. Không sử dụng default passwords hoặc common passwords. Rotate passwords định kỳ (ví dụ mỗi 6 tháng).

**Hardening Redis:**

Redis cũng cần được secured để prevent unauthorized access.

Mở file redis.conf (thường ở /etc/redis/redis.conf) và cấu hình các security settings. Set "bind 127.0.0.1" để Redis chỉ listen trên localhost. Set "protected-mode yes" để enable protected mode, Redis sẽ refuse connections từ external IPs khi không có password. Set "requirepass" với strong password để require authentication. Password nên được generate randomly và lưu trong environment variables.

Disable dangerous commands có thể được abuse. Thêm "rename-command FLUSHDB ''" và "rename-command FLUSHALL ''" để disable FLUSHDB và FLUSHALL commands (commands này xóa toàn bộ data). Có thể rename thay vì disable nếu cần sử dụng: "rename-command FLUSHDB 'secret_flushdb_command'".

Restart Redis sau khi thay đổi config bằng "sudo systemctl restart redis". Update Redis connection string trong application .env file để include password: "redis://:password@localhost:6379".

**Application Security Best Practices:**

Ngoài infrastructure security, cần đảm bảo application code follow security best practices.

Validate và sanitize tất cả user inputs. Hệ thống đã implement Zod validation cho API endpoints, đảm bảo request data đúng type và format. Sanitize inputs để prevent XSS attacks, ví dụ escape HTML characters trong user-generated content như reviews và comments.

Implement rate limiting để prevent brute force attacks và DDoS. Hệ thống sử dụng express-rate-limit middleware để limit số requests từ một IP trong time window. Ví dụ, login endpoint limit 5 requests per 15 minutes để prevent password guessing attacks. API endpoints limit 100 requests per 15 minutes để prevent abuse.

Use HTTPS everywhere. Nginx đã được cấu hình để redirect tất cả HTTP traffic sang HTTPS. Application code cũng nên set secure flags cho cookies: "httpOnly: true" để prevent JavaScript access, "secure: true" để chỉ send cookies qua HTTPS, và "sameSite: 'strict'" để prevent CSRF attacks.

Keep dependencies up to date. Regularly check for security vulnerabilities trong dependencies bằng "npm audit". Lệnh này scan dependencies và report known vulnerabilities với severity levels. Fix vulnerabilities bằng "npm audit fix" hoặc manually update vulnerable packages. Subscribe to security advisories của các libraries chính để được notify về vulnerabilities sớm.

Implement proper error handling. Không expose sensitive information trong error messages. Production error responses nên generic, ví dụ "Internal Server Error" thay vì detailed stack traces. Log detailed errors server-side để debugging nhưng không send về clients.

Regular security audits và penetration testing. Định kỳ review code để identify security issues, test authentication và authorization mechanisms, check for common vulnerabilities như SQL injection (Prisma ORM đã prevent SQL injection), XSS, CSRF, và insecure direct object references. Có thể sử dụng automated security scanning tools hoặc hire security professionals cho comprehensive audits.

**Backup và Disaster Recovery:**

Implement backup strategy để protect data khỏi loss.

Setup automated database backups. Tạo cron job để chạy pg_dump command daily, backup database sang file với timestamp. Ví dụ: "0 2 * * * pg_dump -U nhh_prod_user nhh_coffee_prod > /backups/db_$(date +\%Y\%m\%d).sql". Cron job này chạy lúc 2 AM mỗi ngày, tạo backup file với date trong filename.

Store backups ở off-site location. Không lưu backups chỉ trên production server vì nếu server fail hoặc bị compromise, backups cũng mất. Upload backups lên cloud storage như AWS S3, Google Cloud Storage, hoặc Backblaze B2. Có thể sử dụng tools như rclone để automate upload process.

Test backup restoration regularly. Backup chỉ hữu ích nếu có thể restore được. Định kỳ (ví dụ monthly) test restore backup vào test database để verify backup files không corrupt và restoration process hoạt động. Document restoration procedures để có thể quickly recover trong emergency.

Monitor system health và setup alerts. Sử dụng monitoring tools như PM2 monitoring, Nginx access/error logs, PostgreSQL logs, và system logs. Setup alerts để notify admins khi có issues như high CPU/memory usage, disk space running low, application crashes, hoặc unusual traffic patterns. Có thể sử dụng services như UptimeRobot để monitor website uptime và send alerts khi website down.


## 3.5. KẾT LUẬN

Chương 3 đã trình bày chi tiết về môi trường cài đặt và quy trình triển khai hệ thống NHH-Coffee, từ yêu cầu phần cứng, phần mềm, đến các bước cụ thể để thiết lập môi trường phát triển và triển khai lên môi trường sản xuất.

Về yêu cầu hệ thống, chúng tôi đã phân tích và xác định cấu hình phần cứng phù hợp cho cả môi trường phát triển và sản xuất, đảm bảo hệ thống có đủ tài nguyên để hoạt động ổn định. Các phần mềm cốt lõi như Node.js, PostgreSQL, Redis, cùng với các công cụ phát triển và triển khai như VS Code, PM2, Nginx, và Certbot đã được lựa chọn dựa trên tính ổn định, hiệu suất, và sự phổ biến trong cộng đồng. Kiến trúc công nghệ được thiết kế theo mô hình phân lớp rõ ràng với Frontend sử dụng Next.js, Backend sử dụng Express.js, và Data Layer sử dụng PostgreSQL kết hợp Redis caching, đảm bảo tính module hóa và khả năng mở rộng.

Môi trường phát triển được thiết lập với quy trình chuẩn hóa, từ cài đặt các phần mềm cơ bản, clone repository, cài đặt dependencies, cấu hình environment variables, đến thiết lập database schema và khởi chạy ứng dụng. Việc sử dụng các công cụ như Prisma ORM, nodemon, và Next.js Fast Refresh giúp tăng năng suất phát triển và giảm thiểu thời gian chờ đợi. Quy trình phát triển được tối ưu hóa để lập trình viên có thể dễ dàng test và debug code trong môi trường local trước khi deploy lên production.

Môi trường sản xuất được triển khai trên VPS với Ubuntu 22.04 LTS, tuân thủ các best practices về bảo mật và hiệu suất. Quá trình triển khai bao gồm chuẩn bị máy chủ với các biện pháp bảo mật cơ bản, cài đặt phần mềm hệ thống, deploy ứng dụng với PM2 process manager, cấu hình Nginx làm reverse proxy và load balancer, thiết lập SSL/TLS certificate từ Let's Encrypt, và implement các layers bảo mật bổ sung như UFW firewall, database hardening, và application security measures. Việc sử dụng PM2 cluster mode cho phép tận dụng multi-core CPU và đảm bảo high availability. Nginx được cấu hình với các optimizations như gzip compression, caching, và proper timeouts để cải thiện performance. SSL/TLS certificate từ Let's Encrypt với automated renewal đảm bảo kết nối HTTPS an toàn mà không tốn chi phí.

Các biện pháp bảo mật được implement ở nhiều layers: infrastructure level với firewall và SSH hardening, database level với restricted access và strong passwords, application level với input validation và rate limiting, và operational level với monitoring và backup strategy. Backup strategy với automated daily backups và off-site storage đảm bảo data có thể được recovered trong trường hợp disaster.

Quy trình cài đặt và triển khai được document chi tiết trong chương này cung cấp foundation vững chắc cho việc phát triển và vận hành hệ thống NHH-Coffee. Việc tuân thủ các best practices về security, performance, và reliability đảm bảo hệ thống có thể phục vụ người dùng một cách ổn định và an toàn trong môi trường production. Các công cụ monitoring và alerting cho phép team nhanh chóng phát hiện và xử lý issues, minimizing downtime và maintaining service quality.

Với môi trường đã được thiết lập đầy đủ, hệ thống NHH-Coffee sẵn sàng để phục vụ người dùng với các tính năng quản lý bán hàng, quản lý kho, quản lý nhân viên, chatbot AI, và các chức năng khác. Kiến trúc scalable cho phép hệ thống dễ dàng mở rộng khi lượng người dùng tăng lên, chỉ cần nâng cấp server resources hoặc thêm servers mới vào load balancer. Việc sử dụng các công nghệ modern và proven như Next.js, Express.js, PostgreSQL, và Redis đảm bảo hệ thống có thể được maintain và develop tiếp trong tương lai với chi phí hợp lý.

---

**Sơ đồ tổng quan quy trình triển khai:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUY TRÌNH TRIỂN KHAI                         │
└─────────────────────────────────────────────────────────────────┘

GIAI ĐOẠN 1: CHUẨN BỊ MÁY CHỦ
┌──────────────────────────────────────────────────────────────┐
│ 1. Tạo VPS (DigitalOcean/Vultr/AWS)                         │
│    - Chọn Ubuntu 22.04 LTS                                   │
│    - Cấu hình: 4 cores, 8GB RAM, 100GB SSD                  │
│    - Datacenter: Singapore/Tokyo                             │
│                                                              │
│ 2. Bảo mật cơ bản                                            │
│    - Update system packages                                  │
│    - Tạo sudo user                                           │
│    - Cấu hình SSH (disable root, change port)               │
│                                                              │
│ 3. Cài đặt phần mềm                                          │
│    - Node.js 20.x                                            │
│    - PostgreSQL 15.x                                         │
│    - Redis 7.x                                               │
│    - Nginx 1.24.x                                            │
│    - PM2, Git, Certbot                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
GIAI ĐOẠN 2: TRIỂN KHAI ỨNG DỤNG
┌──────────────────────────────────────────────────────────────┐
│ 1. Clone source code                                         │
│    - git clone repository                                    │
│    - npm ci (backend & frontend)                             │
│                                                              │
│ 2. Cấu hình environment                                      │
│    - Tạo .env files                                          │
│    - Set production credentials                              │
│    - Configure database connection                           │
│                                                              │
│ 3. Build applications                                        │
│    - npm run build (backend)                                 │
│    - npm run build (frontend)                                │
│                                                              │
│ 4. Setup PM2                                                 │
│    - Tạo ecosystem.config.js                                 │
│    - pm2 start ecosystem.config.js                           │
│    - pm2 startup & pm2 save                                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
GIAI ĐOẠN 3: CẤU HÌNH NGINX & SSL
┌──────────────────────────────────────────────────────────────┐
│ 1. Cấu hình Nginx                                            │
│    - Tạo server blocks                                       │
│    - Setup reverse proxy                                     │
│    - Enable gzip & caching                                   │
│                                                              │
│ 2. Setup SSL/TLS                                             │
│    - Point domain to server IP                               │
│    - certbot --nginx                                         │
│    - Verify HTTPS working                                    │
│    - Test auto-renewal                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
GIAI ĐOẠN 4: BẢO MẬT & MONITORING
┌──────────────────────────────────────────────────────────────┐
│ 1. Firewall                                                  │
│    - ufw allow SSH/HTTP/HTTPS                                │
│    - ufw enable                                              │
│                                                              │
│ 2. Database & Redis hardening                                │
│    - Restrict to localhost                                   │
│    - Strong passwords                                        │
│    - Disable dangerous commands                              │
│                                                              │
│ 3. Backup & Monitoring                                       │
│    - Setup automated backups                                 │
│    - Configure monitoring & alerts                           │
│    - Test disaster recovery                                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │   PRODUCTION  │
                    │     READY     │
                    └───────────────┘
```

**Checklist triển khai:**

```
☐ Server Setup
  ☐ VPS created with correct specs
  ☐ Ubuntu 22.04 LTS installed
  ☐ Sudo user created
  ☐ SSH hardened (key-only, custom port)
  ☐ System packages updated

☐ Software Installation
  ☐ Node.js 20.x installed
  ☐ PostgreSQL 15.x installed & configured
  ☐ Redis 7.x installed & configured
  ☐ Nginx installed
  ☐ PM2 installed globally
  ☐ Git installed
  ☐ Certbot installed

☐ Application Deployment
  ☐ Repository cloned
  ☐ Dependencies installed (npm ci)
  ☐ Environment variables configured
  ☐ Database created & migrated
  ☐ Applications built (npm run build)
  ☐ PM2 configured & started
  ☐ PM2 startup script enabled

☐ Nginx Configuration
  ☐ Server blocks created
  ☐ Reverse proxy configured
  ☐ Gzip compression enabled
  ☐ Static file caching configured
  ☐ Configuration tested (nginx -t)
  ☐ Nginx reloaded

☐ SSL/TLS Setup
  ☐ Domain DNS configured
  ☐ SSL certificate obtained
  ☐ HTTPS working
  ☐ HTTP to HTTPS redirect working
  ☐ Auto-renewal tested

☐ Security Hardening
  ☐ UFW firewall enabled
  ☐ Only necessary ports open
  ☐ PostgreSQL restricted to localhost
  ☐ Redis password protected
  ☐ Strong passwords used everywhere
  ☐ Rate limiting configured

☐ Backup & Monitoring
  ☐ Automated backups configured
  ☐ Backup restoration tested
  ☐ Off-site backup storage setup
  ☐ Monitoring & alerts configured
  ☐ Log rotation configured

☐ Final Verification
  ☐ Website accessible via HTTPS
  ☐ API endpoints working
  ☐ Real-time features working
  ☐ Admin panel accessible
  ☐ Performance acceptable
  ☐ No security warnings
```

Chương 3 đã cung cấp một hướng dẫn toàn diện về môi trường cài đặt và triển khai, từ lý thuyết đến thực hành, từ development đến production. Việc tuân thủ các quy trình và best practices được trình bày trong chương này sẽ đảm bảo hệ thống NHH-Coffee được triển khai thành công và vận hành ổn định trong môi trường thực tế.
