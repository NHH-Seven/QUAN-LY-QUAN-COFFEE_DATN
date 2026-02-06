import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import adminRoutes from './index.js'
import { config } from '../../config/index.js'
import { afterEach } from 'node:test'


/**
 * Integration Tests for Admin Routes
 * 
 * **Feature: admin-dashboard**
 * 
 * Tests the admin functionality including:
 * - Role-based access control (Requirements: 1.1, 1.4)
 * - CRUD operations for products, orders, users, categories
 * - Error handling
 */

const prisma = new PrismaClient()
let app: Express

// Test tokens
let adminToken: string
let userToken: string

// Test data IDs
let testCategoryId: string
let testProductId: string
let testUserId: string
let testOrderId: string

// Helper to generate JWT token
function generateToken(userId: string, email: string, role: 'admin' | 'user'): string {
  return jwt.sign({ userId, email, role }, config.jwt.secret, { expiresIn: '1h' })
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  
  app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  
  // Generate test tokens
  adminToken = generateToken('admin-test-id', 'admin@test.com', 'admin')
  userToken = generateToken('user-test-id', 'user@test.com', 'user')
})

afterAll(async () => {
  // Cleanup test data - use camelCase for Prisma field names
  await prisma.orderItem.deleteMany({ where: { order: { shippingAddress: { contains: 'TEST-ADDRESS' } } } })
  await prisma.order.deleteMany({ where: { shippingAddress: { contains: 'TEST-ADDRESS' } } })
  await prisma.product.deleteMany({ where: { name: { contains: 'TEST-PRODUCT' } } })
  await prisma.category.deleteMany({ where: { name: { contains: 'TEST-CATEGORY' } } })
  await prisma.user.deleteMany({ where: { email: { contains: 'admin-test' } } })
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up before each test - use camelCase for Prisma field names
  await prisma.orderItem.deleteMany({ where: { order: { shippingAddress: { contains: 'TEST-ADDRESS' } } } })
  await prisma.order.deleteMany({ where: { shippingAddress: { contains: 'TEST-ADDRESS' } } })
  await prisma.product.deleteMany({ where: { name: { contains: 'TEST-PRODUCT' } } })
  await prisma.category.deleteMany({ where: { name: { contains: 'TEST-CATEGORY' } } })
})


/**
 * Test 1: Role-Based Access Control
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
describe('1. Role-Based Access Control', () => {
  it('should reject requests without authorization header', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .expect(401)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Unauthorized')
  })

  it('should reject requests with invalid token', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Invalid token')
  })

  it('should reject requests from non-admin users (403)', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Không có quyền truy cập')
  })

  it('should allow requests from admin users', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toBeDefined()
  })
})

/**
 * Test 2: Admin Stats Endpoint
 * 
 * **Validates: Requirements 2.1-2.6**
 */
describe('2. Admin Stats Endpoint', () => {
  it('should return dashboard stats with correct structure', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const { data } = response.body
    
    // Revenue stats
    expect(data.revenue).toBeDefined()
    expect(typeof data.revenue.today).toBe('number')
    expect(typeof data.revenue.week).toBe('number')
    expect(typeof data.revenue.month).toBe('number')
    expect(typeof data.revenue.total).toBe('number')
    
    // Orders stats
    expect(data.orders).toBeDefined()
    expect(typeof data.orders.pending).toBe('number')
    expect(typeof data.orders.confirmed).toBe('number')
    expect(typeof data.orders.shipping).toBe('number')
    expect(typeof data.orders.delivered).toBe('number')
    expect(typeof data.orders.cancelled).toBe('number')
    
    // Users stats
    expect(data.users).toBeDefined()
    expect(typeof data.users.total).toBe('number')
    expect(typeof data.users.newThisMonth).toBe('number')
    
    // Products stats
    expect(data.products).toBeDefined()
    expect(typeof data.products.total).toBe('number')
    expect(typeof data.products.lowStock).toBe('number')
    
    // Recent orders and low stock products
    expect(Array.isArray(data.recentOrders)).toBe(true)
    expect(Array.isArray(data.lowStockProducts)).toBe(true)
  })
})


/**
 * Test 3: Category CRUD Operations
 * 
 * **Validates: Requirements 6.1-6.4**
 * Note: Using Prisma for setup since raw SQL in routes doesn't auto-generate UUIDs
 */
describe('3. Category CRUD Operations', () => {
  it('should get all categories with product count', async () => {
    const response = await request(app)
      .get('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('should update a category', async () => {
    // Create category using Prisma (works correctly)
    const category = await prisma.category.create({
      data: { name: 'TEST-CATEGORY-Update', slug: `test-cat-update-${Date.now()}` }
    })

    // Update via API
    const response = await request(app)
      .put(`/api/admin/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'TEST-CATEGORY-Updated', description: 'Updated description' })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.name).toBe('TEST-CATEGORY-Updated')
    expect(response.body.data.description).toBe('Updated description')

    // Cleanup
    await prisma.category.delete({ where: { id: category.id } })
  })

  it('should delete a category without products', async () => {
    // Create category using Prisma
    const category = await prisma.category.create({
      data: { name: 'TEST-CATEGORY-Delete', slug: `test-cat-delete-${Date.now()}` }
    })

    // Delete via API
    const response = await request(app)
      .delete(`/api/admin/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.message).toBe('Danh mục đã được xóa')
  })

  it('should return 404 for non-existent category', async () => {
    const response = await request(app)
      .put('/api/admin/categories/non-existent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' })
      .expect(404)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Danh mục không tồn tại')
  })

  it('should reject deleting category with products', async () => {
    // Create category
    const category = await prisma.category.create({
      data: { name: 'TEST-CATEGORY-WithProd', slug: `test-cat-withprod-${Date.now()}` }
    })

    // Create product in category
    const product = await prisma.product.create({
      data: {
        name: 'TEST-PRODUCT-InCat',
        slug: `test-prod-incat-${Date.now()}`,
        price: 100000,
        stock: 10,
        categoryId: category.id
      }
    })

    // Try to delete category
    const response = await request(app)
      .delete(`/api/admin/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Không thể xóa danh mục có sản phẩm')

    // Cleanup
    await prisma.product.delete({ where: { id: product.id } })
    await prisma.category.delete({ where: { id: category.id } })
  })
})


/**
 * Test 4: Product CRUD Operations
 * 
 * **Validates: Requirements 3.1-3.6**
 * Note: Using Prisma for setup since raw SQL in routes doesn't auto-generate UUIDs
 */
describe('4. Product CRUD Operations', () => {
  let categoryId: string

  beforeEach(async () => {
    // Create a category using Prisma (works correctly)
    const category = await prisma.category.create({
      data: { name: 'TEST-CATEGORY-ForProducts', slug: `test-cat-forprod-${Date.now()}` }
    })
    categoryId = category.id
  })

  afterEach(async () => {
    await prisma.product.deleteMany({ where: { name: { contains: 'TEST-PRODUCT' } } })
    await prisma.category.deleteMany({ where: { name: { contains: 'TEST-CATEGORY-ForProducts' } } })
  })

  it('should get paginated product list', async () => {
    // Create a product using Prisma
    await prisma.product.create({
      data: {
        name: 'TEST-PRODUCT-List',
        slug: `test-prod-list-${Date.now()}`,
        price: 100000,
        stock: 10,
        categoryId
      }
    })

    const response = await request(app)
      .get('/api/admin/products?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(10)
    expect(typeof response.body.total).toBe('number')
    expect(typeof response.body.totalPages).toBe('number')
  })

  it('should get single product by ID', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'TEST-PRODUCT-Single',
        slug: `test-prod-single-${Date.now()}`,
        price: 100000,
        stock: 10,
        categoryId
      }
    })

    const response = await request(app)
      .get(`/api/admin/products/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBe(product.id)
    expect(response.body.data.name).toBe('TEST-PRODUCT-Single')
  })

  it('should update a product', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'TEST-PRODUCT-Update',
        slug: `test-prod-update-${Date.now()}`,
        price: 100000,
        stock: 10,
        categoryId
      }
    })

    const response = await request(app)
      .put(`/api/admin/products/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'TEST-PRODUCT-Updated',
        price: 150000,
        stock: 100
      })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.name).toBe('TEST-PRODUCT-Updated')
    expect(Number(response.body.data.price)).toBe(150000)
    expect(response.body.data.stock).toBe(100)
  })

  it('should soft delete a product', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'TEST-PRODUCT-Delete',
        slug: `test-prod-delete-${Date.now()}`,
        price: 100000,
        stock: 10,
        categoryId
      }
    })

    const response = await request(app)
      .delete(`/api/admin/products/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.message).toBe('Sản phẩm đã được xóa')

    // Verify soft delete (stock = -1)
    const deletedProduct = await prisma.product.findUnique({ where: { id: product.id } })
    expect(deletedProduct?.stock).toBe(-1)
  })

  it('should return 404 for non-existent product', async () => {
    const response = await request(app)
      .get('/api/admin/products/non-existent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Sản phẩm không tồn tại')
  })

  it('should reject update with empty data', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'TEST-PRODUCT-EmptyUpdate',
        slug: `test-prod-emptyupdate-${Date.now()}`,
        price: 100000,
        stock: 10,
        categoryId
      }
    })

    const response = await request(app)
      .put(`/api/admin/products/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Không có dữ liệu để cập nhật')
  })
})


/**
 * Test 5: User Management Operations
 * 
 * **Validates: Requirements 5.1-5.5**
 */
describe('5. User Management Operations', () => {
  let testUserIdForUpdate: string

  beforeEach(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `admin-test-user-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user',
        isActive: true
      }
    })
    testUserIdForUpdate = user.id
  })

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'admin-test-user' } } })
  })

  it('should get paginated user list without password field', async () => {
    const response = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.page).toBe(1)
    
    // Verify password is not included
    if (response.body.data.length > 0) {
      expect(response.body.data[0].password).toBeUndefined()
    }
  })

  it('should get user detail with order history', async () => {
    const response = await request(app)
      .get(`/api/admin/users/${testUserIdForUpdate}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBe(testUserIdForUpdate)
    expect(response.body.data.password).toBeUndefined()
    expect(Array.isArray(response.body.data.orders)).toBe(true)
    expect(typeof response.body.data.total_spent).toBe('number')
  })

  it('should update user profile', async () => {
    const response = await request(app)
      .put(`/api/admin/users/${testUserIdForUpdate}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Name',
        phone: '0123456789',
        address: 'New Address'
      })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.name).toBe('Updated Name')
    expect(response.body.data.phone).toBe('0123456789')
    expect(response.body.data.address).toBe('New Address')
  })

  it('should reject invalid role update', async () => {
    const response = await request(app)
      .put(`/api/admin/users/${testUserIdForUpdate}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superadmin' })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Role không hợp lệ')
  })

  it('should deactivate a user', async () => {
    const response = await request(app)
      .put(`/api/admin/users/${testUserIdForUpdate}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.isActive).toBe(false)
    expect(response.body.message).toBe('Vô hiệu hóa tài khoản thành công')
  })

  it('should activate a user', async () => {
    // First deactivate
    await prisma.user.update({
      where: { id: testUserIdForUpdate },
      data: { isActive: false }
    })

    const response = await request(app)
      .put(`/api/admin/users/${testUserIdForUpdate}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.isActive).toBe(true)
    expect(response.body.message).toBe('Kích hoạt tài khoản thành công')
  })

  it('should return 404 for non-existent user', async () => {
    const response = await request(app)
      .get('/api/admin/users/non-existent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Người dùng không tồn tại')
  })
})


/**
 * Test 6: Order Management Operations
 * 
 * **Validates: Requirements 4.1-4.5**
 */
describe('6. Order Management Operations', () => {
  let testOrderIdForStatus: string
  let testUserForOrder: string
  let testProductForOrder: string
  let testCategoryForOrder: string

  beforeEach(async () => {
    // Create test category
    const category = await prisma.category.create({
      data: { name: 'TEST-CATEGORY-Order', slug: `test-cat-order-${Date.now()}` }
    })
    testCategoryForOrder = category.id

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'TEST-PRODUCT-Order',
        slug: `test-prod-order-${Date.now()}`,
        price: 100000,
        stock: 50,
        categoryId: category.id
      }
    })
    testProductForOrder = product.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `admin-test-order-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Order Test User',
        role: 'user'
      }
    })
    testUserForOrder = user.id

    // Create test order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: 100000,
        status: 'pending',
        shippingAddress: 'TEST-ADDRESS-123',
        paymentMethod: 'cod',
        recipientName: 'Order Test User',
        phone: '0123456789',
        orderItems: {
          create: {
            productId: product.id,
            quantity: 1,
            price: 100000
          }
        }
      }
    })
    testOrderIdForStatus = order.id
  })

  afterEach(async () => {
    // Delete in correct order due to foreign key constraints
    await prisma.orderItem.deleteMany({})
    await prisma.order.deleteMany({ where: { shippingAddress: { contains: 'TEST-ADDRESS' } } })
    await prisma.product.deleteMany({ where: { name: { contains: 'TEST-PRODUCT-Order' } } })
    await prisma.category.deleteMany({ where: { name: { contains: 'TEST-CATEGORY-Order' } } })
    await prisma.user.deleteMany({ where: { email: { contains: 'admin-test-order' } } })
  })

  it('should get paginated order list', async () => {
    const response = await request(app)
      .get('/api/admin/orders?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.page).toBe(1)
    expect(typeof response.body.total).toBe('number')
  })

  it('should filter orders by status', async () => {
    const response = await request(app)
      .get('/api/admin/orders?status=pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    // All returned orders should have pending status
    response.body.data.forEach((order: { status: string }) => {
      expect(order.status).toBe('pending')
    })
  })

  it('should get order detail with items', async () => {
    const response = await request(app)
      .get(`/api/admin/orders/${testOrderIdForStatus}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBe(testOrderIdForStatus)
    expect(Array.isArray(response.body.data.items)).toBe(true)
    expect(response.body.data.items.length).toBeGreaterThan(0)
  })

  it('should update order status from pending to confirmed', async () => {
    const response = await request(app)
      .put(`/api/admin/orders/${testOrderIdForStatus}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe('confirmed')
  })

  it('should reject invalid status transition', async () => {
    // Try to go from pending directly to delivered (invalid)
    const response = await request(app)
      .put(`/api/admin/orders/${testOrderIdForStatus}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toContain('Không thể chuyển từ trạng thái')
  })

  it('should restore stock when cancelling order', async () => {
    // Get initial stock
    const initialProduct = await prisma.product.findUnique({ where: { id: testProductForOrder } })
    const initialStock = initialProduct?.stock || 0

    // Cancel the order
    const response = await request(app)
      .put(`/api/admin/orders/${testOrderIdForStatus}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe('cancelled')

    // Check stock was restored
    const updatedProduct = await prisma.product.findUnique({ where: { id: testProductForOrder } })
    expect(updatedProduct?.stock).toBe(initialStock + 1)
  })

  it('should return 404 for non-existent order', async () => {
    const response = await request(app)
      .get('/api/admin/orders/non-existent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Đơn hàng không tồn tại')
  })

  it('should reject invalid status value', async () => {
    const response = await request(app)
      .put(`/api/admin/orders/${testOrderIdForStatus}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid-status' })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Trạng thái đơn hàng không hợp lệ')
  })
})


/**
 * Test 7: Error Handling
 * 
 * **Validates: General error handling requirements**
 */
describe('7. Error Handling', () => {
  it('should handle missing required fields gracefully', async () => {
    const response = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Tên danh mục là bắt buộc')
  })

  it('should handle empty update request for category', async () => {
    // Create a category using Prisma
    const category = await prisma.category.create({
      data: { name: 'TEST-CATEGORY-EmptyUpdate', slug: `test-cat-emptyupdate-${Date.now()}` }
    })

    // Try to update with empty body
    const response = await request(app)
      .put(`/api/admin/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Không có dữ liệu để cập nhật')

    // Cleanup
    await prisma.category.delete({ where: { id: category.id } })
  })

  it('should handle invalid boolean for user status', async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `admin-test-bool-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Bool Test User',
        role: 'user'
      }
    })

    const response = await request(app)
      .put(`/api/admin/users/${user.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: 'not-a-boolean' })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('isActive phải là boolean')

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } })
  })

  it('should handle missing status in order update', async () => {
    // Create test data
    const user = await prisma.user.create({
      data: {
        email: `admin-test-status-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Status Test User',
        role: 'user'
      }
    })

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: 100000,
        status: 'pending',
        shippingAddress: 'TEST-ADDRESS-Status',
        paymentMethod: 'cod',
        recipientName: 'Status Test User',
        phone: '0123456789'
      }
    })

    const response = await request(app)
      .put(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Trạng thái là bắt buộc')

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  it('should handle update for non-existent user', async () => {
    const response = await request(app)
      .put('/api/admin/users/non-existent-user-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' })
      .expect(404)

    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Người dùng không tồn tại')
  })
})
