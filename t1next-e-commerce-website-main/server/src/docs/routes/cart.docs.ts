/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get cart items
 *     description: Returns all items in the authenticated user's cart with product details
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       quantity:
 *                         type: integer
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           price:
 *                             type: number
 *                           originalPrice:
 *                             type: number
 *                             nullable: true
 *                           images:
 *                             type: array
 *                             items:
 *                               type: string
 *                           brand:
 *                             type: string
 *                           stock:
 *                             type: integer
 *                           discount:
 *                             type: integer
 *                           category:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               slug:
 *                                 type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Add item to cart
 *     description: |
 *       Adds a product to the cart or increases quantity if already exists.
 *       Validates stock availability before adding.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID to add
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 minimum: 1
 *                 description: Quantity to add
 *           example:
 *             productId: "550e8400-e29b-41d4-a716-446655440000"
 *             quantity: 2
 *     responses:
 *       201:
 *         description: Item added to cart
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *       400:
 *         description: |
 *           Validation error or insufficient stock.
 *           Returns INSUFFICIENT_STOCK code when stock is not available.
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
 *                   example: Không đủ hàng. Chỉ còn 5 sản phẩm khả dụng
 *                 code:
 *                   type: string
 *                   example: INSUFFICIENT_STOCK
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: integer
 *                     requested:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Clear cart
 *     description: Removes all items from the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
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
 *                   example: Cart cleared
 *       401:
 *         description: Not authenticated
 */

/**
 * @swagger
 * /api/cart/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     description: |
 *       Updates the quantity of a specific cart item.
 *       Validates stock availability before updating.
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: New quantity
 *           example:
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Cart item updated
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *       400:
 *         description: Invalid quantity or insufficient stock
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
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Cart item not found
 *   delete:
 *     summary: Remove item from cart
 *     description: Removes a specific item from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
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
 *                   example: Item removed from cart
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Cart item not found
 */

export {}
