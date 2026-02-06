/**
 * Chatbot API Routes
 */

import { Router } from 'express'
import { chatbotService } from '../services/chatbot.service.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// POST /api/chatbot/message - Gửi tin nhắn
router.post('/message', async (req, res) => {
  try {
    const { message, guestId } = req.body
    const user = (req as any).user // Có thể có hoặc không (guest)

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      })
    }

    const result = await chatbotService.handleMessage(
      message,
      user?.id,
      guestId,
      user?.name
    )

    res.json({
      success: true,
      data: {
        response: result.response,
        sessionId: result.sessionId,
      },
    })
  } catch (error) {
    console.error('Chatbot message error:', error)
    res.status(500).json({
      success: false,
      error: 'Xin lỗi, AI đang gặp sự cố. Vui lòng thử lại sau.',
    })
  }
})

// GET /api/chatbot/history/:sessionId - Lấy lịch sử chat
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { limit = 50 } = req.query

    const messages = await chatbotService.getChatHistory(
      sessionId,
      parseInt(limit as string)
    )

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error('Get chat history error:', error)
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy lịch sử chat',
    })
  }
})

// POST /api/chatbot/close/:sessionId - Đóng chat session
router.post('/close/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    await chatbotService.closeSession(sessionId)

    res.json({
      success: true,
      message: 'Chat session closed',
    })
  } catch (error) {
    console.error('Close session error:', error)
    res.status(500).json({
      success: false,
      error: 'Lỗi đóng chat',
    })
  }
})

// POST /api/chatbot/feedback - Gửi feedback
router.post('/feedback', async (req, res) => {
  try {
    const { sessionId, messageId, rating, feedback } = req.body

    if (!sessionId || !messageId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      })
    }

    await chatbotService.saveFeedback(sessionId, messageId, rating, feedback)

    res.json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá!',
    })
  } catch (error) {
    console.error('Save feedback error:', error)
    res.status(500).json({
      success: false,
      error: 'Lỗi lưu feedback',
    })
  }
})

// GET /api/chatbot/analytics - Lấy analytics (Admin only)
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { startDate, endDate } = req.query
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate as string) : new Date()

    const analytics = await chatbotService.getAnalytics(start, end)

    res.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy analytics',
    })
  }
})

export default router
