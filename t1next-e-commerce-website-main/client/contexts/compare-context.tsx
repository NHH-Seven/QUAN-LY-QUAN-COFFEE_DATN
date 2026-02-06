"use client"

/**
 * Compare Context
 * Quản lý state so sánh sản phẩm
 * - Client-only implementation với localStorage
 * - Max 4 products limit
 * - Cung cấp các methods: add, remove, clear, isInCompare
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

/** Maximum number of products that can be compared */
export const MAX_COMPARE_ITEMS = 4

/** LocalStorage key for compare list */
const STORAGE_KEY = "nhh-coffee-compare"

/** Interface định nghĩa các giá trị và methods của Compare Context */
interface CompareContextType {
  /** Danh sách product IDs trong compare list */
  compareList: string[]
  /** Thêm sản phẩm vào compare list */
  addToCompare: (productId: string) => boolean
  /** Xóa sản phẩm khỏi compare list */
  removeFromCompare: (productId: string) => void
  /** Xóa toàn bộ compare list */
  clearCompare: () => void
  /** Kiểm tra sản phẩm có trong compare list không */
  isInCompare: (productId: string) => boolean
  /** Số lượng sản phẩm trong compare list */
  compareCount: number
  /** Kiểm tra đã đạt giới hạn chưa */
  isMaxReached: boolean
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

/**
 * Load compare list from localStorage
 * Returns empty array if localStorage unavailable or data invalid
 */
export function loadCompareFromStorage(): string[] {
  if (typeof window === "undefined") return []
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    
    const parsed = JSON.parse(saved)
    // Validate that it's an array of strings
    if (!Array.isArray(parsed)) return []
    if (!parsed.every(item => typeof item === "string")) return []
    
    // Ensure max limit
    return parsed.slice(0, MAX_COMPARE_ITEMS)
  } catch {
    return []
  }
}

/**
 * Save compare list to localStorage
 */
export function saveCompareToStorage(list: string[]): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (error) {
    console.warn("Failed to save compare list to localStorage:", error)
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const saved = loadCompareFromStorage()
    setCompareList(saved)
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever list changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCompareToStorage(compareList)
    }
  }, [compareList, isHydrated])

  /**
   * Add product to compare list
   * Returns true if added successfully, false if already exists or max reached
   */
  const addToCompare = useCallback((productId: string): boolean => {
    let added = false
    
    setCompareList((prev) => {
      // Already in list
      if (prev.includes(productId)) {
        return prev
      }
      
      // Max limit reached
      if (prev.length >= MAX_COMPARE_ITEMS) {
        return prev
      }
      
      added = true
      return [...prev, productId]
    })
    
    return added
  }, [])

  /**
   * Remove product from compare list
   */
  const removeFromCompare = useCallback((productId: string): void => {
    setCompareList((prev) => prev.filter((id) => id !== productId))
  }, [])

  /**
   * Clear all products from compare list
   */
  const clearCompare = useCallback((): void => {
    setCompareList([])
  }, [])

  /**
   * Check if product is in compare list
   */
  const isInCompare = useCallback(
    (productId: string): boolean => compareList.includes(productId),
    [compareList]
  )

  const compareCount = compareList.length
  const isMaxReached = compareList.length >= MAX_COMPARE_ITEMS

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        compareCount,
        isMaxReached,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

/**
 * Hook để sử dụng Compare Context
 * @throws Error nếu sử dụng ngoài CompareProvider
 */
export function useCompare() {
  const context = useContext(CompareContext)
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider")
  }
  return context
}
