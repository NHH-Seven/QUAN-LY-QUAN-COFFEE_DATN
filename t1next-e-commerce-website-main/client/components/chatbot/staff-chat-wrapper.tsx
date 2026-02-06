"use client"

import { ArrowLeft, X, MessageCircle, History, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatWindow } from '../chat/chat-window'
import { useChat } from '@/contexts/chat-context'
import { useState } from 'react'
import { ChatHistory } from '../chat/chat-history'

interface Props {
  onClose: () => void
  onBack?: () => void
}

export function StaffChatWrapper({ onClose, onBack }: Props) {
  const { session, staffStatus } = useChat()
  const [showHistory, setShowHistory] = useState(false)
  
  const hasActiveSession = session && session.status !== 'closed'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-green-600 text-white">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">Chat với nhân viên</h3>
            <p className="text-xs opacity-80">
              {staffStatus.onlineCount > 0 
                ? `${staffStatus.onlineCount} nhân viên online`
                : 'Không có nhân viên online'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!showHistory && !hasActiveSession && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setShowHistory(true)}
              title="Lịch sử trò chuyện"
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {showHistory ? (
        <ChatHistory onBack={() => setShowHistory(false)} />
      ) : (
        <ChatWindow />
      )}
    </div>
  )
}
