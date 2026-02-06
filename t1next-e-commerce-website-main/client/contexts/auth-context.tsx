"use client"

/**
 * Auth Context
 * Quản lý authentication state toàn ứng dụng
 * - Login/Register với OTP verification
 * - Lưu user info trong localStorage
 * - Tự động restore session khi reload
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { mockUser } from "@/lib/mock-data"
import { api, ApiError, type ValidationError } from "@/lib/api"

/** Kết quả trả về từ register function */
interface RegisterResult {
  success: boolean
  email?: string
  error?: string
  validationErrors?: ValidationError[]
  retryAfter?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<RegisterResult>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("nhh-coffee-user")
    api.logout()
  }, [])

  useEffect(() => {
    const savedUser = localStorage.getItem("nhh-coffee-user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem("nhh-coffee-user")
      }
    }
    setIsLoading(false)

    // Listen for auth:logout event from API client
    const handleAuthLogout = () => {
      logout()
    }
    window.addEventListener('auth:logout', handleAuthLogout)
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  }, [logout])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await api.login(email, password)
      if (response.success && response.data) {
        const userData = response.data.user
        const loggedInUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          phone: userData.phone,
          address: userData.address,
          role: userData.role || "user",
          isActive: userData.is_active ?? true,
          createdAt: userData.created_at,
        }
        setUser(loggedInUser)
        localStorage.setItem("nhh-coffee-user", JSON.stringify(loggedInUser))
        setIsLoading(false)
        return true
      }
      setIsLoading(false)
      return false
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      // Re-throw error so login form can handle rate limit
      throw error
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string): Promise<RegisterResult> => {
    setIsLoading(true)
    try {
      // Step 1: Register sends OTP, doesn't create user yet
      const response = await api.register(email, password, name)
      
      setIsLoading(false)
      
      if (response.success) {
        // Return email so we can redirect to OTP page
        return { success: true, email: response.email || email }
      }
      
      return { success: false, error: response.error as string || "Đăng ký thất bại" }
    } catch (error) {
      setIsLoading(false)
      if (error instanceof ApiError) {
        return { 
          success: false, 
          error: error.message,
          validationErrors: error.validationErrors,
          retryAfter: error.retryAfter
        }
      }
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: "Đã có lỗi xảy ra, vui lòng thử lại" }
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getMe()
      if (response.success && response.data) {
        const userData = response.data
        const updatedUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          phone: userData.phone,
          address: userData.address,
          role: userData.role || "user",
          isActive: userData.isActive ?? true,
          createdAt: userData.createdAt,
        }
        setUser(updatedUser)
        localStorage.setItem("nhh-coffee-user", JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook để sử dụng Auth Context
 * @throws Error nếu sử dụng ngoài AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
