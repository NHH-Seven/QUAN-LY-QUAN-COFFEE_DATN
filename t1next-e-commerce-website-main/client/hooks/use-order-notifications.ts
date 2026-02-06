"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"

export function useOrderNotifications(enabled: boolean = true) {
  const { toast } = useToast()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Don't connect if not enabled
    if (!enabled) return
    
    const token = localStorage.getItem("token")
    if (!token) return

    // Connect to socket server
    const serverUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001"
    
    const socket = io(serverUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    })
    
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("🔌 Connected to notification server")
    })

    socket.on("order:status_changed", (data: {
      orderId: string
      status: string
      statusLabel: string
      total: number
    }) => {
      toast({
        title: `Đơn hàng #${data.orderId.slice(0, 8).toUpperCase()}`,
        description: `Trạng thái: ${data.statusLabel}`,
        variant: data.status === "cancelled" ? "destructive" : "default"
      })
    })

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from notification server")
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled]) // Remove toast from deps - it's stable
}

// Hook for staff to receive new order notifications
export function useStaffNotifications(enabled: boolean = true) {
  const { toast } = useToast()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!enabled) return
    
    const token = localStorage.getItem("token")
    if (!token) return

    const serverUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001"
    
    const socket = io(serverUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    })
    
    socketRef.current = socket

    socket.on("order:new", (data: {
      orderId: string
      total: number
      recipientName: string
    }) => {
      toast({
        title: "🛒 Đơn hàng mới!",
        description: `${data.recipientName} - ${formatPrice(data.total)}`
      })
    })

    socket.on("return:new", (data: {
      returnId: string
      orderId: string
      userName: string
    }) => {
      toast({
        title: "📦 Yêu cầu đổi trả mới",
        description: `Từ ${data.userName} - Đơn #${data.orderId.slice(0, 8).toUpperCase()}`
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled])
}
