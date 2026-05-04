import { getPayload, DEFAULT_LOCALE, type Locale } from '../lib/payload'

import TeamGrid, { type TeamMember } from './TeamGrid'

interface TeamProps {
  locale?: Locale
}

const FALLBACK: TeamMember[] = [
  { id: 1, name: 'Alex White North', slug: 'alex', role: 'Lead Artist / Blackwork', portrait: { url: '/portfolio/alex.png', alt: 'Alex' } },
  { id: 2, name: 'Aurora', slug: 'aurora', role: 'Fine Line / Ornamental', portrait: { url: '/portfolio/aurora.png', alt: 'Aurora' } },
  { id: 3, name: 'Julian', slug: 'julian', role: 'Minimalism / Dark Art', portrait: { url: '/portfolio/julian.png', alt: 'Julian' } },
]

const COPY = {
  en: {
    eyebrow: 'The collective',
    heading: 'Artists',
  },
  ru: {
    eyebrow: 'Коллектив',
    heading: 'Артисты',
  },
}

export default async function Team({ locale = DEFAULT_LOCALE }: TeamProps = {}) {
  const safeLocale: 'en' | 'ru' = locale === 'ru' ? 'ru' : 'en'
  const t = COPY[safeLocale]

  let members: TeamMember[] = FALLBACK

  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'artists',
      where: { featured: { equals: true } },
      sort: 'order',
      locale: safeLocale,
      depth: 1,
      limit: 12,
    })

    if (res.docs.length > 0) {
      members = res.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
        role: doc.role,
        portrait: typeof doc.portrait === 'object' ? doc.portrait : null,
      }))
    }
  } catch (err) {
    console.error('[Team] failed to load artists from Payload, using fallback', err)
  }

  return (
    <section
      id="team"
      className="py-24 md:py-32 bg-[#121212] text-[#D4AF37] border-t border-[#D4AF37]/10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16 md:mb-20">
          <p className="label-line text-[#D4AF37]/55 mb-4">{t.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight">
            {t.heading}
          </h2>
        </div>
        <TeamGrid members={members} locale={safeLocale} />
      </div>
    </section>
  )
}
