import prisma from '../db/prisma.js'
import type { ChatSession, ChatMessage, ChatSessionStatus } from '@prisma/client'

/**
 * Chat session status type
 */
export type SessionStatus = 'waiting' | 'active' | 'closed'

/**
 * Create a new chat session
 * Returns the created session with status 'waiting'
 */
export async function createChatSession(userId: string): Promise<ChatSession> {
  return prisma.chatSession.create({
    data: {
      userId,
      status: 'waiting',
    },
  })
}

/**
 * Validate that a session was created with correct initial status
 * Used for property testing
 */
export function validateSessionCreation(session: ChatSession | null, userId: string): boolean {
  if (!session) return false
  
  return (
    session.userId === userId &&
    session.status === 'waiting' &&
    session.staffId === null &&
    session.closedAt === null &&
    session.createdAt instanceof Date
  )
}

/**
 * Create a chat message in a session
 */
export async function createChatMessage(
  sessionId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      senderId,
      content,
    },
  })
}

/**
 * Validate that a message was created correctly
 * Used for property testing
 */
export function validateMessageCreation(
  message: ChatMessage | null,
  sessionId: string,
  senderId: string,
  content: string
): boolean {
  if (!message) return false
  
  return (
    message.sessionId === sessionId &&
    message.senderId === senderId &&
    message.content === content &&
    message.createdAt instanceof Date
  )
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Close a chat session
 */
export async function closeChatSession(sessionId: string): Promise<ChatSession> {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: 'closed',
      closedAt: new Date(),
    },
  })
}

/**
 * Validate that messages persist after session is closed
 * Used for property testing
 */
export async function validateHistoryPersistence(
  sessionId: string,
  expectedMessageCount: number
): Promise<boolean> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: true },
  })
  
  if (!session) return false
  
  return (
    session.status === 'closed' &&
    session.messages.length === expectedMessageCount
  )
}

/**
 * Pure function to validate session status transition
 * Used for property testing without database
 */
export function isValidStatusTransition(from: SessionStatus, to: SessionStatus): boolean {
  const validTransitions: Record<SessionStatus, SessionStatus[]> = {
    waiting: ['active', 'closed'],
    active: ['closed'],
    closed: [], // Cannot transition from closed
  }
  
  return validTransitions[from]?.includes(to) ?? false
}

/**
 * Pure function to validate session creation data
 * Used for property testing without database
 */
export function validateSessionData(data: {
  userId: string
  status: SessionStatus
  staffId: string | null
  closedAt: Date | null
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // userId must be non-empty
  if (!data.userId || data.userId.trim() === '') {
    errors.push('userId is required')
  }
  
  // Initial status must be 'waiting'
  if (data.status !== 'waiting') {
    errors.push('Initial status must be waiting')
  }
  
  // staffId must be null for new sessions
  if (data.staffId !== null) {
    errors.push('staffId must be null for new sessions')
  }
  
  // closedAt must be null for new sessions
  if (data.closedAt !== null) {
    errors.push('closedAt must be null for new sessions')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Pure function to validate message data
 * Used for property testing without database
 */
export function validateMessageData(data: {
  sessionId: string
  senderId: string
  content: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.sessionId || data.sessionId.trim() === '') {
    errors.push('sessionId is required')
  }
  
  if (!data.senderId || data.senderId.trim() === '') {
    errors.push('senderId is required')
  }
  
  if (!data.content || data.content.trim() === '') {
    errors.push('content is required')
  }
  
  return { valid: errors.length === 0, errors }
}
