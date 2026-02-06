"use client"

import { useState, useEffect, useCallback } from "react"
import { api, Product, Category } from "@/lib/api"

interface UseAdminProductsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  sort?: string
  order?: 'asc' | 'desc'
}

interface UseAdminProductsReturn {
  products: Product[]
  categories: Category[]
  isLoading: boolean
  error: string | null
  total: number
  totalPages: number
  currentPage: number
  refetch: () => Promise<void>
}

/**
 * Hook để fetch admin products với pagination, search, filter
 */
export function useAdminProducts(params: UseAdminProductsParams = {}): UseAdminProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(params.page || 1)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [productsRes, categoriesRes] = await Promise.all([
        api.getAdminProducts(params),
        api.getAdminCategories()
      ])
      
      setProducts(productsRes.data || [])
      setTotal(productsRes.total || 0)
      setTotalPages(productsRes.totalPages || 0)
      setCurrentPage(productsRes.page || 1)
      
      if (categoriesRes.data) {
        setCategories(categoriesRes.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu")
    } finally {
      setIsLoading(false)
    }
  }, [params.page, params.limit, params.search, params.category, params.sort, params.order])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { 
    products, 
    categories,
    isLoading, 
    error, 
    total, 
    totalPages, 
    currentPage,
    refetch: fetchProducts 
  }
}
