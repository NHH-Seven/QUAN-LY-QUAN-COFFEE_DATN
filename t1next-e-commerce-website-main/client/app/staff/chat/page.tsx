"use client"

/**
 * Staff Chat Dashboard
 * - List active chat sessions
 * - Queue management
 * - Accept/close sessions
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { MessageCircle, Users, Clock, CheckCircle, XCircle, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useStaffGuard } from "@/hooks/use-staff-guard"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'

interface ChatSession {
  id: string
  userId: string
  staffId?: string
  status: "waiting" | "active" | "closed"
  createdAt: string
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

interface ChatMessage {
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

export default function StaffChatPage() {
  const { isLoading: authLoading } = useStaffGuard()
  const { user } = useAuth()
  
  const socketRef = useRef<Socket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Connect to socket
  useEffect(() => {
    const token = api.getToken()
    if (!token || authLoading) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      console.log('🔌 Staff chat connected')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Staff chat disconnected')
      setIsConnected(false)
    })

    // New session notification
    socket.on('chat:new_session', (data: { session: ChatSession }) => {
      setSessions(prev => {
        const exists = prev.some(s => s.id === data.session.id)
        if (exists) return prev
        return [data.session, ...prev]
      })
    })

    // Session accepted by another staff
    socket.on('chat:session_accepted', (data: { sessionId: string; staffId: string }) => {
      setSessions(prev => prev.map(s => 
        s.id === data.sessionId 
          ? { ...s, status: 'active' as const, staffId: data.staffId }
          : s
      ))
    })

    // Message received
    socket.on('chat:message', (message: ChatMessage) => {
      if (selectedSession?.id === message.sessionId) {
        setMessages(prev => [...prev, message])
      }
      // Update session with latest message
      setSessions(prev => prev.map(s => 
        s.id === message.sessionId 
          ? { ...s, messages: [message] }
          : s
      ))
    })

    // Typing indicator
    socket.on('chat:typing', (data: { sessionId: string; userId: string; isTyping: boolean }) => {
      if (selectedSession?.id === data.sessionId && data.userId !== user?.id) {
        setIsTyping(data.isTyping)
      }
    })

    // Session ended
    socket.on('chat:ended', (data: { sessionId: string }) => {
      setSessions(prev => prev.map(s => 
        s.id === data.sessionId 
          ? { ...s, status: 'closed' as const }
          : s
      ))
      if (selectedSession?.id === data.sessionId) {
        setSelectedSession(prev => prev ? { ...prev, status: 'closed' } : null)
      }
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [authLoading, user?.id, selectedSession?.id])

  // Fetch active sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${SOCKET_URL}/api/chat/staff/sessions`, {
          headers: {
            'Authorization': `Bearer ${api.getToken()}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setSessions(data.data)
        }
      } catch (error) {
        console.error('Error fetching sessions:', error)
      }
    }

    if (!authLoading) {
      fetchSessions()
    }
  }, [authLoading])

  // Fetch messages when session is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedSession) return
      
      setIsLoadingMessages(true)
      try {
        const response = await fetch(`${SOCKET_URL}/api/chat/sessions/${selectedSession.id}/messages`, {
          headers: {
            'Authorization': `Bearer ${api.getToken()}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setMessages(data.data)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [selectedSession?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Accept session
  const handleAccept = useCallback((sessionId: string) => {
    if (!socketRef.current?.connected) return
    socketRef.current.emit('chat:accept', { sessionId })
    
    // Update local state
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, status: 'active' as const, staffId: user?.id }
        : s
    ))
  }, [user?.id])

  // Send message
  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !selectedSession || !socketRef.current?.connected) return
    
    socketRef.current.emit('chat:message', {
      sessionId: selectedSession.id,
      content: inputValue.trim(),
    })
    setInputValue("")
  }, [inputValue, selectedSession])

  // End session
  const handleEndSession = useCallback(() => {
    if (!selectedSession || !socketRef.current?.connected) return
    
    socketRef.current.emit('chat:end', {
      sessionId: selectedSession.id,
    })
  }, [selectedSession])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const waitingSessions = sessions.filter(s => s.status === 'waiting')
  const activeSessions = sessions.filter(s => s.status === 'active')
  const mySessions = activeSessions.filter(s => s.staffId === user?.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chat hỗ trợ</h1>
          <p className="text-muted-foreground">Quản lý các cuộc trò chuyện với khách hàng</p>
        </div>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "Đang kết nối" : "Mất kết nối"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mySessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng active</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Danh sách chat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Không có cuộc trò chuyện nào
                </div>
              ) : (
                <div className="divide-y">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedSession?.id === session.id && "bg-muted"
                      )}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={session.user?.avatar} />
                          <AvatarFallback>
                            {session.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{session.user?.name || 'Khách'}</p>
                            <Badge 
                              variant={
                                session.status === 'waiting' ? 'secondary' :
                                session.status === 'active' ? 'default' : 'outline'
                              }
                              className="text-xs"
                            >
                              {session.status === 'waiting' ? 'Chờ' :
                               session.status === 'active' ? 'Active' : 'Đóng'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {session.user?.email}
                          </p>
                          {session.messages?.[0] && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {session.messages[0].content}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {session.status === 'waiting' && (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAccept(session.id)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Nhận chat
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat window */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            {selectedSession ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedSession.user?.avatar} />
                    <AvatarFallback>
                      {selectedSession.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedSession.user?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedSession.user?.email}</p>
                  </div>
                </div>
                {selectedSession.status === 'active' && selectedSession.staffId === user?.id && (
                  <Button variant="outline" size="sm" onClick={handleEndSession}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Kết thúc
                  </Button>
                )}
              </div>
            ) : (
              <CardTitle className="text-lg text-muted-foreground">
                Chọn một cuộc trò chuyện
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {selectedSession ? (
              <div className="flex flex-col h-[450px]">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            message.senderId === user?.id && "flex-row-reverse"
                          )}
                        >
                          {message.senderId !== user?.id && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender?.avatar} />
                              <AvatarFallback>
                                {message.sender?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn("max-w-[70%]", message.senderId === user?.id && "text-right")}>
                            <div
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm",
                                message.senderId === user?.id
                                  ? "bg-primary text-primary-foreground rounded-br-none"
                                  : "bg-muted rounded-bl-none"
                              )}
                            >
                              {message.content}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span>Đang nhập...</span>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                {selectedSession.status === 'active' && selectedSession.staffId === user?.id && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        disabled={!isConnected}
                        className="flex-1"
                      />
                      <Button onClick={handleSend} disabled={!inputValue.trim() || !isConnected} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedSession.status === 'waiting' && (
                  <div className="p-4 border-t text-center">
                    <Button onClick={() => handleAccept(selectedSession.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Nhận chat này
                    </Button>
                  </div>
                )}

                {selectedSession.status === 'closed' && (
                  <div className="p-4 border-t text-center text-muted-foreground">
                    Cuộc trò chuyện đã kết thúc
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[450px] text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
