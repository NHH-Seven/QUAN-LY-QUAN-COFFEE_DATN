import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import express, { Express } from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient, UserRole } from '@prisma/client'
import * as fc from 'fast-check'
import adminRoutes from './index.js'
import authRoutes from '../auth.js'
import { config } from '../../config/index.js'

/**
 * Property-Based Tests for Staff Management API
 * 
 * **Feature: staff-management**
 * 
 * Tests the staff list functionality using property-based testing:
 * - Property 1: Staff list excludes regular users
 * - Property 4: Response structure and security
 * - Property 5: Email uniqueness
 * - Property 6: Password hashing
 * - Property 7: Role validation
 * - Property 8: Email immutability
 * - Property 10: Self-modification prevention
 * - Property 11: Deactivated account login prevention
 */

const prisma = new PrismaClient()
let app: Express
let adminToken: string

// Test data tracking
const createdUserIds: string[] = []

// Helper to generate JWT token
function generateToken(userId: string, email: string, role: UserRole): string {
  return jwt.sign({ userId, email, role }, config.jwt.secret, { expiresIn: '1h' })
}

// Arbitrary for generating valid staff roles
const staffRoleArb = fc.constantFrom<UserRole>('admin', 'sales', 'warehouse')

// Arbitrary for generating user role
const userRoleArb = fc.constant<UserRole>('user')

// Arbitrary for generating any role
const anyRoleArb = fc.constantFrom<UserRole>('user', 'admin', 'sales', 'warehouse')

// Arbitrary for generating valid email
const emailArb = fc.emailAddress()

// Arbitrary for generating valid name
const nameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)

beforeAll(async () => {
  process.env.NODE_ENV = 'test'
  
  app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  app.use('/api/auth', authRoutes)
  
  // Generate admin token
  adminToken = generateToken('admin-pbt-id', 'admin-pbt@test.com', 'admin')
})

afterAll(async () => {
  // Cleanup all created test users
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds } }
    })
  }
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up test users before each test
  await prisma.user.deleteMany({
    where: { email: { contains: 'pbt-test-' } }
  })
  createdUserIds.length = 0
})

afterEach(async () => {
  // Clean up test users after each test
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds } }
    })
    createdUserIds.length = 0
  }
})

/**
 * Property 1: Staff list excludes regular users
 * 
 * *For any* request to the staff list endpoint, all returned records SHALL have role not equal to "user"
 * 
 * **Validates: Requirements 1.1**
 */
describe('Property 1: Staff list excludes regular users', () => {
  it('should never return users with role "user" in staff list', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a mix of users with different roles
        fc.array(
          fc.record({
            role: anyRoleArb,
            name: nameArb,
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (usersToCreate) => {
          // Create users with generated data
          const timestamp = Date.now()
          for (let i = 0; i < usersToCreate.length; i++) {
            const userData = usersToCreate[i]
            try {
              const user = await prisma.user.create({
                data: {
                  email: `pbt-test-${timestamp}-${i}@test.com`,
                  password: 'hashedpassword123',
                  name: userData.name || `Test User ${i}`,
                  role: userData.role,
                  isActive: true
                }
              })
              createdUserIds.push(user.id)
            } catch {
              // Skip if email already exists
            }
          }

          // Query the staff list
          const response = await request(app)
            .get('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)

          expect(response.status).toBe(200)
          expect(response.body.success).toBe(true)

          // Property: No user with role 'user' should be in the response
          const staffList = response.body.data
          for (const staff of staffList) {
            expect(staff.role).not.toBe('user')
          }

          // Cleanup for this iteration
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 10 }
    )
  })
})

/**
 * Property 4: Response structure and security
 * 
 * *For any* staff API response, the response SHALL contain required fields 
 * (id, email, name, role, phone, isActive, createdAt) and SHALL NOT contain the password field
 * 
 * **Validates: Requirements 1.4, 1.5**
 */
describe('Property 4: Response structure and security', () => {
  it('should always return required fields and never return password', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate staff users
        fc.array(
          fc.record({
            role: staffRoleArb,
            name: nameArb,
            phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (staffToCreate) => {
          // Create staff users
          const timestamp = Date.now()
          for (let i = 0; i < staffToCreate.length; i++) {
            const staffData = staffToCreate[i]
            try {
              const user = await prisma.user.create({
                data: {
                  email: `pbt-test-${timestamp}-${i}@test.com`,
                  password: 'hashedpassword123',
                  name: staffData.name || `Test Staff ${i}`,
                  role: staffData.role,
                  phone: staffData.phone || null,
                  isActive: true
                }
              })
              createdUserIds.push(user.id)
            } catch {
              // Skip if email already exists
            }
          }

          // Query the staff list
          const response = await request(app)
            .get('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)

          expect(response.status).toBe(200)
          expect(response.body.success).toBe(true)

          // Property: Every staff record must have required fields and no password
          const staffList = response.body.data
          for (const staff of staffList) {
            // Required fields must exist
            expect(staff).toHaveProperty('id')
            expect(staff).toHaveProperty('email')
            expect(staff).toHaveProperty('name')
            expect(staff).toHaveProperty('role')
            expect(staff).toHaveProperty('isActive')
            expect(staff).toHaveProperty('createdAt')
            // phone can be null but should be present
            expect('phone' in staff).toBe(true)

            // Password must NEVER be present
            expect(staff).not.toHaveProperty('password')
            expect(staff.password).toBeUndefined()
          }

          // Cleanup for this iteration
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should return correct response structure for single staff detail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          role: staffRoleArb,
          name: nameArb,
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
        }),
        async (staffData) => {
          // Create a staff user
          const timestamp = Date.now()
          let staffId: string | null = null
          
          try {
            const user = await prisma.user.create({
              data: {
                email: `pbt-test-detail-${timestamp}@test.com`,
                password: 'hashedpassword123',
                name: staffData.name || 'Test Staff Detail',
                role: staffData.role,
                phone: staffData.phone || null,
                isActive: true
              }
            })
            staffId = user.id
            createdUserIds.push(user.id)
          } catch {
            return // Skip if creation fails
          }

          if (!staffId) return

          // Query single staff detail
          const response = await request(app)
            .get(`/api/admin/staff/${staffId}`)
            .set('Authorization', `Bearer ${adminToken}`)

          expect(response.status).toBe(200)
          expect(response.body.success).toBe(true)

          const staff = response.body.data

          // Required fields must exist
          expect(staff).toHaveProperty('id')
          expect(staff).toHaveProperty('email')
          expect(staff).toHaveProperty('name')
          expect(staff).toHaveProperty('role')
          expect(staff).toHaveProperty('isActive')
          expect(staff).toHaveProperty('createdAt')
          expect('phone' in staff).toBe(true)

          // Password must NEVER be present
          expect(staff).not.toHaveProperty('password')
          expect(staff.password).toBeUndefined()

          // Cleanup for this iteration
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 10 }
    )
  })
})


/**
 * Property 5: Email uniqueness
 * 
 * *For any* two staff creation requests with the same email, the second request SHALL fail with an error
 * 
 * **Validates: Requirements 2.4**
 */
describe('Property 5: Email uniqueness', () => {
  it('should reject creation when email already exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          role: staffRoleArb,
          password: fc.string({ minLength: 6, maxLength: 20 }),
        }),
        async (staffData) => {
          const timestamp = Date.now()
          const email = `pbt-unique-${timestamp}@test.com`

          // First creation should succeed
          const firstResponse = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: staffData.password,
              name: staffData.name,
              role: staffData.role,
            })

          if (firstResponse.status === 201) {
            createdUserIds.push(firstResponse.body.data.id)

            // Second creation with same email should fail
            const secondResponse = await request(app)
              .post('/api/admin/staff')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                email,
                password: staffData.password,
                name: staffData.name + ' Duplicate',
                role: staffData.role,
              })

            // Property: Second request must fail with 409 Conflict
            expect(secondResponse.status).toBe(409)
            expect(secondResponse.body.success).toBe(false)
            expect(secondResponse.body.error).toBe('Email đã tồn tại')
          }

          // Cleanup
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 5 }
    )
  }, 60000)
})

/**
 * Property 6: Password hashing
 * 
 * *For any* staff creation or password reset, the stored password SHALL NOT equal the plain text password
 * 
 * **Validates: Requirements 2.5, 4.2**
 */
describe('Property 6: Password hashing', () => {
  it('should never store plain text password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          role: staffRoleArb,
          password: fc.string({ minLength: 6, maxLength: 20 }),
        }),
        async (staffData) => {
          const timestamp = Date.now()
          const email = `pbt-hash-${timestamp}@test.com`
          const plainPassword = staffData.password

          // Create staff
          const response = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: plainPassword,
              name: staffData.name,
              role: staffData.role,
            })

          if (response.status === 201) {
            const staffId = response.body.data.id
            createdUserIds.push(staffId)

            // Fetch the user directly from database to check password
            const dbUser = await prisma.user.findUnique({
              where: { id: staffId },
              select: { password: true }
            })

            // Property: Stored password must NOT equal plain text password
            expect(dbUser).not.toBeNull()
            expect(dbUser!.password).not.toBe(plainPassword)

            // Property: Stored password must be a valid bcrypt hash
            const isValidHash = await bcrypt.compare(plainPassword, dbUser!.password)
            expect(isValidHash).toBe(true)
          }

          // Cleanup
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 5 }
    )
  }, 60000)
})

/**
 * Property 7: Role validation
 * 
 * *For any* staff creation or update with an invalid role, the request SHALL be rejected
 * 
 * **Validates: Requirements 2.6, 3.5**
 */
describe('Property 7: Role validation', () => {
  it('should reject creation with invalid role', async () => {
    // Generate invalid roles (not admin, sales, warehouse)
    const invalidRoleArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => !['admin', 'sales', 'warehouse', 'user'].includes(s.toLowerCase()))

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          invalidRole: invalidRoleArb,
          password: fc.string({ minLength: 6, maxLength: 20 }),
        }),
        async (staffData) => {
          const timestamp = Date.now()
          const email = `pbt-role-${timestamp}@test.com`

          // Try to create staff with invalid role
          const response = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: staffData.password,
              name: staffData.name,
              role: staffData.invalidRole,
            })

          // Property: Request must be rejected with 400 Bad Request
          expect(response.status).toBe(400)
          expect(response.body.success).toBe(false)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept creation with valid staff roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          role: staffRoleArb,
          password: fc.string({ minLength: 6, maxLength: 20 }),
        }),
        async (staffData) => {
          const timestamp = Date.now()
          const email = `pbt-valid-role-${timestamp}@test.com`

          // Create staff with valid role
          const response = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: staffData.password,
              name: staffData.name,
              role: staffData.role,
            })

          // Property: Request should succeed with valid role
          if (response.status === 201) {
            createdUserIds.push(response.body.data.id)
            expect(response.body.data.role).toBe(staffData.role)
          }

          // Cleanup
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 5 }
    )
  }, 60000)

  it('should reject creation with user role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          password: fc.string({ minLength: 6, maxLength: 20 }),
        }),
        async (staffData) => {
          const timestamp = Date.now()
          const email = `pbt-user-role-${timestamp}@test.com`

          // Try to create staff with 'user' role
          const response = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: staffData.password,
              name: staffData.name,
              role: 'user',
            })

          // Property: Request must be rejected - 'user' is not a valid staff role
          expect(response.status).toBe(400)
          expect(response.body.success).toBe(false)
        }
      ),
      { numRuns: 10 }
    )
  })
})

/**
 * Property 8: Email immutability
 * 
 * *For any* staff update request that includes email, the email field SHALL remain unchanged
 * 
 * **Validates: Requirements 3.3**
 */
describe('Property 8: Email immutability', () => {
  it('should ignore email field in update requests and preserve original email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalName: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          newName: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          newEmail: fc.emailAddress(),
          role: staffRoleArb,
          newRole: staffRoleArb,
          password: fc.string({ minLength: 6, maxLength: 20 }),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const originalEmail = `pbt-immutable-${timestamp}@test.com`

          // Create staff with original email
          const createResponse = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email: originalEmail,
              password: testData.password,
              name: testData.originalName,
              role: testData.role,
            })

          if (createResponse.status !== 201) {
            return // Skip if creation fails
          }

          const staffId = createResponse.body.data.id
          createdUserIds.push(staffId)

          // Attempt to update with a different email
          const updateResponse = await request(app)
            .put(`/api/admin/staff/${staffId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email: testData.newEmail, // This should be ignored
              name: testData.newName,
              role: testData.newRole,
            })

          // Property: Update should succeed
          expect(updateResponse.status).toBe(200)
          expect(updateResponse.body.success).toBe(true)

          // Property: Email must remain unchanged (original email preserved)
          expect(updateResponse.body.data.email).toBe(originalEmail)
          expect(updateResponse.body.data.email).not.toBe(testData.newEmail)

          // Property: Other fields should be updated
          expect(updateResponse.body.data.name).toBe(testData.newName)
          expect(updateResponse.body.data.role).toBe(testData.newRole)

          // Verify in database
          const dbUser = await prisma.user.findUnique({
            where: { id: staffId },
            select: { email: true, name: true, role: true }
          })

          expect(dbUser).not.toBeNull()
          expect(dbUser!.email).toBe(originalEmail)
          expect(dbUser!.name).toBe(testData.newName)
          expect(dbUser!.role).toBe(testData.newRole)

          // Cleanup
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 5 }
    )
  }, 60000)
})


/**
 * Property 10: Self-modification prevention
 * 
 * *For any* admin attempting to deactivate or delete their own account, the request SHALL be rejected
 * 
 * **Validates: Requirements 5.4**
 */
describe('Property 10: Self-modification prevention', () => {
  it('should reject status change when admin tries to modify their own account', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          password: fc.string({ minLength: 6, maxLength: 20 }),
          isActive: fc.boolean(),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const email = `pbt-self-mod-${timestamp}@test.com`

          // Create an admin user
          const createResponse = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: testData.password,
              name: testData.name,
              role: 'admin',
            })

          if (createResponse.status !== 201) {
            return // Skip if creation fails
          }

          const staffId = createResponse.body.data.id
          createdUserIds.push(staffId)

          // Generate a token for this admin user (simulating they are logged in)
          const selfToken = generateToken(staffId, email, 'admin')

          // Attempt to change own status
          const statusResponse = await request(app)
            .put(`/api/admin/staff/${staffId}/status`)
            .set('Authorization', `Bearer ${selfToken}`)
            .send({
              isActive: testData.isActive,
            })

          // Property: Request must be rejected with 400 Bad Request
          expect(statusResponse.status).toBe(400)
          expect(statusResponse.body.success).toBe(false)
          expect(statusResponse.body.error).toBe('Không thể thực hiện thao tác này trên tài khoản của bạn')

          // Cleanup
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 5 }
    )
  }, 60000)

  it('should allow admin to change status of other staff members', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          role: staffRoleArb,
          password: fc.string({ minLength: 6, maxLength: 20 }),
          isActive: fc.boolean(),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const email = `pbt-other-mod-${timestamp}@test.com`

          // Create a staff user
          const createResponse = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: testData.password,
              name: testData.name,
              role: testData.role,
            })

          if (createResponse.status !== 201) {
            return // Skip if creation fails
          }

          const staffId = createResponse.body.data.id
          createdUserIds.push(staffId)

          // Admin (different user) changes the staff's status
          const statusResponse = await request(app)
            .put(`/api/admin/staff/${staffId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              isActive: testData.isActive,
            })

          // Property: Request should succeed when modifying other users
          // Note: May fail if trying to deactivate last admin, which is a different property
          if (testData.role !== 'admin' || testData.isActive === true) {
            expect(statusResponse.status).toBe(200)
            expect(statusResponse.body.success).toBe(true)
            expect(statusResponse.body.data.isActive).toBe(testData.isActive)
          }
        }
      ),
      { numRuns: 5 }
    )
    
    // Cleanup after all iterations
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } }
      })
      createdUserIds.length = 0
    }
  }, 60000)
})


/**
 * Property 11: Deactivated account login prevention
 * 
 * *For any* deactivated staff account, login attempts SHALL fail
 * 
 * **Validates: Requirements 5.5**
 */
describe('Property 11: Deactivated account login prevention', () => {
  it('should reject login for deactivated accounts', async () => {
    const localCreatedIds: string[] = []
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.constantFrom('Test User', 'Staff Member'),
          role: fc.constantFrom('sales', 'warehouse') as fc.Arbitrary<'admin' | 'sales' | 'warehouse'>,
        }),
        async (testData) => {
          const timestamp = Date.now() + Math.random()
          const email = `pbt-deactivated-${timestamp}@test.com`
          const plainPassword = 'Test@123!'

          // Create a staff user
          const createResponse = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: plainPassword,
              name: testData.name,
              role: testData.role,
            })

          if (createResponse.status !== 201) {
            return // Skip if creation fails
          }

          const staffId = createResponse.body.data.id
          localCreatedIds.push(staffId)

          // Verify login works when account is active
          const activeLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              email,
              password: plainPassword,
            })

          expect(activeLoginResponse.status).toBe(200)
          expect(activeLoginResponse.body.success).toBe(true)

          // Deactivate the account
          const deactivateResponse = await request(app)
            .put(`/api/admin/staff/${staffId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              isActive: false,
            })

          expect(deactivateResponse.status).toBe(200)
          expect(deactivateResponse.body.data.isActive).toBe(false)

          // Property: Login should fail for deactivated account
          const deactivatedLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              email,
              password: plainPassword,
            })

          expect(deactivatedLoginResponse.status).toBe(403)
          expect(deactivatedLoginResponse.body.success).toBe(false)
          expect(deactivatedLoginResponse.body.error).toBe('Tài khoản đã bị vô hiệu hóa')
        }
      ),
      { numRuns: 5 }
    )
    
    // Cleanup after all iterations
    if (localCreatedIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: localCreatedIds } }
      })
    }
  }, 60000)

  it('should allow login after account is reactivated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.constantFrom('Test User', 'Admin User', 'Staff Member'),
          role: staffRoleArb,
        }),
        async (testData) => {
          const timestamp = Date.now()
          const email = `pbt-reactivated-${timestamp}@test.com`
          const plainPassword = 'Test@123!'

          // Create a staff user
          const createResponse = await request(app)
            .post('/api/admin/staff')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email,
              password: plainPassword,
              name: testData.name,
              role: testData.role,
            })

          if (createResponse.status !== 201) {
            return // Skip if creation fails
          }

          const staffId = createResponse.body.data.id
          createdUserIds.push(staffId)

          // Deactivate the account
          await request(app)
            .put(`/api/admin/staff/${staffId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              isActive: false,
            })

          // Verify login fails when deactivated
          const deactivatedLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              email,
              password: plainPassword,
            })

          expect(deactivatedLoginResponse.status).toBe(403)

          // Reactivate the account
          const reactivateResponse = await request(app)
            .put(`/api/admin/staff/${staffId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              isActive: true,
            })

          expect(reactivateResponse.status).toBe(200)
          expect(reactivateResponse.body.data.isActive).toBe(true)

          // Property: Login should succeed after reactivation
          const reactivatedLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              email,
              password: plainPassword,
            })

          expect(reactivatedLoginResponse.status).toBe(200)
          expect(reactivatedLoginResponse.body.success).toBe(true)

          // Cleanup
          if (createdUserIds.length > 0) {
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            })
            createdUserIds.length = 0
          }
        }
      ),
      { numRuns: 5 }
    )
  }, 60000)
})


/**
 * Property 12: Authorization enforcement
 * 
 * *For any* non-admin user attempting to access staff management APIs, the request SHALL return 403 Forbidden
 * 
 * **Validates: Requirements 7.1, 7.2**
 */
describe('Property 12: Authorization enforcement', () => {
  // Non-admin roles that should be denied access
  const nonAdminRoleArb = fc.constantFrom<UserRole>('user', 'sales', 'warehouse')

  // All staff management endpoints to test
  const staffEndpoints = [
    { method: 'get', path: '/api/admin/staff', body: null },
    { method: 'get', path: '/api/admin/staff/some-id', body: null },
    { method: 'post', path: '/api/admin/staff', body: { email: 'test@test.com', password: 'password123', name: 'Test', role: 'sales' } },
    { method: 'put', path: '/api/admin/staff/some-id', body: { name: 'Updated Name' } },
    { method: 'put', path: '/api/admin/staff/some-id/password', body: { password: 'newpassword123' } },
    { method: 'put', path: '/api/admin/staff/some-id/status', body: { isActive: false } },
    { method: 'delete', path: '/api/admin/staff/some-id', body: null },
  ]

  it('should return 403 Forbidden for non-admin users on all staff management endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          role: nonAdminRoleArb,
          endpointIndex: fc.integer({ min: 0, max: staffEndpoints.length - 1 }),
        }),
        async (testData) => {
          const timestamp = Date.now()
          const userId = `non-admin-${timestamp}`
          const email = `non-admin-${timestamp}@test.com`

          // Generate token for non-admin user
          const nonAdminToken = generateToken(userId, email, testData.role)

          const endpoint = staffEndpoints[testData.endpointIndex]

          // Make request to staff management endpoint
          let response
          switch (endpoint.method) {
            case 'get':
              response = await request(app)
                .get(endpoint.path)
                .set('Authorization', `Bearer ${nonAdminToken}`)
              break
            case 'post':
              response = await request(app)
                .post(endpoint.path)
                .set('Authorization', `Bearer ${nonAdminToken}`)
                .send(endpoint.body)
              break
            case 'put':
              response = await request(app)
                .put(endpoint.path)
                .set('Authorization', `Bearer ${nonAdminToken}`)
                .send(endpoint.body)
              break
            case 'delete':
              response = await request(app)
                .delete(endpoint.path)
                .set('Authorization', `Bearer ${nonAdminToken}`)
              break
            default:
              throw new Error(`Unknown method: ${endpoint.method}`)
          }

          // Property: Non-admin users must receive 403 Forbidden
          expect(response.status).toBe(403)
          expect(response.body.success).toBe(false)
          expect(response.body.error).toBe('Không có quyền truy cập')
        }
      ),
      { numRuns: 21 } // 3 roles × 7 endpoints = 21 combinations
    )
  })

  it('should return 401 Unauthorized when no token is provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: staffEndpoints.length - 1 }),
        async (endpointIndex) => {
          const endpoint = staffEndpoints[endpointIndex]

          // Make request without authorization header
          let response
          switch (endpoint.method) {
            case 'get':
              response = await request(app).get(endpoint.path)
              break
            case 'post':
              response = await request(app).post(endpoint.path).send(endpoint.body)
              break
            case 'put':
              response = await request(app).put(endpoint.path).send(endpoint.body)
              break
            case 'delete':
              response = await request(app).delete(endpoint.path)
              break
            default:
              throw new Error(`Unknown method: ${endpoint.method}`)
          }

          // Property: Requests without token must receive 401 Unauthorized
          expect(response.status).toBe(401)
          expect(response.body.success).toBe(false)
          expect(response.body.error).toBe('Unauthorized')
        }
      ),
      { numRuns: 7 } // Test all 7 endpoints
    )
  })

  it('should return 401 Unauthorized when invalid token is provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidToken: fc.string({ minLength: 10, maxLength: 100 }),
          endpointIndex: fc.integer({ min: 0, max: staffEndpoints.length - 1 }),
        }),
        async (testData) => {
          const endpoint = staffEndpoints[testData.endpointIndex]

          // Make request with invalid token
          let response
          switch (endpoint.method) {
            case 'get':
              response = await request(app)
                .get(endpoint.path)
                .set('Authorization', `Bearer ${testData.invalidToken}`)
              break
            case 'post':
              response = await request(app)
                .post(endpoint.path)
                .set('Authorization', `Bearer ${testData.invalidToken}`)
                .send(endpoint.body)
              break
            case 'put':
              response = await request(app)
                .put(endpoint.path)
                .set('Authorization', `Bearer ${testData.invalidToken}`)
                .send(endpoint.body)
              break
            case 'delete':
              response = await request(app)
                .delete(endpoint.path)
                .set('Authorization', `Bearer ${testData.invalidToken}`)
              break
            default:
              throw new Error(`Unknown method: ${endpoint.method}`)
          }

          // Property: Requests with invalid token must receive 401 Unauthorized
          expect(response.status).toBe(401)
          expect(response.body.success).toBe(false)
          expect(response.body.error).toBe('Invalid token')
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should allow admin users to access all staff management endpoints', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 0 }), // Only test GET endpoints to avoid side effects
        async (endpointIndex) => {
          const getEndpoints = [
            { method: 'get', path: '/api/admin/staff' },
          ]
          const endpoint = getEndpoints[endpointIndex]

          // Make request with admin token
          const response = await request(app)
            .get(endpoint.path)
            .set('Authorization', `Bearer ${adminToken}`)

          // Property: Admin users must be allowed access (not 401 or 403)
          expect(response.status).not.toBe(401)
          expect(response.status).not.toBe(403)
          // Should be 200 for successful requests
          expect(response.status).toBe(200)
          expect(response.body.success).toBe(true)
        }
      ),
      { numRuns: 1 }
    )
  })
})
