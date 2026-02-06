# PHẦN BỔ SUNG: PHÂN TÍCH VÀ TRIỂN KHAI CƠ SỞ DỮ LIỆU

## Mục lục
- [1. Tổng quan Database Schema](#1-tổng-quan-database-schema)
- [2. Phân tích các bảng chính](#2-phân-tích-các-bảng-chính)
- [3. Quan hệ giữa các bảng](#3-quan-hệ-giữa-các-bảng)
- [4. Triển khai SQL](#4-triển-khai-sql)
- [5. Indexes và Optimization](#5-indexes-và-optimization)

---

## 1. TỔNG QUAN DATABASE SCHEMA

Hệ thống NHH-Coffee sử dụng PostgreSQL làm hệ quản trị cơ sở dữ liệu quan hệ. Database schema được thiết kế theo chuẩn Third Normal Form (3NF) để đảm bảo tính toàn vẹn dữ liệu, giảm redundancy, và tối ưu hóa hiệu suất truy vấn.

### 1.1. Cấu trúc tổng quan

Database bao gồm 25+ bảng được nhóm thành các module chức năng:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

MODULE QUẢN LÝ NGƯỜI DÙNG
├── users                    (Thông tin người dùng)
├── pending_registrations    (Đăng ký chờ xác thực OTP)
├── password_resets          (Reset mật khẩu)
└── push_subscriptions       (Push notification subscriptions)

MODULE SẢN PHẨM & DANH MỤC
├── categories               (Danh mục sản phẩm)
├── products                 (Sản phẩm)
├── product_suppliers        (Liên kết sản phẩm - nhà cung cấp)
├── suppliers                (Nhà cung cấp)
└── stock_transactions       (Lịch sử giao dịch kho)

MODULE ĐỚN HÀNG
├── orders                   (Đơn hàng)
├── order_items              (Chi tiết đơn hàng)
├── table_orders             (Đơn hàng tại bàn)
└── kitchen_items            (Món ăn trong bếp)

MODULE KHUYẾN MÃI
├── promotions               (Chương trình khuyến mãi)
├── promotion_usage          (Lịch sử sử dụng khuyến mãi)
└── flash_sales              (Flash sale)

MODULE TƯƠNG TÁC KHÁCH HÀNG
├── reviews                  (Đánh giá sản phẩm)
├── review_images            (Hình ảnh đánh giá)
├── product_questions        (Câu hỏi về sản phẩm)
├── product_answers          (Câu trả lời)
├── cart_items               (Giỏ hàng)
├── wishlist                 (Danh sách yêu thích)
└── notifications            (Thông báo)

MODULE CHAT & SUPPORT
├── chat_sessions            (Phiên chat)
├── chat_messages            (Tin nhắn chat)
└── chatbot_knowledge        (Kiến thức chatbot AI)

MODULE QUẢN LÝ BÀN & KHU VỰC
├── areas                    (Khu vực)
├── tables                   (Bàn)
└── reservations             (Đặt bàn)

MODULE NHÂN VIÊN
├── shifts                   (Ca làm việc)
└── shift_swaps              (Yêu cầu đổi ca)
```

### 1.2. Các kiểu dữ liệu ENUM

Hệ thống sử dụng PostgreSQL ENUM types để đảm bảo data integrity:

```sql
-- Vai trò người dùng
CREATE TYPE "UserRole" AS ENUM (
    'user',      -- Khách hàng
    'admin',     -- Quản trị viên
    'sales',     -- Nhân viên bán hàng
    'warehouse'  -- Nhân viên kho
);

-- Trạng thái đơn hàng
CREATE TYPE "OrderStatus" AS ENUM (
    'pending',          -- Chờ xử lý
    'awaiting_payment', -- Chờ thanh toán
    'confirmed',        -- Đã xác nhận
    'shipping',         -- Đang giao hàng
    'delivered',        -- Đã giao hàng
    'cancelled'         -- Đã hủy
);

-- Loại giao dịch kho
CREATE TYPE "StockTransactionType" AS ENUM (
    'import',   -- Nhập kho
    'export',   -- Xuất kho
    'adjust',   -- Điều chỉnh
    'order',    -- Đơn hàng
    'return'    -- Trả hàng
);

-- Trạng thái phiên chat
CREATE TYPE "ChatSessionStatus" AS ENUM (
    'waiting',  -- Chờ nhân viên
    'active',   -- Đang chat
    'closed'    -- Đã đóng
);
```

---

## 2. PHÂN TÍCH CÁC BẢNG CHÍNH

### 2.1. Bảng Users (Người dùng)

Bảng users lưu trữ thông tin tất cả người dùng trong hệ thống, bao gồm khách hàng và nhân viên.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    avatar          TEXT,
    phone           VARCHAR(20),
    address         TEXT,
    role            "UserRole" DEFAULT 'user',
    is_active       BOOLEAN DEFAULT true,
    
    -- Loyalty program fields
    points          INTEGER DEFAULT 0,
    tier            VARCHAR(20) DEFAULT 'bronze',
    total_spent     DECIMAL(15,2) DEFAULT 0,
    order_count     INTEGER DEFAULT 0,
    
    note            TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_points ON users(points);
```

**Phân tích thiết kế:**

- **Primary Key**: UUID thay vì auto-increment integer để tránh enumeration attacks và dễ dàng merge data từ nhiều sources
- **Email**: Unique constraint đảm bảo mỗi email chỉ đăng ký một tài khoản
- **Password**: Lưu trữ bcrypt hash, không bao giờ lưu plain text
- **Role**: ENUM type đảm bảo chỉ có các vai trò hợp lệ
- **Loyalty fields**: Hỗ trợ chương trình khách hàng thân thiết với điểm tích lũy và tier (bronze/silver/gold/platinum)
- **Indexes**: Tối ưu cho các truy vấn thường xuyên (login by email, filter by role, sort by points)

### 2.2. Bảng Products (Sản phẩm)

Bảng products lưu trữ thông tin chi tiết về sản phẩm.

```sql
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) UNIQUE NOT NULL,
    description         TEXT,
    price               DECIMAL(15,2) NOT NULL,
    original_price      DECIMAL(15,2),
    images              TEXT[] DEFAULT '{}',
    category_id         UUID REFERENCES categories(id),
    brand               VARCHAR(255),
    specs               JSONB DEFAULT '{}',
    stock               INTEGER DEFAULT 0,
    rating              DECIMAL(2,1) DEFAULT 0,
    review_count        INTEGER DEFAULT 0,
    is_new              BOOLEAN DEFAULT false,
    is_featured         BOOLEAN DEFAULT false,
    discount            INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_created ON products(created_at);
CREATE INDEX idx_products_stock ON products(stock);
```

**Phân tích thiết kế:**

- **Slug**: URL-friendly identifier cho SEO, unique constraint đảm bảo không trùng lặp
- **Images**: Array type lưu trữ multiple image URLs
- **Specs**: JSONB type cho flexible product specifications (màu sắc, kích thước, cấu hình kỹ thuật)
- **Price fields**: DECIMAL(15,2) đảm bảo precision cho tiền tệ
- **Rating**: Denormalized field để tránh calculate mỗi lần query, updated khi có review mới
- **Stock**: Real-time inventory tracking
- **Flags**: is_new, is_featured cho marketing và display logic

### 2.3. Bảng Orders (Đơn hàng)

Bảng orders lưu trữ thông tin đơn hàng.

```sql
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id),
    order_number        VARCHAR(50) UNIQUE NOT NULL,
    status              "OrderStatus" DEFAULT 'pending',
    
    -- Customer info
    customer_name       VARCHAR(255) NOT NULL,
    customer_email      VARCHAR(255),
    customer_phone      VARCHAR(20) NOT NULL,
    shipping_address    TEXT,
    
    -- Order details
    subtotal            DECIMAL(15,2) NOT NULL,
    shipping_fee        DECIMAL(15,2) DEFAULT 0,
    discount            DECIMAL(15,2) DEFAULT 0,
    total               DECIMAL(15,2) NOT NULL,
    
    -- Payment
    payment_method      VARCHAR(50),
    payment_status      VARCHAR(50) DEFAULT 'pending',
    paid_at             TIMESTAMP,
    
    -- Promotion
    promotion_code      VARCHAR(50),
    promotion_discount  DECIMAL(15,2) DEFAULT 0,
    
    -- Metadata
    notes               TEXT,
    staff_notes         TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);
```

**Phân tích thiết kế:**

- **Order Number**: Human-readable unique identifier (ví dụ: ORD-20260201-0001)
- **Denormalized customer info**: Lưu trữ snapshot của thông tin khách hàng tại thời điểm đặt hàng, không bị ảnh hưởng khi user update profile
- **Money fields**: Tách biệt subtotal, shipping, discount để dễ tracking và reporting
- **Payment tracking**: Separate payment_status và paid_at timestamp
- **Promotion tracking**: Lưu promotion code và discount amount cho audit trail
- **Staff notes**: Internal notes không hiển thị cho khách hàng

### 2.4. Bảng Order_Items (Chi tiết đơn hàng)

Bảng order_items lưu trữ các sản phẩm trong đơn hàng.

```sql
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id),
    
    -- Product snapshot
    product_name    VARCHAR(255) NOT NULL,
    product_image   TEXT,
    product_price   DECIMAL(15,2) NOT NULL,
    
    quantity        INTEGER NOT NULL,
    subtotal        DECIMAL(15,2) NOT NULL,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

**Phân tích thiết kế:**

- **Product snapshot**: Lưu trữ tên, hình ảnh, giá tại thời điểm mua để đảm bảo order history không thay đổi khi product info update
- **CASCADE delete**: Khi order bị xóa, tất cả order items cũng bị xóa
- **Subtotal**: Pre-calculated để tránh tính toán lại mỗi lần query

### 2.5. Bảng Reviews (Đánh giá sản phẩm)

```sql
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id),
    
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           VARCHAR(255),
    comment         TEXT,
    
    -- Verification
    is_verified     BOOLEAN DEFAULT false,
    
    -- Helpfulness
    helpful_count   INTEGER DEFAULT 0,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, user_id, order_id)
);

-- Indexes
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

**Phân tích thiết kế:**

- **Rating constraint**: CHECK constraint đảm bảo rating từ 1-5
- **Unique constraint**: Mỗi user chỉ review một lần cho mỗi product trong mỗi order
- **Verified purchase**: is_verified flag cho reviews từ verified purchases
- **Helpful count**: Tracking số người thấy review hữu ích

---

## 3. QUAN HỆ GIỮA CÁC BẢNG

### 3.1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIPS                         │
└─────────────────────────────────────────────────────────────────┘

USERS (1) ──────< (N) ORDERS
  │                     │
  │                     └──< (N) ORDER_ITEMS ──> (1) PRODUCTS
  │                                                     │
  ├──< (N) CART_ITEMS ──────────────────────────────> │
  │                                                     │
  ├──< (N) WISHLIST ────────────────────────────────> │
  │                                                     │
  ├──< (N) REVIEWS ─────────────────────────────────> │
  │         │                                           │
  │         └──< (N) REVIEW_IMAGES                     │
  │                                                     │
  ├──< (N) NOTIFICATIONS                               │
  │                                                     │
  ├──< (N) CHAT_SESSIONS ──< (N) CHAT_MESSAGES        │
  │                                                     │
  └──< (N) STOCK_TRANSACTIONS ────────────────────────┘

CATEGORIES (1) ──< (N) PRODUCTS

PRODUCTS (N) ──< (N) PRODUCT_SUPPLIERS ──> (N) SUPPLIERS

PROMOTIONS (1) ──< (N) PROMOTION_USAGE ──> (N) USERS

AREAS (1) ──< (N) TABLES ──< (N) TABLE_ORDERS

USERS (1) ──< (N) SHIFTS
  │
  └──< (N) SHIFT_SWAPS
```

### 3.2. Các loại quan hệ

**One-to-Many (1:N):**
- Một user có nhiều orders
- Một order có nhiều order_items
- Một product có nhiều reviews
- Một category có nhiều products

**Many-to-Many (N:N):**
- Products và Suppliers (qua bảng product_suppliers)
- Users và Products (qua cart_items, wishlist)

**Self-referencing:**
- product_questions và product_answers (câu hỏi có thể có nhiều câu trả lời)

---

## 4. TRIỂN KHAI SQL

### 4.1. Tạo Database và User

```sql
-- Kết nối với PostgreSQL như superuser
psql -U postgres

-- Tạo database
CREATE DATABASE nhh_coffee_prod
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Tạo user cho application
CREATE USER nhh_prod_user WITH PASSWORD 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nhh_coffee_prod TO nhh_prod_user;

-- Kết nối vào database
\c nhh_coffee_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO nhh_prod_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nhh_prod_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nhh_prod_user;

-- Set default privileges cho tables và sequences tạo sau này
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO nhh_prod_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON SEQUENCES TO nhh_prod_user;
```

### 4.2. Sử dụng Prisma Migrations

Hệ thống sử dụng Prisma ORM để quản lý database schema. Prisma cung cấp migration system mạnh mẽ và type-safe.

**Bước 1: Cấu hình Prisma**

File `prisma/schema.prisma` định nghĩa toàn bộ data models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)
  name      String   @db.VarChar(255)
  // ... other fields
  
  @@map("users")
}

// ... other models
```

**Bước 2: Generate Migration**

```bash
# Development: Tạo migration và apply
npx prisma migrate dev --name init

# Production: Apply existing migrations
npx prisma migrate deploy
```

**Bước 3: Generate Prisma Client**

```bash
npx prisma generate
```

Prisma Client sẽ được generate với full TypeScript types dựa trên schema.

### 4.3. Seed Initial Data

File `src/db/seed.ts` chứa script để tạo initial data:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Tạo admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nhh-coffee.com' },
    update: {},
    create: {
      email: 'admin@nhh-coffee.com',
      password: adminPassword,
      name: 'Administrator',
      role: 'admin',
      isActive: true,
    },
  });

  // Tạo categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Cà phê',
        slug: 'ca-phe',
        icon: '☕',
        description: 'Các loại cà phê đặc sản',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Trà sữa',
        slug: 'tra-sua',
        icon: '🧋',
        description: 'Trà sữa các loại',
      },
    }),
    // ... more categories
  ]);

  // Tạo sample products
  await prisma.product.createMany({
    data: [
      {
        name: 'Cà phê đen đá',
        slug: 'ca-phe-den-da',
        description: 'Cà phê đen truyền thống',
        price: 25000,
        categoryId: categories[0].id,
        stock: 100,
        images: ['/images/ca-phe-den.jpg'],
      },
      // ... more products
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Chạy seed script:

```bash
npm run seed
```

### 4.4. Backup và Restore

**Backup database:**

```bash
# Full backup
pg_dump -U nhh_prod_user -h localhost nhh_coffee_prod > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -U nhh_prod_user -h localhost --schema-only nhh_coffee_prod > schema.sql

# Data only
pg_dump -U nhh_prod_user -h localhost --data-only nhh_coffee_prod > data.sql
```

**Restore database:**

```bash
# Restore full backup
psql -U nhh_prod_user -h localhost nhh_coffee_prod < backup_20260201.sql

# Restore schema then data
psql -U nhh_prod_user -h localhost nhh_coffee_prod < schema.sql
psql -U nhh_prod_user -h localhost nhh_coffee_prod < data.sql
```

---

## 5. INDEXES VÀ OPTIMIZATION

### 5.1. Chiến lược Indexing

Indexes được tạo dựa trên các query patterns thường xuyên:

```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_points ON users(points);

-- Product queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_created ON products(created_at);

-- Order queries
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Composite indexes cho complex queries
CREATE INDEX idx_products_category_price ON products(category_id, price);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
```

### 5.2. Query Optimization Tips

**1. Sử dụng EXPLAIN ANALYZE:**

```sql
EXPLAIN ANALYZE
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.category_id = 'uuid-here'
AND p.price BETWEEN 100000 AND 500000
ORDER BY p.rating DESC
LIMIT 20;
```

**2. Avoid N+1 queries:**

Sử dụng Prisma include/select để eager load relationships:

```typescript
// Bad: N+1 query
const orders = await prisma.order.findMany();
for (const order of orders) {
  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id }
  });
}

// Good: Single query with join
const orders = await prisma.order.findMany({
  include: {
    orderItems: {
      include: {
        product: true
      }
    }
  }
});
```

**3. Pagination:**

```typescript
// Cursor-based pagination (recommended)
const products = await prisma.product.findMany({
  take: 20,
  skip: 1,
  cursor: {
    id: lastProductId
  },
  orderBy: {
    createdAt: 'desc'
  }
});

// Offset-based pagination
const products = await prisma.product.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: {
    createdAt: 'desc'
  }
});
```

### 5.3. Database Maintenance

**Vacuum và Analyze:**

```sql
-- Vacuum để reclaim storage
VACUUM ANALYZE products;

-- Auto-vacuum configuration
ALTER TABLE products SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

**Monitor query performance:**

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## KẾT LUẬN

Database schema của hệ thống NHH-Coffee được thiết kế với các nguyên tắc:

1. **Normalization**: Tuân thủ 3NF để giảm redundancy
2. **Denormalization có chọn lọc**: Lưu trữ calculated fields (rating, review_count) để tối ưu performance
3. **Data Integrity**: Sử dụng foreign keys, constraints, và ENUM types
4. **Scalability**: Indexes được thiết kế cho các query patterns thường xuyên
5. **Audit Trail**: Timestamps và snapshot data cho orders/order_items
6. **Flexibility**: JSONB fields cho dynamic data (product specs)

Việc sử dụng Prisma ORM cung cấp:
- Type-safe database access
- Automated migrations
- Easy relationship management
- Built-in connection pooling
- Query optimization

Database được thiết kế để hỗ trợ tất cả tính năng của hệ thống từ e-commerce, POS, inventory management, đến customer loyalty và AI chatbot.
