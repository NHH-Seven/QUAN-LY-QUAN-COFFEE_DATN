# CHƯƠNG 5: MÔ TẢ TRIỂN KHAI HỆ THỐNG

## 5.1. TỔNG QUAN KIẾN TRÚC

Hệ thống NHH-Coffee được xây dựng theo kiến trúc 3 lớp (3-tier architecture) với sự phân tách rõ ràng giữa Client Layer, Server Layer và Data Layer. Kiến trúc này đảm bảo tính module hóa, dễ bảo trì và khả năng mở rộng cao.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│                    (Next.js 14 - React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Browser │  │ Mobile View  │  │  Staff Panel │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON/API + Socket.IO
┌────────────────────────▼────────────────────────────────────┐
│              CONTROLLER LAYER (Next.js API)                  │
│                    (Express.js + TypeScript)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Handler  │  Product Handler  │  Order Handler  │   │
│  │  Cart Handler  │  Chat Handler     │  Report Handler │   │
│  │  Payment       │  Promotion        │  Stock Handler  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Service    │  Product Service  │  Order Service│   │
│  │  Email Service   │  Chatbot Service  │  Cache Service│   │
│  │  Payment Service │  Notification     │  Socket.IO    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│            DATA ACCESS LAYER (Prisma ORM)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  User Model   │  Product Model  │  Order Model      │   │
│  │  Cart Model   │  Review Model   │  Promotion Model  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
┌────────────────────────▼────────────────────────────────────┐
│                      PostgreSQL                              │
│                   (Database Server)                          │
└──────────────────────────────────────────────────────────────┘
```

## 5.2. CLIENT LAYER - LỚP GIAO DIỆN

### 5.2.1. Công nghệ sử dụng

**Framework:** Next.js 14 (App Router)
- Server-Side Rendering (SSR) cho SEO tối ưu
- Static Site Generation (SSG) cho các trang tĩnh
- Client-Side Rendering (CSR) cho tương tác động

**UI Library:** React 18 + TypeScript
- Component-based architecture
- Type-safe với TypeScript
- Hooks cho state management

**Styling:** Tailwind CSS + shadcn/ui
- Utility-first CSS framework
- Responsive design
- Dark mode support

### 5.2.2. Cấu trúc thư mục Client

```
client/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes
│   │   ├── page.tsx             # Trang chủ
│   │   ├── login/               # Đăng nhập
│   │   ├── register/            # Đăng ký
│   │   ├── product/[slug]/      # Chi tiết sản phẩm
│   │   ├── cart/                # Giỏ hàng
│   │   ├── checkout/            # Thanh toán
│   │   └── profile/             # Hồ sơ người dùng
│   │
│   └── staff/                    # Staff routes (protected)
│       ├── dashboard/           # Dashboard tổng quan
│       ├── products/            # Quản lý sản phẩm
│       ├── orders/              # Quản lý đơn hàng
│       ├── pos/                 # Point of Sale
│       ├── kitchen/             # Quản lý bếp
│       ├── tables/              # Quản lý bàn
│       ├── reports/             # Báo cáo
│       └── chatbot-knowledge/   # Quản lý chatbot
│
├── components/                   # React components
│   ├── ui/                      # Base UI components
│   ├── auth/                    # Authentication components
│   ├── product/                 # Product components
│   ├── cart/                    # Cart components
│   ├── chatbot/                 # Chatbot components
│   └── admin/                   # Admin components
│
├── contexts/                     # React Context
│   ├── auth-context.tsx         # Authentication state
│   ├── cart-context.tsx         # Cart state
│   └── chat-context.tsx         # Chat state
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts              # Authentication hook
│   ├── use-cart.ts              # Cart hook
│   └── use-toast.ts             # Toast notification hook
│
└── lib/                          # Utilities
    ├── api.ts                   # API client
    ├── socket.ts                # Socket.IO client
    └── utils.ts                 # Helper functions
```

### 5.2.3. Các trang chính

**Trang công khai:**
1. **Trang chủ** (`/`): Hiển thị sản phẩm nổi bật, khuyến mãi
2. **Danh mục** (`/category/[slug]`): Danh sách sản phẩm theo danh mục
3. **Chi tiết sản phẩm** (`/product/[slug]`): Thông tin chi tiết sản phẩm
4. **Giỏ hàng** (`/cart`): Quản lý giỏ hàng
5. **Thanh toán** (`/checkout`): Quy trình thanh toán
6. **Đăng nhập/Đăng ký** (`/login`, `/register`): Xác thực người dùng

**Trang quản trị (Staff):**
1. **Dashboard** (`/staff/dashboard`): Tổng quan hệ thống
2. **Quản lý sản phẩm** (`/staff/products`): CRUD sản phẩm
3. **Quản lý đơn hàng** (`/staff/orders`): Xử lý đơn hàng
4. **POS** (`/staff/pos`): Bán hàng tại quầy
5. **Bếp** (`/staff/kitchen`): Quản lý món ăn
6. **Bàn** (`/staff/tables`): Quản lý bàn ăn
7. **Báo cáo** (`/staff/reports`): Thống kê doanh thu
8. **Chatbot** (`/staff/chatbot-knowledge`): Quản lý kiến thức chatbot

## 5.3. CONTROLLER LAYER - LỚP ĐIỀU KHIỂN

### 5.3.1. Công nghệ sử dụng

**Framework:** Express.js 4.x
- RESTful API design
- Middleware architecture
- Route handling

**Language:** TypeScript 5.x
- Type safety
- Better IDE support
- Modern JavaScript features

### 5.3.2. Cấu trúc API Routes

Hệ thống có **30+ API routes** được tổ chức theo module:

```typescript
// server/src/index.ts - API Routes Registration

// Authentication & User Management
app.use('/api/auth', authRoutes)              // Đăng ký, đăng nhập, OTP
app.use('/api/addresses', addressesRoutes)    // Quản lý địa chỉ
app.use('/api/points', pointsRoutes)          // Điểm tích lũy

// Product Management
app.use('/api/products', productsRoutes)      // CRUD sản phẩm
app.use('/api/categories', categoriesRoutes)  // Danh mục sản phẩm
app.use('/api/reviews', reviewsRoutes)        // Đánh giá sản phẩm
app.use('/api/qa', qaRoutes)                  // Hỏi đáp sản phẩm

// Shopping & Orders
app.use('/api/cart', cartRoutes)              // Giỏ hàng
app.use('/api/wishlist', wishlistRoutes)      // Danh sách yêu thích
app.use('/api/checkout', checkoutRoutes)      // Thanh toán
app.use('/api/orders', ordersRoutes)          // Quản lý đơn hàng
app.use('/api/payment', paymentRoutes)        // Xử lý thanh toán
app.use('/api/shipping', shippingRoutes)      // Vận chuyển
app.use('/api/invoice', invoiceRoutes)        // Hóa đơn

// Promotions & Marketing
app.use('/api/promotions', promotionsRoutes)  // Khuyến mãi
app.use('/api/notifications', notificationsRoutes) // Thông báo
app.use('/api/push', pushRoutes)              // Push notifications

// Staff Operations
app.use('/api/pos', posRoutes)                // Point of Sale
app.use('/api/tables', tablesRoutes)          // Quản lý bàn
app.use('/api/kitchen', kitchenRoutes)        // Quản lý bếp
app.use('/api/shifts', shiftsRoutes)          // Ca làm việc

// Inventory & Stock
app.use('/api/stock-alerts', stockAlertsRoutes) // Cảnh báo tồn kho
app.use('/api/warehouse', warehouseRoutes)    // Quản lý kho

// Reports & Analytics
app.use('/api/reports', reportsRoutes)        // Báo cáo thống kê
app.use('/api/customers', customersRoutes)    // Quản lý khách hàng

// Communication
app.use('/api/chat', chatRoutes)              // Chat với nhân viên
app.use('/api/chatbot', chatbotRoutes)        // AI Chatbot
app.use('/api/chatbot-knowledge', chatbotKnowledgeRoutes) // Kiến thức chatbot

// System
app.use('/api/upload', uploadRoutes)          // Upload files
app.use('/api/settings', settingsRoutes)      // Cài đặt hệ thống
app.use('/api/admin', adminRoutes)            // Admin operations
```

### 5.3.3. Ví dụ Controller - Product Handler

```typescript
// server/src/routes/products.ts

import { Router } from 'express'
import { prisma } from '../db/prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Build where clause
    const where: any = { isActive: true }
    
    if (category) {
      where.categoryId = category
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number(minPrice)
      if (maxPrice) where.price.lte = Number(maxPrice)
    }

    // Fetch products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sort as string]: order },
        include: {
          category: true,
          reviews: {
            select: { rating: true }
          }
        }
      }),
      prisma.product.count({ where })
    ])

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /api/products - Tạo sản phẩm mới (Staff only)
router.post('/', authenticate, authorize(['STAFF', 'ADMIN']), async (req, res) => {
  try {
    const { name, description, price, categoryId, stock, images } = req.body

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        categoryId,
        stock: Number(stock),
        images,
        slug: name.toLowerCase().replace(/\s+/g, '-')
      }
    })

    res.status(201).json({ success: true, data: product })
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
```

### 5.3.4. Middleware Architecture

**Authentication Middleware:**
```typescript
// server/src/middleware/auth.ts

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, config.jwtSecret)
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId } 
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
```

**Security Middleware:**
```typescript
// server/src/middleware/security.ts

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

## 5.4. SERVICE LAYER - LỚP DỊCH VỤ

### 5.4.1. Các Service chính

**1. Auth Service** - Xác thực và phân quyền
```typescript
// server/src/services/auth.service.ts

export class AuthService {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  // Generate JWT token
  generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
  }

  // Verify OTP
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email }
    })

    if (!pending || pending.expiresAt < new Date()) {
      return false
    }

    return bcrypt.compare(otp, pending.otpHash)
  }
}
```

**2. Email Service** - Gửi email
```typescript
// server/src/services/email.service.ts

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    })
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Mã OTP xác thực tài khoản',
      html: `<p>Mã OTP của bạn là: <strong>${otp}</strong></p>`
    })
  }

  async sendOrderConfirmation(email: string, order: any): Promise<void> {
    // Send order confirmation email
  }
}
```

**3. Chatbot Service** - AI Chatbot với Gemini
```typescript
// server/src/services/chatbot.service.ts

import { GoogleGenerativeAI } from '@google/generative-ai'

export class ChatbotService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })
  }

  async processMessage(message: string, context: any): Promise<string> {
    // Search knowledge base first
    const knowledge = await this.searchKnowledge(message)
    
    if (knowledge) {
      return knowledge.answer
    }

    // Use Gemini AI if no knowledge found
    const prompt = this.buildPrompt(message, context)
    const result = await this.model.generateContent(prompt)
    return result.response.text()
  }

  private async searchKnowledge(query: string) {
    return prisma.chatbotKnowledge.findFirst({
      where: {
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { keywords: { has: query } }
        ],
        isActive: true
      }
    })
  }
}
```

**4. Cache Service** - Redis caching
```typescript
// server/src/services/cache.service.ts

import Redis from 'ioredis'

export class CacheService {
  private redis: Redis

  constructor() {
    this.redis = new Redis(config.redisUrl)
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }
}
```

**5. Socket Service** - Real-time communication
```typescript
// server/src/socket/index.ts

import { Server } from 'socket.io'

export const initializeSocketServer = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join room
    socket.on('join-room', (roomId) => {
      socket.join(roomId)
    })

    // Chat message
    socket.on('chat-message', async (data) => {
      // Save message to database
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: data.sessionId,
          message: data.message,
          senderId: data.userId
        }
      })

      // Broadcast to room
      io.to(data.sessionId).emit('new-message', message)
    })

    // Kitchen order update
    socket.on('kitchen-update', (data) => {
      io.emit('kitchen-order-update', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}
```

## 5.5. DATA ACCESS LAYER - LỚP TRUY CẬP DỮ LIỆU

### 5.5.1. Prisma ORM

**Schema Definition:**
```prisma
// server/prisma/schema.prisma

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  name          String
  role          UserRole @default(CUSTOMER)
  points        Int      @default(0)
  tier          String   @default("Bronze")
  totalSpent    Decimal  @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  orders        Order[]
  reviews       Review[]
  cartItems     CartItem[]
  addresses     Address[]
  chatSessions  ChatSession[]
}

model Product {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  description   String?
  price         Decimal
  originalPrice Decimal?
  stock         Int      @default(0)
  categoryId    String
  images        String[]
  rating        Decimal  @default(0)
  reviewCount   Int      @default(0)
  isActive      Boolean  @default(true)
  isFeatured    Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  category      Category @relation(fields: [categoryId], references: [id])
  reviews       Review[]
  cartItems     CartItem[]
  orderItems    OrderItem[]
}

model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique
  userId          String
  status          OrderStatus @default(PENDING)
  subtotal        Decimal
  shippingFee     Decimal     @default(0)
  discount        Decimal     @default(0)
  total           Decimal
  paymentMethod   String
  paymentStatus   String      @default("PENDING")
  shippingAddress String
  customerName    String
  customerEmail   String
  customerPhone   String
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
}
```

### 5.5.2. Database Operations

**Query Examples:**
```typescript
// Get products with filters
const products = await prisma.product.findMany({
  where: {
    categoryId: 'category-id',
    price: { gte: 100, lte: 500 },
    isActive: true
  },
  include: {
    category: true,
    reviews: {
      select: { rating: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0
})

// Create order with items (Transaction)
const order = await prisma.$transaction(async (tx) => {
  // Create order
  const newOrder = await tx.order.create({
    data: {
      userId,
      orderNumber: generateOrderNumber(),
      total,
      status: 'PENDING'
    }
  })

  // Create order items
  await tx.orderItem.createMany({
    data: items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }))
  })

  // Update product stock
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    })
  }

  return newOrder
})
```

## 5.6. TÍCH HỢP VÀ GIAO TIẾP

### 5.6.1. REST API Communication

**Client → Server:**
```typescript
// client/lib/api.ts

export const api = {
  // GET request
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    return response.json()
  },

  // POST request
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}
```

### 5.6.2. WebSocket Communication

**Real-time features:**
```typescript
// client/lib/socket.ts

import { io } from 'socket.io-client'

export const socket = io(SOCKET_URL, {
  auth: {
    token: getToken()
  }
})

// Listen for events
socket.on('new-message', (message) => {
  // Update UI with new message
})

socket.on('kitchen-order-update', (order) => {
  // Update kitchen display
})

// Emit events
socket.emit('chat-message', {
  sessionId,
  message,
  userId
})
```

## 5.7. BẢO MẬT VÀ HIỆU NĂNG

### 5.7.1. Security Features

1. **JWT Authentication**: Token-based authentication
2. **Password Hashing**: bcrypt với salt rounds = 10
3. **CORS Protection**: Whitelist origins
4. **Rate Limiting**: Giới hạn request/IP
5. **SQL Injection Prevention**: Prisma ORM parameterized queries
6. **XSS Protection**: Helmet.js security headers
7. **CSRF Protection**: CSRF tokens

### 5.7.2. Performance Optimization

1. **Redis Caching**: Cache frequently accessed data
2. **Database Indexing**: Index trên các trường thường query
3. **Pagination**: Limit kết quả trả về
4. **Image Optimization**: Next.js Image component
5. **Code Splitting**: Dynamic imports
6. **CDN**: Static assets delivery

## 5.8. KẾT LUẬN

Hệ thống NHH-Coffee được triển khai với kiến trúc 3 lớp rõ ràng, sử dụng các công nghệ hiện đại và best practices. Kiến trúc này đảm bảo:

- **Tính module hóa**: Dễ bảo trì và mở rộng
- **Hiệu năng cao**: Caching, indexing, optimization
- **Bảo mật tốt**: Authentication, authorization, encryption
- **Khả năng mở rộng**: Horizontal và vertical scaling
- **Real-time**: WebSocket cho chat và notifications

Hệ thống đã sẵn sàng phục vụ hàng nghìn người dùng đồng thời với độ tin cậy và hiệu năng cao.
