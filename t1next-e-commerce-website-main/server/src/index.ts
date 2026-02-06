import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import path from 'path'
import { config } from './config/index.js'
import { sendStockAlertNotifications } from './routes/notifications.js'
import { checkAndNotifyWishlistSales } from './services/wishlist-sale.service.js'
import { initializeSocketServer } from './socket/index.js'
import { initializeChatHandlers } from './socket/chat.handler.js'
import { setupSwagger } from './docs/swagger.js'

// Routes
import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import categoriesRoutes from './routes/categories.js'
import cartRoutes from './routes/cart.js'
import ordersRoutes from './routes/orders.js'
import reviewsRoutes from './routes/reviews.js'
import adminRoutes from './routes/admin/index.js'
import warehouseRoutes from './routes/warehouse/index.js'
import checkoutRoutes from './routes/checkout.js'
import paymentRoutes from './routes/payment.js'
import uploadRoutes from './routes/upload.js'
import wishlistRoutes from './routes/wishlist.js'
import posRoutes from './routes/pos.js'
import promotionsRoutes from './routes/promotions.js'
import reportsRoutes from './routes/reports.js'
import customersRoutes from './routes/customers.js'
import stockAlertsRoutes from './routes/stock-alerts.js'
import notificationsRoutes from './routes/notifications.js'
import chatRoutes from './routes/chat.js'
import qaRoutes from './routes/qa.js'
import addressesRoutes from './routes/addresses.js'
import orderNotesRoutes from './routes/order-notes.js'
import pointsRoutes from './routes/points.js'
import shippingRoutes from './routes/shipping.js'
import invoiceRoutes from './routes/invoice.js'
import pushRoutes from './routes/push.js'
import settingsRoutes from './routes/settings.js'
import tablesRoutes from './routes/tables.js'
import shiftsRoutes from './routes/shifts.js'
import kitchenRoutes from './routes/kitchen.js'
import chatbotRoutes from './routes/chatbot.js'
import chatbotKnowledgeRoutes from './routes/chatbot-knowledge.js'
import { csrfRouter } from './middleware/csrf.js'
import { securityHeaders, additionalSecurityHeaders } from './middleware/security.js'

const app = express()
const httpServer = createServer(app)

// Security Headers - Requirements: 6.1
app.use(securityHeaders)
app.use(additionalSecurityHeaders)

// Middleware
// CORS Configuration - Requirements: 6.4
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true)
    }
    
    const allowedOrigins = config.cors.origin
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // In development, allow localhost with any port
    if (config.nodeEnv === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true)
    }
    
    callback(new Error('Not allowed by CORS'))
  },
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: config.cors.exposedHeaders,
  maxAge: config.cors.maxAge,
}))
app.use(express.json({ limit: '10mb' })) // Limit request body size

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Setup Swagger API Documentation - Requirements: 7.3, 7.4
setupSwagger(app)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/warehouse', warehouseRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/pos', posRoutes)
app.use('/api/promotions', promotionsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/stock-alerts', stockAlertsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/qa', qaRoutes)
app.use('/api/addresses', addressesRoutes)
app.use('/api/order-notes', orderNotesRoutes)
app.use('/api/points', pointsRoutes)
app.use('/api/shipping', shippingRoutes)
app.use('/api/invoice', invoiceRoutes)
app.use('/api/push', pushRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/tables', tablesRoutes)
app.use('/api/shifts', shiftsRoutes)
app.use('/api/kitchen', kitchenRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/chatbot-knowledge', chatbotKnowledgeRoutes)
app.use('/api', csrfRouter) // CSRF token endpoint

// Initialize Socket.io
const io = initializeSocketServer(httpServer)
initializeChatHandlers(io)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

// Start server
httpServer.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`)
  console.log(`📝 Environment: ${config.nodeEnv}`)
  
  // Send stock alerts on startup and every hour
  sendStockAlertNotifications().catch(console.error)
  setInterval(() => {
    sendStockAlertNotifications().catch(console.error)
  }, 60 * 60 * 1000) // Every hour

  // Check wishlist sales on startup and every hour
  checkAndNotifyWishlistSales().catch(console.error)
  setInterval(() => {
    checkAndNotifyWishlistSales().catch(console.error)
  }, 60 * 60 * 1000) // Every hour
})
