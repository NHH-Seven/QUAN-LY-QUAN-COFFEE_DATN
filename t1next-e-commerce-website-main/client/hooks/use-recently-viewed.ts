"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "recently_viewed_products"
const MAX_ITEMS = 10

export interface RecentlyViewedProduct {
  id: string
  slug: string
  name: string
  price: number
  original_price?: number
  images: string[]
  viewedAt: number
}

export function useRecentlyViewed() {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedProduct[]
        // Sort by viewedAt descending (most recent first)
        setProducts(parsed.sort((a, b) => b.viewedAt - a.viewedAt))
      }
    } catch (err) {
      console.error("Failed to load recently viewed:", err)
    }
    setIsLoaded(true)
  }, [])

  // Add product to recently viewed
  const addProduct = useCallback((product: Omit<RecentlyViewedProduct, "viewedAt">) => {
    setProducts(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id)
      
      // Add to beginning with timestamp
      const newProduct: RecentlyViewedProduct = {
        ...product,
        viewedAt: Date.now()
      }
      
      // Keep only MAX_ITEMS
      const updated = [newProduct, ...filtered].slice(0, MAX_ITEMS)
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error("Failed to save recently viewed:", err)
      }
      
      return updated
    })
  }, [])

  // Clear all
  const clearAll = useCallback(() => {
    setProducts([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error("Failed to clear recently viewed:", err)
    }
  }, [])

  // Remove single product
  const removeProduct = useCallback((productId: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error("Failed to update recently viewed:", err)
      }
      return updated
    })
  }, [])

  return {
    products,
    isLoaded,
    addProduct,
    removeProduct,
    clearAll
  }
}
