import { Router } from 'express'
import { query, queryOne } from '../db/index.js'
import type { Category } from '../types/index.js'
import { 
  getCacheService, 
  CACHE_KEYS, 
  CACHE_TTL 
} from '../services/cache.service.js'

const router = Router()

// Get all categories
router.get('/', async (req, res) => {
  try {
    const cache = getCacheService()
    const cacheKey = CACHE_KEYS.CATEGORIES

    // Try to get from cache first
    const cachedCategories = await cache.get<Category[]>(cacheKey)
    if (cachedCategories) {
      return res.json({ success: true, data: cachedCategories })
    }

    const categories = await query<Category>('SELECT * FROM categories ORDER BY name')
    
    // Cache the categories
    await cache.set(cacheKey, categories, CACHE_TTL.CATEGORIES)

    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get category by slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await queryOne<Category>('SELECT * FROM categories WHERE slug = $1', [req.params.slug])

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' })
    }

    res.json({ success: true, data: category })
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
