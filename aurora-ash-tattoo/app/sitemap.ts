import type { MetadataRoute } from 'next'

const baseUrl = 'https://aurora-ash.tattoo' // замени на реальный домен перед деплоем

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // В будущем сюда можно добавить динамический фетч страниц мастеров из Payload CMS:
  //   const payload = await getPayload()
  //   const artists = await payload.find({ collection: 'artists', depth: 0 })
  //   const artistUrls = artists.docs.map((a) => ({
  //     url: `${baseUrl}/artists/${a.slug}`,
  //     lastModified: new Date(a.updatedAt),
  //     changeFrequency: 'monthly' as const,
  //     priority: 0.7,
  //   }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
