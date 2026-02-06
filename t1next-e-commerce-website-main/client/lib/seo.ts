/**
 * SEO Utility Functions
 * Provides functions for generating meta tags, Open Graph data, and JSON-LD structured data
 */

import type { Product, Category, Review } from './types'

// ============================================
// CONSTANTS
// ============================================

export const SITE_NAME = 'NHH-Coffee'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nhh-coffee.com'
export const DEFAULT_LOCALE = 'vi_VN'
export const DEFAULT_CURRENCY = 'VND'

// ============================================
// INTERFACES
// ============================================

export interface SEOData {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  openGraph?: OpenGraphData
  twitter?: TwitterData
  jsonLd?: JsonLdData[]
}

export interface OpenGraphData {
  type: 'website' | 'product' | 'article'
  title: string
  description: string
  image: string
  url: string
  siteName: string
  locale?: string
}

export interface TwitterData {
  card: 'summary' | 'summary_large_image' | 'app' | 'player'
  title: string
  description: string
  image?: string
  site?: string
}

export interface JsonLdData {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: unknown
}


// ============================================
// META TAG GENERATION
// ============================================

/**
 * Generate meta tags for a page
 */
export function generateMetaTags(options: {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  noIndex?: boolean
}): Record<string, string | string[]> {
  const { title, description, keywords, canonical, noIndex } = options

  const meta: Record<string, string | string[]> = {
    title: `${title} | ${SITE_NAME}`,
    description: description.slice(0, 160),
  }

  if (keywords && keywords.length > 0) {
    meta.keywords = keywords.join(', ')
  }

  if (canonical) {
    meta.canonical = canonical
  }

  if (noIndex) {
    meta.robots = 'noindex, nofollow'
  }

  return meta
}

// ============================================
// OPEN GRAPH GENERATION
// ============================================

/**
 * Generate Open Graph tags for social media sharing
 */
export function generateOpenGraph(options: {
  title: string
  description: string
  image?: string
  url: string
  type?: 'website' | 'product' | 'article'
}): OpenGraphData {
  const { title, description, image, url, type = 'website' } = options

  return {
    type,
    title,
    description: description.slice(0, 200),
    image: image || `${SITE_URL}/placeholder.jpg`,
    url,
    siteName: SITE_NAME,
    locale: DEFAULT_LOCALE,
  }
}

// ============================================
// TWITTER CARD GENERATION
// ============================================

/**
 * Generate Twitter card data
 */
export function generateTwitterCard(options: {
  title: string
  description: string
  image?: string
}): TwitterData {
  const { title, description, image } = options

  return {
    card: image ? 'summary_large_image' : 'summary',
    title,
    description: description.slice(0, 200),
    image,
    site: '@nhhcoffee',
  }
}


// ============================================
// JSON-LD SCHEMA GENERATION
// ============================================

/**
 * Generate Product JSON-LD schema
 */
export function generateProductJsonLd(product: {
  name: string
  description?: string
  images?: string[]
  price: number
  originalPrice?: number
  brand?: string
  slug: string
  stock?: number
  rating?: number
  reviewCount?: number
  sku?: string
  category?: { name: string }
}): JsonLdData {
  const availability = (product.stock ?? 0) > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'

  const schema: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Sản phẩm chất lượng tại ${SITE_NAME}`,
    image: product.images || [],
    sku: product.sku || product.slug,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: DEFAULT_CURRENCY,
      availability,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      url: `${SITE_URL}/product/${product.slug}`,
    },
  }

  if (product.rating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  if (product.category?.name) {
    schema.category = product.category.name
  }

  return schema
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationJsonLd(): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description: 'NHH-Coffee - Cửa hàng cà phê & trà chất lượng cao',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+84-762-393-111',
      contactType: 'customer service',
      availableLanguage: ['Vietnamese', 'English'],
    },
    sameAs: [
      'https://facebook.com/nhhcoffee',
      'https://instagram.com/nhhcoffee',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Hải Thịnh',
      addressLocality: 'Hải Hậu',
      addressRegion: 'Ninh Bình',
      postalCode: '430000',
      addressCountry: 'VN',
    },
  }
}


/**
 * Generate WebSite JSON-LD schema with SearchAction
 */
export function generateWebSiteJsonLd(): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'NHH-Coffee - Cửa hàng cà phê & trà',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbJsonLd(items: Array<{
  name: string
  url: string
}>): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate Review JSON-LD schema
 */
export function generateReviewJsonLd(review: {
  author: string
  rating: number
  comment: string
  datePublished: string
  productName: string
}): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.comment,
    datePublished: review.datePublished,
    itemReviewed: {
      '@type': 'Product',
      name: review.productName,
    },
  }
}

/**
 * Generate FAQ JSON-LD schema
 */
export function generateFAQJsonLd(faqs: Array<{
  question: string
  answer: string
}>): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate ItemList JSON-LD schema for category pages
 */
export function generateItemListJsonLd(options: {
  name: string
  description: string
  url: string
  items: Array<{
    name: string
    url: string
    image?: string
    position: number
  }>
}): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options.name,
    description: options.description,
    url: options.url,
    numberOfItems: options.items.length,
    itemListElement: options.items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      url: item.url,
      name: item.name,
      image: item.image,
    })),
  }
}


// ============================================
// COMPLETE SEO DATA GENERATION
// ============================================

/**
 * Generate complete SEO data for a product page
 */
export function generateProductSEO(product: {
  name: string
  description?: string
  images?: string[]
  price: number
  originalPrice?: number
  brand?: string
  slug: string
  stock?: number
  rating?: number
  reviewCount?: number
  category?: { name: string; slug: string }
}): SEOData {
  const url = `${SITE_URL}/product/${product.slug}`
  const description = product.description?.slice(0, 160) ||
    `Đặt ${product.name} tại ${SITE_NAME}. Giao hàng nhanh, chất lượng đảm bảo.`

  const breadcrumbItems = [
    { name: 'Trang chủ', url: SITE_URL },
  ]

  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${SITE_URL}/category/${product.category.slug}`,
    })
  }

  breadcrumbItems.push({ name: product.name, url })

  return {
    title: product.name,
    description,
    keywords: [
      product.name,
      product.brand,
      product.category?.name,
      'đặt hàng online',
      'cà phê',
      'trà',
      SITE_NAME,
    ].filter(Boolean) as string[],
    canonical: url,
    openGraph: generateOpenGraph({
      title: product.name,
      description,
      image: product.images?.[0],
      url,
      type: 'product',
    }),
    twitter: generateTwitterCard({
      title: product.name,
      description,
      image: product.images?.[0],
    }),
    jsonLd: [
      generateProductJsonLd(product),
      generateBreadcrumbJsonLd(breadcrumbItems),
    ],
  }
}

/**
 * Generate complete SEO data for a category page
 */
export function generateCategorySEO(category: {
  name: string
  slug: string
  description?: string
  productCount?: number
}): SEOData {
  const url = `${SITE_URL}/category/${category.slug}`
  const description = category.description ||
    `Khám phá ${category.name} chất lượng tại ${SITE_NAME}. Giao hàng nhanh, giá cả hợp lý.`

  const breadcrumbItems = [
    { name: 'Trang chủ', url: SITE_URL },
    { name: category.name, url },
  ]

  return {
    title: category.name,
    description,
    keywords: [category.name, 'đặt hàng online', 'cà phê', 'trà', SITE_NAME],
    canonical: url,
    openGraph: generateOpenGraph({
      title: `${category.name} - ${SITE_NAME}`,
      description,
      url,
      type: 'website',
    }),
    twitter: generateTwitterCard({
      title: `${category.name} - ${SITE_NAME}`,
      description,
    }),
    jsonLd: [generateBreadcrumbJsonLd(breadcrumbItems)],
  }
}

/**
 * Generate complete SEO data for the home page
 */
export function generateHomeSEO(): SEOData {
  const description = 'NHH-Coffee - Cửa hàng cà phê & trà chất lượng cao. Thưởng thức cà phê, trà, đá xay và bánh ngọt thơm ngon. Đặt hàng online, giao hàng nhanh chóng.'

  return {
    title: 'Cửa hàng cà phê & trà',
    description,
    keywords: [
      'cà phê',
      'trà',
      'bánh ngọt',
      'đá xay',
      'coffee',
      'đặt hàng online',
      SITE_NAME,
    ],
    canonical: SITE_URL,
    openGraph: generateOpenGraph({
      title: `${SITE_NAME} - Cửa hàng cà phê & trà`,
      description,
      url: SITE_URL,
      type: 'website',
    }),
    twitter: generateTwitterCard({
      title: `${SITE_NAME} - Cửa hàng cà phê & trà`,
      description,
    }),
    jsonLd: [
      generateOrganizationJsonLd(),
      generateWebSiteJsonLd(),
    ],
  }
}
