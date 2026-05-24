import Link from 'next/link'
import { getPayload } from '../lib/payload'
import SocialLinks from './SocialLinks'
import ScrollTopButton from './ScrollTopButton'

const FALLBACK = {
  name: 'Aurora & Ash',
  address: '8282 Santa Monica Blvd\nWest Hollywood, CA 90046',
  phone: '+1 (323) 555-0190',
  email: 'hello@auroraash.com',
  hours: 'Mon — Sun: 12 PM — 8 PM (By Appointment Only)',
}

const COPY = {
  location: 'LOCATION',
  legal: 'LEGAL',
  contact: 'CONTACT',
  follow: 'FOLLOW',
  hours: 'HOURS',
  accessibility: 'ACCESSIBILITY',
  privacy: 'PRIVACY POLICY',
  terms: 'TERMS OF SERVICE',
  faq: 'FAQ & STUDIO RULES',
  aftercare: 'AFTERCARE',
  about: 'ABOUT THE STUDIO',
  makeAppointment: 'MAKE AN APPOINTMENT',
} as const

export default async function Footer() {
  const t = COPY

  let info = FALLBACK
  let social: Record<string, unknown> = {}

  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 1,
    })) as Record<string, unknown> & {
      phone?: string | null
      email?: string | null
      address?: string | null
      hours?: string | null
      social?: Record<string, unknown> | null
    }
    info = {
      name: FALLBACK.name,
      address: settings?.address ?? FALLBACK.address,
      phone: settings?.phone ?? FALLBACK.phone,
      email: settings?.email ?? FALLBACK.email,
      hours: settings?.hours ?? FALLBACK.hours,
    }
    social = (settings?.social ?? {}) as Record<string, unknown>
  } catch {
    // fall through to fallback
  }

  const telHref = `tel:${(info.phone ?? '').replace(/[^+\d]/g, '')}`
  const mailHref = `mailto:${info.email ?? ''}`

  return (
    <footer id="contact" className="bg-[#0a0a0a] text-[#D4AF37] relative border-t border-[#D4AF37]/15">
      {/* ScrollTopButton is now fixed in the viewport bottom-right; rendered
          here so it shares the footer subtree but its position is independent. */}
      <ScrollTopButton />

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <Link
          href="/"
          aria-label="Aurora & Ash — home"
          className="inline-flex items-center min-h-11"
        >
          <span className="font-serif text-2xl md:text-3xl tracking-[0.12em] text-[#D4AF37] uppercase select-none">
            Aurora <span className="font-serif italic text-xl md:text-2xl">&amp;</span> Ash
          </span>
        </Link>
        <p className="font-serif italic text-[#D4AF37]/65 text-sm md:text-base max-w-md md:text-right leading-relaxed">
          A private studio for permanent art — by appointment, in West Hollywood.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-12 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 border-t border-[#D4AF37]/10">
        <div className="footer__column">
          <h3 className="footer__heading">{t.location}</h3>
          <p className="footer__text whitespace-pre-line">{info.address}</p>
          <p className="footer__subheading">{t.hours}</p>
          <p className="footer__text">{info.hours}</p>
        </div>

        <div className="footer__column">
          <h3 className="footer__heading">SITE</h3>
          <ul className="footer__list">
            <li><Link href="/about" className="footer__link">{t.about}</Link></li>
            <li><Link href="/aftercare" className="footer__link">{t.aftercare}</Link></li>
            <li><Link href="/faq" className="footer__link">{t.faq}</Link></li>
            <li><Link href="/#location" className="footer__link">VISIT &amp; LOCATION</Link></li>
          </ul>

          <h3 className="footer__subheading mt-8">{t.legal}</h3>
          <ul className="footer__list">
            <li><Link href="/accessibility" className="footer__link">{t.accessibility}</Link></li>
            <li><Link href="/privacy" className="footer__link">{t.privacy}</Link></li>
            <li><Link href="/terms" className="footer__link">{t.terms}</Link></li>
          </ul>
        </div>

        <div className="footer__column">
          <h3 className="footer__heading">{t.contact}</h3>
          <a href={telHref} className="footer__link block">{info.phone}</a>
          <a href={mailHref} className="footer__link block mt-2">{info.email}</a>
          <Link
            href="/inquiry"
            className="mt-6 inline-flex items-center min-h-11 px-5 py-3 border border-[#D4AF37] text-[#D4AF37] text-[12px] tracking-[0.28em] uppercase hover:bg-[#D4AF37] hover:text-black transition-colors"
          >
            {t.makeAppointment}
          </Link>
        </div>

        <div className="footer__column">
          <h3 className="footer__heading">{t.follow}</h3>
          <SocialLinks social={social as any} variant="footer" />
        </div>
      </div>

      <div className="border-t border-[#D4AF37]/10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row justify-between gap-2 text-[11px] tracking-[0.22em] uppercase text-[#D4AF37]/55">
          <p>© {new Date().getFullYear()} {info.name} Tattoo Studio LLC. All rights reserved.</p>
          <p>By appointment only · West Hollywood, California</p>
        </div>
      </div>
    </footer>
  )
}