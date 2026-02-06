"use client"

/**
 * SearchBar Component
 * Thanh tìm kiếm sản phẩm trong header với autocomplete
 */

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search, Loader2, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, Product } from "@/lib/api"
import { formatPrice } from "@/lib/utils"
import type { SearchBarProps } from "./types"

// Từ khóa hot/trending
const TRENDING_KEYWORDS = ["Cà phê sữa", "Trà đào", "Matcha", "Bánh tiramisu", "Combo sáng"]

export function SearchBar({ query, setQuery, onSubmit }: SearchBarProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5))
    }
  }, [])

  // Save search to recent
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await api.getProducts({ search: query, limit: 5 })
        setSuggestions(res.data || [])
      } catch {
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      saveRecentSearch(query.trim())
      setShowDropdown(false)
      onSubmit(e)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (product: Product) => {
    setShowDropdown(false)
    router.push(`/product/${product.slug}`)
  }

  // Handle keyword click
  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword)
    saveRecentSearch(keyword)
    setShowDropdown(false)
    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <div ref={wrapperRef} className="flex-1 relative">
      <form onSubmit={handleSubmit}>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="search"
            placeholder="Bạn cần tìm gì?"
            className="w-full h-10 pl-4 pr-12 bg-white border-0 rounded-l-none rounded-r-lg text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 bg-primary hover:bg-primary/90"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {/* Product suggestions */}
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 mb-2">Gợi ý cho bạn</p>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <div className="relative h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Search className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                    <p className="text-sm text-primary">{formatPrice(Number(product.price))}</p>
                  </div>
                </button>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => { saveRecentSearch(query); setShowDropdown(false) }}
                className="block text-center text-sm text-primary hover:underline py-2 border-t mt-2"
              >
                Xem tất cả kết quả cho "{query}"
              </Link>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">Không tìm thấy sản phẩm</p>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => setShowDropdown(false)}
                className="text-sm text-primary hover:underline"
              >
                Tìm kiếm "{query}"
              </Link>
            </div>
          )}

          {/* Recent searches & Trending (when no query) */}
          {query.length < 2 && (
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground px-2 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Tìm kiếm gần đây
                  </p>
                  <div className="flex flex-wrap gap-2 px-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleKeywordClick(term)}
                        className="text-sm px-3 py-1 bg-muted text-foreground hover:bg-muted/80 rounded-full transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground px-2 mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Từ khóa phổ biến
                </p>
                <div className="flex flex-wrap gap-2 px-2">
                  {TRENDING_KEYWORDS.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => handleKeywordClick(keyword)}
                      className="text-sm px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
