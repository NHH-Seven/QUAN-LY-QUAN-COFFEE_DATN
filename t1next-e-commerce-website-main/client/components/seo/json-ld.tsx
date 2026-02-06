/**
 * JSON-LD Component
 * Renders structured data in the page head for SEO
 */

import type { JsonLdData } from '@/lib/seo'

interface JsonLdProps {
  data: JsonLdData | JsonLdData[]
}

/**
 * Renders JSON-LD structured data as a script tag
 * Can accept single schema or array of schemas
 */
export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data]

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </>
  )
}

/**
 * Pre-built JSON-LD components for common use cases
 */

export function ProductJsonLd({ product }: {
  product: {
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
  }
}) {
  const { generateProductJsonLd } = require('@/lib/seo')
  return <JsonLd data={generateProductJsonLd(product)} />
}

export function OrganizationJsonLd() {
  const { generateOrganizationJsonLd } = require('@/lib/seo')
  return <JsonLd data={generateOrganizationJsonLd()} />
}

export function WebSiteJsonLd() {
  const { generateWebSiteJsonLd } = require('@/lib/seo')
  return <JsonLd data={generateWebSiteJsonLd()} />
}

export function BreadcrumbJsonLd({ items }: {
  items: Array<{ name: string; url: string }>
}) {
  const { generateBreadcrumbJsonLd } = require('@/lib/seo')
  return <JsonLd data={generateBreadcrumbJsonLd(items)} />
}

export function FAQJsonLd({ faqs }: {
  faqs: Array<{ question: string; answer: string }>
}) {
  const { generateFAQJsonLd } = require('@/lib/seo')
  return <JsonLd data={generateFAQJsonLd(faqs)} />
}

export function ReviewJsonLd({ review }: {
  review: {
    author: string
    rating: number
    comment: string
    datePublished: string
    productName: string
  }
}) {
  const { generateReviewJsonLd } = require('@/lib/seo')
  return <JsonLd data={generateReviewJsonLd(review)} />
}
