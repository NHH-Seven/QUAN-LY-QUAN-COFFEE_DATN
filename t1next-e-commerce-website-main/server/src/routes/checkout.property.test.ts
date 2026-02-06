import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserRole } from '@prisma/client'
import * as fc from 'fast-check'
import checkoutRoutes from './checkout.js'
import cartRoutes from './cart.js'
import { config } from '../config/index.js'

/**
 * Property-Based Tests for Checkout API
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: checkout**
 * 
 * Tests the checkout functionality:
 * - Property 1: Checkout displays correct cart data
 * - Property 2: Required field validation
 * - Property 3: Phone format validation
 * - Property 4: Order creation with correct data
 * - Property 5: Cart clearing after order
 * - Property 6: Stock decrease on order
 * - Property 7: Stock validation
 * - Property 8: Order-user association
 */

const prisma = new PrismaClient()
let app: Express

// Test data tracking
const createdUserIds: string[] = []
const createdProductIds: string[] = []
const createdCartItemIds: string[] = []

// Fixed shipping fee (must match checkout.ts)
const SHIPPING_FEE = 30000

// Helper to generate JWT token
function generateToken(userId: string, email: string, role: UserRole = 'user'): string {
  return jwt.sign({ userId, email, role }, config.jwt.secret, { expiresIn: '1h' })
}

// Arbitrary for generating valid product price (positive number)
const priceArb = fc.integer({ min: 1000, max: 100000000 })

// Arbitrary for generating valid quantity (positive integer)
const quantityArb = fc.integer({ min: 1, max: 100 })

// Arbitrary for generating valid stock (positive integer)
const stockArb = fc.integer({ min: 1, max: 1000 })


// Arbitrary for generating product name
const productNameArb = fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2)

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  
  app = express()
  app.use(express.json())
  app.use('/api/checkout', checkoutRoutes)
  app.use('/api/cart', cartRoutes)
})

afterAll(async () => {
  // Cleanup all created test data
  await cleanup()
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up test data before each test
  await cleanup()
})

afterEach(async () => {
  // Clean up test data after each test
  await cleanup()
})

async function cleanup() {
  try {
    // Delete cart items first (foreign key constraint)
    if (createdCartItemIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { id: { in: createdCartItemIds } }
      })
      createdCartItemIds.length = 0
    }
    
    // Also clean up any orphaned cart items for test users
    if (createdUserIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: { in: createdUserIds } }
      })
    }
    
    // Delete order items and orders for test users
    if (createdUserIds.length > 0) {
      const orders = await prisma.order.findMany({
        where: { userId: { in: createdUserIds } },
        select: { id: true }
      })
      const orderIds = orders.map(o => o.id)
      if (orderIds.length > 0) {
        await prisma.orderItem.deleteMany({
          where: { orderId: { in: orderIds } }
        })
        await prisma.order.deleteMany({
          where: { id: { in: orderIds } }
        })
      }
    }
    
    // Delete products
    if (createdProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } }
      })
      createdProductIds.length = 0
    }
    
    // Delete users
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } }
      })
      createdUserIds.length = 0
    }
  } catch (error) {
    // Log but don't fail - cleanup errors shouldn't break tests
    console.error('Cleanup error:', error)
  }
}


/**
 * **Feature: checkout, Property 5: Cart clearing after order**
 * 
 * *For any* successful order creation, the user's cart SHALL be empty
 * 
 * **Validates: Requirements 4.4**
 */
describe('Property 5: Cart clearing after order', () => {
  it('should clear all cart items after successful order creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
          itemCount: fc.integer({ min: 1, max: 5 }),
          uniqueId: fc.uuid(),
        }),
        async (testData) => {
          const uniqueId = testData.uniqueId
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-cart-clear-${uniqueId}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create multiple products and cart items
          for (let i = 0; i < testData.itemCount; i++) {
            const product = await prisma.product.create({
              data: {
                name: `Test Product ${i}`,
                slug: `pbt-product-cart-clear-${uniqueId}-${i}`,
                price: 100000,
                stock: 100,
                images: ['test-image.jpg'],
              }
            })
            createdProductIds.push(product.id)
            
            const cartItem = await prisma.cartItem.create({
              data: {
                userId: user.id,
                productId: product.id,
                quantity: 1,
              }
            })
            createdCartItemIds.push(cartItem.id)
          }
          
          // Verify cart has items before checkout
          const cartBefore = await prisma.cartItem.count({
            where: { userId: user.id }
          })
          expect(cartBefore).toBe(testData.itemCount)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          // Place order
          const response = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              recipientName: testData.recipientName,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          expect(response.status).toBe(201)
          expect(response.body.success).toBe(true)
          
          // Property 5: Cart should be empty after successful order
          const cartAfter = await prisma.cartItem.count({
            where: { userId: user.id }
          })
          expect(cartAfter).toBe(0)
          
          // Cleanup - delete order and order items
          const orderId = response.body.data.orderId
          await prisma.orderItem.deleteMany({ where: { orderId } })
          await prisma.order.delete({ where: { id: orderId } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)
})


/**
 * **Feature: checkout, Property 6: Stock decrease on order**
 * 
 * *For any* successful order, product stock SHALL decrease by exactly the ordered quantity
 * 
 * **Validates: Requirements 4.5**
 */
describe('Property 6: Stock decrease on order', () => {
  it('should decrease product stock by exactly the ordered quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
          initialStock: fc.integer({ min: 50, max: 500 }),
          orderQuantity: fc.integer({ min: 1, max: 49 }),
          uniqueId: fc.uuid(),
        }),
        async (testData) => {
          const uniqueId = testData.uniqueId
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-stock-decrease-${uniqueId}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create product with known initial stock
          const product = await prisma.product.create({
            data: {
              name: 'Test Product',
              slug: `pbt-product-stock-decrease-${uniqueId}`,
              price: 100000,
              stock: testData.initialStock,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product.id)
          
          // Create cart item with specific quantity
          const cartItem = await prisma.cartItem.create({
            data: {
              userId: user.id,
              productId: product.id,
              quantity: testData.orderQuantity,
            }
          })
          createdCartItemIds.push(cartItem.id)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          // Place order
          const response = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              recipientName: testData.recipientName,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          expect(response.status).toBe(201)
          expect(response.body.success).toBe(true)
          
          // Property 6: Stock should decrease by exactly the ordered quantity
          const updatedProduct = await prisma.product.findUnique({
            where: { id: product.id }
          })
          
          const expectedStock = testData.initialStock - testData.orderQuantity
          expect(updatedProduct!.stock).toBe(expectedStock)
          
          // Cleanup
          const orderId = response.body.data.orderId
          await prisma.orderItem.deleteMany({ where: { orderId } })
          await prisma.order.delete({ where: { id: orderId } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)

  it('should decrease stock correctly for multiple products in one order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
          uniqueId: fc.uuid(),
          products: fc.array(
            fc.record({
              initialStock: fc.integer({ min: 50, max: 200 }),
              orderQuantity: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 2, maxLength: 4 }
          ),
        }),
        async (testData) => {
          const uniqueId = testData.uniqueId
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-multi-stock-${uniqueId}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          const productStockMap: Array<{ productId: string; initialStock: number; orderQuantity: number }> = []
          
          for (let i = 0; i < testData.products.length; i++) {
            const productData = testData.products[i]
            
            const product = await prisma.product.create({
              data: {
                name: `Test Product ${i}`,
                slug: `pbt-product-multi-stock-${uniqueId}-${i}`,
                price: 100000,
                stock: productData.initialStock,
                images: ['test-image.jpg'],
              }
            })
            createdProductIds.push(product.id)
            
            const cartItem = await prisma.cartItem.create({
              data: {
                userId: user.id,
                productId: product.id,
                quantity: productData.orderQuantity,
              }
            })
            createdCartItemIds.push(cartItem.id)
            
            productStockMap.push({
              productId: product.id,
              initialStock: productData.initialStock,
              orderQuantity: productData.orderQuantity,
            })
          }
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          const response = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              recipientName: testData.recipientName,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          expect(response.status).toBe(201)
          expect(response.body.success).toBe(true)
          
          // Property 6: Each product's stock should decrease by its ordered quantity
          for (const item of productStockMap) {
            const updatedProduct = await prisma.product.findUnique({
              where: { id: item.productId }
            })
            
            const expectedStock = item.initialStock - item.orderQuantity
            expect(updatedProduct!.stock).toBe(expectedStock)
          }
          
          // Cleanup
          const orderId = response.body.data.orderId
          await prisma.orderItem.deleteMany({ where: { orderId } })
          await prisma.order.delete({ where: { id: orderId } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)
})


/**
 * **Feature: checkout, Property 7: Stock validation**
 * 
 * *For any* checkout request where ordered quantity exceeds product stock, 
 * the system SHALL reject the order
 * 
 * **Validates: Requirements 4.6**
 */
/**
 * **Feature: checkout, Property 8: Order-user association**
 * 
 * *For any* order created by authenticated user, the order SHALL have correct userId
 * 
 * **Validates: Requirements 7.2**
 */
describe('Property 8: Order-user association', () => {
  it('should associate order with the authenticated user who created it', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
        }),
        async (testData) => {
          const timestamp = Date.now()
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-order-user-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create product
          const product = await prisma.product.create({
            data: {
              name: 'Test Product',
              slug: `pbt-product-order-user-${timestamp}`,
              price: 100000,
              stock: 100,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product.id)
          
          // Create cart item
          const cartItem = await prisma.cartItem.create({
            data: {
              userId: user.id,
              productId: product.id,
              quantity: 1,
            }
          })
          createdCartItemIds.push(cartItem.id)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          // Place order
          const response = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              recipientName: testData.recipientName,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          expect(response.status).toBe(201)
          expect(response.body.success).toBe(true)
          
          const orderId = response.body.data.orderId
          
          // Property 8: Order should have correct userId
          const order = await prisma.order.findUnique({
            where: { id: orderId }
          })
          
          expect(order).not.toBeNull()
          expect(order!.userId).toBe(user.id)
          
          // Cleanup
          await prisma.orderItem.deleteMany({ where: { orderId } })
          await prisma.order.delete({ where: { id: orderId } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)

  it('should correctly associate orders when multiple users place orders', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName1: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          recipientName2: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
        }),
        async (testData) => {
          const timestamp = Date.now()
          
          // Create two test users
          const user1 = await prisma.user.create({
            data: {
              email: `pbt-order-user1-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User 1',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user1.id)
          
          const user2 = await prisma.user.create({
            data: {
              email: `pbt-order-user2-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User 2',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user2.id)
          
          // Create products for each user
          const product1 = await prisma.product.create({
            data: {
              name: 'Test Product 1',
              slug: `pbt-product-order-user1-${timestamp}`,
              price: 100000,
              stock: 100,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product1.id)
          
          const product2 = await prisma.product.create({
            data: {
              name: 'Test Product 2',
              slug: `pbt-product-order-user2-${timestamp}`,
              price: 150000,
              stock: 100,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product2.id)
          
          // Create cart items for each user
          const cartItem1 = await prisma.cartItem.create({
            data: {
              userId: user1.id,
              productId: product1.id,
              quantity: 1,
            }
          })
          createdCartItemIds.push(cartItem1.id)
          
          const cartItem2 = await prisma.cartItem.create({
            data: {
              userId: user2.id,
              productId: product2.id,
              quantity: 2,
            }
          })
          createdCartItemIds.push(cartItem2.id)
          
          const user1Token = generateToken(user1.id, user1.email, 'user')
          const user2Token = generateToken(user2.id, user2.email, 'user')
          
          // User 1 places order
          const response1 = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
              recipientName: testData.recipientName1,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          expect(response1.status).toBe(201)
          const order1Id = response1.body.data.orderId
          
          // User 2 places order
          const response2 = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${user2Token}`)
            .send({
              recipientName: testData.recipientName2,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          expect(response2.status).toBe(201)
          const order2Id = response2.body.data.orderId
          
          // Property 8: Each order should be associated with correct user
          const order1 = await prisma.order.findUnique({
            where: { id: order1Id }
          })
          const order2 = await prisma.order.findUnique({
            where: { id: order2Id }
          })
          
          expect(order1).not.toBeNull()
          expect(order1!.userId).toBe(user1.id)
          expect(order1!.userId).not.toBe(user2.id)
          
          expect(order2).not.toBeNull()
          expect(order2!.userId).toBe(user2.id)
          expect(order2!.userId).not.toBe(user1.id)
          
          // Cleanup
          await prisma.orderItem.deleteMany({ where: { orderId: { in: [order1Id, order2Id] } } })
          await prisma.order.deleteMany({ where: { id: { in: [order1Id, order2Id] } } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)
})


describe('Property 7: Stock validation', () => {
  it('should reject order when ordered quantity exceeds product stock', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
          availableStock: fc.integer({ min: 1, max: 50 }),
          excessQuantity: fc.integer({ min: 1, max: 50 }),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const orderQuantity = testData.availableStock + testData.excessQuantity
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-stock-validation-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create product with limited stock
          const product = await prisma.product.create({
            data: {
              name: 'Limited Stock Product',
              slug: `pbt-product-stock-validation-${timestamp}`,
              price: 100000,
              stock: testData.availableStock,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product.id)
          
          // Create cart item with quantity exceeding stock
          const cartItem = await prisma.cartItem.create({
            data: {
              userId: user.id,
              productId: product.id,
              quantity: orderQuantity,
            }
          })
          createdCartItemIds.push(cartItem.id)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          const response = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              recipientName: testData.recipientName,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          // Property 7: Order should be rejected with 409 Conflict error (insufficient stock)
          expect(response.status).toBe(409)
          expect(response.body.success).toBe(false)
          expect(response.body.code).toBe('INSUFFICIENT_STOCK')
          
          // Verify stock was NOT changed
          const unchangedProduct = await prisma.product.findUnique({
            where: { id: product.id }
          })
          expect(unchangedProduct!.stock).toBe(testData.availableStock)
          
          // Verify cart was NOT cleared
          const cartStillExists = await prisma.cartItem.findFirst({
            where: { userId: user.id, productId: product.id }
          })
          expect(cartStillExists).not.toBeNull()
          
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)

  it('should reject order when any product in cart has insufficient stock', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
          product1Stock: fc.integer({ min: 50, max: 100 }),
          product1Quantity: fc.integer({ min: 1, max: 10 }),
          product2Stock: fc.integer({ min: 1, max: 10 }),
          product2ExcessQuantity: fc.integer({ min: 1, max: 20 }),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const product2Quantity = testData.product2Stock + testData.product2ExcessQuantity
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-multi-stock-validation-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create first product with sufficient stock
          const product1 = await prisma.product.create({
            data: {
              name: 'Product With Stock',
              slug: `pbt-product-with-stock-${timestamp}`,
              price: 100000,
              stock: testData.product1Stock,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product1.id)
          
          // Create second product with insufficient stock
          const product2 = await prisma.product.create({
            data: {
              name: 'Product Without Stock',
              slug: `pbt-product-without-stock-${timestamp}`,
              price: 50000,
              stock: testData.product2Stock,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product2.id)
          
          // Create cart items
          const cartItem1 = await prisma.cartItem.create({
            data: {
              userId: user.id,
              productId: product1.id,
              quantity: testData.product1Quantity,
            }
          })
          createdCartItemIds.push(cartItem1.id)
          
          const cartItem2 = await prisma.cartItem.create({
            data: {
              userId: user.id,
              productId: product2.id,
              quantity: product2Quantity,
            }
          })
          createdCartItemIds.push(cartItem2.id)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          const response = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              recipientName: testData.recipientName,
              phone: testData.phone,
              address: testData.address,
              paymentMethod: testData.paymentMethod,
            })
          
          // Property 7: Order should be rejected with 409 Conflict error (insufficient stock)
          expect(response.status).toBe(409)
          expect(response.body.success).toBe(false)
          expect(response.body.code).toBe('INSUFFICIENT_STOCK')
          
          // Verify NEITHER product's stock was changed (transaction rollback)
          const unchangedProduct1 = await prisma.product.findUnique({
            where: { id: product1.id }
          })
          expect(unchangedProduct1!.stock).toBe(testData.product1Stock)
          
          const unchangedProduct2 = await prisma.product.findUnique({
            where: { id: product2.id }
          })
          expect(unchangedProduct2!.stock).toBe(testData.product2Stock)
          
          // Verify cart was NOT cleared
          const cartCount = await prisma.cartItem.count({
            where: { userId: user.id }
          })
          expect(cartCount).toBe(2)
          
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)
})


/**
 * **Feature: checkout, Property 9: Duplicate order prevention**
 * 
 * *For any* identical checkout request submitted multiple times within short period,
 * only one order SHALL be created
 * 
 * **Validates: Requirements 6.4**
 */
import { clearIdempotencyStore } from '../services/idempotency.service.js'

describe('Property 9: Duplicate order prevention', () => {
  beforeEach(async () => {
    // Clear idempotency store before each test
    clearIdempotencyStore()
  })

  it('should return same order when same idempotency key is used multiple times', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
          duplicateAttempts: fc.integer({ min: 2, max: 5 }),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const idempotencyKey = crypto.randomUUID()
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-duplicate-prevention-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create product with enough stock for multiple potential orders
          const product = await prisma.product.create({
            data: {
              name: 'Test Product',
              slug: `pbt-product-duplicate-${timestamp}`,
              price: 100000,
              stock: 100,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product.id)
          
          // Create cart item
          const cartItem = await prisma.cartItem.create({
            data: {
              userId: user.id,
              productId: product.id,
              quantity: 1,
            }
          })
          createdCartItemIds.push(cartItem.id)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          const orderPayload = {
            recipientName: testData.recipientName,
            phone: testData.phone,
            address: testData.address,
            paymentMethod: testData.paymentMethod,
            idempotencyKey,
          }
          
          // First request - should create order
          const firstResponse = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${userToken}`)
            .send(orderPayload)
          
          expect(firstResponse.status).toBe(201)
          expect(firstResponse.body.success).toBe(true)
          const originalOrderId = firstResponse.body.data.orderId
          const originalTotal = firstResponse.body.data.total
          
          // Subsequent requests with same idempotency key - should return same order
          // Note: The idempotency check happens BEFORE cart validation, so even with empty cart
          // the duplicate request should return the cached response
          for (let i = 1; i < testData.duplicateAttempts; i++) {
            const duplicateResponse = await request(app)
              .post('/api/checkout')
              .set('Authorization', `Bearer ${userToken}`)
              .send(orderPayload)
            
            // Property 9: Should return same order, not create new one
            expect(duplicateResponse.status).toBe(200)
            expect(duplicateResponse.body.success).toBe(true)
            expect(duplicateResponse.body.data.orderId).toBe(originalOrderId)
            expect(duplicateResponse.body.data.total).toBe(originalTotal)
            expect(duplicateResponse.body.duplicate).toBe(true)
          }
          
          // Verify only ONE order was created in database
          const orderCount = await prisma.order.count({
            where: { userId: user.id }
          })
          expect(orderCount).toBe(1)
          
          // Cleanup
          await prisma.cartItem.deleteMany({ where: { userId: user.id } })
          await prisma.orderItem.deleteMany({ where: { orderId: originalOrderId } })
          await prisma.order.delete({ where: { id: originalOrderId } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)

  it('should create separate orders when different idempotency keys are used', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
          orderCount: fc.integer({ min: 2, max: 3 }),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const orderIds: string[] = []
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-different-keys-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create product with enough stock
          const product = await prisma.product.create({
            data: {
              name: 'Test Product',
              slug: `pbt-product-different-keys-${timestamp}`,
              price: 100000,
              stock: 100,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product.id)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          // Create multiple orders with different idempotency keys
          for (let i = 0; i < testData.orderCount; i++) {
            // Create cart item for each order
            const cartItem = await prisma.cartItem.create({
              data: {
                userId: user.id,
                productId: product.id,
                quantity: 1,
              }
            })
            createdCartItemIds.push(cartItem.id)
            
            const response = await request(app)
              .post('/api/checkout')
              .set('Authorization', `Bearer ${userToken}`)
              .send({
                recipientName: testData.recipientName,
                phone: testData.phone,
                address: testData.address,
                paymentMethod: testData.paymentMethod,
                idempotencyKey: crypto.randomUUID(), // Different key each time
              })
            
            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.duplicate).toBeUndefined()
            orderIds.push(response.body.data.orderId)
          }
          
          // Property 9: All order IDs should be unique
          const uniqueOrderIds = new Set(orderIds)
          expect(uniqueOrderIds.size).toBe(testData.orderCount)
          
          // Verify correct number of orders in database
          const dbOrderCount = await prisma.order.count({
            where: { userId: user.id }
          })
          expect(dbOrderCount).toBe(testData.orderCount)
          
          // Cleanup
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)

  it('should create new order when no idempotency key is provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recipientName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          phone: fc.stringMatching(/^0[0-9]{9,10}$/),
          address: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          paymentMethod: fc.constantFrom('cod', 'bank_transfer') as fc.Arbitrary<'cod' | 'bank_transfer'>,
        }),
        async (testData) => {
          const timestamp = Date.now()
          const orderIds: string[] = []
          
          // Create test user
          const user = await prisma.user.create({
            data: {
              email: `pbt-no-key-${timestamp}@test.com`,
              password: 'hashedpassword123',
              name: 'Test User',
              role: 'user',
              isActive: true
            }
          })
          createdUserIds.push(user.id)
          
          // Create product
          const product = await prisma.product.create({
            data: {
              name: 'Test Product',
              slug: `pbt-product-no-key-${timestamp}`,
              price: 100000,
              stock: 100,
              images: ['test-image.jpg'],
            }
          })
          createdProductIds.push(product.id)
          
          const userToken = generateToken(user.id, user.email, 'user')
          
          // Create two orders without idempotency key
          for (let i = 0; i < 2; i++) {
            const cartItem = await prisma.cartItem.create({
              data: {
                userId: user.id,
                productId: product.id,
                quantity: 1,
              }
            })
            createdCartItemIds.push(cartItem.id)
            
            const response = await request(app)
              .post('/api/checkout')
              .set('Authorization', `Bearer ${userToken}`)
              .send({
                recipientName: testData.recipientName,
                phone: testData.phone,
                address: testData.address,
                paymentMethod: testData.paymentMethod,
                // No idempotencyKey
              })
            
            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            orderIds.push(response.body.data.orderId)
          }
          
          // Without idempotency key, each request creates a new order
          const uniqueOrderIds = new Set(orderIds)
          expect(uniqueOrderIds.size).toBe(2)
          
          // Cleanup
          await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
          
          createdCartItemIds.length = 0
          await cleanup()
        }
      ),
      { numRuns: 100 }
    )
  }, 180000)
})
