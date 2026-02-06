import { Router } from 'express'
import { warehouseMiddleware } from '../../middleware/auth.js'
import stockRoutes from './stock.js'
import inventoryRoutes from './inventory.js'

const router = Router()

// All warehouse routes require warehouse or admin role
router.use(warehouseMiddleware)

// Mount warehouse sub-routes
router.use('/stock', stockRoutes)
router.use('/inventory', inventoryRoutes)

export default router
