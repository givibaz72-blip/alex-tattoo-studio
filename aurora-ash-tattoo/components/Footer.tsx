import Link from 'next/link'
import { getPayload, type Locale, DEFAULT_LOCALE } from '../lib/payload'
import SocialLinks from './SocialLinks'

interface FooterProps {
  locale?: Locale
}

const FALLBACK = {
  name: 'Aurora & Ash',
  address: 'West Hollywood, CA',
  phone: '+1 (323) 555-0142',
  email: 'studio@aurora-ash.com',
  hours: 'By appointment',
}

const COPY = {
  en: {
    hours: 'Hours',
    contact: 'Contact',
    more: 'More',
    about: 'About the studio',
    aftercare: 'Aftercare',
    faq: 'FAQ & studio rules',
    privacy: 'Privacy policy',
    inquiry: 'Submit an inquiry',
    rights: 'All rights reserved.',
    note: 'By appointment only / 18+',
  },
  ru: {
    hours: 'Часы работы',
    contact: 'Контакты',
    more: 'Ещё',
    about: 'О студии',
    aftercare: 'Уход',
    faq: 'FAQ и правила студии',
    privacy: 'Политика конфиденциальности',
    inquiry: 'Отправить заявку',
    rights: 'Все права защищены.',
    note: 'Только по записи / 18+',
  },
} as const

export default async function Footer({ locale = DEFAULT_LOCALE }: FooterProps = {}) {
  const safeLocale: 'en' | 'ru' = locale === 'ru' ? 'ru' : 'en'
  const t = COPY[safeLocale]

  let info = FALLBACK as typeof FALLBACK
  let social: Record<string, unknown> = {}

  try {
    const payload = await getPayload()
    const studio = (await payload.findGlobal({
      slug: 'studio',
      locale: safeLocale,
      depth: 1,
    })) as Record<string, unknown> & {
      name?: string | null
      address?: string | null
      phone?: string | null
      email?: string | null
      hours?: string | null
      social?: Record<string, unknown> | null
    }
    info = {
      name: studio?.name ?? FALLBACK.name,
      address: studio?.address ?? FALLBACK.address,
      phone: studio?.phone ?? FALLBACK.phone,
      email: studio?.email ?? FALLBACK.email,
      hours: studio?.hours ?? FALLBACK.hours,
    }
    social = (studio?.social ?? {}) as Record<string, unknown>
  } catch {
    // fall through
  }

  const linkHref = (path: string) =>
    safeLocale === 'en' ? path : `${path}${path.includes('?') ? '&' : '?'}locale=ru`

  return (
    <footer className="bg-[#0a0a0a] text-[#D4AF37] border-t border-[#D4AF37]/15 mt-12">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
        <div>
          <p className="font-serif text-xl tracking-[0.18em] uppercase mb-4">{info.name}</p>
          <p className="text-sm text-[#D4AF37]/60 leading-relaxed whitespace-pre-line">
            {info.address}
          </p>
        </div>

        <div>
          <p className="label-line text-[#D4AF37]/55 mb-3">{t.hours}</p>
          <p className="text-sm text-[#D4AF37]/80 leading-relaxed whitespace-pre-line">
            {info.hours}
          </p>
        </div>

        <div>
          <p className="label-line text-[#D4AF37]/55 mb-3">{t.contact}</p>
          <ul className="text-sm text-[#D4AF37]/80 space-y-1.5">
            <li>
              <a
                href={`tel:${info.phone.replace(/[^+\d]/g, '')}`}
                className="hover:text-white transition-colors"
              >
                {info.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${info.email}`}
                className="hover:text-white transition-colors break-all"
              >
                {info.email}
              </a>
            </li>
          </ul>
          <div className="mt-4">
            <SocialLinks social={social as any} />
          </div>
        </div>

        <div>
          <p className="label-line text-[#D4AF37]/55 mb-3">{t.more}</p>
          <ul className="text-sm text-[#D4AF37]/80 space-y-2">
            <li>
              <Link href={linkHref('/about')} className="hover:text-white transition-colors">
                {t.about}
              </Link>
            </li>
            <li>
              <Link href={linkHref('/aftercare')} className="hover:text-white transition-colors">
                {t.aftercare}
              </Link>
            </li>
            <li>
              <Link href={linkHref('/faq')} className="hover:text-white transition-colors">
                {t.faq}
              </Link>
            </li>
            <li>
              <Link href={linkHref('/privacy')} className="hover:text-white transition-colors">
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link href={linkHref('/inquiry')} className="hover:text-white transition-colors">
                {t.inquiry}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#D4AF37]/10 px-6 md:px-8 py-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-2 label-line text-[#D4AF37]/45">
        <span>
          (c) {new Date().getFullYear()} {info.name}. {t.rights}
        </span>
        <span>{t.note}</span>
      </div>
    </footer>
  )
}
