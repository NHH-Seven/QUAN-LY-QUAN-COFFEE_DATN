"use client"

import { useOrderNotifications } from "@/hooks/use-order-notifications"
import { useAuth } from "@/contexts/auth-context"

export function NotificationListener() {
  const { isAuthenticated } = useAuth()
  
  // Always call hook, but it will handle auth check internally
  useOrderNotifications(isAuthenticated)
  
  return null
}
