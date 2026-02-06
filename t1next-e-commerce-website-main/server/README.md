# NHH-Coffee Website

Website quản lý cửa hàng cà phê NHH-Coffee với Next.js 14 và Node.js.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: JWT + OTP Email Verification

## Yêu cầu

- Node.js 18+
- PostgreSQL 14+
- pnpm hoặc npm

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd nhh-coffee-website
```

### 2. Cài đặt dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 3. Cấu hình môi trường

```bash
# Server
cp server/.env.example server/.env
# Cập nhật DATABASE_URL và các biến môi trường khác
```

### 4. Khởi tạo database

```bash
cd server
npx prisma migrate dev
npm run db:seed
```

### 5. Chạy ứng dụng

```bash
# Server (port 3001)
cd server
npm run dev

# Client (port 3000)
cd client
npm run dev
```

## Tài khoản demo

- **Admin**: admin@nhh-coffee.com / admin123
- **Staff**: staff@nhh-coffee.com / staff123
- **Warehouse**: warehouse@nhh-coffee.com / warehouse123
- **User**: user@example.com / password123

## Tính năng

- Quản lý menu đồ uống (cà phê, trà, đá xay, sinh tố...)
- Quản lý bánh ngọt và snack
- Hệ thống đặt hàng online
- POS bán hàng tại quầy
- Quản lý kho hàng
- Hệ thống khuyến mãi
- Thông báo đẩy
- Chat hỗ trợ khách hàng
