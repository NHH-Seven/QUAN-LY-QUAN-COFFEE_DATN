/**
 * Chatbot Knowledge Management Routes
 * Quản lý kiến thức cho AI Chatbot
 */

import { Router } from 'express'
import { query, queryOne } from '../db/index.js'
import { adminMiddleware, authMiddleware } from '../middleware/auth.js'

const router = Router()

interface Knowledge {
  id: string
  title: string
  content: string
  category: string | null
  tags: string[] | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

// GET /api/chatbot-knowledge - Lấy danh sách kiến thức (Admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { category, search, is_active } = req.query

    let sql = 'SELECT * FROM chatbot_knowledge WHERE 1=1'
    const params: unknown[] = []
    let idx = 1

    if (category) {
      sql += ' AND category = $' + idx
      params.push(category)
      idx++
    }

    if (search) {
      sql += ' AND (title ILIKE $' + idx + ' OR content ILIKE $' + idx + ')'
      params.push(`%${search}%`)
      idx++
    }

    if (is_active !== undefined) {
      sql += ' AND is_active = $' + idx
      params.push(is_active === 'true')
      idx++
    }

    sql += ' ORDER BY created_at DESC'

    const knowledge = await query<Knowledge>(sql, params)
    res.json({ success: true, data: knowledge })
  } catch (error) {
    console.error('Get knowledge error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/chatbot-knowledge/search - Tìm kiếm kiến thức (Public - cho chatbot)
router.get('/search', async (req, res) => {
  try {
    const { query: searchQuery } = req.query

    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.json({ success: true, data: [] })
    }

    // Tìm kiếm trong title, content, tags
    const knowledge = await query<Knowledge>(
      `SELECT * FROM chatbot_knowledge 
       WHERE is_active = true 
         AND (
           title ILIKE $1 
           OR content ILIKE $1 
           OR $2 = ANY(tags)
         )
       ORDER BY 
         CASE 
           WHEN title ILIKE $1 THEN 1
           WHEN content ILIKE $1 THEN 2
           ELSE 3
         END
       LIMIT 5`,
      [`%${searchQuery}%`, searchQuery]
    )

    res.json({ success: true, data: knowledge })
  } catch (error) {
    console.error('Search knowledge error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/chatbot-knowledge/:id - Lấy chi tiết kiến thức
router.get('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const knowledge = await queryOne<Knowledge>(
      'SELECT * FROM chatbot_knowledge WHERE id = $1',
      [id]
    )

    if (!knowledge) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kiến thức' })
    }

    res.json({ success: true, data: knowledge })
  } catch (error) {
    console.error('Get knowledge detail error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// POST /api/chatbot-knowledge - Tạo kiến thức mới (Admin)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { title, content, category, tags, is_active } = req.body

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Thiếu tiêu đề hoặc nội dung' })
    }

    const knowledge = await queryOne<Knowledge>(
      `INSERT INTO chatbot_knowledge (title, content, category, tags, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, category || null, tags || null, is_active !== false]
    )

    res.status(201).json({ success: true, data: knowledge, message: 'Đã tạo kiến thức mới' })
  } catch (error) {
    console.error('Create knowledge error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// PUT /api/chatbot-knowledge/:id - Cập nhật kiến thức (Admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, category, tags, is_active } = req.body

    const knowledge = await queryOne<Knowledge>(
      `UPDATE chatbot_knowledge 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           category = COALESCE($3, category),
           tags = COALESCE($4, tags),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, content, category, tags, is_active, id]
    )

    if (!knowledge) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kiến thức' })
    }

    res.json({ success: true, data: knowledge, message: 'Đã cập nhật kiến thức' })
  } catch (error) {
    console.error('Update knowledge error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// DELETE /api/chatbot-knowledge/:id - Xóa kiến thức (Admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const knowledge = await queryOne(
      'DELETE FROM chatbot_knowledge WHERE id = $1 RETURNING id',
      [id]
    )

    if (!knowledge) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kiến thức' })
    }

    res.json({ success: true, message: 'Đã xóa kiến thức' })
  } catch (error) {
    console.error('Delete knowledge error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// GET /api/chatbot-knowledge/categories/list - Lấy danh sách categories
router.get('/categories/list', adminMiddleware, async (req, res) => {
  try {
    const categories = await query<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count 
       FROM chatbot_knowledge 
       WHERE category IS NOT NULL 
       GROUP BY category 
       ORDER BY count DESC`
    )

    res.json({ success: true, data: categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

export default router
