"use client"

import { Bot, Users, X, Sparkles, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  onSelectMode: (mode: 'ai' | 'staff') => void
  onClose: () => void
}

export function ChatModeSelector({ onSelectMode, onClose }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Hỗ trợ khách hàng</span>
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

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-center gap-4">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-2">Chào mừng bạn! 👋</h2>
          <p className="text-sm text-muted-foreground">
            Bạn muốn được hỗ trợ bằng cách nào?
          </p>
        </div>

        {/* AI Chat Option */}
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
          onClick={() => onSelectMode('ai')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  Trợ lý AI
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </CardTitle>
                <CardDescription className="text-xs">
                  Trả lời tức thì 24/7
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Phản hồi ngay lập tức
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Tư vấn sản phẩm thông minh
              </li>
              <li className="flex items-center gap-2">
                <Bot className="h-3 w-3" />
                Hỗ trợ tự động
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Staff Chat Option */}
        <Card 
          className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
          onClick={() => onSelectMode('staff')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Chat với nhân viên</CardTitle>
                <CardDescription className="text-xs">
                  Tư vấn trực tiếp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                Tư vấn chuyên sâu
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Giờ làm việc: 8:00 - 22:00
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Hỗ trợ cá nhân hóa
              </li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Bạn có thể chuyển đổi giữa AI và nhân viên bất cứ lúc nào
        </p>
      </div>
    </div>
  )
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
