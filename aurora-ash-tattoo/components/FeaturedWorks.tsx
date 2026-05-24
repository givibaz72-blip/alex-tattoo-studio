import Link from 'next/link'

import { getPayload } from '../lib/payload'
import WorksGallery from './WorksGallery'

const COPY = {
  eyebrow: 'Selected works',
  heading: 'Permanent stories',
  subline: 'A small selection from the studio archive — click any image for the full piece.',
  viewAll: 'View artists & full portfolio',
}

export default async function FeaturedWorks() {
  let works: any[] = []
  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'works',
      sort: '-createdAt',
      depth: 2,
      limit: 9,
    })
    works = res.docs as any[]
  } catch (err) {
    console.error('[FeaturedWorks] failed to load works from Payload', err)
  }

  // Do not render the section if no featured work has a real image
  const hasImages = works.some(
    (w: any) =>
      Array.isArray(w.images) &&
      w.images.some((it: any) => it && it.image && typeof it.image === 'object'),
  )
  if (!hasImages) return null

  return (
    <section
      id="works"
      className="bg-[#121212] text-[#D4AF37] py-24 md:py-32 border-t border-[#D4AF37]/10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16 md:mb-20 max-w-2xl mx-auto">
          <p className="label-line text-[#D4AF37]/55 mb-4">{COPY.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight mb-6">
            {COPY.heading}
          </h2>
          <p className="text-[#D4AF37]/70 text-base md:text-lg leading-relaxed">
            {COPY.subline}
          </p>
        </div>

        <WorksGallery works={works} />

        <div className="mt-20 text-center">
          <Link
            href="/#team"
            className="inline-block label-line text-[#D4AF37] border border-[#D4AF37]/40 px-8 py-4 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
          >
            {COPY.viewAll} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
