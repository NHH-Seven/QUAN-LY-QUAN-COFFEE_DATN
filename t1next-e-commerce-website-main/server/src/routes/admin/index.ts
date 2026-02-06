import { Router } from 'express'
import { adminMiddleware, staffMiddleware, salesMiddleware } from '../../middleware/auth.js'
import statsRoutes from './stats.js'
import productsRoutes from './products.js'
import ordersRoutes from './orders.js'
import usersRoutes from './users.js'
import categoriesRoutes from './categories.js'
import staffRoutes from './staff.js'
import importRoutes from './import.js'
import exportRoutes from './export.js'
import trackingRoutes from './tracking.js'
import backupRoutes from './backup.js'

const router = Router()

// Orders - accessible by all staff (admin, sales, warehouse)
router.use('/orders', staffMiddleware, ordersRoutes)

// Tracking - accessible by all staff
router.use('/tracking', staffMiddleware, trackingRoutes)

// Stats, Products - admin and sales only
router.use('/stats', salesMiddleware, statsRoutes)
router.use('/products', salesMiddleware, productsRoutes)

// Import/Export - admin and sales
router.use('/import', salesMiddleware, importRoutes)
router.use('/export', salesMiddleware, exportRoutes)

// Users, Categories - admin and sales (sales chỉ xem)
router.use('/users', salesMiddleware, usersRoutes)
router.use('/categories', salesMiddleware, categoriesRoutes)

// Staff management - admin only
router.use('/staff', adminMiddleware, staffRoutes)

// Backup - admin only
router.use('/backup', adminMiddleware, backupRoutes)

export default router
