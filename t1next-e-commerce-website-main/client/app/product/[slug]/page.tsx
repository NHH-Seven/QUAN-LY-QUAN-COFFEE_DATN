import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductDetail } from "@/components/product/product-detail"
import { ProductSpecs } from "@/components/product/product-specs"
import { ProductDescription } from "@/components/product/product-description"
import { TrackProductView } from "@/components/product/track-product-view"
import { RelatedProducts } from "@/components/product/related-products"
import { JsonLd } from "@/components/seo"
import {
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  SITE_URL,
  SITE_NAME,
} from "@/lib/seo"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { ProductPageClient } from "./product-page-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.success ? data.data : null
  } catch {
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  
  if (!product) {
    return { title: 'Sản phẩm không tồn tại' }
  }

  const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
  const description = product.description?.slice(0, 160) || 
    `Đặt ${product.name} tại ${SITE_NAME}. ${price}. Giao hàng nhanh, chất lượng đảm bảo.`
  const productUrl = `${SITE_URL}/product/${slug}`

  return {
    title: `${product.name} | ${SITE_NAME}`,
    description,
    keywords: [
      product.name,
      product.brand,
      product.category?.name || product.category_name,
      'đặt hàng online',
      'giao hàng nhanh',
      SITE_NAME,
    ].filter(Boolean),
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: product.name,
      description,
      images: product.images?.[0] ? [{ 
        url: product.images[0], 
        width: 800, 
        height: 800,
        alt: product.name,
      }] : [],
      type: 'website',
      url: productUrl,
      siteName: SITE_NAME,
      locale: 'vi_VN',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
      site: '@nhhcoffee',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

async function getRelatedProducts(categoryId: string, excludeId: string) {
  try {
    const res = await fetch(`${API_URL}/products?category=${categoryId}&limit=4`, {
      cache: 'no-store'
    })
    if (!res.ok) return []
    const data = await res.json()
    if (data.success && data.data) {
      return data.data.filter((p: { id: string }) => p.id !== excludeId)
    }
    return []
  } catch {
    return []
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.category?.id, product.id)

  // Generate JSON-LD structured data
  const productJsonLd = generateProductJsonLd({
    name: product.name,
    description: product.description,
    images: product.images,
    price: product.price,
    originalPrice: product.original_price || product.originalPrice,
    brand: product.brand,
    slug: product.slug,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.review_count || product.reviewCount,
    sku: product.id,
    category: product.category,
  })

  // Generate breadcrumb JSON-LD
  const breadcrumbItems = [
    { name: 'Trang chủ', url: SITE_URL },
  ]
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${SITE_URL}/category/${product.category.slug}`,
    })
  }
  breadcrumbItems.push({
    name: product.name,
    url: `${SITE_URL}/product/${product.slug}`,
  })
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems)

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      {/* JSON-LD Structured Data */}
      <JsonLd data={[productJsonLd, breadcrumbJsonLd]} />
      
      <Header />
      <TrackProductView product={product} />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Trang chủ
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {product.category && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/category/${product.category.slug}`}>
                      {product.category.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Product detail - main info */}
          <ProductDetail product={product} />

          {/* Two column layout for specs and description */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 mt-4 sm:mt-6">
            {/* Specs */}
            <ProductSpecs specs={product.specs || {}} />
            
            {/* Description */}
            <ProductDescription description={product.description || ''} name={product.name} />
          </div>

          {/* Client-side components: Reviews, Q&A, Recently Viewed */}
          <ProductPageClient 
            productId={product.id}
            initialRating={product.rating || 0}
            initialReviewCount={product.review_count || 0}
          />

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <RelatedProducts products={relatedProducts} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
