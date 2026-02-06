"use client"

/**
 * ChatWidget Component
 * Floating chat button with popup chat window
 * - Shows chat button when user is authenticated
 * - Opens chat window on click
 * - Shows unread indicator
 */

import { useState } from "react"
import { MessageCircle, X, Minimize2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { ChatWindow } from "./chat-window"
import { ChatHistory } from "./chat-history"
import { cn } from "@/lib/utils"

export function ChatWidget() {
  const { isAuthenticated, user } = useAuth()
  const { isOpen, setIsOpen, session, staffStatus } = useChat()
  const [isMinimized, setIsMinimized] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Don't show for staff users
  if (!isAuthenticated || user?.role !== 'user') {
    return null
  }

  const hasActiveSession = session && session.status !== 'closed'

  return (
    <>
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] h-[500px] bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold text-sm">Hỗ trợ trực tuyến</h3>
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
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setShowHistory(true)}
                  title="Lịch sử trò chuyện"
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => {
                  setIsOpen(false)
                  setShowHistory(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {showHistory ? (
            <ChatHistory onBack={() => setShowHistory(false)} currentUserId={user?.id} />
          ) : (
            <ChatWindow />
          )}
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => {
          if (isMinimized) {
            setIsMinimized(false)
          } else {
            setIsOpen(!isOpen)
          }
        }}
        className={cn(
          "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
          "hover:scale-105 transition-transform duration-200",
          hasActiveSession && "animate-pulse"
        )}
        size="icon"
      >
        {isOpen && !isMinimized ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {hasActiveSession && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">!</span>
              </span>
            )}
          </>
        )}
      </Button>
    </>
  )
}
