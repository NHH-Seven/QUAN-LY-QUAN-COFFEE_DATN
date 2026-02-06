/**
 * Global Socket.IO client
 * Shared across the application for real-time features
 */

import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'

let socket: Socket | null = null

/**
 * Initialize socket connection with authentication
 */
export function initSocket(token: string): Socket {
  if (socket?.connected) {
    console.log('🔌 Socket already connected, reusing:', socket.id)
    return socket
  }

  // Disconnect old socket if exists but not connected
  if (socket && !socket.connected) {
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 10000,
  })

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.warn('🔌 Socket connection error:', error.message)
    // Don't throw error, just log warning
  })

  // Make socket available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).socket = socket
  }

  return socket
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
    if (typeof window !== 'undefined') {
      (window as any).socket = null
    }
  }
}

/**
 * Join a room
 */
export function joinRoom(room: string): void {
  if (!socket) {
    console.warn(`⚠️ Cannot join room "${room}": Socket not initialized`)
    return
  }
  
  if (!socket.connected) {
    console.warn(`⚠️ Cannot join room "${room}": Socket not connected. Will join on reconnect.`)
    // Join when connected
    socket.once('connect', () => {
      socket!.emit('join:room', room)
      console.log(`📍 Joined room: ${room} (after reconnect)`)
    })
    return
  }
  
  socket.emit('join:room', room)
  console.log(`📍 Joined room: ${room}`)
}

/**
 * Leave a room
 */
export function leaveRoom(room: string): void {
  if (socket?.connected) {
    socket.emit('leave:room', room)
    console.log(`📍 Left room: ${room}`)
  }
}
