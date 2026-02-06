import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nhh-coffee.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ProductData {
  slug: string
  updated_at?: string
  created_at?: string
  is_featured?: boolean
  is_new?: boolean
}

interface CategoryData {
  slug: string
  updated_at?: string
  product_count?: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with appropriate priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/wishlist`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    },
  ]

  // Fetch all categories
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    const data = await res.json()
    if (data.success && data.data) {
      categoryPages = data.data.map((cat: CategoryData) => ({
        url: `${BASE_URL}/category/${cat.slug}`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
        changeFrequency: 'daily' as const,
        // Higher priority for categories with more products
        priority: cat.product_count && cat.product_count > 10 ? 0.8 : 0.7,
      }))
    }
  } catch (e) {
    console.error('Failed to fetch categories for sitemap:', e)
  }

  // Fetch all products (paginated to get all)
  let productPages: MetadataRoute.Sitemap = []
  try {
    // First, get total count
    const countRes = await fetch(`${API_URL}/products?limit=1`, {
      next: { revalidate: 3600 },
    })
    const countData = await countRes.json()
    const total = countData.pagination?.total || 100

    // Fetch all products in batches
    const batchSize = 100
    const batches = Math.ceil(total / batchSize)
    const allProducts: ProductData[] = []

    for (let i = 0; i < batches; i++) {
      const res = await fetch(`${API_URL}/products?limit=${batchSize}&offset=${i * batchSize}`, {
        next: { revalidate: 3600 },
      })
      const data = await res.json()
      if (data.success && data.data) {
        allProducts.push(...data.data)
      }
    }

    productPages = allProducts.map((product: ProductData) => {
      // Determine priority based on product attributes
      let priority = 0.6
      if (product.is_featured) priority = 0.8
      else if (product.is_new) priority = 0.7

      // Determine change frequency based on product age
      const createdDate = product.created_at ? new Date(product.created_at) : new Date()
      const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      const changeFrequency: 'daily' | 'weekly' | 'monthly' = 
        daysSinceCreation < 7 ? 'daily' : 
        daysSinceCreation < 30 ? 'weekly' : 'monthly'

      return {
        url: `${BASE_URL}/product/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency,
        priority,
      }
    })
  } catch (e) {
    console.error('Failed to fetch products for sitemap:', e)
  }

  return [...staticPages, ...categoryPages, ...productPages]
}
