"use client"

/**
 * Chat Context
 * Quản lý chat state và Socket.io connection
 * - Connect/disconnect socket
 * - Send/receive messages
 * - Manage chat sessions
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "./auth-context"
import { api } from "@/lib/api"

// Types
export interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  content: string
  createdAt: string
  sender?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface ChatSession {
  id: string
  userId: string
  staffId?: string
  status: "waiting" | "active" | "closed"
  createdAt: string
  closedAt?: string
  user?: {
    id: string
    name: string
    avatar?: string
    email?: string
  }
  staff?: {
    id: string
    name: string
    avatar?: string
  }
  messages?: ChatMessage[]
}

interface StaffStatus {
  onlineCount: number
  estimatedWait: number | null
}

interface ChatContextType {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  
  // Chat state
  session: ChatSession | null
  messages: ChatMessage[]
  isTyping: boolean
  typingUser: string | null
  staffStatus: StaffStatus
  
  // Actions
  connect: () => void
  disconnect: () => void
  startChat: (initialMessage?: string) => void
  sendMessage: (content: string) => void
  sendTyping: (isTyping: boolean) => void
  endChat: () => void
  
  // UI state
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // Chat state
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [staffStatus, setStaffStatus] = useState<StaffStatus>({ onlineCount: 0, estimatedWait: null })
  
  // UI state
  const [isOpen, setIsOpen] = useState(false)

  // Connect to socket
  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnecting || !isAuthenticated) return
    
    const token = api.getToken()
    if (!token) return
    
    setIsConnecting(true)
    
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    
    socket.on('connect', () => {
      console.log('🔌 Chat connected')
      setIsConnected(true)
      setIsConnecting(false)
    })
    
    socket.on('disconnect', () => {
      console.log('🔌 Chat disconnected')
      setIsConnected(false)
    })
    
    socket.on('connect_error', (error) => {
      console.error('🔌 Chat connection error:', error.message)
      setIsConnecting(false)
    })
    
    // Chat events
    socket.on('chat:session', (newSession: ChatSession) => {
      setSession(newSession)
    })
    
    socket.on('chat:message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
      setIsTyping(false)
      setTypingUser(null)
    })
    
    socket.on('chat:typing', (data: { sessionId: string; userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping)
        setTypingUser(data.isTyping ? data.userId : null)
      }
    })
    
    socket.on('chat:assigned', (data: { session: ChatSession; staff: ChatSession['staff'] }) => {
      setSession(data.session)
    })
    
    socket.on('chat:ended', () => {
      // Reset session immediately to show start chat UI
      setSession(null)
      setMessages([])
    })
    
    socket.on('chat:staff_status', (status: StaffStatus) => {
      setStaffStatus(status)
    })
    
    socket.on('chat:error', (error: { message: string }) => {
      console.error('Chat error:', error.message)
    })
    
    socketRef.current = socket
  }, [isAuthenticated, isConnecting, user?.id])

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setSession(null)
      setMessages([])
    }
  }, [])

  // Start a new chat session
  const startChat = useCallback((initialMessage?: string) => {
    if (!socketRef.current?.connected) {
      connect()
      // Wait for connection then start chat
      setTimeout(() => {
        socketRef.current?.emit('chat:start', { message: initialMessage })
      }, 1000)
    } else {
      socketRef.current.emit('chat:start', { message: initialMessage })
    }
  }, [connect])

  // Send a message
  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current?.connected || !session) return
    
    socketRef.current.emit('chat:message', {
      sessionId: session.id,
      content,
    })
  }, [session])

  // Send typing indicator
  const sendTyping = useCallback((typing: boolean) => {
    if (!socketRef.current?.connected || !session) return
    
    socketRef.current.emit('chat:typing', {
      sessionId: session.id,
      isTyping: typing,
    })
  }, [session])

  // End chat session
  const endChat = useCallback(() => {
    if (!socketRef.current?.connected || !session) return
    
    socketRef.current.emit('chat:end', {
      sessionId: session.id,
    })
  }, [session])

  // Auto-connect when authenticated and chat is opened
  useEffect(() => {
    if (isAuthenticated && isOpen && !isConnected && !isConnecting) {
      connect()
    }
  }, [isAuthenticated, isOpen, isConnected, isConnecting, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Fetch staff status periodically
  useEffect(() => {
    const fetchStaffStatus = async () => {
      try {
        const response = await fetch(`${SOCKET_URL}/api/chat/staff/online`)
        const data = await response.json()
        if (data.success) {
          setStaffStatus(data.data)
        }
      } catch {
        // Ignore errors
      }
    }
    
    fetchStaffStatus()
    const interval = setInterval(fetchStaffStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        isConnecting,
        session,
        messages,
        isTyping,
        typingUser,
        staffStatus,
        connect,
        disconnect,
        startChat,
        sendMessage,
        sendTyping,
        endChat,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

/**
 * Hook để sử dụng Chat Context
 */
export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
