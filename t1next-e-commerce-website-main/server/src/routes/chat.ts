import { Router } from 'express'
import { authMiddleware, staffMiddleware } from '../middleware/auth.js'
import prisma from '../db/prisma.js'
import { getOnlineStaffCount } from '../socket/chat.handler.js'

const router = Router()

// Get chat sessions for current user
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { 
        userId: req.user!.userId,
        // Lấy tất cả sessions của user (cả đang chờ và đã có staff)
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        staff: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter out AI messages on the application level
    const filteredSessions = sessions.map(session => ({
      ...session,
      messages: session.messages.filter(msg => msg.senderId !== null)
    }))

    res.json({ success: true, data: filteredSessions })
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch chat sessions' })
  }
})

// Get messages for a specific session
router.get('/sessions/:sessionId/messages', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.user!.userId

    // Verify user has access to this session
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        OR: [
          { userId },
          { staffId: userId },
        ],
      },
    })

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { 
        sessionId,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Filter out AI messages (senderId = null)
    const filteredMessages = messages.filter(msg => msg.senderId !== null)

    res.json({ success: true, data: filteredMessages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch messages' })
  }
})

// Staff: Get all active chat sessions
router.get('/staff/sessions', staffMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        status: { in: ['waiting', 'active'] },
        // Lấy cả sessions chưa có staff (waiting) và đã có staff (active)
        // Không lọc staffId để hiển thị cả sessions đang chờ
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        staff: {
          select: { id: true, name: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { status: 'asc' }, // waiting first
        { createdAt: 'asc' }, // oldest first
      ],
    })

    // Filter out AI messages on the application level
    const filteredSessions = sessions.map(session => ({
      ...session,
      messages: session.messages.filter(msg => msg.senderId !== null)
    }))

    res.json({ success: true, data: filteredSessions })
  } catch (error) {
    console.error('Error fetching staff sessions:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' })
  }
})

// Staff: Get session history
router.get('/staff/history', staffMiddleware, async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: { status: 'closed' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true, email: true },
          },
          staff: {
            select: { id: true, name: true, avatar: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { closedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.chatSession.count({ where: { status: 'closed' } }),
    ])

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('Error fetching session history:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch history' })
  }
})

// Get online staff count (for queue estimation)
router.get('/staff/online', async (req, res) => {
  try {
    const status = getOnlineStaffCount()
    res.json({ success: true, data: status })
  } catch (error) {
    console.error('Error fetching online staff:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch online staff' })
  }
})

export default router
