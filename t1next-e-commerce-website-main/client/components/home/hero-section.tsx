"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const banners = [
  {
    id: 1,
    badge: "Best Seller",
    title: "Cà phê sữa đá",
    tagline: "Hương vị Việt Nam đích thực",
    description: "Cà phê đậm đà kết hợp sữa đặc béo ngậy. Thức uống quốc dân được yêu thích nhất.",
    price: 29000,
    originalPrice: 35000,
    cta: "Đặt ngay",
    href: "/category/ca-phe",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
    bgImage: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920",
  },
  {
    id: 2,
    badge: "Mới ra mắt",
    title: "Trà đào cam sả",
    tagline: "Thanh mát mùa hè",
    description: "Trà đào thơm ngọt, cam tươi và sả thơm. Giải khát tuyệt vời cho ngày nắng.",
    price: 39000,
    originalPrice: 45000,
    cta: "Khám phá",
    href: "/category/tra",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800",
    bgImage: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1920",
  },
  {
    id: 3,
    badge: "Combo tiết kiệm",
    title: "Combo bữa sáng",
    tagline: "Bữa sáng hoàn hảo",
    description: "Cà phê sữa đá + Croissant bơ. Tiết kiệm 23% cho bữa sáng năng lượng.",
    price: 55000,
    originalPrice: 71000,
    cta: "Đặt combo",
    href: "/category/combo",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
    bgImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920",
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price)
}


export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextSlide() : prevSlide()
    }
  }

  return (
    <section className="relative overflow-hidden group">
      <div
        className="relative h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <Image
                src={banner.bgImage}
                alt=""
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            </div>

            <div className="container relative z-10 mx-auto h-full px-4">
              <div className="flex h-full items-center">
                <div className="grid h-full w-full grid-cols-1 items-center lg:grid-cols-2 gap-8">
                  {/* Content */}
                  <div className="flex flex-col justify-center py-8">
                    {/* Badge */}
                    <span className="inline-flex w-fit items-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground uppercase tracking-wide">
                      {banner.badge}
                    </span>
                    
                    {/* Title */}
                    <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-lg">
                      {banner.title}
                    </h1>
                    
                    {/* Tagline */}
                    <p className="mt-3 text-xl sm:text-2xl font-medium text-white/90">
                      {banner.tagline}
                    </p>
                    
                    {/* Description */}
                    <p className="mt-3 text-base sm:text-lg text-white/75 max-w-md">
                      {banner.description}
                    </p>

                    {/* Price */}
                    <div className="mt-6 flex items-baseline gap-3">
                      <span className="text-sm text-white/70">Chỉ từ</span>
                      <span className="text-3xl sm:text-4xl font-bold text-primary">
                        {formatPrice(banner.price)} ₫
                      </span>
                      <span className="text-lg text-white/50 line-through">
                        {formatPrice(banner.originalPrice)} ₫
                      </span>
                    </div>

                    {/* Buttons */}
                    <div className="mt-8 flex items-center gap-4">
                      <Button size="lg" className="h-12 px-8 font-semibold text-base" asChild>
                        <Link href={banner.href}>{banner.cta}</Link>
                      </Button>
                      <Link 
                        href="/category"
                        className="inline-flex items-center gap-2 text-base font-medium text-white hover:text-primary transition-colors"
                      >
                        Xem menu
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="relative hidden lg:flex items-center justify-center">
                    <div className="relative w-80 h-80 xl:w-96 xl:h-96">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-cover rounded-full shadow-2xl"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 sm:left-6 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 sm:right-6 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? "w-10 bg-primary" 
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            onClick={() => setCurrentSlide(index)}
          >
            <span className="sr-only">Slide {index + 1}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
