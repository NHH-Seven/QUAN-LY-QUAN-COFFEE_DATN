/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filters
 *     description: |
 *       Returns a paginated list of products with optional filtering and sorting.
 *       Supports search, category filter, price range, and various sort options.
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 50
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category slug to filter by
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Brand name to filter by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, description, or brand
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured products only
 *       - in: query
 *         name: isNew
 *         schema:
 *           type: boolean
 *         description: Filter new products only
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, rating, bestseller]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 12
 *                 totalPages:
 *                   type: integer
 *                   example: 9
 */

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     description: Returns up to 8 featured products
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: List of featured products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products/new:
 *   get:
 *     summary: Get new products
 *     description: Returns up to 8 new products
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200:
 *         description: List of new products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/products/flash-sale:
 *   get:
 *     summary: Get flash sale products
 *     description: Returns products with active discounts, including today's sold count
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *           maximum: 12
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: List of flash sale products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Product'
 *                       - type: object
 *                         properties:
 *                           sold_today:
 *                             type: integer
 *                             description: Number of units sold today
 *                           flash_sale_stock:
 *                             type: integer
 *                             description: Flash sale stock limit
 */

/**
 * @swagger
 * /api/products/by-id/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Returns full product data by product ID
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/products/{slug}:
 *   get:
 *     summary: Get product by slug
 *     description: Returns full product data by product slug (cached)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *         example: iphone-15-pro-max
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products (Admin)
 *     description: |
 *       Returns a paginated list of products for admin management.
 *       Requires admin or sales role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, price, stock, created_at, rating]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *   post:
 *     summary: Create new product (Admin)
 *     description: Creates a new product. Requires admin or sales role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15 Pro Max
 *               description:
 *                 type: string
 *                 example: Flagship smartphone with A17 Pro chip
 *               price:
 *                 type: number
 *                 example: 34990000
 *               original_price:
 *                 type: number
 *                 example: 36990000
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["/iphone-15-pro-max.jpg"]
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               brand:
 *                 type: string
 *                 example: Apple
 *               specs:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   Display: "6.7 inch Super Retina XDR"
 *                   Chip: "A17 Pro"
 *               stock:
 *                 type: integer
 *                 default: 0
 *               is_new:
 *                 type: boolean
 *                 default: false
 *               is_featured:
 *                 type: boolean
 *                 default: false
 *               discount:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/admin/products/{id}:
 *   get:
 *     summary: Get product by ID (Admin)
 *     description: Returns product details for admin. Requires admin or sales role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update product (Admin)
 *     description: Updates an existing product. Requires admin or sales role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               original_price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               brand:
 *                 type: string
 *               specs:
 *                 type: object
 *               stock:
 *                 type: integer
 *               is_new:
 *                 type: boolean
 *               is_featured:
 *                 type: boolean
 *               discount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete product (Admin)
 *     description: |
 *       Soft deletes a product (sets stock to -1).
 *       Preserves data for order history.
 *       Requires admin or sales role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sản phẩm đã được xóa
 *       404:
 *         description: Product not found
 */

export {}
