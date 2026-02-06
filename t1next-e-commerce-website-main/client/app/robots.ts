import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nhh-coffee.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/staff/',
          '/checkout/',
          '/profile/',
          '/verify-otp/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
