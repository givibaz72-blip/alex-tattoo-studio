import type { MetadataRoute } from 'next'

const baseUrl = 'https://aurora-ash.tattoo' // замени на реальный домен перед деплоем

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/_next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
