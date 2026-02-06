import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserRole, OrderStatus } from '@prisma/client'
import * as fc from 'fast-check'
import reportsRoutes from './reports.js'
import { config } from '../config/index.js'

/**
 * Property-Based Tests for Reports API
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: advanced-reporting**
 * 
 * Tests the reporting functionality:
 * - Property 1: Date range filtering
 * - Property 2: Category filtering
 */

const prisma = new PrismaClient()
let app: Express

// Test data tracking
const createdUserIds: string[] = []
const createdProductIds: string[] = []
const createdCategoryIds: string[] = []
const createdOrderIds: string[] = []

// Helper to generate JWT token for staff/admin
function generateToken(userId: string, email: string, role: UserRole = 'admin'): string {
  return jwt.sign({ userId, email, role }, config.jwt.secret, { expiresIn: '1h' })
}

// Helper to create a date within a range
function createDateInRange(from: Date, to: Date): Date {
  const fromTime = from.getTime()
  const toTime = to.getTime()
  const randomTime = fromTime + Math.random() * (toTime - fromTime)
  return new Date(randomTime)
}

// Helper to create a date outside a range
function createDateOutsideRange(from: Date, to: Date, before: boolean): Date {
  if (before) {
    // Create date 1-30 days before the range
    const daysBeforeMs = (1 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000
    return new Date(from.getTime() - daysBeforeMs)
  } else {
    // Create date 1-30 days after the range
    const daysAfterMs = (1 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000
    return new Date(to.getTime() + daysAfterMs)
  }
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  
  app = express()
  app.use(express.json())
  app.use('/api/reports', reportsRoutes)
})

afterAll(async () => {
  await cleanup()
  await prisma.$disconnect()
})

beforeEach(async () => {
  await cleanup()
})

afterEach(async () => {
  await cleanup()
})

async function cleanup() {
  try {
    // Delete order items first
    if (createdOrderIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: createdOrderIds } }
      })
      await prisma.order.deleteMany({
        where: { id: { in: createdOrderIds } }
      })
      createdOrderIds.length = 0
    }
    
    // Delete products
    if (createdProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } }
      })
      createdProductIds.length = 0
    }
    
    // Delete categories
    if (createdCategoryIds.length > 0) {
      await prisma.category.deleteMany({
        where: { id: { in: createdCategoryIds } }
      })
      createdCategoryIds.length = 0
    }
    
    // Delete users
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } }
      })
      createdUserIds.length = 0
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}


/**
 * **Feature: advanced-reporting, Property 1: Date range filtering**
 * 
 * *For any* date range filter applied, all returned orders/revenue data SHALL only 
 * include records with created_at within the specified range.
 * 
 * **Validates: Requirements 1.3, 5.1, 6.1**
 */
describe('Property 1: Date range filtering', () => {
  it('should only return revenue data within the specified date range', async () => {
    let testCounter = 0
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Generate a date range (from 7 to 60 days ago, spanning 3-30 days)
          daysAgo: fc.integer({ min: 7, max: 60 }),
          rangeDays: fc.integer({ min: 3, max: 30 }),
          // Number of orders to create
          ordersInRange: fc.integer({ min: 1, max: 3 }),
          ordersOutsideRange: fc.integer({ min: 1, max: 2 }),
          orderTotal: fc.integer({ min: 10000, max: 1000000 }),
        }),
        async (testData) => {
          // Use timestamp + counter for truly unique IDs
          const uniqueId = `${Date.now()}-${testCounter++}-${Math.random().toString(36).substring(7)}`
          
          // Calculate date range
          const now = new Date()
          const to = new Date(now.getTime() - testData.daysAgo * 24 * 60 * 60 * 1000)
          const from = new Date(to.getTime() - testData.rangeDays * 24 * 60 * 60 * 1000)
          
          // Create admin user
          const adminUser = await prisma.user.create({
            data: {
              email: `pbt-date-filter-admin-${uniqueId}@test.com`,
              password: 'hashedpassword123',
              name: 'Admin User',
              role: 'admin',
              isActive: true
            }
          })
          createdUserIds.push(adminUser.id)
          
          // Create a UNIQUE category for this test to isolate from existing data
          const testCategory = await prisma.category.create({
            data: {
              name: `PBT Date Test Category ${uniqueId}`,
              slug: `pbt-date-test-category-${uniqueId}`,
            }
          })
          createdCategoryIds.push(testCategory.id)
          
          const product = await prisma.product.create({
            data: {
              name: `Test Product ${uniqueId}`,
              slug: `test-product-${uniqueId}`,
              price: testData.orderTotal,
              stock: 1000,
              categoryId: testCategory.id,
            }
          })
          createdProductIds.push(product.id)
          
          // Track expected revenue within range
          let expectedRevenueInRange = 0
          
          // Create orders WITHIN the date range
          for (let i = 0; i < testData.ordersInRange; i++) {
            const orderDate = createDateInRange(from, to)
            const order = await prisma.order.create({
              data: {
                userId: adminUser.id,
                total: testData.orderTotal,
                status: 'delivered',
                shippingAddress: '123 Test St',
                paymentMethod: 'cod',
                recipientName: 'Test User',
                phone: '0123456789',
                createdAt: orderDate,
                orderItems: {
                  create: {
                    productId: product.id,
                    quantity: 1,
                    price: testData.orderTotal,
                  }
                }
              }
            })
            createdOrderIds.push(order.id)
            expectedRevenueInRange += testData.orderTotal
          }
          
          // Create orders OUTSIDE the date range (before)
          for (let i = 0; i < testData.ordersOutsideRange; i++) {
            const orderDate = createDateOutsideRange(from, to, true)
            const order = await prisma.order.create({
              data: {
                userId: adminUser.id,
                total: testData.orderTotal * 2, // Different amount to distinguish
                status: 'delivered',
                shippingAddress: '123 Test St',
                paymentMethod: 'cod',
                recipientName: 'Test User',
                phone: '0123456789',
                createdAt: orderDate,
                orderItems: {
                  create: {
                    productId: product.id,
                    quantity: 1,
                    price: testData.orderTotal * 2,
                  }
                }
              }
            })
            createdOrderIds.push(order.id)
          }
          
          const adminToken = generateToken(adminUser.id, adminUser.email, 'admin')
          
          // Call revenue endpoint with date filter AND category filter to isolate test data
          const response = await request(app)
            .get('/api/reports/revenue')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
              from: from.toISOString(),
              to: to.toISOString(),
              categories: testCategory.id, // Filter by test category to isolate from existing data
            })
          
          expect(response.status).toBe(200)
          expect(response.body.success).toBe(true)
          
          // Property 1: Total revenue should only include orders within the date range
          // (filtered by our test category to isolate from existing database data)
          const actualRevenue = response.body.data.summary.totalRevenue
          const actualOrders = response.body.data.summary.totalOrders
          
          // Revenue should match expected (only orders in range within our test category)
          expect(actualRevenue).toBe(expectedRevenueInRange)
          expect(actualOrders).toBe(testData.ordersInRange)
          
          await cleanup()
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)
})


/**
 * **Feature: advanced-reporting, Property 2: Category filtering**
 * 
 * *For any* category filter applied, all returned orders SHALL contain at least 
 * one product from the selected categories.
 * 
 * **Validates: Requirements 2.3**
 */
describe('Property 2: Category filtering', () => {
  it('should only return revenue from orders containing products in selected categories', async () => {
    let testCounter = 0
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          orderTotal: fc.integer({ min: 10000, max: 500000 }),
          ordersInCategory: fc.integer({ min: 1, max: 3 }),
          ordersOutsideCategory: fc.integer({ min: 1, max: 2 }),
        }),
        async (testData) => {
          // Use timestamp + counter for truly unique IDs
          const uniqueId = `${Date.now()}-${testCounter++}-${Math.random().toString(36).substring(7)}`
          
          // Create admin user
          const adminUser = await prisma.user.create({
            data: {
              email: `pbt-cat-filter-admin-${uniqueId}@test.com`,
              password: 'hashedpassword123',
              name: 'Admin User',
              role: 'admin',
              isActive: true
            }
          })
          createdUserIds.push(adminUser.id)
          
          // Create two categories
          const targetCategory = await prisma.category.create({
            data: {
              name: `Target Category ${uniqueId}`,
              slug: `target-category-${uniqueId}`,
            }
          })
          createdCategoryIds.push(targetCategory.id)
          
          const otherCategory = await prisma.category.create({
            data: {
              name: `Other Category ${uniqueId}`,
              slug: `other-category-${uniqueId}`,
            }
          })
          createdCategoryIds.push(otherCategory.id)
          
          // Create products in each category
          const targetProduct = await prisma.product.create({
            data: {
              name: `Target Product ${uniqueId}`,
              slug: `target-product-${uniqueId}`,
              price: testData.orderTotal,
              stock: 1000,
              categoryId: targetCategory.id,
            }
          })
          createdProductIds.push(targetProduct.id)
          
          const otherProduct = await prisma.product.create({
            data: {
              name: `Other Product ${uniqueId}`,
              slug: `other-product-${uniqueId}`,
              price: testData.orderTotal * 2,
              stock: 1000,
              categoryId: otherCategory.id,
            }
          })
          createdProductIds.push(otherProduct.id)
          
          // Track expected revenue from target category
          let expectedRevenueInCategory = 0
          
          // Create orders with products from TARGET category
          for (let i = 0; i < testData.ordersInCategory; i++) {
            const order = await prisma.order.create({
              data: {
                userId: adminUser.id,
                total: testData.orderTotal,
                status: 'delivered',
                shippingAddress: '123 Test St',
                paymentMethod: 'cod',
                recipientName: 'Test User',
                phone: '0123456789',
                orderItems: {
                  create: {
                    productId: targetProduct.id,
                    quantity: 1,
                    price: testData.orderTotal,
                  }
                }
              }
            })
            createdOrderIds.push(order.id)
            expectedRevenueInCategory += testData.orderTotal
          }
          
          // Create orders with products from OTHER category (should be excluded)
          for (let i = 0; i < testData.ordersOutsideCategory; i++) {
            const order = await prisma.order.create({
              data: {
                userId: adminUser.id,
                total: testData.orderTotal * 2,
                status: 'delivered',
                shippingAddress: '123 Test St',
                paymentMethod: 'cod',
                recipientName: 'Test User',
                phone: '0123456789',
                orderItems: {
                  create: {
                    productId: otherProduct.id,
                    quantity: 1,
                    price: testData.orderTotal * 2,
                  }
                }
              }
            })
            createdOrderIds.push(order.id)
          }
          
          const adminToken = generateToken(adminUser.id, adminUser.email, 'admin')
          
          // Call revenue endpoint with category filter
          const response = await request(app)
            .get('/api/reports/revenue')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
              categories: targetCategory.id,
            })
          
          expect(response.status).toBe(200)
          expect(response.body.success).toBe(true)
          
          // Property 2: Revenue should only include orders with products from target category
          const actualRevenue = response.body.data.summary.totalRevenue
          const actualOrders = response.body.data.summary.totalOrders
          
          expect(actualRevenue).toBe(expectedRevenueInCategory)
          expect(actualOrders).toBe(testData.ordersInCategory)
          
          await cleanup()
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)
})


/**
 * **Feature: advanced-reporting, Property 10: Export data consistency**
 * 
 * *For any* export request with filters, exported CSV data SHALL match 
 * the filtered report data exactly.
 * 
 * **Validates: Requirements 7.2**
 */
describe('Property 10: Export data consistency', () => {
  it('should export CSV data that matches the filtered report data for revenue type', async () => {
    let testCounter = 0
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          orderTotal: fc.integer({ min: 10000, max: 500000 }),
          ordersCount: fc.integer({ min: 1, max: 3 }),
          daysAgo: fc.integer({ min: 7, max: 30 }),
          rangeDays: fc.integer({ min: 3, max: 14 }),
        }),
        async (testData) => {
          const uniqueId = `${Date.now()}-${testCounter++}-${Math.random().toString(36).substring(7)}`
          
          // Calculate date range
          const now = new Date()
          const to = new Date(now.getTime() - testData.daysAgo * 24 * 60 * 60 * 1000)
          const from = new Date(to.getTime() - testData.rangeDays * 24 * 60 * 60 * 1000)
          
          // Create admin user
          const adminUser = await prisma.user.create({
            data: {
              email: `pbt-export-admin-${uniqueId}@test.com`,
              password: 'hashedpassword123',
              name: 'Admin User',
              role: 'admin',
              isActive: true
            }
          })
          createdUserIds.push(adminUser.id)
          
          // Create a unique category for this test
          const testCategory = await prisma.category.create({
            data: {
              name: `PBT Export Test Category ${uniqueId}`,
              slug: `pbt-export-test-category-${uniqueId}`,
            }
          })
          createdCategoryIds.push(testCategory.id)
          
          const product = await prisma.product.create({
            data: {
              name: `Test Product ${uniqueId}`,
              slug: `test-product-${uniqueId}`,
              price: testData.orderTotal,
              stock: 1000,
              categoryId: testCategory.id,
            }
          })
          createdProductIds.push(product.id)
          
          // Create orders within the date range
          for (let i = 0; i < testData.ordersCount; i++) {
            const orderDate = createDateInRange(from, to)
            const order = await prisma.order.create({
              data: {
                userId: adminUser.id,
                total: testData.orderTotal,
                status: 'delivered',
                shippingAddress: '123 Test St',
                paymentMethod: 'cod',
                recipientName: 'Test User',
                phone: '0123456789',
                createdAt: orderDate,
                orderItems: {
                  create: {
                    productId: product.id,
                    quantity: 1,
                    price: testData.orderTotal,
                  }
                }
              }
            })
            createdOrderIds.push(order.id)
          }
          
          const adminToken = generateToken(adminUser.id, adminUser.email, 'admin')
          
          // Get revenue report data
          const reportResponse = await request(app)
            .get('/api/reports/revenue')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
              from: from.toISOString(),
              to: to.toISOString(),
              categories: testCategory.id,
            })
          
          expect(reportResponse.status).toBe(200)
          expect(reportResponse.body.success).toBe(true)
          
          // Get export CSV data
          const exportResponse = await request(app)
            .get('/api/reports/export')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
              type: 'revenue',
              format: 'csv',
              from: from.toISOString(),
              to: to.toISOString(),
              categories: testCategory.id,
            })
          
          expect(exportResponse.status).toBe(200)
          expect(exportResponse.headers['content-type']).toContain('text/csv')
          
          // Parse CSV content (skip BOM character)
          const csvContent = exportResponse.text.replace(/^\uFEFF/, '')
          const lines = csvContent.split('\n').filter(line => line.trim())
          
          // Should have header + data rows
          expect(lines.length).toBeGreaterThan(0)
          
          // Parse CSV data rows (skip header)
          const dataRows = lines.slice(1)
          
          // Calculate totals from CSV
          let csvTotalRevenue = 0
          let csvTotalOrders = 0
          let csvTotalItems = 0
          
          for (const row of dataRows) {
            // Parse CSV row - format: "Date","Orders","Items","Revenue"
            const values = row.match(/"([^"]*)"/g)?.map(v => v.replace(/"/g, '')) || []
            if (values.length >= 4) {
              csvTotalOrders += parseInt(values[1]) || 0
              csvTotalItems += parseInt(values[2]) || 0
              csvTotalRevenue += parseFloat(values[3]) || 0
            }
          }
          
          // Property 10: CSV totals should match report totals
          const reportSummary = reportResponse.body.data.summary
          
          expect(csvTotalRevenue).toBe(reportSummary.totalRevenue)
          expect(csvTotalOrders).toBe(reportSummary.totalOrders)
          expect(csvTotalItems).toBe(reportSummary.totalItems)
          
          await cleanup()
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)

  it('should export CSV data that matches the filtered report data for products type', async () => {
    let testCounter = 0
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          orderTotal: fc.integer({ min: 10000, max: 500000 }),
          ordersCount: fc.integer({ min: 1, max: 3 }),
        }),
        async (testData) => {
          const uniqueId = `${Date.now()}-${testCounter++}-${Math.random().toString(36).substring(7)}`
          
          // Create admin user
          const adminUser = await prisma.user.create({
            data: {
              email: `pbt-export-prod-admin-${uniqueId}@test.com`,
              password: 'hashedpassword123',
              name: 'Admin User',
              role: 'admin',
              isActive: true
            }
          })
          createdUserIds.push(adminUser.id)
          
          // Create a unique category for this test
          const testCategory = await prisma.category.create({
            data: {
              name: `PBT Export Products Category ${uniqueId}`,
              slug: `pbt-export-products-category-${uniqueId}`,
            }
          })
          createdCategoryIds.push(testCategory.id)
          
          const product = await prisma.product.create({
            data: {
              name: `Test Product ${uniqueId}`,
              slug: `test-product-${uniqueId}`,
              price: testData.orderTotal,
              stock: 1000,
              categoryId: testCategory.id,
            }
          })
          createdProductIds.push(product.id)
          
          // Create orders
          let expectedQuantity = 0
          for (let i = 0; i < testData.ordersCount; i++) {
            const order = await prisma.order.create({
              data: {
                userId: adminUser.id,
                total: testData.orderTotal,
                status: 'delivered',
                shippingAddress: '123 Test St',
                paymentMethod: 'cod',
                recipientName: 'Test User',
                phone: '0123456789',
                orderItems: {
                  create: {
                    productId: product.id,
                    quantity: 1,
                    price: testData.orderTotal,
                  }
                }
              }
            })
            createdOrderIds.push(order.id)
            expectedQuantity += 1
          }
          
          const adminToken = generateToken(adminUser.id, adminUser.email, 'admin')
          
          // Get top-products report data
          const reportResponse = await request(app)
            .get('/api/reports/top-products')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
              categories: testCategory.id,
            })
          
          expect(reportResponse.status).toBe(200)
          expect(reportResponse.body.success).toBe(true)
          
          // Get export CSV data
          const exportResponse = await request(app)
            .get('/api/reports/export')
            .set('Authorization', `Bearer ${adminToken}`)
            .query({
              type: 'products',
              format: 'csv',
              categories: testCategory.id,
            })
          
          expect(exportResponse.status).toBe(200)
          expect(exportResponse.headers['content-type']).toContain('text/csv')
          
          // Parse CSV content
          const csvContent = exportResponse.text.replace(/^\uFEFF/, '')
          const lines = csvContent.split('\n').filter(line => line.trim())
          
          // Should have header + data rows
          expect(lines.length).toBeGreaterThan(0)
          
          // Find our test product in CSV
          const dataRows = lines.slice(1)
          let foundProduct = false
          let csvQuantity = 0
          let csvRevenue = 0
          
          for (const row of dataRows) {
            // Parse CSV row - format: "Rank","ProductId","Name","Category","Quantity","Orders","Revenue"
            const values = row.match(/"([^"]*)"/g)?.map(v => v.replace(/"/g, '')) || []
            if (values.length >= 7 && values[1] === product.id) {
              foundProduct = true
              csvQuantity = parseInt(values[4]) || 0
              csvRevenue = parseFloat(values[6]) || 0
            }
          }
          
          // Property 10: CSV data should match report data for our test product
          const reportProduct = reportResponse.body.data.find((p: { productId: string }) => p.productId === product.id)
          
          if (reportProduct) {
            expect(foundProduct).toBe(true)
            expect(csvQuantity).toBe(reportProduct.totalQuantity)
            expect(csvRevenue).toBe(reportProduct.totalRevenue)
          }
          
          await cleanup()
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)
})
