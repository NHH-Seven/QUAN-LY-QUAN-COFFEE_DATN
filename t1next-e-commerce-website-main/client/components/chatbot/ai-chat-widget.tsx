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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden z-50 bg-background border animate-in slide-in-from-bottom-5">
          <AIChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  )
}
