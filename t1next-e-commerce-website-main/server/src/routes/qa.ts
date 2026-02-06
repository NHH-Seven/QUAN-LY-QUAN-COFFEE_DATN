import { Router } from 'express'
import { query, queryOne } from '../db/index.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'

const router = Router()

interface Question {
  id: string
  product_id: string
  user_id: string
  question: string
  created_at: string
  user_name: string
}

interface Answer {
  id: string
  question_id: string
  user_id: string
  answer: string
  is_staff: boolean
  created_at: string
  user_name: string
}

// Get questions for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const questions = await query<Question>(
      `SELECT q.*, u.name as user_name 
       FROM product_questions q
       JOIN users u ON q.user_id = u.id
       WHERE q.product_id = $1
       ORDER BY q.created_at DESC`,
      [req.params.productId]
    )

    // Get answers for each question
    const questionsWithAnswers = await Promise.all(
      questions.map(async (q) => {
        const answers = await query<Answer>(
          `SELECT a.*, u.name as user_name
           FROM product_answers a
           LEFT JOIN users u ON a.user_id = u.id
           WHERE a.question_id = $1
           ORDER BY a.is_staff DESC, a.created_at ASC`,
          [q.id]
        )
        return { ...q, answers }
      })
    )

    res.json({ success: true, data: questionsWithAnswers })
  } catch (error) {
    console.error('Get questions error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// Ask a question
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, question } = req.body
    
    if (!productId || !question?.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin' })
    }

    const result = await queryOne<Question>(
      `INSERT INTO product_questions (product_id, user_id, question)
       VALUES ($1, $2, $3) RETURNING *`,
      [productId, req.user!.userId, question.trim()]
    )

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    console.error('Create question error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// Answer a question
router.post('/:questionId/answer', authMiddleware, async (req, res) => {
  try {
    const { answer } = req.body
    
    if (!answer?.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu câu trả lời' })
    }

    const isStaff = req.user!.role === 'admin' || req.user!.role === 'staff'

    const result = await queryOne<Answer>(
      `INSERT INTO product_answers (question_id, user_id, answer, is_staff)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.questionId, req.user!.userId, answer.trim(), isStaff]
    )

    res.status(201).json({ success: true, data: result })
  } catch (error) {
    console.error('Create answer error:', error)
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

// Delete question (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await queryOne(
      'DELETE FROM product_questions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.userId]
    )
    
    if (!result) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy' })
    }

    res.json({ success: true, message: 'Đã xóa' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' })
  }
})

export default router
