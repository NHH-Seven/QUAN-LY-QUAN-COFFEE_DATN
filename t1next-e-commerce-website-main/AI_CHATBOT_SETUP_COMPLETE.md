# ✅ AI Chatbot Setup Complete - Google Gemini

## Đã hoàn thành

### Backend (Server)
- ✅ Cài đặt `@google/generative-ai` package
- ✅ Tạo database schema (chat_sessions, chat_messages, chatbot_feedback, chatbot_knowledge)
- ✅ Tạo Gemini AI Service (`server/src/services/gemini.service.ts`)
- ✅ Tạo Chatbot Service (`server/src/services/chatbot.service.ts`)
- ✅ Tạo API Routes (`server/src/routes/chatbot.ts`)
- ✅ Đăng ký routes trong `server/src/index.ts`
- ✅ Chạy migration thành công

### API Endpoints
- `POST /api/chatbot/message` - Gửi tin nhắn đến AI
- `GET /api/chatbot/history/:sessionId` - Lấy lịch sử chat
- `POST /api/chatbot/close/:sessionId` - Đóng chat session
- `POST /api/chatbot/feedback` - Gửi feedback
- `GET /api/chatbot/analytics` - Lấy analytics (Admin only)

## Cần làm tiếp

### 1. Lấy Gemini API Key (5 phút)
Xem file: `HUONG_DAN_LAY_GEMINI_API_KEY.md`

### 2. Frontend - Chat Widget UI (2-3 giờ)
Tạo các component sau trong `client/components/chatbot/`:

#### a. `ai-chat-widget.tsx` - Main widget
```tsx
"use client"

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIChatWindow } from './ai-chat-window'

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden z-50 bg-background border">
          <AIChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  )
}
```

#### b. `ai-chat-window.tsx` - Chat interface
```tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIChatWindow({ onClose }: { onClose: () => void }) {
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
  const [guestId] = useState(() => `guest-${Date.now()}`)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }])
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage, guestId }),
      })

      const data = await res.json()
      
      if (data.success) {
        setSessionId(data.data.sessionId)
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.data.response, timestamp: new Date() },
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
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce delay-100" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
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
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
```

#### c. Thêm vào layout
Trong `client/app/layout.tsx`, thêm:
```tsx
import { AIChatWidget } from '@/components/chatbot/ai-chat-widget'

// ... trong return
<body>
  {children}
  <AIChatWidget />
</body>
```

### 3. Test Chatbot (10 phút)

#### Test API trực tiếp:
```bash
curl -X POST http://localhost:3001/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào","guestId":"test-123"}'
```

#### Test trên UI:
1. Mở http://localhost:3000
2. Click vào icon chat ở góc phải
3. Gửi tin nhắn: "Xin chào"
4. AI sẽ trả lời

### 4. Tính năng nâng cao (Optional)

#### a. Quick Replies (Câu hỏi gợi ý)
```tsx
const quickReplies = [
  "Sản phẩm nào đang khuyến mãi?",
  "Tôi muốn mua laptop",
  "Kiểm tra đơn hàng",
  "Chính sách đổi trả",
]
```

#### b. Typing Indicator
Đã có trong code mẫu (3 dots animation)

#### c. Message Timestamps
```tsx
<span className="text-xs text-muted-foreground">
  {msg.timestamp.toLocaleTimeString()}
</span>
```

#### d. Feedback Buttons
```tsx
<div className="flex gap-2 mt-2">
  <Button size="sm" variant="ghost" onClick={() => sendFeedback(5)}>
    👍
  </Button>
  <Button size="sm" variant="ghost" onClick={() => sendFeedback(1)}>
    👎
  </Button>
</div>
```

### 5. Tối ưu hóa

#### a. Caching responses
Thêm Redis để cache câu trả lời phổ biến

#### b. Rate limiting
Giới hạn số message/phút để tránh spam

#### c. Context window
Giới hạn history để tiết kiệm tokens

#### d. Error handling
Xử lý lỗi network, timeout, v.v.

## Cấu trúc file

```
server/
├── src/
│   ├── services/
│   │   ├── gemini.service.ts       ✅ Done
│   │   └── chatbot.service.ts      ✅ Done
│   ├── routes/
│   │   └── chatbot.ts              ✅ Done
│   └── db/
│       └── migrations/
│           └── add_chatbot.sql     ✅ Done

client/
├── components/
│   └── chatbot/
│       ├── ai-chat-widget.tsx      ⏳ TODO
│       └── ai-chat-window.tsx      ⏳ TODO
```

## Chi phí

### Google Gemini (Free tier)
- 60 requests/minute
- 1500 requests/day
- **Chi phí: $0/month** 🎉

### Nếu cần nhiều hơn
- Gemini Pro: $0.00025/1K characters (~$7.50/1M characters)
- Rẻ hơn OpenAI GPT-3.5 (~10x)

## Monitoring

### Metrics cần theo dõi:
- Số lượng conversations/day
- Average messages/conversation
- Response time
- Error rate
- User satisfaction (feedback rating)

### Xem analytics:
```bash
curl http://localhost:3001/api/chatbot/analytics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Troubleshooting

### Chatbot không trả lời
1. Kiểm tra GEMINI_API_KEY trong .env
2. Kiểm tra server logs
3. Test API trực tiếp bằng curl

### Response chậm
1. Gemini free tier có thể bị throttle
2. Xem xét upgrade lên paid plan
3. Implement caching

### Câu trả lời không chính xác
1. Cải thiện system prompt
2. Thêm context từ database (RAG)
3. Fine-tune với data thực tế

## Next Steps

1. **Lấy Gemini API Key** (xem `HUONG_DAN_LAY_GEMINI_API_KEY.md`)
2. **Tạo Frontend UI** (copy code mẫu ở trên)
3. **Test và cải thiện** system prompt
4. **Thu thập feedback** từ users
5. **Iterate và optimize**

## Resources

- Gemini API Docs: https://ai.google.dev/docs
- Google AI Studio: https://aistudio.google.com/
- Langchain JS: https://js.langchain.com/ (for advanced RAG)

---

**Bạn đã sẵn sàng! Hãy lấy API key và test chatbot ngay! 🚀**
