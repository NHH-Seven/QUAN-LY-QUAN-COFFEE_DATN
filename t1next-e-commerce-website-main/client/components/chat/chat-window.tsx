"use client"

/**
 * ChatWindow Component
 * Main chat interface with message list, input, and typing indicator
 * Handles offline/no staff scenarios with queue position and offline form
 */

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Clock, User, Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useChat, type ChatMessage } from "@/contexts/chat-context"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  onClose?: () => void
  onBack?: () => void
}

export function ChatWindow({ onClose, onBack }: ChatWindowProps = {}) {
  const { user } = useAuth()
  const { 
    session, 
    messages, 
    isTyping, 
    isConnected, 
    isConnecting,
    staffStatus,
    startChat, 
    sendMessage, 
    sendTyping,
    endChat,
  } = useChat()
  
  const [inputValue, setInputValue] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [showOfflineForm, setShowOfflineForm] = useState(false)
  const [offlineMessage, setOfflineMessage] = useState("")
  const [offlineEmail, setOfflineEmail] = useState(user?.email || "")
  const [offlineSubmitted, setOfflineSubmitted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user is logged in
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-950/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
        </div>
        <h4 className="font-semibold mb-2">Yêu cầu đăng nhập</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Bạn cần đăng nhập để chat với nhân viên hỗ trợ.
        </p>
        <Button onClick={() => window.location.href = '/login'}>
          Đăng nhập ngay
        </Button>
      </div>
    )
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Handle typing indicator
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    
    if (session && value.length > 0) {
      sendTyping(true)
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false)
      }, 2000)
    }
  }, [session, sendTyping])

  // Handle send message
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return
    
    if (!session) {
      // Start new chat with initial message
      setIsStarting(true)
      startChat(inputValue.trim())
      setInputValue("")
      setTimeout(() => setIsStarting(false), 2000)
    } else {
      sendMessage(inputValue.trim())
      setInputValue("")
      sendTyping(false)
    }
  }, [inputValue, session, startChat, sendMessage, sendTyping])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // Handle offline form submission
  const handleOfflineSubmit = useCallback(() => {
    if (!offlineMessage.trim()) return
    
    // In a real app, this would send to an API endpoint
    // For now, we'll just start a chat session with the message
    startChat(offlineMessage.trim())
    setOfflineSubmitted(true)
    setShowOfflineForm(false)
  }, [offlineMessage, startChat])

  // Calculate queue position
  const getQueuePosition = () => {
    if (!session || session.status !== 'waiting') return null
    // This would ideally come from the server
    return 1
  }

  const queuePosition = getQueuePosition()

  // Render offline form
  if (showOfflineForm && !session) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Để lại tin nhắn</h4>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Hiện không có nhân viên online. Vui lòng để lại tin nhắn, chúng tôi sẽ phản hồi sớm nhất có thể.
        </p>

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-sm font-medium mb-1 block">Email liên hệ</label>
            <Input
              type="email"
              value={offlineEmail || user?.email || ""}
              onChange={(e) => setOfflineEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Nội dung tin nhắn</label>
            <Textarea
              value={offlineMessage}
              onChange={(e) => setOfflineMessage(e.target.value)}
              placeholder="Mô tả vấn đề bạn cần hỗ trợ..."
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowOfflineForm(false)}
          >
            Quay lại
          </Button>
          <Button 
            className="flex-1"
            onClick={handleOfflineSubmit}
            disabled={!offlineMessage.trim()}
          >
            Gửi tin nhắn
          </Button>
        </div>
      </div>
    )
  }

  // Render offline submitted confirmation
  if (offlineSubmitted && !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h4 className="font-semibold mb-2">Tin nhắn đã được gửi!</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Chúng tôi sẽ phản hồi qua email sớm nhất có thể.
        </p>
        <Button variant="outline" onClick={() => setOfflineSubmitted(false)}>
          Gửi tin nhắn khác
        </Button>
      </div>
    )
  }

  // Render waiting state (no session yet)
  if (!session) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Welcome message */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h4 className="font-semibold mb-2">Xin chào, {user?.name}!</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Nhập tin nhắn để bắt đầu cuộc trò chuyện với nhân viên hỗ trợ.
          </p>
          
          {staffStatus.onlineCount === 0 ? (
            <div className="space-y-3 w-full">
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Hiện không có nhân viên online.</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowOfflineForm(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Để lại tin nhắn offline
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>{staffStatus.onlineCount} nhân viên đang online</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={isStarting || isConnecting}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!inputValue.trim() || isStarting || isConnecting}
              size="icon"
            >
              {isStarting || isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render chat session
  return (
    <div className="flex-1 flex flex-col">
      {/* Session status */}
      {session.status === 'waiting' && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-b">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang chờ nhân viên hỗ trợ...</span>
          </div>
          {queuePosition && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 mt-1">
              <Clock className="h-3 w-3" />
              <span>Vị trí trong hàng đợi: #{queuePosition}</span>
              {staffStatus.estimatedWait && (
                <span>• Thời gian chờ ước tính: ~{staffStatus.estimatedWait} phút</span>
              )}
            </div>
          )}
          {staffStatus.onlineCount === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
              Hiện không có nhân viên online. Tin nhắn của bạn sẽ được phản hồi khi có nhân viên.
            </p>
          )}
        </div>
      )}
      
      {session.status === 'active' && session.staff && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border-b text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Đang chat với {session.staff.name}</span>
        </div>
      )}

      {session.status === 'closed' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Cuộc trò chuyện đã kết thúc</p>
            <p className="text-sm text-muted-foreground mb-4">Cảm ơn bạn đã liên hệ với chúng tôi!</p>
          </div>
        </div>
      )}

      {/* Messages - hide when closed */}
      {session.status !== 'closed' && (
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isOwn={message.senderId === user?.id}
            />
          ))}
          
          {/* Typing indicator */}
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
      </ScrollArea>
      )}

      {/* Input */}
      {session.status !== 'closed' && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={!isConnected}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!inputValue.trim() || !isConnected}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* End chat button */}
      {session.status !== 'closed' && (
        <div className="px-4 pb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-muted-foreground"
            onClick={endChat}
          >
            Kết thúc cuộc trò chuyện
          </Button>
        </div>
      )}
    </div>
  )
}

// Message bubble component
function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender?.avatar} />
          <AvatarFallback>
            {message.sender?.name?.charAt(0) || 'S'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("max-w-[70%]", isOwn && "text-right")}>
        {!isOwn && message.sender && (
          <p className="text-xs text-muted-foreground mb-1">{message.sender.name}</p>
        )}
        <div
          className={cn(
            "px-3 py-2 rounded-lg text-sm",
            isOwn 
              ? "bg-primary text-primary-foreground rounded-br-none" 
              : "bg-muted rounded-bl-none"
          )}
        >
          {message.content}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  )
}
