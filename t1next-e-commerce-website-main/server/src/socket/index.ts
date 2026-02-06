import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import type { JwtPayload } from '../types/index.js'

// Extended socket with user info
export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload
}

// Socket.io server instance
let io: Server | null = null

/**
 * Initialize Socket.io server with authentication middleware
 */
export function initializeSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      const decoded = jwt.verify(token as string, config.jwt.secret) as JwtPayload
      socket.user = decoded
      next()
    } catch {
      return next(new Error('Invalid token'))
    }
  })

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.user?.userId}`)

    // Join user to their personal room for direct messages
    if (socket.user?.userId) {
      socket.join(`user:${socket.user.userId}`)
    }

    // Join staff to staff room for notifications
    if (socket.user?.role && ['admin', 'sales'].includes(socket.user.role)) {
      socket.join('staff')
    }

    // Join kitchen room for baristas/kitchen staff
    if (socket.user?.role && ['admin', 'sales', 'warehouse'].includes(socket.user.role)) {
      socket.join('kitchen')
      socket.join('service')
      console.log(`👨‍🍳 User ${socket.user.userId} (${socket.user.role}) joined kitchen room`)
    }

    // Allow manual room joining
    socket.on('join:room', (room: string) => {
      if (['kitchen', 'service', 'tables'].includes(room)) {
        socket.join(room)
        console.log(`User ${socket.user?.userId} joined room: ${room}`)
      }
    })

    socket.on('leave:room', (room: string) => {
      socket.leave(room)
      console.log(`User ${socket.user?.userId} left room: ${room}`)
    })

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user?.userId}`)
    })
  })

  console.log('🔌 Socket.io server initialized')
  return io
}

/**
 * Get the Socket.io server instance
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocketServer first.')
  }
  return io
}

/**
 * Emit event to a specific user
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data)
  }
}

/**
 * Emit event to all staff members
 */
export function emitToStaff(event: string, data: unknown): void {
  if (io) {
    io.to('staff').emit(event, data)
  }
}

/**
 * Emit event to a specific room
 */
export function emitToRoom(room: string, event: string, data: unknown): void {
  if (io) {
    io.to(room).emit(event, data)
  }
}
