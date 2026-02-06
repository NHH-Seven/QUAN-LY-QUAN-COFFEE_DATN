"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface WishlistItem {
  id: string
  product_id: string
  created_at: string
  product: {
    id: string
    name: string
    slug: string
    price: string
    original_price: string | null
    images: string[]
    brand: string | null
    stock: number
    rating: string
    discount: number
  }
}

interface WishlistContextType {
  items: WishlistItem[]
  isLoading: boolean
  isInWishlist: (productId: string) => boolean
  addToWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  toggleWishlist: (productId: string) => Promise<void>
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch wishlist when user logs in
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([])
      return
    }

    setIsLoading(true)
    try {
      const res = await api.getWishlist()
      setItems(res.data || [])
    } catch (error) {
      console.error("Fetch wishlist error:", error)
      // If it's a 401 error, the API client will handle logout
      // Just clear the items here
      if (error instanceof Error && error.message.includes('Phiên đăng nhập')) {
        setItems([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.product_id === productId)
  }, [items])

  // Add to wishlist
  const addToWishlist = useCallback(async (productId: string) => {
    if (!user) {
      toast({
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để thêm vào yêu thích",
        variant: "destructive"
      })
      return
    }

    try {
      await api.addToWishlist(productId)
      await fetchWishlist()
      toast({
        title: "Đã thêm vào yêu thích",
        variant: "success"
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể thêm vào yêu thích",
        variant: "destructive"
      })
    }
  }, [user, fetchWishlist, toast])

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId: string) => {
    try {
      await api.removeFromWishlist(productId)
      setItems(prev => prev.filter(item => item.product_id !== productId))
      toast({
        title: "Đã xóa khỏi yêu thích",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa khỏi yêu thích",
        variant: "destructive"
      })
    }
  }, [toast])

  // Toggle wishlist
  const toggleWishlist = useCallback(async (productId: string) => {
    console.log('toggleWishlist called:', productId, 'user:', !!user)
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId)
    } else {
      await addToWishlist(productId)
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist])

  return (
    <WishlistContext.Provider value={{
      items,
      isLoading,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      refresh: fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider")
  }
  return context
}
