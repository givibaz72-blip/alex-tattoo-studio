import React from 'react'
import { getPayload } from '../lib/payload'
import MediaImage, { type MediaDoc } from './MediaImage'

const FALLBACK = {
  eyebrow: 'The philosophy',
  heading: 'A curated space for permanent art',
  body:
    'We accept limited bookings per month to ensure every piece receives absolute focus. Our studio operates as a private gallery where skin meets curated vision.',
  placeholder: 'Studio visual // 01',
}

const About = async () => {
  let eyebrow: string = FALLBACK.eyebrow
  let heading: string = FALLBACK.heading
  let body: string = FALLBACK.body
  let image: MediaDoc | null = null

  try {
    const payload = await getPayload()
    const studio = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 1,
    })) as Record<string, unknown> & {
      about?: {
        eyebrow?: string | null
        heading?: string | null
        body?: string | null
        image?: MediaDoc | string | number | null
      } | null
    }

    const about = studio?.about ?? null
    if (about?.eyebrow) eyebrow = about.eyebrow
    if (about?.heading) heading = about.heading
    if (about?.body) body = about.body
    if (about?.image && typeof about.image === 'object') image = about.image as MediaDoc
  } catch {
    // fall through to defaults
  }

  return (
    <section
      id="about"
      className="bg-[#121212] text-[#D4AF37] py-24 md:py-32 px-6 md:px-8 border-t border-[#D4AF37]/10"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <p className="label-line text-[#D4AF37]/60 mb-5">{eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15] mb-8">
            {heading}
          </h2>
          <p className="text-base md:text-lg text-[#D4AF37]/80 leading-relaxed whitespace-pre-line">
            {body}
          </p>
        </div>
        <div className="border border-[#D4AF37]/20 aspect-[4/5] flex items-center justify-center bg-white/5 relative overflow-hidden">
          {image ? (
            <MediaImage
              media={image}
              size="feature"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <span className="label-line text-[#D4AF37]/30">{FALLBACK.placeholder}</span>
          )}
        </div>
      </div>
    </section>
  )
}

export default About
