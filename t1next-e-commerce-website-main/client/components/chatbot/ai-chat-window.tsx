"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, User, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_REPLIES = [
  "Sản phẩm nào đang khuyến mãi?",
  "Có cà phê gì ngon không?",
  "Kiểm tra đơn hàng",
  "Chính sách đổi trả",
]

interface Props {
  onClose: () => void
  onBack?: () => void
}

export function AIChatWindow({ onClose, onBack }: Props) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Chào bạn! Mình là trợ lý AI của NHH Coffee. Mình có thể giúp gì cho bạn hôm nay? 😊',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const [guestId] = useState(() => `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || loading) return

    setInput('')
    setShowQuickReplies(false)
    setMessages(prev => [...prev, { role: 'user', content: textToSend, timestamp: new Date() }])
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: textToSend, guestId }),
      })

      const data = await res.json()
      
      if (data.success) {
        setSessionId(data.data.sessionId)
        setMessages(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: data.data.response, 
            timestamp: new Date() 
          },
        ])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Send message error:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau. 😔',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const sendFeedback = async (messageId: string, rating: number) => {
    if (!sessionId) return

    try {
      await fetch(`${API_URL}/chatbot/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messageId, rating }),
      })
    } catch (error) {
      console.error('Send feedback error:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold">AI Assistant</span>
            <p className="text-xs opacity-80">Trợ lý thông minh</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(600px - 180px)' }}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div
                  className={`rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {/* Feedback buttons for assistant messages */}
                {msg.role === 'assistant' && msg.id && (
                  <div className="flex gap-1 px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => sendFeedback(msg.id!, 5)}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => sendFeedback(msg.id!, 1)}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick replies */}
          {showQuickReplies && messages.length === 1 && !loading && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground px-1">Câu hỏi gợi ý:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((reply, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => sendMessage(reply)}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            disabled={loading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Powered by Google Gemini AI
        </p>
      </div>
    </div>
  )
}
