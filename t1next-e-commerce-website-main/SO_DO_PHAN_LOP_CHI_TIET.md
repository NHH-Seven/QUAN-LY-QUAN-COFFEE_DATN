# SƠ ĐỒ PHÂN LỚP CHI TIẾT - HỆ THỐNG NHH-COFFEE

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc phân lớp](#1-tổng-quan-kiến-trúc-phân-lớp)
2. [Lớp Presentation (Frontend)](#2-lớp-presentation-frontend)
3. [Lớp API Gateway](#3-lớp-api-gateway)
4. [Lớp Controller](#4-lớp-controller)
5. [Lớp Service](#5-lớp-service)
6. [Lớp Data Access](#6-lớp-data-access)
7. [Lớp Database](#7-lớp-database)
8. [Luồng dữ liệu giữa các lớp](#8-luồng-dữ-liệu-giữa-các-lớp)

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN LỚP

### 1.1 Sơ đồ tổng quan 6 lớp

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    ┌──────────────────────────┐                     │
│                    │   1. PRESENTATION LAYER  │                     │
│                    │      (Client-side)       │                     │
│                    └────────────┬─────────────┘                     │
│                                 │                                    │
│                                 │ HTTP/WebSocket                     │
│                                 │                                    │
│                    ┌────────────▼─────────────┐                     │
│                    │   2. API GATEWAY LAYER   │                     │
│                    │   (Security & Routing)   │                     │
│                    └────────────┬─────────────┘                     │
│                                 │                                    │
│                                 │ Validated Request                  │
│                                 │                                    │
│                    ┌────────────▼─────────────┐                     │
│                    │   3. CONTROLLER LAYER    │                     │
│                    │   (Request Handling)     │                     │
│                    └────────────┬─────────────┘                     │
│                                 │                                    │
│                                 │ Business Logic Call                │
│                                 │                                    │
│                    ┌────────────▼─────────────┐                     │
│                    │   4. SERVICE LAYER       │                     │
│                    │   (Business Logic)       │                     │
│                    └────────────┬─────────────┘                     │
│                                 │                                    │
│                                 │ Data Query                         │
│                                 │                                    │
│                    ┌────────────▼─────────────┐                     │
│                    │   5. DATA ACCESS LAYER   │                     │
│                    │   (ORM - Prisma)         │                     │
│                    └────────────┬─────────────┘                     │
│                                 │                                    │
│                                 │ SQL Query                          │
│                                 │                                    │
│                    ┌────────────▼─────────────┐                     │
│                    │   6. DATABASE LAYER      │                     │
│                    │   (PostgreSQL)           │                     │
│                    └──────────────────────────┘                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Nguyên tắc giao tiếp giữa các lớp

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION PRINCIPLES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. ONE-WAY DEPENDENCY (Phụ thuộc một chiều)                        │
│     - Lớp trên chỉ phụ thuộc vào lớp dưới                           │
│     - Lớp dưới KHÔNG biết về lớp trên                               │
│     - Tránh circular dependency                                     │
│                                                                      │
│  2. INTERFACE SEGREGATION (Tách biệt interface)                     │
│     - Mỗi lớp expose interface rõ ràng                              │
│     - Lớp trên chỉ biết interface, không biết implementation        │
│                                                                      │
│  3. LOOSE COUPLING (Liên kết lỏng)                                  │
│     - Thay đổi một lớp không ảnh hưởng lớp khác                     │
│     - Dễ dàng thay thế implementation                               │
│                                                                      │
│  4. HIGH COHESION (Gắn kết cao)                                     │
│     - Mỗi lớp có trách nhiệm rõ ràng                                │
│     - Các thành phần trong lớp liên quan chặt chẽ                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. LỚP PRESENTATION (FRONTEND)

### 2.1 Cấu trúc chi tiết

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
│                      (Next.js Application)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 1: PAGES (App Router)                                   │ │
│  │  Trách nhiệm: Routing, SSR/CSR, SEO                            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  Public Pages:                                                  │ │
│  │  ├─ app/page.tsx                    (Home)                     │ │
│  │  ├─ app/products/page.tsx           (Product List)             │ │
│  │  ├─ app/product/[slug]/page.tsx     (Product Detail)           │ │
│  │  ├─ app/category/[slug]/page.tsx    (Category)                 │ │
│  │  ├─ app/search/page.tsx             (Search Results)           │ │
│  │  ├─ app/login/page.tsx              (Login)                    │ │
│  │  └─ app/register/page.tsx           (Register)                 │ │
│  │                                                                 │ │
│  │  Customer Pages (Protected):                                   │ │
│  │  ├─ app/cart/page.tsx               (Shopping Cart)            │ │
│  │  ├─ app/checkout/page.tsx           (Checkout)                 │ │
│  │  ├─ app/profile/page.tsx            (User Profile)             │ │
│  │  ├─ app/wishlist/page.tsx           (Wishlist)                 │ │
│  │  ├─ app/compare/page.tsx            (Compare Products)         │ │
│  │  └─ app/notifications/page.tsx      (Notifications)            │ │
│  │                                                                 │ │
│  │  Staff Pages (Role: sales, warehouse):                         │ │
│  │  ├─ app/staff/page.tsx              (Staff Dashboard)          │ │
│  │  ├─ app/staff/pos/page.tsx          (Point of Sale)            │ │
│  │  ├─ app/staff/tables/page.tsx       (Table Management)         │ │
│  │  ├─ app/staff/kitchen/page.tsx      (Kitchen Display)          │ │
│  │  ├─ app/staff/orders/page.tsx       (Order Management)         │ │
│  │  ├─ app/staff/sales/page.tsx        (Sales - Dine-in/Takeaway) │ │
│  │  ├─ app/staff/chat/page.tsx         (Customer Chat)            │ │
│  │  └─ app/staff/shifts/page.tsx       (Shift Management)         │ │
│  │                                                                 │ │
│  │  Admin Pages (Role: admin):                                    │ │
│  │  ├─ app/staff/dashboard/page.tsx    (Admin Dashboard)          │ │
│  │  ├─ app/staff/products/page.tsx     (Product Management)       │ │
│  │  ├─ app/staff/categories/page.tsx   (Category Management)      │ │
│  │  ├─ app/staff/stock/page.tsx        (Stock Management)         │ │
│  │  ├─ app/staff/customers/page.tsx    (Customer Management)      │ │
│  │  ├─ app/staff/staff-management/     (Staff Management)         │ │
│  │  ├─ app/staff/promotions/page.tsx   (Promotion Management)     │ │
│  │  ├─ app/staff/reports/page.tsx      (Reports & Analytics)      │ │
│  │  ├─ app/staff/chatbot-knowledge/    (AI Knowledge Base)        │ │
│  │  ├─ app/staff/settings/page.tsx     (System Settings)          │ │
│  │  └─ app/staff/backup/page.tsx       (Backup & Restore)         │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 2: COMPONENTS                                           │ │
│  │  Trách nhiệm: UI Rendering, User Interaction                   │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  UI Components (Atomic Design):                                │ │
│  │  ├─ components/ui/                                             │ │
│  │  │  ├─ button.tsx                   (Button)                   │ │
│  │  │  ├─ input.tsx                    (Input Field)              │ │
│  │  │  ├─ card.tsx                     (Card Container)           │ │
│  │  │  ├─ dialog.tsx                   (Modal Dialog)             │ │
│  │  │  ├─ dropdown-menu.tsx            (Dropdown)                 │ │
│  │  │  ├─ table.tsx                    (Data Table)               │ │
│  │  │  ├─ tabs.tsx                     (Tabs)                     │ │
│  │  │  └─ toast.tsx                    (Toast Notification)       │ │
│  │                                                                 │ │
│  │  Feature Components:                                           │ │
│  │  ├─ components/product/                                        │ │
│  │  │  ├─ product-card.tsx             (Product Card)             │ │
│  │  │  ├─ product-detail.tsx           (Product Detail View)      │ │
│  │  │  ├─ product-filters.tsx          (Filter Sidebar)           │ │
│  │  │  ├─ product-reviews.tsx          (Reviews Section)          │ │
│  │  │  ├─ product-qa.tsx               (Q&A Section)              │ │
│  │  │  ├─ related-products.tsx         (Related Products)         │ │
│  │  │  ├─ compare-button.tsx           (Add to Compare)           │ │
│  │  │  └─ compare-bar.tsx              (Compare Floating Bar)     │ │
│  │                                                                 │ │
│  │  ├─ components/cart/                                           │ │
│  │  │  ├─ cart-content.tsx             (Cart Items List)          │ │
│  │  │  ├─ cart-item.tsx                (Single Cart Item)         │ │
│  │  │  └─ cart-summary.tsx             (Price Summary)            │ │
│  │                                                                 │ │
│  │  ├─ components/checkout/                                       │ │
│  │  │  ├─ checkout-form.tsx            (Checkout Form)            │ │
│  │  │  ├─ shipping-form.tsx            (Shipping Info)            │ │
│  │  │  ├─ payment-methods.tsx          (Payment Selection)        │ │
│  │  │  └─ order-summary.tsx            (Order Summary)            │ │
│  │                                                                 │ │
│  │  ├─ components/admin/                                          │ │
│  │  │  ├─ admin-sidebar.tsx            (Admin Navigation)         │ │
│  │  │  ├─ admin-header.tsx             (Admin Header)             │ │
│  │  │  ├─ stats-card.tsx               (Statistics Card)          │ │
│  │  │  ├─ recent-orders-table.tsx      (Recent Orders)            │ │
│  │  │  ├─ low-stock-alert.tsx          (Stock Alert)              │ │
│  │  │  ├─ product-form.tsx             (Product CRUD Form)        │ │
│  │  │  └─ role-protected-page.tsx      (Role Guard)               │ │
│  │                                                                 │ │
│  │  ├─ components/chatbot/                                        │ │
│  │  │  ├─ unified-chat-widget.tsx      (Chat Button)              │ │
│  │  │  ├─ ai-chat-window.tsx           (AI Chat Interface)        │ │
│  │  │  ├─ chat-mode-selector.tsx       (AI/Human Toggle)          │ │
│  │  │  └─ staff-chat-wrapper.tsx       (Staff Chat Interface)     │ │
│  │                                                                 │ │
│  │  ├─ components/notifications/                                  │ │
│  │  │  ├─ notification-bell.tsx        (Notification Icon)        │ │
│  │  │  ├─ notification-listener.tsx    (Real-time Listener)       │ │
│  │  │  └─ notifications-content.tsx    (Notification List)        │ │
│  │                                                                 │ │
│  │  └─ components/layout/                                         │ │
│  │     ├─ header.tsx                   (Site Header)              │ │
│  │     ├─ footer.tsx                   (Site Footer)              │ │
│  │     ├─ sidebar.tsx                  (Sidebar Navigation)       │ │
│  │     └─ breadcrumb.tsx               (Breadcrumb)               │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 3: STATE MANAGEMENT (React Context)                     │ │
│  │  Trách nhiệm: Global State, Side Effects                       │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  contexts/auth-context.tsx                                     │ │
│  │  ├─ State: user, isAuthenticated, isLoading                    │ │
│  │  ├─ Actions:                                                   │ │
│  │  │  ├─ login(email, password)                                  │ │
│  │  │  ├─ register(email, password, name)                         │ │
│  │  │  ├─ logout()                                                │ │
│  │  │  └─ refreshUser()                                           │ │
│  │  └─ Storage: localStorage (persist session)                    │ │
│  │                                                                 │ │
│  │  contexts/cart-context.tsx                                     │ │
│  │  ├─ State: items[], totalItems, totalPrice, appliedPromotion   │ │
│  │  ├─ Actions:                                                   │ │
│  │  │  ├─ addItem(product, quantity)                              │ │
│  │  │  ├─ removeItem(productId)                                   │ │
│  │  │  ├─ updateQuantity(productId, quantity)                     │ │
│  │  │  ├─ clearCart()                                             │ │
│  │  │  └─ setAppliedPromotion(promo)                              │ │
│  │  └─ Sync: Server (when authenticated) + localStorage           │ │
│  │                                                                 │ │
│  │  contexts/wishlist-context.tsx                                 │ │
│  │  ├─ State: items[], isLoading                                  │ │
│  │  ├─ Actions:                                                   │ │
│  │  │  ├─ addItem(product)                                        │ │
│  │  │  ├─ removeItem(productId)                                   │ │
│  │  │  ├─ toggleWishlist(product)                                 │ │
│  │  │  └─ isInWishlist(productId)                                 │ │
│  │  └─ Sync: Server (when authenticated)                          │ │
│  │                                                                 │ │
│  │  contexts/compare-context.tsx                                  │ │
│  │  ├─ State: items[], maxItems                                   │ │
│  │  ├─ Actions:                                                   │ │
│  │  │  ├─ addItem(product)                                        │ │
│  │  │  ├─ removeItem(productId)                                   │ │
│  │  │  ├─ clearAll()                                              │ │
│  │  │  ├─ isInCompare(productId)                                  │ │
│  │  │  └─ getComparisonData()                                     │ │
│  │  └─ Storage: localStorage                                      │ │
│  │                                                                 │ │
│  │  contexts/chat-context.tsx                                     │ │
│  │  ├─ State: isOpen, unreadCount, currentMode                    │ │
│  │  ├─ Actions:                                                   │ │
│  │  │  ├─ openChat()                                              │ │
│  │  │  ├─ closeChat()                                             │ │
│  │  │  ├─ toggleChat()                                            │ │
│  │  │  ├─ setUnreadCount(count)                                   │ │
│  │  │  └─ switchMode('ai' | 'human')                              │ │
│  │  └─ Real-time: Socket.io listener                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 4: CUSTOM HOOKS                                         │ │
│  │  Trách nhiệm: Reusable Logic, Side Effects                     │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  hooks/use-auth.ts                                             │ │
│  │  └─ Access AuthContext, provide auth utilities                 │ │
│  │                                                                 │ │
│  │  hooks/use-admin-guard.ts                                      │ │
│  │  └─ Redirect if not admin role                                 │ │
│  │                                                                 │ │
│  │  hooks/use-staff-guard.ts                                      │ │
│  │  └─ Redirect if not staff role                                 │ │
│  │                                                                 │ │
│  │  hooks/use-role-guard.ts                                       │ │
│  │  └─ Generic role checking                                      │ │
│  │                                                                 │ │
│  │  hooks/use-debounce.ts                                         │ │
│  │  └─ Debounce value changes (search, etc.)                      │ │
│  │                                                                 │ │
│  │  hooks/use-search.ts                                           │ │
│  │  └─ Search functionality with debounce                         │ │
│  │                                                                 │ │
│  │  hooks/use-toast.ts                                            │ │
│  │  └─ Toast notification utilities                               │ │
│  │                                                                 │ │
│  │  hooks/use-order-notifications.ts                              │ │
│  │  └─ Listen to order status changes (Socket.io)                 │ │
│  │                                                                 │ │
│  │  hooks/use-push-notification.ts                                │ │
│  │  └─ Web Push notification subscription                         │ │
│  │                                                                 │ │
│  │  hooks/use-recently-viewed.ts                                  │ │
│  │  └─ Track recently viewed products                             │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 5: API CLIENT                                           │ │
│  │  Trách nhiệm: HTTP Communication, WebSocket                    │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  lib/api.ts (HTTP Client)                                      │ │
│  │  ├─ Base Configuration:                                        │ │
│  │  │  ├─ baseURL: process.env.NEXT_PUBLIC_API_URL               │ │
│  │  │  ├─ timeout: 30000ms                                        │ │
│  │  │  └─ headers: Content-Type, Authorization                    │ │
│  │  │                                                              │ │
│  │  ├─ Request Interceptor:                                       │ │
│  │  │  ├─ Add JWT token to headers                                │ │
│  │  │  ├─ Add CSRF token                                          │ │
│  │  │  └─ Log requests (dev mode)                                 │ │
│  │  │                                                              │ │
│  │  ├─ Response Interceptor:                                      │ │
│  │  │  ├─ Handle 401 (Unauthorized) → Logout                      │ │
│  │  │  ├─ Handle 403 (Forbidden) → Redirect                       │ │
│  │  │  ├─ Handle 429 (Rate Limit) → Show message                  │ │
│  │  │  └─ Parse error messages                                    │ │
│  │  │                                                              │ │
│  │  └─ API Methods:                                               │ │
│  │     ├─ Auth: login, register, verifyOTP, logout, getMe         │ │
│  │     ├─ Products: getProducts, getProduct, searchProducts       │ │
│  │     ├─ Cart: getCart, addToCart, updateCartItem, removeFromCart│ │
│  │     ├─ Orders: createOrder, getOrders, getOrder, cancelOrder   │ │
│  │     ├─ Wishlist: getWishlist, addToWishlist, removeFromWishlist│ │
│  │     ├─ Reviews: createReview, getReviews                       │ │
│  │     ├─ Chat: sendChatMessage, getChatHistory                   │ │
│  │     └─ Admin: CRUD operations for all entities                 │ │
│  │                                                                 │ │
│  │  lib/socket.ts (WebSocket Client)                              │ │
│  │  ├─ Connection:                                                │ │
│  │  │  ├─ URL: process.env.NEXT_PUBLIC_API_URL                    │ │
│  │  │  ├─ Auth: JWT token in handshake                            │ │
│  │  │  └─ Auto reconnect on disconnect                            │ │
│  │  │                                                              │ │
│  │  ├─ Event Listeners:                                           │ │
│  │  │  ├─ order:new → Notify staff                                │ │
│  │  │  ├─ order:status_changed → Update UI                        │ │
│  │  │  ├─ kitchen:new_item → Update kitchen display               │ │
│  │  │  ├─ kitchen:item_ready → Notify staff                       │ │
│  │  │  ├─ table:status_changed → Update table view                │ │
│  │  │  ├─ chat:message → Show new message                         │ │
│  │  │  ├─ notification:new → Show notification                    │ │
│  │  │  └─ stock:alert → Alert low stock                           │ │
│  │  │                                                              │ │
│  │  └─ Event Emitters:                                            │ │
│  │     ├─ join:room(roomName)                                     │ │
│  │     ├─ leave:room(roomName)                                    │ │
│  │     ├─ chat:send(message)                                      │ │
│  │     └─ typing:start / typing:stop                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```


---

## 3. LỚP API GATEWAY

### 3.1 Cấu trúc chi tiết

```
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                              │
│                    (Express.js Middleware)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SUBLAYER 1: SECURITY MIDDLEWARE                               │ │
│  │  Trách nhiệm: Security Headers, CORS, Rate Limiting            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  middleware/security.ts                                        │ │
│  │  ├─ Helmet (Security Headers):                                 │ │
│  │  │  ├─ X-Frame-Options: SAMEORIGIN                             │ │
│  │  │  ├─ X-Content-Type-Options: nosniff                         │ │
│  │  │  ├─ X-XSS-Protection: 1; mode=block                         │ │
│  │  │  ├─ Strict-Transport-Security: max-age=31536000             │ │
│  │  │  └─ Content-Security-Policy: (configured)                   │ │
│  │  │                                                              │ │
│  │  ├─ CORS Configuration:                                        │ │
│  │  │  ├─ origin: ['http://localhost:3000', production_url]       │ │
│  │  │  ├─ credentials: true                                       │ │
│  │  │  ├─ methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']      │ │
│  │  │  ├─ allowedHeaders: ['Content-Type', 'Authorization']       │ │
│  │  │  └─ maxAge: 86400                                           │ │
│  │  │                                                              │ │
│  │  └─ Additional Security:                                       │ │
│  │     ├─ Body size limit: 10mb                                   │ │
│  │     ├─ Parameter pollution prevention                          │ │
│  │     └─ HTTP parameter pollution protection                     │ │
│  │                                                                 │ │
│  │  middleware/rate-limit.ts                                      │ │
│  │  ├─ API Rate Limiter:                                          │ │
│  │  │  ├─ Window: 15 minutes                                      │ │
│  │  │  ├─ Max requests: 100                                       │ │
│  │  │  ├─ Message: "Too many requests"                            │ │
│  │  │  └─ Store: Redis (with memory fallback)                     │ │
│  │  │                                                              │ │
│  │  ├─ Auth Rate Limiter (Stricter):                              │ │
│  │  │  ├─ Window: 15 minutes                                      │ │
│  │  │  ├─ Max requests: 5                                         │ │
│  │  │  ├─ Message: "Too many login attempts"                      │ │
│  │  │  └─ Block duration: 15 minutes                              │ │
│  │  │                                                              │ │
│  │  └─ Strict Limiter (Admin operations):                         │ │
│  │     ├─ Window: 15 minutes                                      │ │
│  │     ├─ Max requests: 50                                        │ │
│  │     └─ IP-based tracking                                       │ │
│  │                                                                 │ │
│  │  middleware/csrf.ts                                            │ │
│  │  ├─ CSRF Token Generation                                      │ │
│  │  ├─ Token Validation                                           │ │
│  │  └─ Exempt routes: ['/api/auth/login', '/api/webhook/*']      │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SUBLAYER 2: AUTHENTICATION MIDDLEWARE                         │ │
│  │  Trách nhiệm: JWT Verification, User Identification            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  middleware/auth.ts                                            │ │
│  │                                                                 │ │
│  │  authenticate(req, res, next):                                 │ │
│  │  ├─ 1. Extract token from header:                              │ │
│  │  │    Authorization: "Bearer <token>"                          │ │
│  │  │                                                              │ │
│  │  ├─ 2. Verify JWT token:                                       │ │
│  │  │    ├─ Check signature                                       │ │
│  │  │    ├─ Check expiration                                      │ │
│  │  │    └─ Decode payload                                        │ │
│  │  │                                                              │ │
│  │  ├─ 3. Extract user info:                                      │ │
│  │  │    ├─ userId                                                │ │
│  │  │    ├─ email                                                 │ │
│  │  │    └─ role                                                  │ │
│  │  │                                                              │ │
│  │  ├─ 4. Attach to request:                                      │ │
│  │  │    req.user = { userId, email, role }                       │ │
│  │  │                                                              │ │
│  │  └─ 5. Error handling:                                         │ │
│  │       ├─ No token → 401 Unauthorized                           │ │
│  │       ├─ Invalid token → 401 Unauthorized                      │ │
│  │       ├─ Expired token → 401 Token expired                     │ │
│  │       └─ Valid → next()                                        │ │
│  │                                                                 │ │
│  │  optionalAuth(req, res, next):                                 │ │
│  │  ├─ Try to authenticate                                        │ │
│  │  ├─ If success → attach user                                   │ │
│  │  ├─ If fail → continue without user                            │ │
│  │  └─ Use case: Public endpoints with optional user features     │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SUBLAYER 3: AUTHORIZATION MIDDLEWARE                          │ │
│  │  Trách nhiệm: Role-based Access Control                        │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  middleware/auth.ts                                            │ │
│  │                                                                 │ │
│  │  authorize(...allowedRoles):                                   │ │
│  │  ├─ 1. Check if user exists (from authenticate):               │ │
│  │  │    if (!req.user) → 401 Unauthorized                        │ │
│  │  │                                                              │ │
│  │  ├─ 2. Check user role:                                        │ │
│  │  │    if (!allowedRoles.includes(req.user.role))               │ │
│  │  │       → 403 Forbidden                                       │ │
│  │  │                                                              │ │
│  │  └─ 3. Grant access:                                           │ │
│  │       next()                                                    │ │
│  │                                                                 │ │
│  │  Usage Examples:                                               │ │
│  │  ├─ authorize('admin')                                         │ │
│  │  │  → Only admin can access                                    │ │
│  │  │                                                              │ │
│  │  ├─ authorize('admin', 'sales')                                │ │
│  │  │  → Admin or sales can access                                │ │
│  │  │                                                              │ │
│  │  └─ authorize('admin', 'sales', 'warehouse')                   │ │
│  │     → All staff roles can access                               │ │
│  │                                                                 │ │
│  │  Role Hierarchy:                                               │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  admin (Highest)                                          │ │ │
│  │  │    ├─ All permissions                                     │ │ │
│  │  │    └─ Can manage system                                   │ │ │
│  │  │                                                            │ │ │
│  │  │  sales                                                     │ │ │
│  │  │    ├─ POS operations                                      │ │ │
│  │  │    ├─ Table management                                    │ │ │
│  │  │    ├─ Kitchen display                                     │ │ │
│  │  │    └─ Customer chat                                       │ │ │
│  │  │                                                            │ │ │
│  │  │  warehouse                                                 │ │ │
│  │  │    ├─ Stock management                                    │ │ │
│  │  │    ├─ Import/Export                                       │ │ │
│  │  │    └─ Inventory reports                                   │ │ │
│  │  │                                                            │ │ │
│  │  │  user (Lowest)                                            │ │ │
│  │  │    ├─ Browse products                                     │ │ │
│  │  │    ├─ Place orders                                        │ │ │
│  │  │    └─ Manage profile                                      │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SUBLAYER 4: VALIDATION MIDDLEWARE                             │ │
│  │  Trách nhiệm: Input Validation, Sanitization                   │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  validations/common.ts                                         │ │
│  │  ├─ Pagination Schema:                                         │ │
│  │  │  ├─ page: number (min: 1, default: 1)                      │ │
│  │  │  └─ limit: number (min: 1, max: 100, default: 20)          │ │
│  │  │                                                              │ │
│  │  ├─ Search Schema:                                             │ │
│  │  │  ├─ q: string (min: 1, max: 100)                           │ │
│  │  │  └─ sanitize: remove special chars                         │ │
│  │  │                                                              │ │
│  │  ├─ Product Filter Schema:                                     │ │
│  │  │  ├─ category: string (optional)                            │ │
│  │  │  ├─ minPrice: number (min: 0)                              │ │
│  │  │  ├─ maxPrice: number (min: 0)                              │ │
│  │  │  ├─ brand: string (optional)                               │ │
│  │  │  └─ sort: enum ['price_asc', 'price_desc', 'newest']       │ │
│  │  │                                                              │ │
│  │  └─ Cart Item Schema:                                          │ │
│  │     ├─ productId: string (uuid)                               │ │
│  │     └─ quantity: number (min: 1, max: 100)                    │ │
│  │                                                                 │ │
│  │  validations/auth.validation.ts                                │ │
│  │  ├─ Register Schema:                                           │ │
│  │  │  ├─ email: string (email format, max: 255)                 │ │
│  │  │  ├─ password: string (min: 8, max: 100)                    │ │
│  │  │  │  └─ Must contain: uppercase, lowercase, number          │ │
│  │  │  └─ name: string (min: 2, max: 100)                        │ │
│  │  │                                                              │ │
│  │  ├─ Login Schema:                                              │ │
│  │  │  ├─ email: string (email format)                           │ │
│  │  │  └─ password: string (min: 1)                              │ │
│  │  │                                                              │ │
│  │  └─ OTP Schema:                                                │ │
│  │     ├─ email: string (email format)                           │ │
│  │     └─ otp: string (exactly 6 digits)                         │ │
│  │                                                                 │ │
│  │  validations/checkout.validation.ts                            │ │
│  │  └─ Create Order Schema:                                       │ │
│  │     ├─ recipientName: string (min: 2, max: 100)               │ │
│  │     ├─ phone: string (10-11 digits)                           │ │
│  │     ├─ shippingAddress: string (min: 10, max: 500)            │ │
│  │     ├─ paymentMethod: enum ['cash', 'card', 'transfer']       │ │
│  │     ├─ promotionCode: string (optional, max: 50)              │ │
│  │     └─ note: string (optional, max: 500)                      │ │
│  │                                                                 │ │
│  │  Validation Process:                                           │ │
│  │  ├─ 1. Parse request (body/query/params)                      │ │
│  │  ├─ 2. Validate against schema (Zod)                          │ │
│  │  ├─ 3. Sanitize input (remove XSS, SQL injection)             │ │
│  │  ├─ 4. Transform data (trim, lowercase email, etc.)           │ │
│  │  └─ 5. Error handling:                                        │ │
│  │     ├─ Invalid → 400 Bad Request                              │ │
│  │     ├─ Return detailed error messages                         │ │
│  │     └─ Valid → next()                                         │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. LỚP CONTROLLER

### 4.1 Cấu trúc chi tiết

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CONTROLLER LAYER                              │
│                    (Express Route Handlers)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Trách nhiệm:                                                        │
│  ├─ Handle HTTP requests                                            │
│  ├─ Call appropriate services                                       │
│  ├─ Format responses                                                │
│  ├─ Error handling                                                  │
│  └─ HTTP status codes                                               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  routes/auth.ts - AuthController                               │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  POST /api/auth/register                                       │ │
│  │  ├─ Input: { email, password, name }                           │ │
│  │  ├─ Process:                                                    │ │
│  │  │  ├─ Validate input                                          │ │
│  │  │  ├─ Check if email exists                                   │ │
│  │  │  ├─ Hash password (bcrypt)                                  │ │
│  │  │  ├─ Generate OTP (6 digits)                                 │ │
│  │  │  ├─ Save to pending_registrations                           │ │
│  │  │  └─ Send OTP email                                          │ │
│  │  └─ Response: { success: true, email }                         │ │
│  │                                                                 │ │
│  │  POST /api/auth/verify-otp                                     │ │
│  │  ├─ Input: { email, otp }                                      │ │
│  │  ├─ Process:                                                    │ │
│  │  │  ├─ Verify OTP                                              │ │
│  │  │  ├─ Create user                                             │ │
│  │  │  ├─ Generate JWT token                                      │ │
│  │  │  └─ Delete pending registration                             │ │
│  │  └─ Response: { success: true, user, token }                   │ │
│  │                                                                 │ │
│  │  POST /api/auth/login                                          │ │
│  │  ├─ Input: { email, password }                                 │ │
│  │  ├─ Process:                                                    │ │
│  │  │  ├─ Find user by email                                      │ │
│  │  │  ├─ Compare password (bcrypt)                               │ │
│  │  │  ├─ Check if active                                         │ │
│  │  │  └─ Generate JWT token                                      │ │
│  │  └─ Response: { success: true, user, token }                   │ │
│  │                                                                 │ │
│  │  POST /api/auth/logout                                         │ │
│  │  ├─ Input: (JWT token in header)                               │ │
│  │  ├─ Process: Clear session (if any)                            │ │
│  │  └─ Response: { success: true }                                │ │
│  │                                                                 │ │
│  │  GET /api/auth/me                                              │ │
│  │  ├─ Input: (JWT token in header)                               │ │
│  │  ├─ Process: Get user from req.user                            │ │
│  │  └─ Response: { success: true, user }                          │ │
│  │                                                                 │ │
│  │  POST /api/auth/forgot-password                                │ │
│  │  POST /api/auth/reset-password                                 │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  routes/products.ts - ProductController                        │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  GET /api/products                                             │ │
│  │  ├─ Query: { page, limit, category, minPrice, maxPrice, sort } │ │
│  │  ├─ Process:                                                    │ │
│  │  │  ├─ Check cache (Redis)                                     │ │
│  │  │  ├─ If cached → return                                      │ │
│  │  │  ├─ Build query with filters                                │ │
│  │  │  ├─ Execute query (Prisma)                                  │ │
│  │  │  ├─ Calculate pagination                                    │ │
│  │  │  └─ Cache result (5 minutes)                                │ │
│  │  └─ Response: { success: true, data, total, page, totalPages } │ │
│  │                                                                 │ │
│  │  GET /api/products/:slug                                       │ │
│  │  ├─ Params: { slug }                                           │ │
│  │  ├─ Process:                                                    │ │
│  │  │  ├─ Check cache                                             │ │
│  │  │  ├─ Find product by slug                                    │ │
│  │  │  ├─ Include: category, reviews                              │ │
│  │  │  └─ Cache result (10 minutes)                               │ │
│  │  └─ Response: { success: true, data: product }                 │ │
│  │                                                                 │ │
│  │  POST /api/products (Admin only)                               │ │
│  │  PUT /api/products/:id (Admin only)                            │ │
│  │  DELETE /api/products/:id (Admin only)                         │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  routes/orders.ts - OrderController                            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  POST /api/orders                                              │ │
│  │  ├─ Input: { recipientName, phone, address, paymentMethod }    │ │
│  │  ├─ Process:                                                    │ │
│  │  │  ├─ Get cart items                                          │ │
│  │  │  ├─ Validate stock availability                             │ │
│  │  │  ├─ Apply promotion (if any)                                │ │
│  │  │  ├─ Calculate total                                         │ │
│  │  │  ├─ Create order (transaction)                              │ │
│  │  │  ├─ Create order items                                      │ │
│  │  │  ├─ Update stock                                            │ │
│  │  │  ├─ Clear cart                                              │ │
│  │  │  ├─ Add points to user                                      │ │
│  │  │  ├─ Send email confirmation                                 │ │
│  │  │  └─ Notify staff (Socket.io)                                │ │
│  │  └─ Response: { success: true, data: order }                   │ │
│  │                                                                 │ │
│  │  GET /api/orders                                               │ │
│  │  GET /api/orders/:id                                           │ │
│  │  PUT /api/orders/:id/status (Staff only)                       │ │
│  │  POST /api/orders/:id/cancel                                   │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  routes/cart.ts - CartController                               │ │
│  │  routes/chatbot.ts - ChatbotController                         │ │
│  │  routes/pos.ts - POSController                                 │ │
│  │  routes/tables.ts - TableController                            │ │
│  │  routes/kitchen.ts - KitchenController                         │ │
│  │  routes/stock.ts - StockController                             │ │
│  │  routes/shifts.ts - ShiftController                            │ │
│  │  routes/reports.ts - ReportController                          │ │
│  │  ... (30+ route files)                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

Tôi đã tạo file **SO_DO_PHAN_LOP_CHI_TIET.md** với sơ đồ phân lớp cực kỳ chi tiết! 

Bạn có muốn tôi tiếp tục với:
- **Lớp Service** (chi tiết 8+ services)
- **Lớp Data Access** (Prisma ORM)
- **Lớp Database** (PostgreSQL schema)
- **Luồng dữ liệu** giữa các lớp

không? 🎨


---

## 5. LỚP SERVICE

### 5.1 Cấu trúc chi tiết

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                │
│                    (Business Logic Layer)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Trách nhiệm:                                                        │
│  ├─ Implement business rules                                        │
│  ├─ Data transformation                                             │
│  ├─ External API integration                                        │
│  ├─ Caching management                                              │
│  └─ Transaction coordination                                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/cache.service.ts - CacheService                      │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class RedisCacheService implements CacheService {             │ │
│  │    private client: Redis | null                                │ │
│  │    private memoryFallback: MemoryCache                         │ │
│  │    private useMemoryFallback: boolean                          │ │
│  │                                                                 │ │
│  │    Methods:                                                     │ │
│  │    ├─ get<T>(key: string): Promise<T | null>                   │ │
│  │    │  ├─ Try Redis first                                       │ │
│  │    │  ├─ Fallback to memory cache                              │ │
│  │    │  └─ Return null if not found                              │ │
│  │    │                                                            │ │
│  │    ├─ set<T>(key, value, ttl): Promise<void>                   │ │
│  │    │  ├─ Serialize value (JSON)                                │ │
│  │    │  ├─ Store in Redis with TTL                               │ │
│  │    │  └─ Also store in memory cache                            │ │
│  │    │                                                            │ │
│  │    ├─ del(key: string): Promise<void>                          │ │
│  │    │  ├─ Delete from Redis                                     │ │
│  │    │  └─ Delete from memory cache                              │ │
│  │    │                                                            │ │
│  │    ├─ delPattern(pattern: string): Promise<void>               │ │
│  │    │  ├─ Find keys matching pattern                            │ │
│  │    │  └─ Delete all matching keys                              │ │
│  │    │                                                            │ │
│  │    ├─ flush(): Promise<void>                                   │ │
│  │    │  └─ Clear all cache                                       │ │
│  │    │                                                            │ │
│  │    └─ isConnected(): boolean                                   │ │
│  │       └─ Check Redis connection status                         │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  │  Helper Functions:                                             │ │
│  │  ├─ invalidateProductCache(slug?)                              │ │
│  │  ├─ invalidateCategoryCache(slug?)                             │ │
│  │  └─ invalidateFlashSaleCache()                                 │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/chatbot.service.ts - ChatbotService                  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class ChatbotService {                                        │ │
│  │    Methods:                                                     │ │
│  │    ├─ getOrCreateSession(userId?, guestId?)                    │ │
│  │    │  ├─ Find active session                                   │ │
│  │    │  ├─ Create new if not found                               │ │
│  │    │  └─ Return session                                        │ │
│  │    │                                                            │ │
│  │    ├─ saveMessage(sessionId, role, content, metadata)          │ │
│  │    │  ├─ Insert into chat_messages                             │ │
│  │    │  └─ Return message                                        │ │
│  │    │                                                            │ │
│  │    ├─ getChatHistory(sessionId, limit)                         │ │
│  │    │  ├─ Query messages by session                             │ │
│  │    │  ├─ Order by created_at ASC                               │ │
│  │    │  └─ Limit results                                         │ │
│  │    │                                                            │ │
│  │    ├─ searchKnowledge(query)                                   │ │
│  │    │  ├─ Search in chatbot_knowledge table                     │ │
│  │    │  ├─ Match title, content, tags                            │ │
│  │    │  └─ Return best match                                     │ │
│  │    │                                                            │ │
│  │    ├─ handleMessage(message, userId?, guestId?, userName?)     │ │
│  │    │  ├─ Get or create session                                 │ │
│  │    │  ├─ Save user message                                     │ │
│  │    │  ├─ Search knowledge base first                           │ │
│  │    │  ├─ If not found, use Gemini AI                           │ │
│  │    │  ├─ Detect intent                                         │ │
│  │    │  ├─ Handle by intent:                                     │ │
│  │    │  │  ├─ product_inquiry → handleProductInquiry()           │ │
│  │    │  │  ├─ order_tracking → handleOrderTracking()             │ │
│  │    │  │  └─ purchase_intent → handlePurchaseIntent()           │ │
│  │    │  ├─ Save AI response                                      │ │
│  │    │  └─ Return response                                       │ │
│  │    │                                                            │ │
│  │    ├─ handleProductInquiry(message, sessionId, history)        │ │
│  │    │  ├─ Extract keywords                                      │ │
│  │    │  ├─ Search products                                       │ │
│  │    │  ├─ Build context with product info                       │ │
│  │    │  └─ Call Gemini with context                              │ │
│  │    │                                                            │ │
│  │    ├─ handleOrderTracking(message, userId, sessionId, history) │ │
│  │    │  ├─ Extract order ID from message                         │ │
│  │    │  ├─ Get order info                                        │ │
│  │    │  ├─ Build context with order info                         │ │
│  │    │  └─ Call Gemini with context                              │ │
│  │    │                                                            │ │
│  │    ├─ searchProducts(keywords)                                 │ │
│  │    │  ├─ Build SQL query with keywords                         │ │
│  │    │  ├─ Search in name and description                        │ │
│  │    │  ├─ Filter by stock > 0                                   │ │
│  │    │  └─ Return top 10 products                                │ │
│  │    │                                                            │ │
│  │    ├─ getOrderInfo(orderId, userId?)                           │ │
│  │    │  ├─ Query order by ID                                     │ │
│  │    │  ├─ Check ownership if userId provided                    │ │
│  │    │  └─ Return order details                                  │ │
│  │    │                                                            │ │
│  │    ├─ extractKeywords(message)                                 │ │
│  │    │  ├─ Remove stop words                                     │ │
│  │    │  ├─ Match product keywords                                │ │
│  │    │  └─ Return unique keywords                                │ │
│  │    │                                                            │ │
│  │    ├─ closeSession(sessionId)                                  │ │
│  │    │  ├─ Update session status to 'closed'                     │ │
│  │    │  └─ Clear Gemini session                                  │ │
│  │    │                                                            │ │
│  │    └─ getAnalytics(startDate, endDate)                         │ │
│  │       ├─ Count total sessions                                  │ │
│  │       ├─ Count total messages                                  │ │
│  │       ├─ Calculate avg messages per session                    │ │
│  │       └─ Calculate avg rating                                  │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │

│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/gemini.service.ts - GeminiService                    │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class GeminiService {                                         │ │
│  │    private model: GenerativeModel                              │ │
│  │    private sessions: Map<string, ChatSession>                  │ │
│  │                                                                 │ │
│  │    Methods:                                                     │ │
│  │    ├─ chat(message, options)                                   │ │
│  │    │  ├─ Get or create chat session                            │ │
│  │    │  ├─ Build system prompt                                   │ │
│  │    │  ├─ Add previous messages for context                     │ │
│  │    │  ├─ Send to Gemini API                                    │ │
│  │    │  └─ Return response                                       │ │
│  │    │                                                            │ │
│  │    ├─ chatWithContext(message, context)                        │ │
│  │    │  ├─ Build enhanced prompt with context                    │ │
│  │    │  ├─ Include products, orders, etc.                        │ │
│  │    │  └─ Call chat() with enhanced prompt                      │ │
│  │    │                                                            │ │
│  │    ├─ detectIntent(message)                                    │ │
│  │    │  ├─ Analyze message content                               │ │
│  │    │  ├─ Classify intent:                                      │ │
│  │    │  │  ├─ product_inquiry                                    │ │
│  │    │  │  ├─ order_tracking                                     │ │
│  │    │  │  ├─ purchase_intent                                    │ │
│  │    │  │  └─ general_question                                   │ │
│  │    │  └─ Return { intent, confidence }                         │ │
│  │    │                                                            │ │
│  │    ├─ clearSession(sessionId)                                  │ │
│  │    │  └─ Remove session from memory                            │ │
│  │    │                                                            │ │
│  │    └─ buildSystemPrompt()                                      │ │
│  │       ├─ Define AI role (coffee shop assistant)                │ │
│  │       ├─ Set personality (friendly, helpful)                   │ │
│  │       ├─ Add business rules                                    │ │
│  │       └─ Return prompt string                                  │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/email.service.ts - EmailService                      │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class EmailService {                                          │ │
│  │    private transporter: Transporter                            │ │
│  │                                                                 │ │
│  │    Methods:                                                     │ │
│  │    ├─ sendOTP(email, otp, name)                                │ │
│  │    │  ├─ Load OTP email template                               │ │
│  │    │  ├─ Replace placeholders                                  │ │
│  │    │  ├─ Send email via SMTP                                   │ │
│  │    │  └─ Return success/failure                                │ │
│  │    │                                                            │ │
│  │    ├─ sendPasswordReset(email, otp)                            │ │
│  │    │  ├─ Load password reset template                          │ │
│  │    │  ├─ Replace placeholders                                  │ │
│  │    │  └─ Send email                                            │ │
│  │    │                                                            │ │
│  │    ├─ sendOrderConfirmation(email, order)                      │ │
│  │    │  ├─ Load order confirmation template                      │ │
│  │    │  ├─ Include order details                                 │ │
│  │    │  ├─ Add order items table                                 │ │
│  │    │  └─ Send email                                            │ │
│  │    │                                                            │ │
│  │    ├─ sendOrderStatusUpdate(email, order, status)              │ │
│  │    │  ├─ Load status update template                           │ │
│  │    │  ├─ Include tracking info                                 │ │
│  │    │  └─ Send email                                            │ │
│  │    │                                                            │ │
│  │    └─ sendWelcomeEmail(email, name)                            │ │
│  │       ├─ Load welcome template                                 │ │
│  │       ├─ Personalize content                                   │ │
│  │       └─ Send email                                            │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/notification.service.ts - NotificationService        │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class NotificationService {                                   │ │
│  │    Methods:                                                     │ │
│  │    ├─ create(userId, type, title, message, data?)              │ │
│  │    │  ├─ Insert into notifications table                       │ │
│  │    │  ├─ Emit Socket.io event                                  │ │
│  │    │  ├─ Send push notification (if subscribed)                │ │
│  │    │  └─ Return notification                                   │ │
│  │    │                                                            │ │
│  │    ├─ notifyOrderStatus(userId, orderId, status)               │ │
│  │    │  ├─ Build notification message                            │ │
│  │    │  ├─ Create notification                                   │ │
│  │    │  └─ Emit to user room                                     │ │
│  │    │                                                            │ │
│  │    ├─ notifyNewOrder(orderId, orderData)                       │ │
│  │    │  ├─ Create notification for staff                         │ │
│  │    │  ├─ Emit to staff room                                    │ │
│  │    │  └─ Play notification sound                               │ │
│  │    │                                                            │ │
│  │    ├─ notifyLowStock(productId, productName, stock)            │ │
│  │    │  ├─ Create notification for warehouse staff               │ │
│  │    │  └─ Emit to staff room                                    │ │
│  │    │                                                            │ │
│  │    ├─ markAsRead(notificationId)                               │ │
│  │    │  └─ Update is_read = true                                 │ │
│  │    │                                                            │ │
│  │    └─ markAllAsRead(userId)                                    │ │
│  │       └─ Update all user notifications                         │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/push.service.ts - PushService                        │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class PushService {                                           │ │
│  │    private vapidKeys: { publicKey, privateKey }                │ │
│  │                                                                 │ │
│  │    Methods:                                                     │ │
│  │    ├─ subscribe(userId, subscription)                          │ │
│  │    │  ├─ Save subscription to database                         │ │
│  │    │  └─ Return success                                        │ │
│  │    │                                                            │ │
│  │    ├─ unsubscribe(userId, endpoint)                            │ │
│  │    │  ├─ Delete subscription from database                     │ │
│  │    │  └─ Return success                                        │ │
│  │    │                                                            │ │
│  │    ├─ sendNotification(userId, notification)                   │ │
│  │    │  ├─ Get user subscriptions                                │ │
│  │    │  ├─ Build push payload                                    │ │
│  │    │  ├─ Send to each subscription                             │ │
│  │    │  ├─ Handle expired subscriptions                          │ │
│  │    │  └─ Return results                                        │ │
│  │    │                                                            │ │
│  │    └─ sendToAll(notification)                                  │ │
│  │       ├─ Get all active subscriptions                          │ │
│  │       └─ Send to each subscription                             │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/shipping.service.ts - ShippingService                │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class ShippingService {                                       │ │
│  │    Methods:                                                     │ │
│  │    ├─ calculateShippingFee(address, weight)                    │ │
│  │    │  ├─ Parse address                                         │ │
│  │    │  ├─ Calculate distance                                    │ │
│  │    │  ├─ Apply weight factor                                   │ │
│  │    │  └─ Return fee                                            │ │
│  │    │                                                            │ │
│  │    ├─ estimateDeliveryTime(address)                            │ │
│  │    │  ├─ Calculate distance                                    │ │
│  │    │  ├─ Estimate time based on distance                       │ │
│  │    │  └─ Return estimated date                                 │ │
│  │    │                                                            │ │
│  │    └─ generateTrackingCode()                                   │ │
│  │       ├─ Generate unique code                                  │ │
│  │       └─ Return tracking code                                  │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  services/wishlist-sale.service.ts - WishlistSaleService       │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  class WishlistSaleService {                                   │ │
│  │    Methods:                                                     │ │
│  │    ├─ checkWishlistSales()                                     │ │
│  │    │  ├─ Get all wishlist items                                │ │
│  │    │  ├─ Check if product on sale                              │ │
│  │    │  ├─ Notify users                                          │ │
│  │    │  └─ Return notified count                                 │ │
│  │    │                                                            │ │
│  │    └─ notifyUserProductOnSale(userId, product)                 │ │
│  │       ├─ Create notification                                   │ │
│  │       ├─ Send push notification                                │ │
│  │       └─ Send email                                            │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```


---

## 6. LỚP DATA ACCESS

### 6.1 Cấu trúc chi tiết

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                              │
│                         (Prisma ORM)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Trách nhiệm:                                                        │
│  ├─ Database queries                                                │
│  ├─ Data mapping (DB ↔ Application)                                │
│  ├─ Connection pooling                                              │
│  ├─ Transaction management                                          │
│  └─ Type safety                                                     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  db/prisma.ts - Prisma Client                                  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  import { PrismaClient } from '@prisma/client'                 │ │
│  │                                                                 │ │
│  │  const prisma = new PrismaClient({                             │ │
│  │    log: ['query', 'error', 'warn'],                            │ │
│  │    errorFormat: 'pretty',                                      │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  Features:                                                      │ │
│  │  ├─ Auto-generated types from schema                           │ │
│  │  ├─ Type-safe queries                                          │ │
│  │  ├─ Connection pooling (default: 10)                           │ │
│  │  ├─ Query logging (development)                                │ │
│  │  └─ Error handling                                             │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  QUERY PATTERNS                                                │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  1. FIND OPERATIONS                                            │ │
│  │                                                                 │ │
│  │  // Find single record                                         │ │
│  │  const user = await prisma.user.findUnique({                   │ │
│  │    where: { id: userId }                                       │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  // Find first matching                                        │ │
│  │  const product = await prisma.product.findFirst({              │ │
│  │    where: { slug: productSlug }                                │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  // Find many with filters                                     │ │
│  │  const products = await prisma.product.findMany({              │ │
│  │    where: {                                                    │ │
│  │      categoryId: categoryId,                                   │ │
│  │      stock: { gt: 0 },                                         │ │
│  │      price: { gte: minPrice, lte: maxPrice }                   │ │
│  │    },                                                           │ │
│  │    orderBy: { price: 'asc' },                                  │ │
│  │    skip: (page - 1) * limit,                                   │ │
│  │    take: limit                                                 │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  2. CREATE OPERATIONS                                          │ │
│  │                                                                 │ │
│  │  // Create single record                                       │ │
│  │  const user = await prisma.user.create({                       │ │
│  │    data: {                                                     │ │
│  │      email: 'user@example.com',                                │ │
│  │      password: hashedPassword,                                 │ │
│  │      name: 'John Doe'                                          │ │
│  │    }                                                            │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  // Create with relations                                      │ │
│  │  const order = await prisma.order.create({                     │ │
│  │    data: {                                                     │ │
│  │      userId: userId,                                           │ │
│  │      total: total,                                             │ │
│  │      status: 'pending',                                        │ │
│  │      orderItems: {                                             │ │
│  │        create: items.map(item => ({                            │ │
│  │          productId: item.productId,                            │ │
│  │          quantity: item.quantity,                              │ │
│  │          price: item.price                                     │ │
│  │        }))                                                      │ │
│  │      }                                                          │ │
│  │    },                                                           │ │
│  │    include: { orderItems: true }                               │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  3. UPDATE OPERATIONS                                          │ │
│  │                                                                 │ │
│  │  // Update single record                                       │ │
│  │  const product = await prisma.product.update({                 │ │
│  │    where: { id: productId },                                   │ │
│  │    data: { stock: { decrement: quantity } }                    │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  // Update many                                                │ │
│  │  await prisma.notification.updateMany({                        │ │
│  │    where: { userId: userId, isRead: false },                   │ │
│  │    data: { isRead: true }                                      │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  4. DELETE OPERATIONS                                          │ │
│  │                                                                 │ │
│  │  // Delete single record                                       │ │
│  │  await prisma.cartItem.delete({                                │ │
│  │    where: { id: cartItemId }                                   │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  // Delete many                                                │ │
│  │  await prisma.cartItem.deleteMany({                            │ │
│  │    where: { userId: userId }                                   │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  5. TRANSACTIONS                                               │ │
│  │                                                                 │ │
│  │  await prisma.$transaction(async (tx) => {                     │ │
│  │    // Create order                                             │ │
│  │    const order = await tx.order.create({ ... })                │ │
│  │                                                                 │ │
│  │    // Update stock                                             │ │
│  │    for (const item of items) {                                 │ │
│  │      await tx.product.update({                                 │ │
│  │        where: { id: item.productId },                          │ │
│  │        data: { stock: { decrement: item.quantity } }           │ │
│  │      })                                                         │ │
│  │    }                                                            │ │
│  │                                                                 │ │
│  │    // Clear cart                                               │ │
│  │    await tx.cartItem.deleteMany({                              │ │
│  │      where: { userId: userId }                                 │ │
│  │    })                                                           │ │
│  │                                                                 │ │
│  │    return order                                                │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  6. AGGREGATIONS                                               │ │
│  │                                                                 │ │
│  │  // Count records                                              │ │
│  │  const count = await prisma.product.count({                    │ │
│  │    where: { categoryId: categoryId }                           │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  // Aggregate functions                                        │ │
│  │  const stats = await prisma.order.aggregate({                  │ │
│  │    where: { status: 'delivered' },                             │ │
│  │    _sum: { total: true },                                      │ │
│  │    _avg: { total: true },                                      │ │
│  │    _count: true                                                │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  7. RAW QUERIES (when needed)                                  │ │
│  │                                                                 │ │
│  │  const result = await prisma.$queryRaw`                        │ │
│  │    SELECT * FROM products                                      │ │
│  │    WHERE name ILIKE ${`%${search}%`}                           │ │
│  │    LIMIT ${limit}                                              │ │
│  │  `                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  RELATION LOADING                                              │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  // Include relations                                          │ │
│  │  const order = await prisma.order.findUnique({                 │ │
│  │    where: { id: orderId },                                     │ │
│  │    include: {                                                  │ │
│  │      orderItems: {                                             │ │
│  │        include: {                                              │ │
│  │          product: true                                         │ │
│  │        }                                                        │ │
│  │      },                                                         │ │
│  │      user: {                                                   │ │
│  │        select: {                                               │ │
│  │          id: true,                                             │ │
│  │          name: true,                                           │ │
│  │          email: true                                           │ │
│  │        }                                                        │ │
│  │      }                                                          │ │
│  │    }                                                            │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  │  // Select specific fields                                     │ │
│  │  const products = await prisma.product.findMany({              │ │
│  │    select: {                                                   │ │
│  │      id: true,                                                 │ │
│  │      name: true,                                               │ │
│  │      price: true,                                              │ │
│  │      images: true,                                             │ │
│  │      category: {                                               │ │
│  │        select: { name: true, slug: true }                      │ │
│  │      }                                                          │ │
│  │    }                                                            │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```


---

## 7. LỚP DATABASE

### 7.1 Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                                │
│                        (PostgreSQL)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  CORE TABLES (User & Authentication)                           │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  users                                                          │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ email: VARCHAR(255) UNIQUE                                 │ │
│  │  ├─ password: VARCHAR(255)                                     │ │
│  │  ├─ name: VARCHAR(255)                                         │ │
│  │  ├─ avatar: TEXT                                               │ │
│  │  ├─ phone: VARCHAR(20)                                         │ │
│  │  ├─ address: TEXT                                              │ │
│  │  ├─ role: ENUM (user, admin, sales, warehouse)                │ │
│  │  ├─ points: INTEGER DEFAULT 0                                  │ │
│  │  ├─ tier: VARCHAR(20) DEFAULT 'bronze'                         │ │
│  │  ├─ total_spent: DECIMAL(15,2) DEFAULT 0                       │ │
│  │  ├─ order_count: INTEGER DEFAULT 0                             │ │
│  │  ├─ is_active: BOOLEAN DEFAULT true                            │ │
│  │  ├─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │  └─ note: TEXT                                                 │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  ├─ idx_users_email ON (email)                                 │ │
│  │  ├─ idx_users_role ON (role)                                   │ │
│  │  ├─ idx_users_tier ON (tier)                                   │ │
│  │  └─ idx_users_points ON (points)                               │ │
│  │                                                                 │ │
│  │  pending_registrations                                         │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ email: VARCHAR(255) UNIQUE                                 │ │
│  │  ├─ password: VARCHAR(255)                                     │ │
│  │  ├─ name: VARCHAR(255)                                         │ │
│  │  ├─ otp: VARCHAR(6)                                            │ │
│  │  ├─ otp_hash: VARCHAR(255)                                     │ │
│  │  ├─ expires_at: TIMESTAMP                                      │ │
│  │  ├─ attempts: INTEGER DEFAULT 0                                │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  password_resets                                               │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ email: VARCHAR(255) UNIQUE                                 │ │
│  │  ├─ otp_hash: VARCHAR(255)                                     │ │
│  │  ├─ expires_at: TIMESTAMP                                      │ │
│  │  ├─ attempts: INTEGER DEFAULT 0                                │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  PRODUCT TABLES                                                │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  categories                                                     │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ name: VARCHAR(255)                                         │ │
│  │  ├─ slug: VARCHAR(255) UNIQUE                                  │ │
│  │  ├─ icon: VARCHAR(100)                                         │ │
│  │  ├─ description: TEXT                                          │ │
│  │  ├─ product_count: INTEGER DEFAULT 0                           │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  products                                                       │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ name: VARCHAR(255)                                         │ │
│  │  ├─ slug: VARCHAR(255) UNIQUE                                  │ │
│  │  ├─ description: TEXT                                          │ │
│  │  ├─ price: DECIMAL(15,2)                                       │ │
│  │  ├─ original_price: DECIMAL(15,2)                              │ │
│  │  ├─ images: TEXT[] DEFAULT '{}'                                │ │
│  │  ├─ category_id: UUID (FK → categories)                        │ │
│  │  ├─ brand: VARCHAR(255)                                        │ │
│  │  ├─ specs: JSONB DEFAULT '{}'                                  │ │
│  │  ├─ stock: INTEGER DEFAULT 0                                   │ │
│  │  ├─ rating: DECIMAL(2,1) DEFAULT 0                             │ │
│  │  ├─ review_count: INTEGER DEFAULT 0                            │ │
│  │  ├─ is_new: BOOLEAN DEFAULT false                              │ │
│  │  ├─ is_featured: BOOLEAN DEFAULT false                         │ │
│  │  ├─ discount: INTEGER DEFAULT 0                                │ │
│  │  ├─ low_stock_threshold: INTEGER DEFAULT 10                    │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  ├─ idx_products_slug ON (slug)                                │ │
│  │  ├─ idx_products_category ON (category_id)                     │ │
│  │  ├─ idx_products_price ON (price)                              │ │
│  │  └─ idx_products_stock ON (stock)                              │ │
│  │                                                                 │ │
│  │  stock_transactions                                            │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ product_id: UUID (FK → products)                           │ │
│  │  ├─ user_id: UUID (FK → users)                                 │ │
│  │  ├─ type: ENUM (import, export, adjust, order, return)        │ │
│  │  ├─ quantity: INTEGER                                          │ │
│  │  ├─ reason: VARCHAR(500)                                       │ │
│  │  ├─ reference: VARCHAR(255)                                    │ │
│  │  ├─ stock_before: INTEGER                                      │ │
│  │  ├─ stock_after: INTEGER                                       │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  ├─ idx_stock_product ON (product_id)                          │ │
│  │  ├─ idx_stock_user ON (user_id)                                │ │
│  │  ├─ idx_stock_created ON (created_at DESC)                     │ │
│  │  └─ idx_stock_type ON (type)                                   │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  ORDER TABLES                                                  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  orders                                                         │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users)                                 │ │
│  │  ├─ total: DECIMAL(15,2)                                       │ │
│  │  ├─ subtotal: DECIMAL(12,2)                                    │ │
│  │  ├─ shipping_fee: DECIMAL(12,2) DEFAULT 0                      │ │
│  │  ├─ discount_amount: DECIMAL(15,2) DEFAULT 0                   │ │
│  │  ├─ status: ENUM (pending, awaiting_payment, confirmed,        │ │
│  │  │                 shipping, delivered, cancelled)             │ │
│  │  ├─ shipping_address: TEXT                                     │ │
│  │  ├─ recipient_name: VARCHAR(255)                               │ │
│  │  ├─ phone: VARCHAR(20)                                         │ │
│  │  ├─ payment_method: VARCHAR(100)                               │ │
│  │  ├─ promotion_id: UUID (FK → promotions)                       │ │
│  │  ├─ tracking_code: VARCHAR(100)                                │ │
│  │  ├─ shipping_carrier: VARCHAR(100)                             │ │
│  │  ├─ note: TEXT                                                 │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  ├─ idx_orders_user ON (user_id)                               │ │
│  │  ├─ idx_orders_status ON (status)                              │ │
│  │  ├─ idx_orders_created ON (created_at DESC)                    │ │
│  │  └─ idx_orders_created_status ON (created_at DESC, status)     │ │
│  │                                                                 │ │
│  │  order_items                                                    │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ order_id: UUID (FK → orders) ON DELETE CASCADE             │ │
│  │  ├─ product_id: UUID (FK → products)                           │ │
│  │  ├─ quantity: INTEGER                                          │ │
│  │  └─ price: DECIMAL(15,2)                                       │ │
│  │                                                                 │ │
│  │  cart_items                                                     │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users) ON DELETE CASCADE               │ │
│  │  ├─ product_id: UUID (FK → products) ON DELETE CASCADE         │ │
│  │  ├─ quantity: INTEGER DEFAULT 1                                │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  ├─ idx_cart_user ON (user_id)                                 │ │
│  │  └─ UNIQUE idx_cart_user_product ON (user_id, product_id)      │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  REVIEW & WISHLIST TABLES                                      │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  reviews                                                        │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users)                                 │ │
│  │  ├─ product_id: UUID (FK → products) ON DELETE CASCADE         │ │
│  │  ├─ rating: INTEGER (1-5)                                      │ │
│  │  ├─ comment: TEXT                                              │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  review_images                                                 │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ review_id: UUID (FK → reviews) ON DELETE CASCADE           │ │
│  │  ├─ url: TEXT                                                  │ │
│  │  ├─ public_id: VARCHAR(255)                                    │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  wishlist                                                       │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users) ON DELETE CASCADE               │ │
│  │  ├─ product_id: UUID (FK → products) ON DELETE CASCADE         │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  ├─ idx_wishlist_user ON (user_id)                             │ │
│  │  └─ UNIQUE idx_wishlist_user_product ON (user_id, product_id)  │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  NOTIFICATION & CHAT TABLES                                    │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  notifications                                                  │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users) ON DELETE CASCADE               │ │
│  │  ├─ type: VARCHAR(50)                                          │ │
│  │  ├─ title: VARCHAR(255)                                        │ │
│  │  ├─ message: TEXT                                              │ │
│  │  ├─ data: JSONB                                                │ │
│  │  ├─ is_read: BOOLEAN DEFAULT false                             │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  Indexes:                                                       │ │
│  │  └─ idx_notifications_user_read ON (user_id, is_read)          │ │
│  │                                                                 │ │
│  │  push_subscriptions                                            │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users) ON DELETE CASCADE               │ │
│  │  ├─ endpoint: TEXT UNIQUE                                      │ │
│  │  ├─ p256dh: TEXT                                               │ │
│  │  ├─ auth: VARCHAR(255)                                         │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  chat_sessions                                                 │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users) ON DELETE CASCADE               │ │
│  │  ├─ staff_id: UUID (FK → users)                                │ │
│  │  ├─ status: ENUM (waiting, active, closed)                     │ │
│  │  ├─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │  └─ closed_at: TIMESTAMP                                       │ │
│  │                                                                 │ │
│  │  chat_messages                                                 │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ session_id: UUID (FK → chat_sessions) ON DELETE CASCADE    │ │
│  │  ├─ sender_id: UUID (FK → users) ON DELETE CASCADE             │ │
│  │  ├─ content: TEXT                                              │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  PROMOTION & LOYALTY TABLES                                    │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  promotions                                                     │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ code: VARCHAR(50) UNIQUE                                   │ │
│  │  ├─ name: VARCHAR(255)                                         │ │
│  │  ├─ description: TEXT                                          │ │
│  │  ├─ type: VARCHAR(20) (percentage, fixed)                      │ │
│  │  ├─ value: DECIMAL(12,2)                                       │ │
│  │  ├─ min_order_value: DECIMAL(12,2) DEFAULT 0                   │ │
│  │  ├─ max_discount: DECIMAL(12,2)                                │ │
│  │  ├─ usage_limit: INTEGER                                       │ │
│  │  ├─ used_count: INTEGER DEFAULT 0                              │ │
│  │  ├─ start_date: TIMESTAMP                                      │ │
│  │  ├─ end_date: TIMESTAMP                                        │ │
│  │  ├─ is_active: BOOLEAN DEFAULT true                            │ │
│  │  ├─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │  └─ updated_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  promotion_usage                                               │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ promotion_id: UUID (FK → promotions) ON DELETE CASCADE     │ │
│  │  ├─ user_id: UUID (FK → users)                                 │ │
│  │  ├─ order_id: UUID (FK → orders)                               │ │
│  │  ├─ discount_amount: DECIMAL(12,2)                             │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  │  points_history                                                │ │
│  │  ├─ id: UUID (PK)                                              │ │
│  │  ├─ user_id: UUID (FK → users)                                 │ │
│  │  ├─ points: INTEGER                                            │ │
│  │  ├─ type: VARCHAR(50) (earned, redeemed, expired)              │ │
│  │  ├─ description: TEXT                                          │ │
│  │  ├─ order_id: UUID (FK → orders)                               │ │
│  │  └─ created_at: TIMESTAMP DEFAULT NOW()                        │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```


---

## 8. LUỒNG DỮ LIỆU GIỮA CÁC LỚP

### 8.1 Ví dụ 1: Đặt hàng (Create Order)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LUỒNG ĐẶT HÀNG (CREATE ORDER)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  USER ACTION: Click "Đặt hàng" button                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. PRESENTATION LAYER (Frontend)                              │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  checkout/page.tsx                                             │ │
│  │  ├─ User fills checkout form                                   │ │
│  │  ├─ Validate form data (React Hook Form + Zod)                 │ │
│  │  ├─ Get cart items from CartContext                            │ │
│  │  ├─ Calculate total                                            │ │
│  │  └─ Call API: POST /api/orders                                 │ │
│  │                                                                 │ │
│  │  Request Body:                                                 │ │
│  │  {                                                              │ │
│  │    recipientName: "Nguyễn Văn A",                              │ │
│  │    phone: "0123456789",                                        │ │
│  │    shippingAddress: "123 Đường ABC, Quận 1, TP.HCM",           │ │
│  │    paymentMethod: "cash",                                      │ │
│  │    promotionCode: "SUMMER2024",                                │ │
│  │    note: "Giao giờ hành chính"                                 │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                          │                                           │
│                          │ HTTP POST                                 │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  2. API GATEWAY LAYER (Middleware)                             │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  Security Middleware:                                          │ │
│  │  ├─ Check CORS                                                 │ │
│  │  ├─ Check rate limit                                           │ │
│  │  └─ Check security headers                                     │ │
│  │                                                                 │ │
│  │  Authentication Middleware:                                    │ │
│  │  ├─ Extract JWT token from header                              │ │
│  │  ├─ Verify token                                               │ │
│  │  ├─ Decode user info                                           │ │
│  │  └─ Attach to req.user                                         │ │
│  │                                                                 │ │
│  │  Validation Middleware:                                        │ │
│  │  ├─ Validate request body (Zod schema)                         │ │
│  │  ├─ Sanitize input                                             │ │
│  │  └─ Check required fields                                      │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                          │                                           │
│                          │ Validated Request                         │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  3. CONTROLLER LAYER                                           │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  routes/orders.ts - createOrder()                              │ │
│  │  ├─ Extract data from req.body                                 │ │
│  │  ├─ Get userId from req.user                                   │ │
│  │  ├─ Call OrderService.createOrder()                            │ │
│  │  ├─ Handle errors                                              │ │
│  │  └─ Return response                                            │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                          │                                           │
│                          │ Business Logic Call                       │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  4. SERVICE LAYER                                              │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  OrderService.createOrder():                                   │ │
│  │                                                                 │ │
│  │  Step 1: Get cart items                                        │ │
│  │  ├─ Query cart_items by userId                                 │ │
│  │  ├─ Include product details                                    │ │
│  │  └─ Validate cart not empty                                    │ │
│  │                                                                 │ │
│  │  Step 2: Validate stock availability                           │ │
│  │  ├─ For each cart item:                                        │ │
│  │  │  ├─ Check product.stock >= item.quantity                    │ │
│  │  │  └─ Throw error if insufficient                             │ │
│  │                                                                 │ │
│  │  Step 3: Apply promotion (if provided)                         │ │
│  │  ├─ Find promotion by code                                     │ │
│  │  ├─ Validate promotion:                                        │ │
│  │  │  ├─ is_active = true                                        │ │
│  │  │  ├─ start_date <= now <= end_date                           │ │
│  │  │  ├─ usage_limit not exceeded                                │ │
│  │  │  └─ min_order_value <= subtotal                             │ │
│  │  ├─ Calculate discount                                         │ │
│  │  └─ Apply max_discount limit                                   │ │
│  │                                                                 │ │
│  │  Step 4: Calculate totals                                      │ │
│  │  ├─ subtotal = sum(item.price * item.quantity)                 │ │
│  │  ├─ shipping_fee = ShippingService.calculate()                 │ │
│  │  ├─ discount_amount = calculated discount                      │ │
│  │  └─ total = subtotal + shipping_fee - discount_amount          │ │
│  │                                                                 │ │
│  │  Step 5: Create order (Transaction)                            │ │
│  │  ├─ Start database transaction                                 │ │
│  │  ├─ Create order record                                        │ │
│  │  ├─ Create order_items records                                 │ │
│  │  ├─ Update product stock (decrement)                           │ │
│  │  ├─ Create stock_transactions records                          │ │
│  │  ├─ Update promotion used_count                                │ │
│  │  ├─ Create promotion_usage record                              │ │
│  │  ├─ Clear cart_items                                           │ │
│  │  ├─ Add points to user                                         │ │
│  │  ├─ Create points_history record                               │ │
│  │  ├─ Update user.total_spent                                    │ │
│  │  ├─ Update user.order_count                                    │ │
│  │  ├─ Commit transaction                                         │ │
│  │  └─ Rollback on error                                          │ │
│  │                                                                 │ │
│  │  Step 6: Post-order actions                                    │ │
│  │  ├─ EmailService.sendOrderConfirmation()                       │ │
│  │  ├─ NotificationService.notifyNewOrder()                       │ │
│  │  ├─ Socket.io emit 'order:new' to staff room                   │ │
│  │  └─ Invalidate cache (cart, products)                          │ │
│  │                                                                 │ │
│  │  Step 7: Return order                                          │ │
│  │  └─ Return created order with items                            │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                          │                                           │
│                          │ Database Queries                          │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  5. DATA ACCESS LAYER (Prisma)                                │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  await prisma.$transaction(async (tx) => {                     │ │
│  │    // Create order                                             │ │
│  │    const order = await tx.order.create({                       │ │
│  │      data: {                                                   │ │
│  │        userId,                                                 │ │
│  │        total,                                                  │ │
│  │        subtotal,                                               │ │
│  │        shippingFee,                                            │ │
│  │        discountAmount,                                         │ │
│  │        status: 'pending',                                      │ │
│  │        shippingAddress,                                        │ │
│  │        recipientName,                                          │ │
│  │        phone,                                                  │ │
│  │        paymentMethod,                                          │ │
│  │        promotionId,                                            │ │
│  │        note,                                                   │ │
│  │        orderItems: {                                           │ │
│  │          create: cartItems.map(item => ({                      │ │
│  │            productId: item.productId,                          │ │
│  │            quantity: item.quantity,                            │ │
│  │            price: item.product.price                           │ │
│  │          }))                                                    │ │
│  │        }                                                        │ │
│  │      },                                                         │ │
│  │      include: { orderItems: { include: { product: true } } }   │ │
│  │    })                                                           │ │
│  │                                                                 │ │
│  │    // Update stock                                             │ │
│  │    for (const item of cartItems) {                             │ │
│  │      await tx.product.update({                                 │ │
│  │        where: { id: item.productId },                          │ │
│  │        data: { stock: { decrement: item.quantity } }           │ │
│  │      })                                                         │ │
│  │    }                                                            │ │
│  │                                                                 │ │
│  │    // Clear cart                                               │ │
│  │    await tx.cartItem.deleteMany({                              │ │
│  │      where: { userId }                                         │ │
│  │    })                                                           │ │
│  │                                                                 │ │
│  │    // Update user                                              │ │
│  │    await tx.user.update({                                      │ │
│  │      where: { id: userId },                                    │ │
│  │      data: {                                                   │ │
│  │        points: { increment: earnedPoints },                    │ │
│  │        totalSpent: { increment: total },                       │ │
│  │        orderCount: { increment: 1 }                            │ │
│  │      }                                                          │ │
│  │    })                                                           │ │
│  │                                                                 │ │
│  │    return order                                                │ │
│  │  })                                                             │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                          │                                           │
│                          │ SQL Queries                               │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  6. DATABASE LAYER (PostgreSQL)                                │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  BEGIN TRANSACTION;                                            │ │
│  │                                                                 │ │
│  │  INSERT INTO orders (...)                                      │ │
│  │  VALUES (...);                                                 │ │
│  │                                                                 │ │
│  │  INSERT INTO order_items (...)                                 │ │
│  │  VALUES (...), (...), (...);                                   │ │
│  │                                                                 │ │
│  │  UPDATE products                                               │ │
│  │  SET stock = stock - quantity                                  │ │
│  │  WHERE id IN (...);                                            │ │
│  │                                                                 │ │
│  │  DELETE FROM cart_items                                        │ │
│  │  WHERE user_id = ...;                                          │ │
│  │                                                                 │ │
│  │  UPDATE users                                                  │ │
│  │  SET points = points + ...,                                    │ │
│  │      total_spent = total_spent + ...,                          │ │
│  │      order_count = order_count + 1                             │ │
│  │  WHERE id = ...;                                               │ │
│  │                                                                 │ │
│  │  COMMIT;                                                        │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                          │                                           │
│                          │ Return Data                               │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  7. RESPONSE FLOW (Back to Frontend)                           │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │                                                                 │ │
│  │  Controller formats response:                                  │ │
│  │  {                                                              │ │
│  │    success: true,                                              │ │
│  │    data: {                                                     │ │
│  │      id: "uuid",                                               │ │
│  │      total: 250000,                                            │ │
│  │      status: "pending",                                        │ │
│  │      orderItems: [...],                                        │ │
│  │      createdAt: "2026-01-30T..."                               │ │
│  │    },                                                           │ │
│  │    message: "Đặt hàng thành công"                              │ │
│  │  }                                                              │ │
│  │                                                                 │ │
│  │  Frontend receives response:                                   │ │
│  │  ├─ Clear cart context                                         │ │
│  │  ├─ Show success toast                                         │ │
│  │  ├─ Redirect to order detail page                              │ │
│  │  └─ Update order count in header                               │ │
│  │                                                                 │ │
│  │  Real-time updates:                                            │ │
│  │  ├─ Staff receives Socket.io event 'order:new'                 │ │
│  │  ├─ Kitchen display updates                                    │ │
│  │  └─ Notification bell updates                                  │ │
│  │                                                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Ví dụ 2: AI Chatbot Query

```
┌─────────────────────────────────────────────────────────────────────┐
│                  LUỒNG AI CHATBOT (Product Inquiry)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  USER ACTION: "Có cà phê nào đang giảm giá không?"                   │
│                                                                      │
│  Frontend → API → ChatbotService → GeminiService → Database          │
│                                                                      │
│  1. Search knowledge base                                            │
│  2. If not found, extract keywords: ["cà phê", "giảm giá"]           │
│  3. Search products with discount                                    │
│  4. Build context with product info                                  │
│  5. Call Gemini AI with context                                      │
│  6. Return AI response with product recommendations                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## KẾT LUẬN

Tài liệu này trình bày chi tiết **Sơ đồ phân lớp** của hệ thống NHH-Coffee với 6 lớp chính:

1. **Lớp Presentation (Frontend)**: Pages, Components, Contexts, Hooks, API Client
2. **Lớp API Gateway**: Security, Authentication, Authorization, Validation
3. **Lớp Controller**: Request handling, Response formatting
4. **Lớp Service**: Business logic, External integrations
5. **Lớp Data Access**: Prisma ORM, Database queries
6. **Lớp Database**: PostgreSQL schema, Relationships, Indexes

Mỗi lớp có trách nhiệm rõ ràng, tách biệt và giao tiếp thông qua interface được định nghĩa rõ ràng. Kiến trúc này đảm bảo:

- **Maintainability**: Dễ bảo trì và mở rộng
- **Testability**: Dễ dàng test từng lớp độc lập
- **Scalability**: Có thể scale từng lớp riêng biệt
- **Reusability**: Code có thể tái sử dụng
- **Separation of Concerns**: Mỗi lớp có trách nhiệm riêng

---

**Tài liệu được tạo cho đồ án tốt nghiệp**  
**Hệ thống: NHH-Coffee E-commerce & POS**  
**Ngày cập nhật: 2026-01-30**
