"use client"

/**
 * Cart Context
 * Quản lý state giỏ hàng toàn ứng dụng
 * - Sync với server khi user đăng nhập
 * - Fallback localStorage cho guest users
 * - Cung cấp các methods: add, remove, update, clear
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Product, CartItem } from "@/lib/types"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "./auth-context"

/** Applied promotion info */
interface AppliedPromotion {
  id: string
  code: string
  name: string
  discount: number
}

/** Extended CartItem with server cart item ID */
interface CartItemWithId extends CartItem {
  /** Server cart item ID (for API calls) */
  cartItemId?: string
}

/** Interface định nghĩa các giá trị và methods của Cart Context */
interface CartContextType {
  /** Danh sách items trong giỏ hàng */
  items: CartItemWithId[]
  /** Thêm sản phẩm vào giỏ */
  addItem: (product: Product, quantity?: number) => Promise<{ success: boolean; error?: string }>
  /** Xóa sản phẩm khỏi giỏ */
  removeItem: (productId: string) => void
  /** Cập nhật số lượng sản phẩm */
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>
  /** Xóa toàn bộ giỏ hàng */
  clearCart: () => void
  /** Tổng số lượng items */
  totalItems: number
  /** Tổng giá trị giỏ hàng */
  totalPrice: number
  /** Kiểm tra sản phẩm có trong giỏ không */
  isInCart: (productId: string) => boolean
  /** Loading state */
  isLoading: boolean
  /** Applied promotion */
  appliedPromotion: AppliedPromotion | null
  /** Set applied promotion */
  setAppliedPromotion: (promo: AppliedPromotion | null) => void
  /** Last error message */
  lastError: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemWithId[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [appliedPromotion, setAppliedPromotion] = useState<AppliedPromotion | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Load cart from server when authenticated, or from localStorage for guests
  useEffect(() => {
    async function loadCart() {
      if (authLoading) return

      if (isAuthenticated) {
        // Sync with server
        setIsLoading(true)
        try {
          const response = await api.getCart()
          if (response.success && response.data) {
            // Transform server cart items to local format
            const serverItems: CartItemWithId[] = response.data.map((item: any) => ({
              cartItemId: item.id, // Server cart item ID
              product: {
                id: item.product.id,
                name: item.product.name,
                price: Number(item.product.price),
                images: item.product.images || [],
                stock: item.product.stock || 0,
                slug: item.product.slug || '',
                brand: item.product.brand || '',
                description: '',
                categoryId: '',
              },
              quantity: item.quantity
            }))
            setItems(serverItems)
            // Also update localStorage
            localStorage.setItem("nhh-coffee-cart", JSON.stringify(serverItems))
          }
        } catch (error) {
          console.error('Failed to load cart from server:', error)
          // Fallback to localStorage
          loadFromLocalStorage()
        } finally {
          setIsLoading(false)
        }
      } else {
        // Guest user - use localStorage
        loadFromLocalStorage()
      }
    }

    function loadFromLocalStorage() {
      const savedCart = localStorage.getItem("nhh-coffee-cart")
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch {
          localStorage.removeItem("nhh-coffee-cart")
        }
      }
    }

    loadCart()
  }, [isAuthenticated, authLoading])

  // Save cart to localStorage on change (for persistence)
  useEffect(() => {
    if (!authLoading) {
      localStorage.setItem("nhh-coffee-cart", JSON.stringify(items))
    }
  }, [items, authLoading])

  const addItem = useCallback(async (product: Product, quantity = 1): Promise<{ success: boolean; error?: string }> => {
    setLastError(null)
    const prevItems = [...items]
    
    // Optimistic update
    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...prev, { product, quantity }]
    })

    // Sync with server if authenticated
    if (isAuthenticated) {
      try {
        const response = await api.addToCart(product.id, quantity)
        // Update with server cart item ID
        if (response.data?.id) {
          setItems((prev) => prev.map((item) =>
            item.product.id === product.id ? { ...item, cartItemId: response.data.id } : item
          ))
        }
        return { success: true }
      } catch (error) {
        // Revert optimistic update
        setItems(prevItems)
        const errorMsg = error instanceof ApiError ? error.message : 'Không thể thêm vào giỏ hàng'
        setLastError(errorMsg)
        return { success: false, error: errorMsg }
      }
    }
    return { success: true }
  }, [isAuthenticated, items])

  const removeItem = useCallback(async (productId: string) => {
    // Find the cart item for server sync
    const item = items.find(i => i.product.id === productId)
    
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.product.id !== productId))

    // Sync with server if authenticated
    if (isAuthenticated && item?.cartItemId) {
      try {
        // Use cart item id, not product id
        await api.removeFromCart(item.cartItemId)
      } catch (error) {
        console.error('Failed to sync cart removal with server:', error)
      }
    }
  }, [isAuthenticated, items])

  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
      setLastError(null)
      
      if (quantity <= 0) {
        removeItem(productId)
        return { success: true }
      }
      
      // Find the cart item for server sync
      const item = items.find(i => i.product.id === productId)
      const prevQuantity = item?.quantity || 0
      
      // Optimistic update
      setItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))

      // Sync with server if authenticated
      if (isAuthenticated && item?.cartItemId) {
        try {
          // Use cart item id, not product id
          await api.updateCartItem(item.cartItemId, quantity)
          return { success: true }
        } catch (error) {
          // Revert optimistic update
          setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity: prevQuantity } : i)))
          const errorMsg = error instanceof ApiError ? error.message : 'Không thể cập nhật giỏ hàng'
          setLastError(errorMsg)
          return { success: false, error: errorMsg }
        }
      }
      return { success: true }
    },
    [removeItem, isAuthenticated, items],
  )

  const clearCart = useCallback(async () => {
    setItems([])
    setAppliedPromotion(null)
    
    // Sync with server if authenticated
    if (isAuthenticated) {
      try {
        await api.clearCart()
      } catch (error) {
        console.error('Failed to clear cart on server:', error)
      }
    }
  }, [isAuthenticated])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const isInCart = useCallback((productId: string) => items.some((item) => item.product.id === productId), [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isInCart,
        isLoading,
        appliedPromotion,
        setAppliedPromotion,
        lastError,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

/**
 * Hook để sử dụng Cart Context
 * @throws Error nếu sử dụng ngoài CartProvider
 */
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
