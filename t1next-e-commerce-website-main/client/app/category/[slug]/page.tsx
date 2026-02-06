import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/product/product-card"
import { ProductFilters } from "@/components/product/product-filters"
import { JsonLd } from "@/components/seo"
import {
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.success ? data.data : null
  } catch {
    return null
  }
}

async function getProducts(categorySlug: string) {
  try {
    const res = await fetch(`${API_URL}/products?category=${categorySlug}&limit=50`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.success ? data.data : []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return { title: "Không tìm thấy danh mục" }
  
  const description = category.description || 
    `Khám phá ${category.name} tại ${SITE_NAME}. Giao hàng nhanh, chất lượng đảm bảo.`
  const categoryUrl = `${SITE_URL}/category/${slug}`

  return {
    title: `${category.name} - ${SITE_NAME}`,
    description,
    keywords: [category.name, 'đặt hàng online', 'giao hàng nhanh', SITE_NAME],
    alternates: {
      canonical: categoryUrl,
    },
    openGraph: {
      title: `${category.name} - ${SITE_NAME}`,
      description,
      url: categoryUrl,
      siteName: SITE_NAME,
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${category.name} - ${SITE_NAME}`,
      description,
      site: '@nhhcoffee',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [category, products] = await Promise.all([
    getCategory(slug),
    getProducts(slug)
  ])

  if (!category) {
    notFound()
  }

  // Generate breadcrumb JSON-LD
  const breadcrumbItems = [
    { name: 'Trang chủ', url: SITE_URL },
    { name: category.name, url: `${SITE_URL}/category/${category.slug}` },
  ]
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems)

  // Generate ItemList JSON-LD for category products
  const itemListJsonLd = generateItemListJsonLd({
    name: category.name,
    description: category.description || `Danh mục ${category.name} tại ${SITE_NAME}`,
    url: `${SITE_URL}/category/${category.slug}`,
    items: products.slice(0, 10).map((product: any, index: number) => ({
      name: product.name,
      url: `${SITE_URL}/product/${product.slug}`,
      image: product.images?.[0],
      position: index + 1,
    })),
  })

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      {/* JSON-LD Structured Data */}
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />
      
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Trang chủ
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="mt-6">
            <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>
            <p className="mt-2 text-muted-foreground">{products.length} món được tìm thấy</p>
          </div>

          {/* Content */}
          <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Filters */}
            <aside className="hidden lg:block">
              <ProductFilters />
            </aside>

            {/* Products grid */}
            <div>
              {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-lg font-medium">Không tìm thấy món nào</p>
                  <p className="mt-2 text-muted-foreground">Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm danh mục khác</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
