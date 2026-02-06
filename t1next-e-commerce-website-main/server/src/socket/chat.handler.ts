import { Server } from 'socket.io'
import prisma from '../db/prisma.js'
import type { AuthenticatedSocket } from './index.js'
import { emitToUser, emitToStaff, emitToRoom } from './index.js'

// Track online staff for queue estimation
const onlineStaff = new Map<string, string>() // staffId -> socketId

// Chat event types
interface ChatStartData {
  message?: string
}

interface ChatMessageData {
  sessionId: string
  content: string
}

interface ChatTypingData {
  sessionId: string
  isTyping: boolean
}

interface ChatEndData {
  sessionId: string
}

interface ChatAcceptData {
  sessionId: string
}

/**
 * Initialize chat-related socket event handlers
 */
export function initializeChatHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId
    const userRole = socket.user?.role

    if (!userId) return

    // Track online staff
    if (userRole && ['admin', 'sales'].includes(userRole)) {
      onlineStaff.set(userId, socket.id)
      broadcastStaffStatus(io)
    }

    // Join user to their active chat sessions
    joinActiveSessions(socket, userId)

    // ==================== USER EVENTS ====================

    // Start a new chat session
    socket.on('chat:start', async (data: ChatStartData) => {
      try {
        // Check if user already has an active session
        const existingSession = await prisma.chatSession.findFirst({
          where: {
            userId,
            status: { in: ['waiting', 'active'] },
          },
        })

        if (existingSession) {
          socket.emit('chat:error', { message: 'Bạn đã có phiên chat đang hoạt động' })
          socket.emit('chat:session', existingSession)
          return
        }

        // Create new session
        const session = await prisma.chatSession.create({
          data: {
            userId,
            status: 'waiting',
          },
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
        })

        // If initial message provided, save it
        if (data.message) {
          await prisma.chatMessage.create({
            data: {
              sessionId: session.id,
              senderId: userId,
              content: data.message,
            },
          })
        }

        // Join socket to session room
        socket.join(`chat:${session.id}`)

        // Emit to user
        socket.emit('chat:session', session)

        // Notify staff about new chat
        emitToStaff('chat:new_session', {
          session,
          queuePosition: await getQueuePosition(session.id),
        })

        console.log(`💬 New chat session: ${session.id} by user ${userId}`)
      } catch (error) {
        console.error('Error starting chat:', error)
        socket.emit('chat:error', { message: 'Không thể bắt đầu chat' })
      }
    })

    // Send a message
    socket.on('chat:message', async (data: ChatMessageData) => {
      try {
        const { sessionId, content } = data

        if (!content?.trim()) {
          socket.emit('chat:error', { message: 'Tin nhắn không được để trống' })
          return
        }

        // Verify user has access to this session
        const session = await prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            OR: [{ userId }, { staffId: userId }],
            status: { in: ['waiting', 'active'] },
          },
        })

        if (!session) {
          socket.emit('chat:error', { message: 'Phiên chat không tồn tại hoặc đã kết thúc' })
          return
        }

        // Save message
        const message = await prisma.chatMessage.create({
          data: {
            sessionId,
            senderId: userId,
            content: content.trim(),
          },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true },
            },
          },
        })

        // Broadcast to session room
        emitToRoom(`chat:${sessionId}`, 'chat:message', message)

        console.log(`💬 Message in session ${sessionId}: ${content.substring(0, 50)}...`)
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('chat:error', { message: 'Không thể gửi tin nhắn' })
      }
    })

    // Typing indicator
    socket.on('chat:typing', async (data: ChatTypingData) => {
      try {
        const { sessionId, isTyping } = data

        // Verify access
        const session = await prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            OR: [{ userId }, { staffId: userId }],
          },
        })

        if (!session) return

        // Broadcast typing status to session room (except sender)
        socket.to(`chat:${sessionId}`).emit('chat:typing', {
          sessionId,
          userId,
          isTyping,
        })
      } catch (error) {
        console.error('Error with typing indicator:', error)
      }
    })

    // End chat session (user can end their own session)
    socket.on('chat:end', async (data: ChatEndData) => {
      try {
        const { sessionId } = data

        const session = await prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            OR: [{ userId }, { staffId: userId }],
            status: { in: ['waiting', 'active'] },
          },
        })

        if (!session) {
          socket.emit('chat:error', { message: 'Phiên chat không tồn tại' })
          return
        }

        // Close session
        const closedSession = await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            status: 'closed',
            closedAt: new Date(),
          },
        })

        // Notify all participants
        emitToRoom(`chat:${sessionId}`, 'chat:ended', {
          sessionId,
          closedBy: userId,
        })

        // Leave room
        socket.leave(`chat:${sessionId}`)

        console.log(`💬 Chat session ended: ${sessionId}`)
      } catch (error) {
        console.error('Error ending chat:', error)
        socket.emit('chat:error', { message: 'Không thể kết thúc chat' })
      }
    })

    // ==================== STAFF EVENTS ====================

    // Staff accepts a chat session
    socket.on('chat:accept', async (data: ChatAcceptData) => {
      try {
        if (!userRole || !['admin', 'sales'].includes(userRole)) {
          socket.emit('chat:error', { message: 'Không có quyền' })
          return
        }

        const { sessionId } = data

        // Verify staff exists
        const staff = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true }
        })

        if (!staff || (staff.role !== 'admin' && staff.role !== 'sales')) {
          socket.emit('chat:error', { message: 'Bạn không có quyền nhận chat. Vui lòng đăng nhập lại.' })
          return
        }

        const session = await prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            status: 'waiting',
          },
        })

        if (!session) {
          socket.emit('chat:error', { message: 'Phiên chat không còn khả dụng' })
          return
        }

        // Assign staff to session
        const updatedSession = await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            staffId: userId,
            status: 'active',
          },
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
            staff: {
              select: { id: true, name: true, avatar: true },
            },
          },
        })

        // Join staff to session room
        socket.join(`chat:${sessionId}`)

        // Notify user that staff has joined
        emitToRoom(`chat:${sessionId}`, 'chat:assigned', {
          session: updatedSession,
          staff: updatedSession.staff,
        })

        // Update staff dashboard
        emitToStaff('chat:session_accepted', {
          sessionId,
          staffId: userId,
        })

        console.log(`💬 Staff ${userId} accepted session ${sessionId}`)
      } catch (error) {
        console.error('Error accepting chat:', error)
        socket.emit('chat:error', { message: 'Không thể nhận chat' })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      if (userRole && ['admin', 'sales'].includes(userRole)) {
        onlineStaff.delete(userId)
        broadcastStaffStatus(io)
      }
    })
  })

  console.log('💬 Chat handlers initialized')
}

/**
 * Join socket to all active chat sessions for the user
 */
async function joinActiveSessions(socket: AuthenticatedSocket, userId: string): Promise<void> {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        OR: [{ userId }, { staffId: userId }],
        status: { in: ['waiting', 'active'] },
      },
    })

    for (const session of sessions) {
      socket.join(`chat:${session.id}`)
    }
  } catch (error) {
    console.error('Error joining active sessions:', error)
  }
}

/**
 * Get queue position for a waiting session
 */
async function getQueuePosition(sessionId: string): Promise<number> {
  const waitingSessions = await prisma.chatSession.findMany({
    where: { status: 'waiting' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  const position = waitingSessions.findIndex(s => s.id === sessionId)
  return position + 1
}

/**
 * Broadcast online staff count to all clients
 */
function broadcastStaffStatus(io: Server): void {
  const onlineCount = onlineStaff.size
  const estimatedWait = onlineCount > 0 ? Math.ceil(5 / onlineCount) : null // 5 min per staff

  io.emit('chat:staff_status', {
    onlineCount,
    estimatedWait,
  })
}

/**
 * Get online staff count (exported for REST API)
 */
export function getOnlineStaffCount(): { onlineCount: number; estimatedWait: number | null } {
  const onlineCount = onlineStaff.size
  const estimatedWait = onlineCount > 0 ? Math.ceil(5 / onlineCount) : null
  return { onlineCount, estimatedWait }
}
