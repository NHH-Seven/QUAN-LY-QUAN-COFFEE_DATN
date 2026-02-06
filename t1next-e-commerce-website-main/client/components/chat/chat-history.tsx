"use client"

/**
 * ChatHistory Component
 * Shows user's past chat sessions with ability to view messages
 */

import { useState, useEffect } from "react"
import { History, MessageCircle, ChevronLeft, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface ChatSession {
  id: string
  status: string
  createdAt: string
  closedAt: string | null
  staff: {
    id: string
    name: string
    avatar: string | null
  } | null
  messages: {
    content: string
    createdAt: string
  }[]
}

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    avatar: string | null
  }
}

interface ChatHistoryProps {
  onBack: () => void
  currentUserId?: string
}

export function ChatHistory({ onBack, currentUserId }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/chat/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) {
          // Only show closed sessions
          setSessions(data.data.filter((s: ChatSession) => s.status === 'closed'))
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  // Fetch messages for selected session
  useEffect(() => {
    if (!selectedSession) return
    
    const fetchMessages = async () => {
      setLoadingMessages(true)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_URL}/chat/sessions/${selectedSession}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) {
          setMessages(data.data)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setLoadingMessages(false)
      }
    }
    fetchMessages()
  }, [selectedSession])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Session list view
  if (!selectedSession) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <History className="h-5 w-5 text-primary" />
          <span className="font-medium">Lịch sử trò chuyện</span>
        </div>

        {/* Session list */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p>Chưa có lịch sử trò chuyện</p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session.id)}
                  className="w-full p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.staff?.avatar || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {session.staff?.name || "Nhân viên hỗ trợ"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {session.messages[0]?.content || "Không có tin nhắn"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    )
  }

  // Message view
  const currentSession = sessions.find(s => s.id === selectedSession)
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentSession?.staff?.avatar || undefined} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-sm">{currentSession?.staff?.name || "Nhân viên hỗ trợ"}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {currentSession && formatDate(currentSession.createdAt)}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender.id === currentUserId
              return (
                <div key={message.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.avatar || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2",
                    isOwn 
                      ? "bg-primary text-primary-foreground rounded-br-md" 
                      : "bg-muted rounded-bl-md"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t text-center text-sm text-muted-foreground">
        Cuộc trò chuyện đã kết thúc
      </div>
    </div>
  )
}
