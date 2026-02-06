"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Zap, Clock, ChevronRight, ChevronLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface FlashSaleProduct {
  id: string
  name: string
  slug: string
  price: number
  original_price: number | null
  images: string[]
  discount: number
  sold_today: number
  flash_sale_stock: number
}

interface SiteSettings {
  flashSaleEnabled: boolean
  flashSaleStartHour: number
  flashSaleEndHour: number
}

// Calculate time until flash sale ends based on settings
function getTimeUntilEnd(endHour: number) {
  const now = new Date()
  const end = new Date()
  end.setHours(endHour, 0, 0, 0)
  
  // If end time has passed today, show 0
  if (now >= end) {
    return 0
  }
  
  return end.getTime() - now.getTime()
}

// Check if current time is within flash sale hours
function isWithinFlashSaleHours(startHour: number, endHour: number) {
  const now = new Date()
  const currentHour = now.getHours()
  return currentHour >= startHour && currentHour < endHour
}

function formatTime(ms: number) {
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0 }
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((ms % (1000 * 60)) / 1000)
  return { hours, minutes, seconds }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

export function FlashSaleSection() {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [products, setProducts] = useState<FlashSaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<SiteSettings>({
    flashSaleEnabled: true,
    flashSaleStartHour: 0,
    flashSaleEndHour: 24
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Check scroll position
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      setTimeout(checkScroll, 300)
    }
  }

  // Check if flash sale is enabled and get settings
  useEffect(() => {
    async function checkSettings() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`)
        if (!res.ok) return
        const data = await res.json()
        if (data.success) {
          setSettings({
            flashSaleEnabled: data.data.flashSaleEnabled !== false,
            flashSaleStartHour: data.data.flashSaleStartHour ?? 0,
            flashSaleEndHour: data.data.flashSaleEndHour ?? 24
          })
        }
      } catch {
        // API not available, keep defaults
      }
    }
    checkSettings()
  }, [])

  useEffect(() => {
    setMounted(true)
    setTimeLeft(getTimeUntilEnd(settings.flashSaleEndHour))
    
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilEnd(settings.flashSaleEndHour))
    }, 1000)
    return () => clearInterval(timer)
  }, [settings.flashSaleEndHour])

  // Fetch flash sale products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/flash-sale?limit=12`)
        const data = await res.json()
        if (data.success) {
          setProducts(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch flash sale products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const { hours, minutes, seconds } = formatTime(timeLeft)
  const isActive = isWithinFlashSaleHours(settings.flashSaleStartHour, settings.flashSaleEndHour)

  // Don't show section if disabled, outside hours, or no products
  if (!settings.flashSaleEnabled || !isActive || (!loading && products.length === 0)) {
    return null
  }

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Zap className="h-6 w-6 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span className="text-xl sm:text-2xl font-bold text-white drop-shadow">Flash Sale</span>
            </div>
          </div>
          
          {/* Countdown */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Clock className="h-5 w-5 text-white" />
            <span className="text-white text-sm font-medium">Kết thúc sau:</span>
            <div className="flex items-center gap-1">
              <div className="bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg text-lg min-w-[44px] text-center shadow-lg">
                {mounted ? String(hours).padStart(2, '0') : '--'}
              </div>
              <span className="text-white font-bold text-xl">:</span>
              <div className="bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg text-lg min-w-[44px] text-center shadow-lg">
                {mounted ? String(minutes).padStart(2, '0') : '--'}
              </div>
              <span className="text-white font-bold text-xl">:</span>
              <div className="bg-white text-red-600 font-bold px-3 py-1.5 rounded-lg text-lg min-w-[44px] text-center shadow-lg">
                {mounted ? String(seconds).padStart(2, '0') : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="relative group/carousel">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 -ml-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-6 w-6 text-red-600" />
              </button>
            )}
            
            {/* Right Arrow */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 -mr-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-6 w-6 text-red-600" />
              </button>
            )}

            {/* Scrollable Container */}
            <div 
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map((product) => {
                const discount = product.discount || 0
                const soldToday = product.sold_today || 0
                const flashStock = product.flash_sale_stock || 50
                const soldPercent = Math.min(100, Math.round((soldToday / flashStock) * 100))
                const imageUrl = product.images?.[0]
                const validImageUrl = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/')) ? imageUrl : "/placeholder.svg"
                
                return (
                  <Link 
                    key={product.id} 
                    href={`/product/${product.slug}`}
                    className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px]"
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white h-full group hover:-translate-y-1">
                      <div className="relative aspect-square bg-gray-50">
                        <Image
                          src={validImageUrl}
                          alt={product.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-2 left-2 bg-red-600 text-white font-bold text-sm px-2 py-1 shadow-lg">
                          -{discount}%
                        </Badge>
                        {soldPercent >= 80 && (
                          <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">
                            🔥 Hot
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium line-clamp-2 min-h-[40px] group-hover:text-red-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <span className="text-lg font-bold text-red-600">
                            {formatPrice(product.price)}
                          </span>
                          {product.original_price && (
                            <span className="ml-2 text-xs text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <div className="relative h-2 bg-red-100 rounded-full overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(soldPercent, 10)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                            Đã bán {soldToday}/{flashStock}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* View all button */}
        <div className="flex justify-center mt-6">
          <Button 
            asChild 
            variant="secondary" 
            className="bg-white hover:bg-gray-100 text-red-600 font-semibold px-6 shadow-lg"
          >
            <Link href="/search?sort=discount_desc">
              Xem tất cả
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
