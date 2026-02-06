/**
 * Custom hook để quản lý search functionality
 * Tách logic search ra khỏi Header component
 */

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface UseSearchReturn {
  /** Giá trị search query */
  query: string
  /** Cập nhật search query */
  setQuery: (value: string) => void
  /** Xử lý submit search form */
  handleSearch: (e: React.FormEvent) => void
  /** Clear search query */
  clearQuery: () => void
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }
    },
    [query, router]
  )

  const clearQuery = useCallback(() => setQuery(""), [])

  return {
    query,
    setQuery,
    handleSearch,
    clearQuery,
  }
}
