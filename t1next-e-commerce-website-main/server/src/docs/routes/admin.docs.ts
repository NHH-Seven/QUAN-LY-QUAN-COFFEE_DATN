/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: |
 *       Returns comprehensive statistics for the admin dashboard including:
 *       - Revenue (today, week, month, total)
 *       - Order counts by status
 *       - User statistics
 *       - Product statistics
 *       - Return statistics
 *       - Recent orders
 *       - Low stock products
 *       
 *       Requires admin or sales role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AdminStats'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin)
 *     description: |
 *       Returns paginated list of users with search and sorting.
 *       Includes order count and total spent for each user.
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
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, name, email, role]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of users
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/User'
 *                       - type: object
 *                         properties:
 *                           orders_count:
 *                             type: integer
 *                           total_spent:
 *                             type: number
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
 */

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user detail (Admin)
 *     description: Returns user details with order history
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
 *         description: User details with orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         orders:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Order'
 *                         total_spent:
 *                           type: number
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user (Admin)
 *     description: Updates user information
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
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Activate/deactivate user (Admin)
 *     description: |
 *       Enables or disables a user account.
 *       Cannot deactivate admin accounts.
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
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot deactivate admin
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     description: |
 *       Returns revenue statistics grouped by time period.
 *       Includes comparison with previous period.
 *       Requires staff role.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (default 30 days ago)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (default today)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated category IDs
 *       - in: query
 *         name: statuses
 *         schema:
 *           type: string
 *         description: Comma-separated order statuses
 *       - in: query
 *         name: paymentMethods
 *         schema:
 *           type: string
 *         description: Comma-separated payment methods
 *     responses:
 *       200:
 *         description: Revenue report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chart:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           orders:
 *                             type: integer
 *                           items:
 *                             type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                         totalOrders:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         avgOrderValue:
 *                           type: number
 *                         revenueGrowth:
 *                           type: number
 *                         prevRevenue:
 *                           type: number
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/reports/top-products:
 *   get:
 *     summary: Get top selling products
 *     description: Returns best-selling products by quantity
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Top products list
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
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                       productId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       image:
 *                         type: string
 *                       totalQuantity:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *                       orderCount:
 *                         type: integer
 */

/**
 * @swagger
 * /api/reports/top-categories:
 *   get:
 *     summary: Get revenue by category
 *     description: Returns revenue breakdown by product category
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Category revenue data
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
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       totalQuantity:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 *                       productCount:
 *                         type: integer
 *                       percentage:
 *                         type: number
 */

/**
 * @swagger
 * /api/reports/order-status:
 *   get:
 *     summary: Get order status statistics
 *     description: Returns order counts grouped by status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Order status statistics
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
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       name:
 *                         type: string
 *                       color:
 *                         type: string
 *                       totalOrders:
 *                         type: integer
 *                       totalRevenue:
 *                         type: number
 */

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     summary: Export report data
 *     description: |
 *       Exports report data to CSV or XLSX format.
 *       Supports revenue, orders, products, and categories reports.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [revenue, orders, products, categories]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: xlsx
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: For revenue report only
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid report type or date format
 */

export {}
