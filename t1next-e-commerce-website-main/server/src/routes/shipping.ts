import { Router } from 'express'
import { calculateShippingFee, getShippingRates } from '../services/shipping.service.js'

const router = Router()

// GET /api/shipping/rates - Get all shipping rates
router.get('/rates', (req, res) => {
  const rates = getShippingRates()
  res.json({ success: true, data: rates })
})

// POST /api/shipping/calculate - Calculate shipping fee
router.post('/calculate', (req, res) => {
  const { address, orderTotal } = req.body

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ success: false, error: 'Địa chỉ không hợp lệ' })
  }

  const total = Number(orderTotal) || 0
  const result = calculateShippingFee(address, total)

  res.json({
    success: true,
    data: {
      fee: result.fee,
      region: result.region,
      freeShippingThreshold: result.freeShippingThreshold,
      isFreeShipping: result.isFreeShipping
    }
  })
})

export default router
