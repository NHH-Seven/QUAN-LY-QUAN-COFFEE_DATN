"use client"

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatModeSelector } from './chat-mode-selector'
import { AIChatWindow } from './ai-chat-window'
import { StaffChatWrapper } from './staff-chat-wrapper'

export type ChatMode = 'selector' | 'ai' | 'staff'

export function UnifiedChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('selector')

  const handleClose = () => {
    setIsOpen(false)
    // Reset về selector khi đóng
    setTimeout(() => setChatMode('selector'), 300)
  }

  const handleSelectMode = (mode: 'ai' | 'staff') => {
    setChatMode(mode)
  }

  const handleBack = () => {
    setChatMode('selector')
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden z-50 bg-background border animate-in slide-in-from-bottom-5">
          {chatMode === 'selector' && (
            <ChatModeSelector 
              onSelectMode={handleSelectMode}
              onClose={handleClose}
            />
          )}
          
          {chatMode === 'ai' && (
            <AIChatWindow 
              onClose={handleClose}
              onBack={handleBack}
            />
          )}
          
          {chatMode === 'staff' && (
            <StaffChatWrapper 
              onClose={handleClose}
              onBack={handleBack}
            />
          )}
        </div>
      )}
    </>
  )
}
