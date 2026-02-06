/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders (legacy)
 *     description: |
 *       Returns all orders for the authenticated user.
 *       Use /api/orders/my for paginated results.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get user orders with pagination
 *     description: Returns paginated orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
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
 *           default: 10
 *           maximum: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of orders
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
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: |
 *       Returns order details by ID.
 *       Users can only view their own orders.
 *       Admins can view any order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order
 *     description: |
 *       Cancels a pending order and restores product stock.
 *       Only pending orders can be cancelled.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled
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
 *                   example: Order cancelled
 *       400:
 *         description: Order cannot be cancelled (not pending)
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/checkout:
 *   get:
 *     summary: Get checkout information
 *     description: |
 *       Returns cart items, subtotal, shipping fee, and user info for checkout.
 *       Requires authenticated user with items in cart.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CartItem'
 *                     subtotal:
 *                       type: number
 *                       example: 34990000
 *                     shippingFee:
 *                       type: number
 *                       example: 30000
 *                     shippingInfo:
 *                       type: object
 *                       properties:
 *                         region:
 *                           type: string
 *                           example: hcm
 *                         freeShippingThreshold:
 *                           type: number
 *                           example: 500000
 *                         isFreeShipping:
 *                           type: boolean
 *                     total:
 *                       type: number
 *                       example: 35020000
 *                     user:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         address:
 *                           type: string
 *       400:
 *         description: Cart is empty
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Create order (Checkout)
 *     description: |
 *       Creates a new order from the user's cart.
 *       Validates stock, calculates shipping, and clears cart on success.
 *       Supports idempotency key to prevent duplicate orders.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientName
 *               - phone
 *               - address
 *               - paymentMethod
 *             properties:
 *               recipientName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               address:
 *                 type: string
 *                 example: 123 Đường ABC, Quận 1, TP.HCM
 *               note:
 *                 type: string
 *                 example: Giao hàng giờ hành chính
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, bank_transfer]
 *                 example: cod
 *               idempotencyKey:
 *                 type: string
 *                 description: Unique key to prevent duplicate orders
 *               promotionId:
 *                 type: string
 *                 format: uuid
 *                 description: Promotion ID to apply
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount from promotion
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       format: uuid
 *                     total:
 *                       type: number
 *                       example: 35020000
 *                     status:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: Validation error or cart empty
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                   example: INSUFFICIENT_STOCK
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           requested:
 *                             type: integer
 *                           available:
 *                             type: integer
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (Admin)
 *     description: |
 *       Returns paginated list of all orders with filtering options.
 *       Requires staff role (admin, sales, or warehouse).
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipping, delivered, cancelled]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, total, status]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of orders
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
 *                       - $ref: '#/components/schemas/Order'
 *                       - type: object
 *                         properties:
 *                           user_name:
 *                             type: string
 *                           user_email:
 *                             type: string
 *                           items_count:
 *                             type: integer
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
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order detail (Admin)
 *     description: Returns detailed order information including user details
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
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Order'
 *                     - type: object
 *                       properties:
 *                         user_name:
 *                           type: string
 *                         user_email:
 *                           type: string
 *                         user_phone:
 *                           type: string
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin)
 *     description: |
 *       Updates order status with validation of allowed transitions.
 *       Sends push notification and in-app notification to user.
 *       
 *       **Allowed transitions:**
 *       - pending → confirmed, cancelled
 *       - confirmed → shipping, cancelled
 *       - shipping → delivered, cancelled
 *       - delivered → (none)
 *       - cancelled → (none)
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipping, delivered, cancelled]
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: Cập nhật trạng thái đơn hàng thành công
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Order not found
 */

export {}
