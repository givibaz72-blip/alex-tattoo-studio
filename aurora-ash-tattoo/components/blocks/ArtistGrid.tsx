import Link from 'next/link'

import MediaImage, { type MediaDoc } from '../MediaImage'
import { getPayload } from '../../lib/payload'
import type { ArtistGridBlockData } from './types'

interface Props {
  block: ArtistGridBlockData
}

type ArtistCard = {
  id: string | number
  name: string
  slug: string
  role?: string | null
  portrait?: MediaDoc | null
}

export default async function ArtistGrid({ block }: Props) {
  let artists: ArtistCard[] = []

  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'artists',
      where: block.featuredOnly ? { featured: { equals: true } } : undefined,
      sort: 'order',
      depth: 1,
      limit: 24,
    })
    artists = (res.docs as any[]).map((doc) => ({
      id: doc.id,
      name: doc.name,
      slug: doc.slug,
      role: doc.role,
      portrait: typeof doc.portrait === 'object' ? doc.portrait : null,
    }))
  } catch {
    // empty grid on error
  }

  if (artists.length === 0) return null

  return (
    <section className="bg-[#0a0a0a] text-[#D4AF37] py-20 md:py-28 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        {block.heading ? (
          <h2 className="font-serif text-3xl md:text-5xl text-center tracking-tight mb-16">
            {block.heading}
          </h2>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {artists.map((a) => (
            <Link
              key={a.id}
              href={`/portfolio/${a.slug}`}
              className="group block bg-[#121212] border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-colors"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {a.portrait ? (
                  <MediaImage
                    media={a.portrait}
                    size="card"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.4em] text-[#D4AF37]/30">
                    No portrait
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-[#D4AF37]/10">
                <p className="font-serif text-xl text-[#D4AF37] group-hover:text-white transition-colors">
                  {a.name}
                </p>
                {a.role ? (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/55 mt-2">
                    {a.role}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
