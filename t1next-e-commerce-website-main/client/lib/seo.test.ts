import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  generateMetaTags,
  generateOpenGraph,
  generateTwitterCard,
  generateProductJsonLd,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  generateBreadcrumbJsonLd,
  generateProductSEO,
  generateCategorySEO,
  generateHomeSEO,
  SITE_NAME,
  SITE_URL,
} from './seo'

/**
 * Property-Based Tests for SEO Metadata Generation
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: platform-completion**
 */

// Generators for test data
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)

const slugArb = fc.stringMatching(/^[a-z0-9-]{1,50}$/)

const priceArb = fc.integer({ min: 1000, max: 100000000 })

const stockArb = fc.integer({ min: 0, max: 10000 })

const ratingArb = fc.float({ min: 1, max: 5, noNaN: true })

const reviewCountArb = fc.integer({ min: 0, max: 10000 })

const imageUrlArb = fc.webUrl().map(url => `${url}/image.jpg`)

const productArb = fc.record({
  name: nonEmptyStringArb,
  description: fc.option(nonEmptyStringArb, { nil: undefined }),
  images: fc.option(fc.array(imageUrlArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
  price: priceArb,
  originalPrice: fc.option(priceArb, { nil: undefined }),
  brand: fc.option(nonEmptyStringArb, { nil: undefined }),
  slug: slugArb,
  stock: fc.option(stockArb, { nil: undefined }),
  rating: fc.option(ratingArb, { nil: undefined }),
  reviewCount: fc.option(reviewCountArb, { nil: undefined }),
  sku: fc.option(nonEmptyStringArb, { nil: undefined }),
  category: fc.option(
    fc.record({
      name: nonEmptyStringArb,
      slug: slugArb,
    }),
    { nil: undefined }
  ),
})

const categoryArb = fc.record({
  name: nonEmptyStringArb,
  slug: slugArb,
  description: fc.option(nonEmptyStringArb, { nil: undefined }),
  productCount: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
})

describe('SEO Metadata Property Tests', () => {
  /**
   * **Feature: platform-completion, Property 3: SEO Meta Tag Presence**
   * 
   * *For any* product page, the rendered HTML SHALL contain title, description, 
   * Open Graph tags, and JSON-LD structured data.
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.6**
   */
  describe('Property 3: SEO Meta Tag Presence', () => {
    it('generateMetaTags should always include title and description', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          (title, description) => {
            const meta = generateMetaTags({ title, description })
            
            // Title should include site name
            expect(meta.title).toContain(title)
            expect(meta.title).toContain(SITE_NAME)
            
            // Description should be present and truncated to 160 chars
            expect(meta.description).toBeDefined()
            expect((meta.description as string).length).toBeLessThanOrEqual(160)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('generateOpenGraph should always include required OG fields', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.webUrl(),
          (title, description, url) => {
            const og = generateOpenGraph({ title, description, url })
            
            // All required OG fields must be present
            expect(og.type).toBeDefined()
            expect(['website', 'product', 'article']).toContain(og.type)
            expect(og.title).toBe(title)
            expect(og.description).toBeDefined()
            expect(og.description.length).toBeLessThanOrEqual(200)
            expect(og.image).toBeDefined()
            expect(og.url).toBe(url)
            expect(og.siteName).toBe(SITE_NAME)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('generateProductJsonLd should always include required schema.org fields', () => {
      fc.assert(
        fc.property(productArb, (product) => {
          const jsonLd = generateProductJsonLd(product)
          
          // Required JSON-LD fields for Product schema
          expect(jsonLd['@context']).toBe('https://schema.org')
          expect(jsonLd['@type']).toBe('Product')
          expect(jsonLd.name).toBe(product.name)
          expect(jsonLd.description).toBeDefined()
          expect(jsonLd.sku).toBeDefined()
          expect(jsonLd.brand).toBeDefined()
          expect((jsonLd.brand as Record<string, unknown>)['@type']).toBe('Brand')
          
          // Offers must be present with required fields
          const offers = jsonLd.offers as Record<string, unknown>
          expect(offers['@type']).toBe('Offer')
          expect(offers.price).toBe(product.price)
          expect(offers.priceCurrency).toBe('VND')
          expect(offers.availability).toBeDefined()
          expect(offers.seller).toBeDefined()
          
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('generateProductSEO should include all SEO components', () => {
      fc.assert(
        fc.property(productArb, (product) => {
          const seo = generateProductSEO(product)
          
          // Title and description must be present
          expect(seo.title).toBe(product.name)
          expect(seo.description).toBeDefined()
          expect(seo.description.length).toBeLessThanOrEqual(160)
          
          // Keywords must be present
          expect(seo.keywords).toBeDefined()
          expect(Array.isArray(seo.keywords)).toBe(true)
          expect(seo.keywords!.length).toBeGreaterThan(0)
          
          // Canonical URL must be present
          expect(seo.canonical).toBeDefined()
          expect(seo.canonical).toContain(product.slug)
          
          // Open Graph must be present with required fields
          expect(seo.openGraph).toBeDefined()
          expect(seo.openGraph!.type).toBe('product')
          expect(seo.openGraph!.title).toBe(product.name)
          expect(seo.openGraph!.url).toContain(product.slug)
          
          // Twitter card must be present
          expect(seo.twitter).toBeDefined()
          expect(seo.twitter!.title).toBe(product.name)
          
          // JSON-LD must be present with Product and Breadcrumb schemas
          expect(seo.jsonLd).toBeDefined()
          expect(Array.isArray(seo.jsonLd)).toBe(true)
          expect(seo.jsonLd!.length).toBeGreaterThanOrEqual(2)
          
          // First JSON-LD should be Product schema
          const productSchema = seo.jsonLd![0]
          expect(productSchema['@type']).toBe('Product')
          
          // Second JSON-LD should be BreadcrumbList schema
          const breadcrumbSchema = seo.jsonLd![1]
          expect(breadcrumbSchema['@type']).toBe('BreadcrumbList')
          
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('generateCategorySEO should include all SEO components', () => {
      fc.assert(
        fc.property(categoryArb, (category) => {
          const seo = generateCategorySEO(category)
          
          // Title and description must be present
          expect(seo.title).toBe(category.name)
          expect(seo.description).toBeDefined()
          
          // Keywords must be present
          expect(seo.keywords).toBeDefined()
          expect(Array.isArray(seo.keywords)).toBe(true)
          
          // Canonical URL must be present
          expect(seo.canonical).toBeDefined()
          expect(seo.canonical).toContain(category.slug)
          
          // Open Graph must be present
          expect(seo.openGraph).toBeDefined()
          expect(seo.openGraph!.type).toBe('website')
          
          // Twitter card must be present
          expect(seo.twitter).toBeDefined()
          
          // JSON-LD must be present with Breadcrumb schema
          expect(seo.jsonLd).toBeDefined()
          expect(Array.isArray(seo.jsonLd)).toBe(true)
          expect(seo.jsonLd!.length).toBeGreaterThanOrEqual(1)
          
          const breadcrumbSchema = seo.jsonLd![0]
          expect(breadcrumbSchema['@type']).toBe('BreadcrumbList')
          
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('generateHomeSEO should include Organization and WebSite schemas', () => {
      const seo = generateHomeSEO()
      
      // Title and description must be present
      expect(seo.title).toBeDefined()
      expect(seo.description).toBeDefined()
      
      // Keywords must be present
      expect(seo.keywords).toBeDefined()
      expect(Array.isArray(seo.keywords)).toBe(true)
      
      // Canonical URL must be SITE_URL
      expect(seo.canonical).toBe(SITE_URL)
      
      // Open Graph must be present
      expect(seo.openGraph).toBeDefined()
      expect(seo.openGraph!.type).toBe('website')
      
      // Twitter card must be present
      expect(seo.twitter).toBeDefined()
      
      // JSON-LD must include Organization and WebSite schemas
      expect(seo.jsonLd).toBeDefined()
      expect(Array.isArray(seo.jsonLd)).toBe(true)
      expect(seo.jsonLd!.length).toBe(2)
      
      const orgSchema = seo.jsonLd![0]
      expect(orgSchema['@type']).toBe('Organization')
      expect(orgSchema.name).toBe(SITE_NAME)
      expect(orgSchema.url).toBe(SITE_URL)
      
      const webSiteSchema = seo.jsonLd![1]
      expect(webSiteSchema['@type']).toBe('WebSite')
      expect(webSiteSchema.name).toBe(SITE_NAME)
      expect(webSiteSchema.potentialAction).toBeDefined()
    })

    it('Product JSON-LD should have correct availability based on stock', () => {
      fc.assert(
        fc.property(
          productArb,
          (product) => {
            const jsonLd = generateProductJsonLd(product)
            const offers = jsonLd.offers as Record<string, unknown>
            
            const stock = product.stock ?? 0
            const expectedAvailability = stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock'
            
            expect(offers.availability).toBe(expectedAvailability)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Product JSON-LD should include aggregateRating only when reviews exist', () => {
      fc.assert(
        fc.property(productArb, (product) => {
          const jsonLd = generateProductJsonLd(product)
          
          const hasValidRating = product.rating && product.reviewCount && product.reviewCount > 0
          
          if (hasValidRating) {
            expect(jsonLd.aggregateRating).toBeDefined()
            const rating = jsonLd.aggregateRating as Record<string, unknown>
            expect(rating['@type']).toBe('AggregateRating')
            expect(rating.ratingValue).toBe(product.rating)
            expect(rating.reviewCount).toBe(product.reviewCount)
          } else {
            expect(jsonLd.aggregateRating).toBeUndefined()
          }
          
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('Breadcrumb JSON-LD should have correct structure', () => {
      const breadcrumbItemsArb = fc.array(
        fc.record({
          name: nonEmptyStringArb,
          url: fc.webUrl(),
        }),
        { minLength: 1, maxLength: 5 }
      )

      fc.assert(
        fc.property(breadcrumbItemsArb, (items) => {
          const jsonLd = generateBreadcrumbJsonLd(items)
          
          expect(jsonLd['@context']).toBe('https://schema.org')
          expect(jsonLd['@type']).toBe('BreadcrumbList')
          expect(jsonLd.itemListElement).toBeDefined()
          
          const listItems = jsonLd.itemListElement as Array<Record<string, unknown>>
          expect(listItems.length).toBe(items.length)
          
          // Each item should have correct position (1-indexed)
          listItems.forEach((item, index) => {
            expect(item['@type']).toBe('ListItem')
            expect(item.position).toBe(index + 1)
            expect(item.name).toBe(items[index].name)
            expect(item.item).toBe(items[index].url)
          })
          
          return true
        }),
        { numRuns: 100 }
      )
    })

    it('Twitter card should use correct card type based on image presence', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.option(imageUrlArb, { nil: undefined }),
          (title, description, image) => {
            const twitter = generateTwitterCard({ title, description, image })
            
            if (image) {
              expect(twitter.card).toBe('summary_large_image')
              expect(twitter.image).toBe(image)
            } else {
              expect(twitter.card).toBe('summary')
            }
            
            expect(twitter.title).toBe(title)
            expect(twitter.description.length).toBeLessThanOrEqual(200)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Meta tags should include keywords when provided', () => {
      const keywordsArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 10 })

      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          keywordsArb,
          (title, description, keywords) => {
            const meta = generateMetaTags({ title, description, keywords })
            
            expect(meta.keywords).toBeDefined()
            expect(meta.keywords).toBe(keywords.join(', '))
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Meta tags should include canonical when provided', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          fc.webUrl(),
          (title, description, canonical) => {
            const meta = generateMetaTags({ title, description, canonical })
            
            expect(meta.canonical).toBe(canonical)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Meta tags should include robots noindex when specified', () => {
      fc.assert(
        fc.property(
          nonEmptyStringArb,
          nonEmptyStringArb,
          (title, description) => {
            const meta = generateMetaTags({ title, description, noIndex: true })
            
            expect(meta.robots).toBe('noindex, nofollow')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
