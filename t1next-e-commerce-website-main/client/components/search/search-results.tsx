"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { api, Product, Category } from "@/lib/api"

const PRICE_RANGES = [
  { label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "20 - 50 triệu", min: 20000000, max: 50000000 },
  { label: "Trên 50 triệu", min: 50000000, max: 200000000 },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "rating", label: "Đánh giá cao" },
]

export function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Get filters from URL
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const brand = searchParams.get("brand") || ""
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""
  const sort = searchParams.get("sort") || "newest"
  const page = Number(searchParams.get("page")) || 1

  // Local filter state for UI
  const [searchInput, setSearchInput] = useState(query)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    minPrice ? Number(minPrice) : 0,
    maxPrice ? Number(maxPrice) : 200000000
  ])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.getProducts({
        search: query || undefined,
        category: category || undefined,
        brand: brand || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sort || undefined,
        page,
        limit: 12,
      })
      setProducts(res.data || [])
      setTotal(res.total || 0)
      setTotalPages(res.totalPages || 0)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [query, category, brand, minPrice, maxPrice, sort, page])

  // Fetch categories and extract brands
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ limit: 100 }) // Get all products to extract brands
        ])
        if (catRes.data) setCategories(catRes.data)
        if (prodRes.data) {
          const uniqueBrands = [...new Set(prodRes.data.map(p => p.brand).filter(Boolean))]
          setBrands(uniqueBrands as string[])
        }
      } catch (error) {
        console.error("Fetch meta error:", error)
      }
    }
    fetchMeta()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Update URL with filters
  const updateFilters = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== 0) {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })
    // Reset page when filters change (except when changing page itself)
    if (!("page" in updates)) {
      params.delete("page")
    }
    router.push(`/search?${params.toString()}`)
  }

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: searchInput })
  }

  // Apply price range
  const applyPriceRange = () => {
    updateFilters({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 200000000 ? priceRange[1] : undefined,
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("")
    setPriceRange([0, 200000000])
    router.push("/search")
  }

  // Count active filters
  const activeFilterCount = [category, brand, minPrice, maxPrice].filter(Boolean).length

  // Format price for display
  const formatPriceShort = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(0)}tr`
    if (price >= 1000) return `${(price / 1000).toFixed(0)}k`
    return price.toString()
  }

  // Filter sidebar content (shared between desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <Accordion type="multiple" defaultValue={["category", "brand", "price"]}>
        <AccordionItem value="category">
          <AccordionTrigger className="text-sm font-medium">Danh mục</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${cat.id}`}
                    checked={category === cat.slug}
                    onCheckedChange={(checked) => 
                      updateFilters({ category: checked ? cat.slug : undefined })
                    }
                  />
                  <Label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer flex-1">
                    {cat.name}
                  </Label>
                  <span className="text-xs text-muted-foreground">{cat.product_count}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand">
          <AccordionTrigger className="text-sm font-medium">Thương hiệu</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
              {brands.map((b) => (
                <div key={b} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${b}`}
                    checked={brand === b}
                    onCheckedChange={(checked) => 
                      updateFilters({ brand: checked ? b : undefined })
                    }
                  />
                  <Label htmlFor={`brand-${b}`} className="text-sm cursor-pointer">
                    {b}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">Khoảng giá</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                value={priceRange}
                min={0}
                max={200000000}
                step={1000000}
                onValueChange={(value) => setPriceRange(value as [number, number])}
              />
              <div className="flex items-center justify-between text-sm">
                <span>{formatPriceShort(priceRange[0])}</span>
                <span>{formatPriceShort(priceRange[1])}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={applyPriceRange}>
                Áp dụng
              </Button>
              
              <div className="space-y-2 pt-2 border-t">
                {PRICE_RANGES.map((range) => (
                  <div key={range.label} className="flex items-center space-x-2">
                    <Checkbox
                      id={`price-${range.label}`}
                      checked={priceRange[0] === range.min && priceRange[1] === range.max}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPriceRange([range.min, range.max])
                          updateFilters({ minPrice: range.min, maxPrice: range.max })
                        }
                      }}
                    />
                    <Label htmlFor={`price-${range.label}`} className="text-sm cursor-pointer">
                      {range.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {activeFilterCount > 0 && (
        <Button variant="ghost" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Xóa bộ lọc ({activeFilterCount})
        </Button>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm đồ uống, bánh ngọt..."
            className="pl-12 pr-24 h-12 text-base"
          />
          <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
            Tìm kiếm
          </Button>
        </div>
      </form>

      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          {query && (
            <h1 className="text-xl font-bold">
              Kết quả cho "{query}"
            </h1>
          )}
          <p className="text-muted-foreground">
            {isLoading ? "Đang tìm kiếm..." : `Tìm thấy ${total} món`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter button */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Bộ lọc
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Bộ lọc</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select value={sort} onValueChange={(value) => updateFilters({ sort: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters badges */}
      {(category || brand || minPrice || maxPrice) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category && (
            <Badge variant="secondary" className="gap-1">
              {categories.find(c => c.slug === category)?.name || category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ category: undefined })}
              />
            </Badge>
          )}
          {brand && (
            <Badge variant="secondary" className="gap-1">
              {brand}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ brand: undefined })}
              />
            </Badge>
          )}
          {(minPrice || maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              {formatPriceShort(Number(minPrice) || 0)} - {formatPriceShort(Number(maxPrice) || 200000000)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <FilterContent />
            </CardContent>
          </Card>
        </aside>

        {/* Products grid */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: page - 1 })}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ page: page + 1 })}
                    disabled={page >= totalPages}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-16 w-16 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-medium">Không tìm thấy món nào</p>
              <p className="mt-2 text-muted-foreground">
                Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc
              </p>
              {activeFilterCount > 0 && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
