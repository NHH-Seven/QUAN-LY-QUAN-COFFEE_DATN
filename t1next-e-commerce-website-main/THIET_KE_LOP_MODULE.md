# THIẾT KẾ LỚP/MODULE HỆ THỐNG NHH-COFFEE

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
2. [Backend Modules](#backend-modules)
3. [Frontend Modules](#frontend-modules)
4. [Database Models](#database-models)
5. [Shared Types](#shared-types)
6. [Design Patterns](#design-patterns)

---

## 🏗️ TỔNG QUAN KIẾN TRÚC

### Kiến trúc phân lớp (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (Next.js Pages, Components, Contexts)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  (Express Routes, Middleware, Socket.io)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  (Services, Validators, Utilities)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   DATA ACCESS LAYER                          │
│  (Prisma ORM, Database Queries)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    DATABASE LAYER                            │
│  (PostgreSQL)                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 BACKEND MODULES

### 1. Configuration Module (`server/src/config/`)

**Mục đích**: Quản lý cấu hình ứng dụng

```typescript
// config/index.ts
export interface Config {
  port: number
  nodeEnv: string
  database: {
    url: string
  }
  jwt: {
    secret: string
    expiresIn: string
  }
  cors: {
    origin: string[]
    credentials: boolean
  }
  redis?: {
    url: string
  }
  email: {
    host: string
    port: number
    user: string
    pass: string
  }
  cloudinary: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }
}
```

**Trách nhiệm**:
- Load environment variables
- Validate configuration
- Provide typed config object
- Centralize all settings

---

### 2. Middleware Module (`server/src/middleware/`)


#### 2.1 Authentication Middleware

```typescript
// middleware/auth.ts
export interface AuthRequest extends Request {
  user?: JwtPayload
}

export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}

class AuthMiddleware {
  // Verify JWT token
  authenticate(req: AuthRequest, res: Response, next: NextFunction): void
  
  // Check user role
  authorize(...roles: UserRole[]): RequestHandler
  
  // Optional authentication (for guest + user endpoints)
  optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void
}
```

**Trách nhiệm**:
- Verify JWT tokens
- Extract user info from token
- Role-based access control
- Handle authentication errors

#### 2.2 Security Middleware

```typescript
// middleware/security.ts
class SecurityMiddleware {
  // Helmet security headers
  securityHeaders: RequestHandler
  
  // Additional security headers
  additionalSecurityHeaders: RequestHandler
  
  // CSRF protection
  csrfProtection: RequestHandler
}
```

#### 2.3 Rate Limiting Middleware

```typescript
// middleware/rate-limit.ts
interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
}

class RateLimiter {
  createLimiter(config: RateLimitConfig): RequestHandler
  
  // Predefined limiters
  static readonly authLimiter: RequestHandler
  static readonly apiLimiter: RequestHandler
  static readonly strictLimiter: RequestHandler
}
```

---

### 3. Services Module (`server/src/services/`)

#### 3.1 Cache Service

```typescript
// services/cache.service.ts
export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  delPattern(pattern: string): Promise<void>
  flush(): Promise<void>
  isConnected(): boolean
  disconnect(): Promise<void>
}

class RedisCacheService implements CacheService {
  private client: Redis | null
  private memoryFallback: MemoryCache
  private useMemoryFallback: boolean
  
  // Cache operations
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async del(key: string): Promise<void>
  async delPattern(pattern: string): Promise<void>
}

// Cache keys constants
export const CACHE_KEYS = {
  PRODUCTS_LIST: 'products:list',
  PRODUCT_DETAIL: (slug: string) => `product:${slug}`,
  CATEGORIES: 'categories:all',
  USER_CART: (userId: string) => `cart:${userId}`,
}

// TTL configuration
export const CACHE_TTL = {
  PRODUCTS_LIST: 300,      // 5 minutes
  PRODUCT_DETAIL: 600,     // 10 minutes
  CATEGORIES: 3600,        // 1 hour
}
```

**Design Pattern**: Singleton, Strategy (Redis/Memory fallback)

**Trách nhiệm**:
- Cache frequently accessed data
- Reduce database load
- Automatic fallback to memory cache
- TTL management

#### 3.2 Chatbot Service

```typescript
// services/chatbot.service.ts
interface ChatSession {
  id: string
  user_id: number | null
  guest_id: string | null
  status: string
  started_at: Date
  ended_at: Date | null
}

interface ChatMessage {
  id: string
  session_id: string
  sender_type: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  created_at: Date
}

class ChatbotService {
  // Session management
  async getOrCreateSession(userId?: number, guestId?: string): Promise<ChatSession>
  async closeSession(sessionId: string): Promise<void>
  
  // Message handling
  async handleMessage(
    message: string,
    userId?: number,
    guestId?: string,
    userName?: string
  ): Promise<{ response: string; sessionId: string }>
  
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ChatMessage>
  
  async getChatHistory(sessionId: string, limit?: number): Promise<ChatMessage[]>
  
  // Knowledge base
  async searchKnowledge(query: string): Promise<{ title: string; content: string } | null>
  
  // Intent handling
  private async handleProductInquiry(message: string, sessionId: string): Promise<string>
  private async handleOrderTracking(message: string, userId?: number): Promise<string>
  private async handlePurchaseIntent(message: string): Promise<string>
  
  // Utilities
  private extractKeywords(message: string): string[]
  private async searchProducts(keywords: string[]): Promise<Product[]>
  private async getPromotionalProducts(): Promise<Product[]>
  
  // Analytics
  async saveFeedback(sessionId: string, messageId: string, rating: number): Promise<void>
  async getAnalytics(startDate: Date, endDate: Date): Promise<Analytics>
}
```

**Design Pattern**: Facade, Strategy

**Trách nhiệm**:
- Manage chat sessions
- Process user messages
- Search knowledge base
- Integrate with Gemini AI
- Handle different intents
- Track analytics

#### 3.3 Email Service

```typescript
// services/email.service.ts
export interface EmailTemplate {
  subject: string
  html: string
}

export interface OrderEmailData {
  orderId: string
  recipientName: string
  items: OrderItem[]
  total: number
  shippingAddress: string
}

class EmailService {
  private transporter: Transporter
  
  // Core email sending
  async sendEmail(to: string, subject: string, html: string): Promise<void>
  
  // Template-based emails
  async sendWelcomeEmail(to: string, name: string): Promise<void>
  async sendOrderConfirmation(to: string, data: OrderEmailData): Promise<void>
  async sendOrderStatusUpdate(to: string, data: OrderStatusData): Promise<void>
  async sendPasswordReset(to: string, otp: string): Promise<void>
  async sendPromotionalEmail(to: string, data: PromotionalData): Promise<void>
  
  // OTP emails
  async sendOTP(to: string, otp: string, purpose: string): Promise<void>
}
```

**Design Pattern**: Template Method

**Trách nhiệm**:
- Send transactional emails
- Send promotional emails
- OTP delivery
- Email template rendering

#### 3.4 Notification Service

```typescript
// services/notification.service.ts
class NotificationService {
  private io: Server | null
  
  // Socket.io setup
  setSocketIO(socketIO: Server): void
  getSocketIO(): Server | null
  
  // Order notifications
  notifyOrderStatusChange(userId: string, order: Order): void
  notifyNewOrder(order: Order): void
  
  // Real-time updates
  notifyKitchenUpdate(kitchenItem: KitchenItem): void
  notifyTableUpdate(table: Table): void
  notifyStockAlert(product: Product): void
  
  // User notifications
  notifyNewReturn(returnRequest: ReturnRequest): void
}
```

**Design Pattern**: Observer

**Trách nhiệm**:
- Real-time notifications via Socket.io
- Broadcast to specific users/rooms
- Order status updates
- Kitchen/table updates

#### 3.5 Push Notification Service

```typescript
// services/push.service.ts
export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
}

class PushService {
  // Subscription management
  async saveSubscription(userId: string, subscription: PushSubscriptionData): Promise<void>
  async removeSubscription(endpoint: string): Promise<void>
  async getUserSubscriptions(userId: string): Promise<PushSubscriptionData[]>
  
  // Send notifications
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void>
  async sendToMultipleUsers(userIds: string[], payload: PushNotificationPayload): Promise<void>
  
  // Batch operations
  async sendBulkNotifications(notifications: Array<{
    userId: string
    payload: PushNotificationPayload
  }>): Promise<void>
}
```

**Design Pattern**: Facade

**Trách nhiệm**:
- Web Push notifications
- Subscription management
- Batch notification sending
- Handle failed deliveries

#### 3.6 Gemini AI Service

```typescript
// services/gemini.service.ts
interface ChatContext {
  sessionId: string
  userId?: number
  userName?: string
  previousMessages?: Array<{ role: string; content: string }>
  products?: Product[]
  orderInfo?: Order
}

class GeminiService {
  private model: GenerativeModel
  private sessions: Map<string, ChatSession>
  
  // Chat operations
  async chat(message: string, context: ChatContext): Promise<string>
  async chatWithContext(message: string, context: ChatContext): Promise<string>
  
  // Intent detection
  async detectIntent(message: string): Promise<{ intent: string; confidence: number }>
  
  // Session management
  clearSession(sessionId: string): void
  
  // Utilities
  private buildSystemPrompt(context: ChatContext): string
  private formatProductInfo(products: Product[]): string
}
```

**Design Pattern**: Singleton, Strategy

**Trách nhiệm**:
- Integrate with Google Gemini AI
- Manage conversation context
- Intent detection
- Generate contextual responses

---

### 4. Routes Module (`server/src/routes/`)

#### 4.1 Route Structure

```typescript
// routes/products.ts
class ProductRoutes {
  // Public routes
  GET    /api/products              // List products with filters
  GET    /api/products/:slug        // Get product detail
  GET    /api/products/:id/reviews  // Get product reviews
  GET    /api/products/:id/qa       // Get product Q&A
  
  // Protected routes (admin/staff)
  POST   /api/products              // Create product
  PUT    /api/products/:id          // Update product
  DELETE /api/products/:id          // Delete product
}

// routes/auth.ts
class AuthRoutes {
  POST   /api/auth/register         // Register with OTP
  POST   /api/auth/verify-otp       // Verify OTP
  POST   /api/auth/login            // Login
  POST   /api/auth/logout           // Logout
  GET    /api/auth/me               // Get current user
  POST   /api/auth/forgot-password  // Request password reset
  POST   /api/auth/reset-password   // Reset password with OTP
}

// routes/cart.ts
class CartRoutes {
  GET    /api/cart                  // Get user cart
  POST   /api/cart                  // Add to cart
  PUT    /api/cart/:id              // Update cart item
  DELETE /api/cart/:id              // Remove from cart
  DELETE /api/cart                  // Clear cart
}

// routes/orders.ts
class OrderRoutes {
  GET    /api/orders                // List user orders
  GET    /api/orders/:id            // Get order detail
  POST   /api/orders                // Create order
  PUT    /api/orders/:id/status     // Update order status (staff)
  POST   /api/orders/:id/cancel     // Cancel order
}
```

**Design Pattern**: Router Pattern, Controller Pattern

**Trách nhiệm**:
- Define API endpoints
- Request validation
- Route to appropriate handlers
- Response formatting

---

### 5. Socket Module (`server/src/socket/`)

```typescript
// socket/index.ts
export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload
}

class SocketServer {
  private io: Server
  
  // Initialize with authentication
  initializeSocketServer(httpServer: HttpServer): Server
  
  // Room management
  joinRoom(socket: Socket, room: string): void
  leaveRoom(socket: Socket, room: string): void
  
  // Emit helpers
  emitToUser(userId: string, event: string, data: unknown): void
  emitToStaff(event: string, data: unknown): void
  emitToRoom(room: string, event: string, data: unknown): void
  
  // Get instance
  getIO(): Server
}

// socket/chat.handler.ts
class ChatHandler {
  initializeChatHandlers(io: Server): void
  
  // Event handlers
  private handleChatMessage(socket: AuthenticatedSocket, data: ChatMessageData): void
  private handleTyping(socket: AuthenticatedSocket, data: TypingData): void
  private handleJoinChat(socket: AuthenticatedSocket, sessionId: string): void
  private handleLeaveChat(socket: AuthenticatedSocket, sessionId: string): void
}
```

**Design Pattern**: Observer, Mediator

**Trách nhiệm**:
- WebSocket connection management
- Real-time event handling
- Room-based broadcasting
- Authentication middleware

---

### 6. Validation Module (`server/src/validations/`)

```typescript
// validations/auth.validation.ts
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// validations/common.ts
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  search: z.string().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).optional(),
})
```

**Design Pattern**: Validator Pattern

**Trách nhiệm**:
- Input validation
- Type safety
- Error messages
- Schema reusability

---

## 🎨 FRONTEND MODULES

### 1. Context Modules (`client/contexts/`)

#### 1.1 Auth Context

```typescript
// contexts/auth-context.tsx
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<RegisterResult>
  logout: () => void
  refreshUser: () => Promise<void>
}

class AuthProvider extends React.Component {
  state: {
    user: User | null
    isLoading: boolean
  }
  
  // Lifecycle
  componentDidMount(): void  // Load from localStorage
  
  // Methods
  login(email: string, password: string): Promise<boolean>
  register(email: string, password: string, name: string): Promise<RegisterResult>
  logout(): void
  refreshUser(): Promise<void>
}
```

**Design Pattern**: Context API, Provider Pattern

**Trách nhiệm**:
- Global authentication state
- Login/logout operations
- Session persistence
- User data management

#### 1.2 Cart Context

```typescript
// contexts/cart-context.tsx
interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => Promise<Result>
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => Promise<Result>
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isInCart: (productId: string) => boolean
  isLoading: boolean
  appliedPromotion: AppliedPromotion | null
  setAppliedPromotion: (promo: AppliedPromotion | null) => void
}

class CartProvider extends React.Component {
  state: {
    items: CartItem[]
    isLoading: boolean
    appliedPromotion: AppliedPromotion | null
  }
  
  // Sync with server
  syncWithServer(): Promise<void>
  
  // Cart operations
  addItem(product: Product, quantity: number): Promise<Result>
  removeItem(productId: string): void
  updateQuantity(productId: string, quantity: number): Promise<Result>
  clearCart(): void
}
```

**Design Pattern**: Context API, Optimistic UI

**Trách nhiệm**:
- Global cart state
- Server synchronization
- Optimistic updates
- LocalStorage persistence

#### 1.3 Wishlist Context

```typescript
// contexts/wishlist-context.tsx
interface WishlistContextType {
  items: Product[]
  addItem: (product: Product) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  isLoading: boolean
}
```

#### 1.4 Compare Context

```typescript
// contexts/compare-context.tsx
interface CompareContextType {
  items: Product[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearAll: () => void
  isInCompare: (productId: string) => boolean
  maxItems: number
}
```

#### 1.5 Chat Context

```typescript
// contexts/chat-context.tsx
interface ChatContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  unreadCount: number
  setUnreadCount: (count: number) => void
}
```

---

### 2. Component Modules (`client/components/`)

#### 2.1 UI Components (`components/ui/`)

**Atomic Design Pattern**

```typescript
// Atoms
Button, Input, Label, Badge, Avatar, Skeleton

// Molecules
Card, Dialog, DropdownMenu, Select, Tabs, Toast

// Organisms
Table, Form, Navigation, Sidebar
```

#### 2.2 Feature Components

```typescript
// components/product/
ProductCard              // Display product in grid
ProductDetail            // Full product page
ProductFilters           // Filter sidebar
ProductReviews           // Reviews section
ProductQA                // Q&A section
RelatedProducts          // Related products carousel
CompareButton            // Add to compare
CompareBar               // Floating compare bar

// components/cart/
CartContent              // Cart items list
CartSummary              // Price summary
CartItem                 // Single cart item

// components/checkout/
CheckoutForm             // Checkout process
PaymentMethods           // Payment selection
ShippingForm             // Shipping info

// components/admin/
AdminSidebar             // Admin navigation
AdminHeader              // Admin header
StatsCard                // Dashboard stats
RecentOrdersTable        // Orders table
LowStockAlert            // Stock alerts
ProductForm              // Product CRUD form

// components/chatbot/
AIChatWidget             // AI chatbot button
AIChatWindow             // Chat interface
ChatModeSelector         // AI/Human toggle
UnifiedChatWidget        // Combined chat

// components/notifications/
NotificationBell         // Notification icon
NotificationListener     // Real-time listener
NotificationsContent     // Notification list
```

**Design Pattern**: Component Composition, Container/Presentational

---

### 3. Hooks Module (`client/hooks/`)

```typescript
// hooks/use-admin-guard.ts
export function useAdminGuard(): void

// hooks/use-staff-guard.ts
export function useStaffGuard(): void

// hooks/use-role-guard.ts
export function useRoleGuard(allowedRoles: UserRole[]): void

// hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T

// hooks/use-search.ts
export function useSearch(initialQuery: string): {
  query: string
  setQuery: (q: string) => void
  debouncedQuery: string
  results: Product[]
  isLoading: boolean
}

// hooks/use-toast.ts
export function useToast(): {
  toast: (options: ToastOptions) => void
  dismiss: (id: string) => void
}

// hooks/use-order-notifications.ts
export function useOrderNotifications(): void

// hooks/use-push-notification.ts
export function usePushNotification(): {
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  isSubscribed: boolean
}
```

**Design Pattern**: Custom Hooks Pattern

**Trách nhiệm**:
- Reusable logic
- Side effects management
- State management
- API integration

---

### 4. API Client Module (`client/lib/api.ts`)

```typescript
// lib/api.ts
export class ApiError extends Error {
  statusCode: number
  validationErrors?: ValidationError[]
  retryAfter?: number
}

class ApiClient {
  private baseURL: string
  private token: string | null
  
  // Core methods
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>>
  
  // Auth
  async login(email: string, password: string): Promise<AuthResponse>
  async register(email: string, password: string, name: string): Promise<Response>
  async verifyOTP(email: string, otp: string): Promise<AuthResponse>
  async logout(): Promise<void>
  async getMe(): Promise<UserResponse>
  
  // Products
  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>>
  async getProduct(slug: string): Promise<Product>
  
  // Cart
  async getCart(): Promise<CartItem[]>
  async addToCart(productId: string, quantity: number): Promise<CartItem>
  async updateCartItem(itemId: string, quantity: number): Promise<CartItem>
  async removeFromCart(itemId: string): Promise<void>
  async clearCart(): Promise<void>
  
  // Orders
  async createOrder(data: CreateOrderInput): Promise<Order>
  async getOrders(): Promise<Order[]>
  async getOrder(id: string): Promise<Order>
  
  // Wishlist
  async getWishlist(): Promise<Product[]>
  async addToWishlist(productId: string): Promise<void>
  async removeFromWishlist(productId: string): Promise<void>
  
  // Reviews
  async createReview(productId: string, data: ReviewInput): Promise<Review>
  async getReviews(productId: string): Promise<Review[]>
  
  // Chatbot
  async sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse>
  
  // Token management
  setToken(token: string): void
  clearToken(): void
}

export const api = new ApiClient()
```

**Design Pattern**: Singleton, Facade

**Trách nhiệm**:
- HTTP client wrapper
- Token management
- Error handling
- Request/response transformation

---

## 💾 DATABASE MODELS

### Prisma Schema Overview

```prisma
// Core Models
model User {
  id: String
  email: String @unique
  password: String
  name: String
  role: UserRole
  // Relations
  orders: Order[]
  reviews: Review[]
  cartItems: CartItem[]
  wishlist: Wishlist[]
  notifications: Notification[]
}

model Product {
  id: String
  name: String
  slug: String @unique
  price: Decimal
  stock: Int
  categoryId: String
  // Relations
  category: Category
  orderItems: OrderItem[]
  reviews: Review[]
  cartItems: CartItem[]
}

model Order {
  id: String
  userId: String
  total: Decimal
  status: OrderStatus
  // Relations
  user: User
  orderItems: OrderItem[]
}

model Category {
  id: String
  name: String
  slug: String @unique
  // Relations
  products: Product[]
}

// Enums
enum UserRole {
  user
  admin
  sales
  warehouse
}

enum OrderStatus {
  pending
  awaiting_payment
  confirmed
  shipping
  delivered
  cancelled
}
```

---

## 🔄 SHARED TYPES

### Common Interfaces

```typescript
// types/index.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  images: string[]
  description: string
  categoryId: string
  brand: string
  stock: number
  rating: number
  reviewCount: number
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  phone?: string
  address?: string
}

export interface Order {
  id: string
  userId: string
  total: number
  status: OrderStatus
  items: OrderItem[]
  shippingAddress: string
  createdAt: string
}
```

---

## 🎯 DESIGN PATTERNS SUMMARY

### 1. **Singleton Pattern**
- `CacheService`: Single Redis/Memory cache instance
- `ApiClient`: Single HTTP client instance
- `GeminiService`: Single AI service instance

### 2. **Factory Pattern**
- Email template generation
- Notification creation

### 3. **Strategy Pattern**
- Cache strategy (Redis vs Memory)
- Payment methods
- Shipping methods

### 4. **Observer Pattern**
- Socket.io event system
- React Context subscriptions
- Notification system

### 5. **Facade Pattern**
- `ApiClient`: Simplifies HTTP requests
- `ChatbotService`: Simplifies AI integration
- `PushService`: Simplifies web push

### 6. **Repository Pattern**
- Prisma ORM abstracts database access
- Service layer abstracts business logic

### 7. **Middleware Pattern**
- Express middleware chain
- Authentication/Authorization
- Request validation

### 8. **Provider Pattern**
- React Context Providers
- Dependency injection

### 9. **Decorator Pattern**
- Route decorators (authentication, validation)
- Component HOCs

### 10. **Template Method Pattern**
- Email templates
- Report generation

---

## 📊 MODULE DEPENDENCY GRAPH

```
┌─────────────┐
│   Routes    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Services   │────▶│  Validators  │
└──────┬──────┘     └──────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Database   │────▶│    Prisma    │
└─────────────┘     └──────────────┘
```

---

**Ngày tạo**: 26/01/2026  
**Phiên bản**: 1.0.0  
**Tác giả**: NHH-Coffee Development Team


---

## 📐 BIỂU ĐỒ LỚP CHI TIẾT (UML CLASS DIAGRAMS)

### 1. Domain Model Classes

#### 1.1 User Domain

```
┌─────────────────────────────────────────────────────────────────┐
│                            User                                  │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - email: string                                                  │
│ - password: string                                               │
│ - name: string                                                   │
│ - avatar: string?                                                │
│ - phone: string?                                                 │
│ - address: string?                                               │
│ - role: UserRole                                                 │
│ - points: number                                                 │
│ - tier: string                                                   │
│ - totalSpent: Decimal                                            │
│ - orderCount: number                                             │
│ - isActive: boolean                                              │
│ - createdAt: Date                                                │
├─────────────────────────────────────────────────────────────────┤
│ + register(email, password, name): Promise<User>                 │
│ + login(email, password): Promise<AuthToken>                     │
│ + updateProfile(data: UpdateUserDto): Promise<User>              │
│ + changePassword(oldPass, newPass): Promise<void>                │
│ + addPoints(points: number): void                                │
│ + updateTier(): void                                             │
│ + canAccessResource(resource: string): boolean                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has many
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Order                                  │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - userId: string                                                 │
│ - total: Decimal                                                 │
│ - subtotal: Decimal                                              │
│ - shippingFee: Decimal                                           │
│ - discountAmount: Decimal                                        │
│ - status: OrderStatus                                            │
│ - shippingAddress: string                                        │
│ - recipientName: string                                          │
│ - phone: string                                                  │
│ - paymentMethod: string                                          │
│ - promotionId: string?                                           │
│ - trackingCode: string?                                          │
│ - note: string?                                                  │
│ - createdAt: Date                                                │
├─────────────────────────────────────────────────────────────────┤
│ + create(data: CreateOrderDto): Promise<Order>                   │
│ + updateStatus(status: OrderStatus): Promise<void>               │
│ + cancel(reason: string): Promise<void>                          │
│ + calculateTotal(): Decimal                                      │
│ + applyPromotion(promo: Promotion): void                         │
│ + canBeCancelled(): boolean                                      │
│ + getStatusHistory(): OrderStatusHistory[]                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has many
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         OrderItem                                │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - orderId: string                                                │
│ - productId: string                                              │
│ - quantity: number                                               │
│ - price: Decimal                                                 │
├─────────────────────────────────────────────────────────────────┤
│ + calculateSubtotal(): Decimal                                   │
│ + getProduct(): Promise<Product>                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2 Product Domain

```
┌─────────────────────────────────────────────────────────────────┐
│                          Category                                │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - name: string                                                   │
│ - slug: string                                                   │
│ - icon: string?                                                  │
│ - description: string?                                           │
│ - productCount: number                                           │
│ - createdAt: Date                                                │
├─────────────────────────────────────────────────────────────────┤
│ + create(data: CreateCategoryDto): Promise<Category>             │
│ + update(data: UpdateCategoryDto): Promise<Category>             │
│ + delete(): Promise<void>                                        │
│ + getProducts(filters?: ProductFilters): Promise<Product[]>      │
│ + updateProductCount(): Promise<void>                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has many
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Product                                 │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - name: string                                                   │
│ - slug: string                                                   │
│ - description: string?                                           │
│ - price: Decimal                                                 │
│ - originalPrice: Decimal?                                        │
│ - images: string[]                                               │
│ - categoryId: string                                             │
│ - brand: string?                                                 │
│ - specs: JSON                                                    │
│ - stock: number                                                  │
│ - rating: Decimal                                                │
│ - reviewCount: number                                            │
│ - isNew: boolean                                                 │
│ - isFeatured: boolean                                            │
│ - discount: number                                               │
│ - lowStockThreshold: number                                      │
│ - createdAt: Date                                                │
├─────────────────────────────────────────────────────────────────┤
│ + create(data: CreateProductDto): Promise<Product>               │
│ + update(data: UpdateProductDto): Promise<Product>               │
│ + delete(): Promise<void>                                        │
│ + updateStock(quantity: number, type: StockType): Promise<void>  │
│ + addReview(review: Review): Promise<void>                       │
│ + updateRating(): Promise<void>                                  │
│ + isInStock(): boolean                                           │
│ + isLowStock(): boolean                                          │
│ + getDiscountedPrice(): Decimal                                  │
│ + getCategory(): Promise<Category>                               │
│ + getReviews(limit?: number): Promise<Review[]>                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has many
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Review                                 │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - userId: string                                                 │
│ - productId: string                                              │
│ - rating: number                                                 │
│ - comment: string?                                               │
│ - images: ReviewImage[]                                          │
│ - createdAt: Date                                                │
├─────────────────────────────────────────────────────────────────┤
│ + create(data: CreateReviewDto): Promise<Review>                 │
│ + update(data: UpdateReviewDto): Promise<Review>                 │
│ + delete(): Promise<void>                                        │
│ + addImages(images: string[]): Promise<void>                     │
│ + getUser(): Promise<User>                                       │
│ + getProduct(): Promise<Product>                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3 Cart & Wishlist Domain

```
┌─────────────────────────────────────────────────────────────────┐
│                          CartItem                                │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - userId: string                                                 │
│ - productId: string                                              │
│ - quantity: number                                               │
│ - createdAt: Date                                                │
├─────────────────────────────────────────────────────────────────┤
│ + add(productId: string, quantity: number): Promise<CartItem>    │
│ + updateQuantity(quantity: number): Promise<CartItem>            │
│ + remove(): Promise<void>                                        │
│ + getProduct(): Promise<Product>                                 │
│ + getSubtotal(): Promise<Decimal>                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Wishlist                                 │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                     │
│ - userId: string                                                 │
│ - productId: string                                              │
│ - createdAt: Date                                                │
├─────────────────────────────────────────────────────────────────┤
│ + add(productId: string): Promise<Wishlist>                      │
│ + remove(): Promise<void>                                        │
│ + getProduct(): Promise<Product>                                 │
│ + isProductOnSale(): Promise<boolean>                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Service Layer Classes

#### 2.1 Cache Service

```
┌─────────────────────────────────────────────────────────────────┐
│                    <<interface>>                                 │
│                     CacheService                                 │
├─────────────────────────────────────────────────────────────────┤
│ + get<T>(key: string): Promise<T | null>                         │
│ + set<T>(key, value, ttl?): Promise<void>                        │
│ + del(key: string): Promise<void>                                │
│ + delPattern(pattern: string): Promise<void>                     │
│ + flush(): Promise<void>                                         │
│ + isConnected(): boolean                                         │
│ + disconnect(): Promise<void>                                    │
└─────────────────────────────────────────────────────────────────┘
                              △
                              │ implements
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                                                                  │
│                                                                  │
┌─────────────────────────────▼───────────────────────────────────┐
│                   RedisCacheService                              │
├─────────────────────────────────────────────────────────────────┤
│ - client: Redis | null                                           │
│ - memoryFallback: MemoryCache                                    │
│ - useMemoryFallback: boolean                                     │
│ - connected: boolean                                             │
├─────────────────────────────────────────────────────────────────┤
│ - initRedis(): void                                              │
│ + get<T>(key: string): Promise<T | null>                         │
│ + set<T>(key, value, ttl): Promise<void>                         │
│ + del(key: string): Promise<void>                                │
│ + delPattern(pattern: string): Promise<void>                     │
│ + flush(): Promise<void>                                         │
│ + isConnected(): boolean                                         │
│ + disconnect(): Promise<void>                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MemoryCache                                │
├─────────────────────────────────────────────────────────────────┤
│ - cache: Map<string, MemoryCacheEntry>                           │
│ - cleanupInterval: NodeJS.Timeout | null                         │
├─────────────────────────────────────────────────────────────────┤
│ + get<T>(key: string): Promise<T | null>                         │
│ + set<T>(key, value, ttl): Promise<void>                         │
│ + del(key: string): Promise<void>                                │
│ + delPattern(pattern: string): Promise<void>                     │
│ + flush(): Promise<void>                                         │
│ - cleanup(): void                                                │
│ + destroy(): void                                                │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Chatbot Service

```
┌─────────────────────────────────────────────────────────────────┐
│                      ChatbotService                              │
├─────────────────────────────────────────────────────────────────┤
│ - geminiService: GeminiService                                   │
├─────────────────────────────────────────────────────────────────┤
│ + getOrCreateSession(userId?, guestId?): Promise<ChatSession>    │
│ + saveMessage(sessionId, role, content, metadata?): Promise<Msg> │
│ + getChatHistory(sessionId, limit?): Promise<ChatMessage[]>      │
│ + searchKnowledge(query: string): Promise<Knowledge | null>      │
│ + handleMessage(message, userId?, guestId?, userName?): Promise  │
│ - handleProductInquiry(message, sessionId, history): Promise     │
│ - handleOrderTracking(message, userId, sessionId, history): Prom │
│ - handlePurchaseIntent(message, sessionId, history): Promise     │
│ - searchProducts(keywords: string[]): Promise<Product[]>         │
│ - getOrderInfo(orderId, userId?): Promise<Order | null>          │
│ - extractKeywords(message: string): string[]                     │
│ - getPromotionalProducts(): Promise<Product[]>                   │
│ + closeSession(sessionId: string): Promise<void>                 │
│ + saveFeedback(sessionId, messageId, rating, feedback?): Promise │
│ + getAnalytics(startDate, endDate): Promise<Analytics>           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       GeminiService                              │
├─────────────────────────────────────────────────────────────────┤
│ - model: GenerativeModel                                         │
│ - sessions: Map<string, ChatSession>                             │
├─────────────────────────────────────────────────────────────────┤
│ + chat(message, options): Promise<string>                        │
│ + chatWithContext(message, context): Promise<string>             │
│ + detectIntent(message): Promise<{intent, confidence}>           │
│ + clearSession(sessionId: string): void                          │
│ - buildSystemPrompt(context): string                             │
│ - formatProductInfo(products): string                            │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3 Email Service

```
┌─────────────────────────────────────────────────────────────────┐
│                        EmailService                              │
├─────────────────────────────────────────────────────────────────┤
│ - transporter: Transporter                                       │
│ - templates: Map<string, EmailTemplate>                          │
├─────────────────────────────────────────────────────────────────┤
│ + sendEmail(to, subject, html): Promise<void>                    │
│ + sendOTP(to, otp, name): Promise<void>                          │
│ + sendPasswordReset(to, otp): Promise<void>                      │
│ + sendOrderConfirmation(to, order): Promise<void>                │
│ + sendOrderStatusUpdate(to, order, status): Promise<void>        │
│ + sendWelcomeEmail(to, name): Promise<void>                      │
│ + sendPromotionalEmail(to, data): Promise<void>                  │
│ - loadTemplate(name: string): string                             │
│ - renderTemplate(template, data): string                         │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.4 Notification Service

```
┌─────────────────────────────────────────────────────────────────┐
│                    NotificationService                           │
├─────────────────────────────────────────────────────────────────┤
│ - io: Server | null                                              │
│ - pushService: PushService                                       │
├─────────────────────────────────────────────────────────────────┤
│ + setSocketIO(io: Server): void                                  │
│ + getSocketIO(): Server | null                                   │
│ + create(userId, type, title, message, data?): Promise<Notif>    │
│ + notifyOrderStatus(userId, orderId, status): void               │
│ + notifyNewOrder(orderId, orderData): void                       │
│ + notifyLowStock(productId, productName, stock): void            │
│ + notifyKitchenUpdate(kitchenItem): void                         │
│ + notifyTableUpdate(table): void                                 │
│ + markAsRead(notificationId): Promise<void>                      │
│ + markAllAsRead(userId): Promise<void>                           │
│ - emitToUser(userId, event, data): void                          │
│ - emitToStaff(event, data): void                                 │
│ - emitToRoom(room, event, data): void                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PushService                               │
├─────────────────────────────────────────────────────────────────┤
│ - vapidKeys: { publicKey, privateKey }                           │
├─────────────────────────────────────────────────────────────────┤
│ + subscribe(userId, subscription): Promise<void>                 │
│ + unsubscribe(userId, endpoint): Promise<void>                   │
│ + sendNotification(userId, payload): Promise<void>               │
│ + sendToAll(payload): Promise<void>                              │
│ - getUserSubscriptions(userId): Promise<Subscription[]>          │
│ - sendToSubscription(subscription, payload): Promise<void>       │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Controller Layer Classes

```
┌─────────────────────────────────────────────────────────────────┐
│                      AuthController                              │
├─────────────────────────────────────────────────────────────────┤
│ + register(req, res): Promise<Response>                          │
│ + verifyOTP(req, res): Promise<Response>                         │
│ + login(req, res): Promise<Response>                             │
│ + logout(req, res): Promise<Response>                            │
│ + getMe(req, res): Promise<Response>                             │
│ + forgotPassword(req, res): Promise<Response>                    │
│ + resetPassword(req, res): Promise<Response>                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ProductController                             │
├─────────────────────────────────────────────────────────────────┤
│ + getProducts(req, res): Promise<Response>                       │
│ + getProduct(req, res): Promise<Response>                        │
│ + searchProducts(req, res): Promise<Response>                    │
│ + createProduct(req, res): Promise<Response>                     │
│ + updateProduct(req, res): Promise<Response>                     │
│ + deleteProduct(req, res): Promise<Response>                     │
│ + getProductReviews(req, res): Promise<Response>                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     OrderController                              │
├─────────────────────────────────────────────────────────────────┤
│ + getOrders(req, res): Promise<Response>                         │
│ + getOrder(req, res): Promise<Response>                          │
│ + createOrder(req, res): Promise<Response>                       │
│ + updateOrderStatus(req, res): Promise<Response>                 │
│ + cancelOrder(req, res): Promise<Response>                       │
│ + getAllOrders(req, res): Promise<Response>                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CartController                              │
├─────────────────────────────────────────────────────────────────┤
│ + getCart(req, res): Promise<Response>                           │
│ + addToCart(req, res): Promise<Response>                         │
│ + updateCartItem(req, res): Promise<Response>                    │
│ + removeFromCart(req, res): Promise<Response>                    │
│ + clearCart(req, res): Promise<Response>                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ChatbotController                             │
├─────────────────────────────────────────────────────────────────┤
│ + sendMessage(req, res): Promise<Response>                       │
│ + getChatHistory(req, res): Promise<Response>                    │
│ + closeSession(req, res): Promise<Response>                      │
│ + submitFeedback(req, res): Promise<Response>                    │
│ + getKnowledge(req, res): Promise<Response>                      │
│ + createKnowledge(req, res): Promise<Response>                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Middleware Classes

```
┌─────────────────────────────────────────────────────────────────┐
│                    AuthMiddleware                                │
├─────────────────────────────────────────────────────────────────┤
│ + authenticate(req, res, next): void                             │
│ + authorize(...roles): RequestHandler                            │
│ + optionalAuth(req, res, next): void                             │
│ - verifyToken(token: string): JwtPayload                         │
│ - extractToken(req: Request): string | null                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   SecurityMiddleware                             │
├─────────────────────────────────────────────────────────────────┤
│ + securityHeaders: RequestHandler                                │
│ + corsConfig: CorsOptions                                        │
│ + csrfProtection: RequestHandler                                 │
│ + sanitizeInput(req, res, next): void                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    RateLimitMiddleware                           │
├─────────────────────────────────────────────────────────────────┤
│ + apiLimiter: RequestHandler                                     │
│ + authLimiter: RequestHandler                                    │
│ + strictLimiter: RequestHandler                                  │
│ + createLimiter(config): RequestHandler                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  ValidationMiddleware                            │
├─────────────────────────────────────────────────────────────────┤
│ + validate(schema: ZodSchema): RequestHandler                    │
│ + validateBody(schema: ZodSchema): RequestHandler                │
│ + validateQuery(schema: ZodSchema): RequestHandler               │
│ + validateParams(schema: ZodSchema): RequestHandler              │
└─────────────────────────────────────────────────────────────────┘
```


### 5. Frontend Context Classes

```
┌─────────────────────────────────────────────────────────────────┐
│                       AuthContext                                │
├─────────────────────────────────────────────────────────────────┤
│ - user: User | null                                              │
│ - isAuthenticated: boolean                                       │
│ - isLoading: boolean                                             │
│ - token: string | null                                           │
├─────────────────────────────────────────────────────────────────┤
│ + login(email, password): Promise<boolean>                       │
│ + register(email, password, name): Promise<RegisterResult>       │
│ + logout(): void                                                 │
│ + refreshUser(): Promise<void>                                   │
│ + updateProfile(data): Promise<User>                             │
│ - loadFromStorage(): void                                        │
│ - saveToStorage(): void                                          │
│ - clearStorage(): void                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CartContext                                │
├─────────────────────────────────────────────────────────────────┤
│ - items: CartItem[]                                              │
│ - isLoading: boolean                                             │
│ - appliedPromotion: AppliedPromotion | null                      │
├─────────────────────────────────────────────────────────────────┤
│ + addItem(product, quantity): Promise<Result>                    │
│ + removeItem(productId): void                                    │
│ + updateQuantity(productId, quantity): Promise<Result>           │
│ + clearCart(): void                                              │
│ + isInCart(productId): boolean                                   │
│ + setAppliedPromotion(promo): void                               │
│ + getTotalItems(): number                                        │
│ + getTotalPrice(): number                                        │
│ - syncWithServer(): Promise<void>                                │
│ - loadFromStorage(): void                                        │
│ - saveToStorage(): void                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     WishlistContext                              │
├─────────────────────────────────────────────────────────────────┤
│ - items: Product[]                                               │
│ - isLoading: boolean                                             │
├─────────────────────────────────────────────────────────────────┤
│ + addItem(product): Promise<void>                                │
│ + removeItem(productId): Promise<void>                           │
│ + toggleWishlist(product): Promise<void>                         │
│ + isInWishlist(productId): boolean                               │
│ - syncWithServer(): Promise<void>                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     CompareContext                               │
├─────────────────────────────────────────────────────────────────┤
│ - items: Product[]                                               │
│ - maxItems: number                                               │
├─────────────────────────────────────────────────────────────────┤
│ + addItem(product): void                                         │
│ + removeItem(productId): void                                    │
│ + clearAll(): void                                               │
│ + isInCompare(productId): boolean                                │
│ + canAddMore(): boolean                                          │
│ + getComparisonData(): ComparisonData                            │
│ - loadFromStorage(): void                                        │
│ - saveToStorage(): void                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       ChatContext                                │
├─────────────────────────────────────────────────────────────────┤
│ - isOpen: boolean                                                │
│ - unreadCount: number                                            │
│ - currentMode: 'ai' | 'human'                                    │
│ - sessionId: string | null                                       │
├─────────────────────────────────────────────────────────────────┤
│ + openChat(): void                                               │
│ + closeChat(): void                                              │
│ + toggleChat(): void                                             │
│ + setUnreadCount(count): void                                    │
│ + switchMode(mode): void                                         │
│ + setSessionId(id): void                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Component Classes (React)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ProductCard                                 │
├─────────────────────────────────────────────────────────────────┤
│ Props:                                                           │
│ - product: Product                                               │
│ - onAddToCart?: (product) => void                                │
│ - onAddToWishlist?: (product) => void                            │
│ - onAddToCompare?: (product) => void                             │
├─────────────────────────────────────────────────────────────────┤
│ + render(): JSX.Element                                          │
│ - handleAddToCart(): void                                        │
│ - handleAddToWishlist(): void                                    │
│ - handleAddToCompare(): void                                     │
│ - getDiscountPercentage(): number                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     ProductDetail                                │
├─────────────────────────────────────────────────────────────────┤
│ Props:                                                           │
│ - product: Product                                               │
│ - reviews: Review[]                                              │
│ - relatedProducts: Product[]                                     │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                           │
│ - selectedImage: number                                          │
│ - quantity: number                                               │
│ - selectedTab: string                                            │
├─────────────────────────────────────────────────────────────────┤
│ + render(): JSX.Element                                          │
│ - handleImageSelect(index): void                                 │
│ - handleQuantityChange(qty): void                                │
│ - handleAddToCart(): void                                        │
│ - handleBuyNow(): void                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CartContent                                 │
├─────────────────────────────────────────────────────────────────┤
│ Props:                                                           │
│ - items: CartItem[]                                              │
│ - onUpdateQuantity: (id, qty) => void                            │
│ - onRemoveItem: (id) => void                                     │
│ - onClearCart: () => void                                        │
├─────────────────────────────────────────────────────────────────┤
│ + render(): JSX.Element                                          │
│ - calculateSubtotal(): number                                    │
│ - calculateTotal(): number                                       │
│ - handleCheckout(): void                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     CheckoutForm                                 │
├─────────────────────────────────────────────────────────────────┤
│ Props:                                                           │
│ - cartItems: CartItem[]                                          │
│ - onSuccess: (order) => void                                     │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                           │
│ - formData: CheckoutFormData                                     │
│ - isSubmitting: boolean                                          │
│ - errors: ValidationErrors                                       │
├─────────────────────────────────────────────────────────────────┤
│ + render(): JSX.Element                                          │
│ - handleInputChange(field, value): void                          │
│ - validateForm(): boolean                                        │
│ - handleSubmit(): Promise<void>                                  │
│ - calculateShipping(): number                                    │
│ - applyPromotion(code): Promise<void>                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      AIChatWindow                                │
├─────────────────────────────────────────────────────────────────┤
│ Props:                                                           │
│ - isOpen: boolean                                                │
│ - onClose: () => void                                            │
│ - mode: 'ai' | 'human'                                           │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                           │
│ - messages: ChatMessage[]                                        │
│ - inputValue: string                                             │
│ - isLoading: boolean                                             │
│ - sessionId: string | null                                       │
├─────────────────────────────────────────────────────────────────┤
│ + render(): JSX.Element                                          │
│ - handleSendMessage(): Promise<void>                             │
│ - handleInputChange(value): void                                 │
│ - scrollToBottom(): void                                         │
│ - loadChatHistory(): Promise<void>                               │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Utility Classes

```
┌─────────────────────────────────────────────────────────────────┐
│                        ApiClient                                 │
├─────────────────────────────────────────────────────────────────┤
│ - baseURL: string                                                │
│ - token: string | null                                           │
│ - defaultHeaders: Headers                                        │
├─────────────────────────────────────────────────────────────────┤
│ + setToken(token): void                                          │
│ + clearToken(): void                                             │
│ + get<T>(endpoint, options?): Promise<T>                         │
│ + post<T>(endpoint, data, options?): Promise<T>                  │
│ + put<T>(endpoint, data, options?): Promise<T>                   │
│ + delete<T>(endpoint, options?): Promise<T>                      │
│ - request<T>(endpoint, options): Promise<T>                      │
│ - handleResponse<T>(response): Promise<T>                        │
│ - handleError(error): never                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SocketClient                                │
├─────────────────────────────────────────────────────────────────┤
│ - socket: Socket | null                                          │
│ - listeners: Map<string, Function[]>                             │
├─────────────────────────────────────────────────────────────────┤
│ + connect(token): void                                           │
│ + disconnect(): void                                             │
│ + emit(event, data): void                                        │
│ + on(event, callback): void                                      │
│ + off(event, callback): void                                     │
│ + joinRoom(room): void                                           │
│ + leaveRoom(room): void                                          │
│ - setupDefaultListeners(): void                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      StorageManager                              │
├─────────────────────────────────────────────────────────────────┤
│ + get<T>(key): T | null                                          │
│ + set<T>(key, value): void                                       │
│ + remove(key): void                                              │
│ + clear(): void                                                  │
│ + has(key): boolean                                              │
│ - serialize<T>(value): string                                    │
│ - deserialize<T>(value): T                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ValidationHelper                            │
├─────────────────────────────────────────────────────────────────┤
│ + validateEmail(email): boolean                                  │
│ + validatePassword(password): ValidationResult                   │
│ + validatePhone(phone): boolean                                  │
│ + sanitizeInput(input): string                                   │
│ + formatCurrency(amount): string                                 │
│ + formatDate(date): string                                       │
│ + slugify(text): string                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 8. Class Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  CLASS RELATIONSHIPS OVERVIEW                    │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │ 1
                           │
                           │ has many
                           │
                    ┌──────▼───────┐
                    │    Order     │
                    └──────┬───────┘
                           │ 1
                           │
                           │ has many
                           │
                    ┌──────▼───────┐
                    │  OrderItem   │
                    └──────┬───────┘
                           │ many
                           │
                           │ references
                           │
                    ┌──────▼───────┐
                    │   Product    │
                    └──────┬───────┘
                           │ many
                           │
                           │ belongs to
                           │
                    ┌──────▼───────┐
                    │   Category   │
                    └──────────────┘


┌──────────────┐         ┌──────────────┐
│ Controller   │────────▶│   Service    │
└──────────────┘  uses   └──────┬───────┘
                                │
                                │ uses
                                │
                         ┌──────▼───────┐
                         │   Prisma     │
                         └──────┬───────┘
                                │
                                │ queries
                                │
                         ┌──────▼───────┐
                         │  PostgreSQL  │
                         └──────────────┘


┌──────────────┐         ┌──────────────┐
│   Context    │────────▶│  ApiClient   │
└──────────────┘  uses   └──────┬───────┘
                                │
                                │ HTTP
                                │
                         ┌──────▼───────┐
                         │   Backend    │
                         │     API      │
                         └──────────────┘
```

### 9. Design Pattern Implementation

#### 9.1 Singleton Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    Singleton Pattern                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  class CacheService {                                            │
│    private static instance: CacheService                         │
│                                                                  │
│    private constructor() {                                       │
│      // Private constructor                                      │
│    }                                                             │
│                                                                  │
│    public static getInstance(): CacheService {                   │
│      if (!CacheService.instance) {                               │
│        CacheService.instance = new CacheService()                │
│      }                                                           │
│      return CacheService.instance                                │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  Usage:                                                          │
│  const cache = CacheService.getInstance()                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 9.2 Factory Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                     Factory Pattern                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  interface Notification {                                        │
│    send(recipient: string, data: any): Promise<void>             │
│  }                                                               │
│                                                                  │
│  class EmailNotification implements Notification {               │
│    async send(recipient, data) { /* ... */ }                     │
│  }                                                               │
│                                                                  │
│  class PushNotification implements Notification {                │
│    async send(recipient, data) { /* ... */ }                     │
│  }                                                               │
│                                                                  │
│  class SocketNotification implements Notification {              │
│    async send(recipient, data) { /* ... */ }                     │
│  }                                                               │
│                                                                  │
│  class NotificationFactory {                                     │
│    static create(type: string): Notification {                   │
│      switch(type) {                                              │
│        case 'email': return new EmailNotification()              │
│        case 'push': return new PushNotification()                │
│        case 'socket': return new SocketNotification()            │
│        default: throw new Error('Unknown type')                  │
│      }                                                           │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  Usage:                                                          │
│  const notif = NotificationFactory.create('email')               │
│  await notif.send('user@example.com', data)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 9.3 Strategy Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    Strategy Pattern                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  interface CacheStrategy {                                       │
│    get<T>(key: string): Promise<T | null>                        │
│    set<T>(key: string, value: T, ttl?: number): Promise<void>   │
│  }                                                               │
│                                                                  │
│  class RedisStrategy implements CacheStrategy {                  │
│    async get<T>(key) { /* Redis implementation */ }              │
│    async set<T>(key, value, ttl) { /* ... */ }                   │
│  }                                                               │
│                                                                  │
│  class MemoryStrategy implements CacheStrategy {                 │
│    async get<T>(key) { /* Memory implementation */ }             │
│    async set<T>(key, value, ttl) { /* ... */ }                   │
│  }                                                               │
│                                                                  │
│  class CacheService {                                            │
│    private strategy: CacheStrategy                               │
│                                                                  │
│    setStrategy(strategy: CacheStrategy) {                        │
│      this.strategy = strategy                                    │
│    }                                                             │
│                                                                  │
│    async get<T>(key: string) {                                   │
│      return this.strategy.get<T>(key)                            │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  Usage:                                                          │
│  const cache = new CacheService()                                │
│  cache.setStrategy(new RedisStrategy())                          │
│  // Fallback to memory if Redis fails                            │
│  cache.setStrategy(new MemoryStrategy())                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 9.4 Observer Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    Observer Pattern                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  interface Observer {                                            │
│    update(data: any): void                                       │
│  }                                                               │
│                                                                  │
│  class Subject {                                                 │
│    private observers: Observer[] = []                            │
│                                                                  │
│    attach(observer: Observer) {                                  │
│      this.observers.push(observer)                               │
│    }                                                             │
│                                                                  │
│    detach(observer: Observer) {                                  │
│      const index = this.observers.indexOf(observer)              │
│      this.observers.splice(index, 1)                             │
│    }                                                             │
│                                                                  │
│    notify(data: any) {                                           │
│      this.observers.forEach(o => o.update(data))                 │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  class OrderSubject extends Subject {                            │
│    createOrder(order: Order) {                                   │
│      // Create order logic                                       │
│      this.notify({ type: 'order:created', order })               │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  class EmailObserver implements Observer {                       │
│    update(data) {                                                │
│      if (data.type === 'order:created') {                        │
│        this.sendOrderEmail(data.order)                           │
│      }                                                           │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  class NotificationObserver implements Observer {                │
│    update(data) {                                                │
│      if (data.type === 'order:created') {                        │
│        this.sendNotification(data.order)                         │
│      }                                                           │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  Usage:                                                          │
│  const orderSubject = new OrderSubject()                         │
│  orderSubject.attach(new EmailObserver())                        │
│  orderSubject.attach(new NotificationObserver())                 │
│  orderSubject.createOrder(order) // Notifies all observers       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 TỔNG KẾT

### Số lượng Classes/Modules

| Layer | Số lượng | Mô tả |
|-------|----------|-------|
| **Domain Models** | 15+ | User, Product, Order, Category, Review, etc. |
| **Services** | 8 | Cache, Chatbot, Email, Notification, Push, Gemini, Shipping, WishlistSale |
| **Controllers** | 20+ | Auth, Product, Order, Cart, Chatbot, POS, Kitchen, etc. |
| **Middleware** | 4 | Auth, Security, RateLimit, Validation |
| **Contexts** | 5 | Auth, Cart, Wishlist, Compare, Chat |
| **Components** | 50+ | UI components, Feature components |
| **Hooks** | 15+ | Custom React hooks |
| **Utilities** | 10+ | ApiClient, SocketClient, Storage, Validation, etc. |

### Design Patterns Sử dụng

1. **Singleton**: CacheService, ApiClient, GeminiService
2. **Factory**: NotificationFactory, EmailTemplateFactory
3. **Strategy**: CacheStrategy (Redis/Memory), PaymentStrategy
4. **Observer**: Socket.io events, React Context subscriptions
5. **Facade**: ApiClient, ChatbotService, PushService
6. **Repository**: Prisma ORM
7. **Middleware**: Express middleware chain
8. **Provider**: React Context Providers
9. **Decorator**: Route decorators
10. **Template Method**: Email templates

### Ưu điểm của kiến trúc

✅ **Separation of Concerns**: Mỗi lớp có trách nhiệm rõ ràng  
✅ **Maintainability**: Dễ bảo trì và mở rộng  
✅ **Testability**: Dễ dàng test từng lớp độc lập  
✅ **Reusability**: Code có thể tái sử dụng  
✅ **Scalability**: Có thể scale từng phần riêng biệt  
✅ **Type Safety**: TypeScript đảm bảo type safety  
✅ **Design Patterns**: Áp dụng các design patterns phổ biến  

---

**Tài liệu được tạo cho đồ án tốt nghiệp**  
**Hệ thống: NHH-Coffee E-commerce & POS**  
**Ngày cập nhật: 2026-01-30**
