import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'
import { config } from '../config/index.js'

/**
 * Swagger/OpenAPI configuration for NHH-Coffee API
 * Requirements: 7.3 - API Documentation using OpenAPI/Swagger specification
 */

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NHH-Coffee API',
      version: '1.0.0',
      description: `
## Overview
NHH-Coffee API provides endpoints for managing a coffee shop platform including:
- User authentication and authorization
- Menu and product catalog management
- Shopping cart operations
- Order processing and tracking
- Admin dashboard and reporting

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
Sensitive endpoints have rate limiting:
- Login: 5 requests/minute
- Register: 3 requests/minute
- Password Reset: 3 requests/hour

## Response Format
All responses follow this format:
\`\`\`json
{
  "success": true|false,
  "data": {...} | [...],
  "error": "Error message if success is false"
}
\`\`\`
      `,
      contact: {
        name: 'NHH-Coffee Support',
        email: 'support@nhh-coffee.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.nhh-coffee.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and user management' },
      { name: 'Products', description: 'Product catalog operations' },
      { name: 'Cart', description: 'Shopping cart management' },
      { name: 'Orders', description: 'Order processing and tracking' },
      { name: 'Admin', description: 'Admin dashboard and management' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Reviews', description: 'Product reviews and ratings' },
      { name: 'Wishlist', description: 'User wishlist management' },
      { name: 'Notifications', description: 'Push notifications and alerts' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            avatar: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['user', 'admin', 'sales', 'warehouse'] },
            isActive: { type: 'boolean' },
            points: { type: 'integer' },
            tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
            totalSpent: { type: 'number' },
            orderCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Product schemas
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            original_price: { type: 'number', nullable: true },
            images: { type: 'array', items: { type: 'string' } },
            brand: { type: 'string' },
            stock: { type: 'integer' },
            rating: { type: 'number' },
            review_count: { type: 'integer' },
            discount: { type: 'integer' },
            is_new: { type: 'boolean' },
            is_featured: { type: 'boolean' },
            specs: { type: 'object', additionalProperties: { type: 'string' } },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                slug: { type: 'string' },
              },
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        // Cart schemas
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            product: { $ref: '#/components/schemas/Product' },
          },
        },
        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'] 
            },
            total: { type: 'number' },
            shippingAddress: { type: 'string' },
            paymentMethod: { type: 'string' },
            recipientName: { type: 'string' },
            phone: { type: 'string' },
            note: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer' },
            price: { type: 'number' },
            product: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                images: { type: 'array', items: { type: 'string' } },
                slug: { type: 'string' },
              },
            },
          },
        },
        // Category schema
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            image: { type: 'string', nullable: true },
            product_count: { type: 'integer' },
          },
        },
        // Admin Stats schema
        AdminStats: {
          type: 'object',
          properties: {
            revenue: {
              type: 'object',
              properties: {
                today: { type: 'number' },
                week: { type: 'number' },
                month: { type: 'number' },
                total: { type: 'number' },
              },
            },
            orders: {
              type: 'object',
              properties: {
                pending: { type: 'integer' },
                confirmed: { type: 'integer' },
                shipping: { type: 'integer' },
                delivered: { type: 'integer' },
                cancelled: { type: 'integer' },
              },
            },
            users: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                newThisMonth: { type: 'integer' },
              },
            },
            products: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                lowStock: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/docs/routes/*.ts'], // Path to the API docs
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

/**
 * Setup Swagger UI middleware
 * Requirements: 7.4 - API Documentation accessible via web interface
 */
export function setupSwagger(app: Express): void {
  // Swagger UI options
  const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NHH-Coffee API Documentation',
  }

  // Mount Swagger UI at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

  // Serve raw OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  console.log(`📚 API Documentation available at http://localhost:${config.port}/api-docs`)
}

export { swaggerSpec }
