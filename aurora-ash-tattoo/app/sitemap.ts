import type { MetadataRoute } from 'next'
import { getPayload } from '@/lib/payload'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const payload = await getPayload()
    // Fetch published pages and artists
    const [pagesResult, artistsResult] = await Promise.all([
      payload.find({
        collection: 'pages',
        where: {
          _status: {
            equals: 'published',
          },
        },
      }),
      payload.find({
        collection: 'artists',
        where: {
          _status: {
            equals: 'published',
          },
        },
      }),
    ])

    const sitemap: MetadataRoute.Sitemap = []

    // Add homepage entry
    sitemap.push({
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    })

    // Add other pages (excluding home to avoid duplicate)
    for (const page of pagesResult.docs) {
      if (page.slug === 'home') {
        // Skip homepage as we already added it
        continue
      }
      sitemap.push({
        url: `${baseUrl}/${page.slug}`,
        lastModified: new Date(page.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    // Add artist pages
    for (const artist of artistsResult.docs) {
      sitemap.push({
        url: `${baseUrl}/portfolio/${artist.slug}`,
        lastModified: new Date(artist.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    return sitemap
  } catch (error) {
    // Fallback to static homepage sitemap if Payload query fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
    ]
  }
}
