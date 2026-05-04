import Link from 'next/link'

import { getPayload, DEFAULT_LOCALE, type Locale } from '../lib/payload'
import WorksGallery from './WorksGallery'

interface FeaturedWorksProps {
  locale?: Locale
}

const COPY = {
  en: {
    eyebrow: 'Selected works',
    heading: 'Permanent stories',
    subline: 'A small selection from the studio archive — click any image for the full piece.',
    viewAll: 'View artists & full portfolio',
  },
  ru: {
    eyebrow: 'Избранные работы',
    heading: 'Постоянные истории',
    subline: 'Небольшая выборка из архива студии — нажмите на изображение, чтобы открыть его полностью.',
    viewAll: 'Посмотреть артистов и полное портфолио',
  },
}

export default async function FeaturedWorks({ locale = DEFAULT_LOCALE }: FeaturedWorksProps = {}) {
  const safeLocale: 'en' | 'ru' = locale === 'ru' ? 'ru' : 'en'
  const t = COPY[safeLocale]

  let works: any[] = []
  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'works',
      sort: '-createdAt',
      locale: safeLocale,
      depth: 2,
      limit: 9,
    })
    works = res.docs as any[]
  } catch (err) {
    console.error('[FeaturedWorks] failed to load works from Payload', err)
  }

  // Не рендерим секцию, если нет ни одной работы с реальной картинкой
  const hasImages = works.some(
    (w: any) =>
      Array.isArray(w.images) &&
      w.images.some((it: any) => it && it.image && typeof it.image === 'object'),
  )
  if (!hasImages) return null

  const teamHref = safeLocale === 'en' ? '/#team' : '/?locale=ru#team'

  return (
    <section
      id="works"
      className="bg-[#121212] text-[#D4AF37] py-24 md:py-32 border-t border-[#D4AF37]/10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16 md:mb-20 max-w-2xl mx-auto">
          <p className="label-line text-[#D4AF37]/55 mb-4">{t.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight mb-6">
            {t.heading}
          </h2>
          <p className="text-[#D4AF37]/70 text-base md:text-lg leading-relaxed">
            {t.subline}
          </p>
        </div>

        <WorksGallery works={works} />

        <div className="mt-20 text-center">
          <Link
            href={teamHref}
            className="inline-block label-line text-[#D4AF37] border border-[#D4AF37]/40 px-8 py-4 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
          >
            {t.viewAll} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
