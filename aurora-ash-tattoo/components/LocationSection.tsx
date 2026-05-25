'use client'

import Link from 'next/link'
import { useState } from 'react'

/**
 * LocationSection — editorial map block, "Bang Bang Forever" silhouette
 * adapted to the Aurora & Ash gold-on-charcoal palette.
 *
 * Visual contract:
 *  - Deep black background without a decorative outer frame.
 *  - Large serif uppercase "LOCATION" heading with wide tracking.
 *  - Centered Google Maps iframe inside max-w-4xl figure with a CSS filter
 *    pipeline that turns the default tiles into a near-black plate: grayscale
 *    + invert + contrast + brightness. On hover the grayscale eases off so
 *    the map looks subtly "warm". A single gold marker pulses in the centre.
 *  - Address line beneath the map in tight tracked uppercase.
 *
 * Self-contained: no CMS dependency. Pass `address`, `mapEmbedUrl`,
 * `hours`, `phone` to override.
 */

interface LocationSectionProps {
  /** Address rendered under the map in tracked uppercase. */
  address?: string
  /** Google Maps `?output=embed` URL. Defaults to the studio location. */
  mapEmbedUrl?: string
  /** Visible hours line beneath the address. */
  hours?: string
  /** Phone number rendered below hours; also wired into `tel:`. */
  phone?: string
}

const DEFAULT_ADDRESS = '8282 Santa Monica Blvd · West Hollywood, CA 90046'
const DEFAULT_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4065.69233176963!2d-118.37259442370754!3d34.090485315709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2beb884d7a495%3A0x4abda10eb14fc5f6!2s8282%20Santa%20Monica%20Blvd%2C%20West%20Hollywood%2C%20CA%2090046%2C%20%D0%A1%D0%A8%D0%90!5e1!3m2!1sru!2sru!4v1779624430736!5m2!1sru!2sru'
const DEFAULT_HOURS = 'Mon — Sun · 12 PM — 8 PM · By appointment'
const DEFAULT_PHONE = '+1 (323) 555-0190'

// Two CSS filter strings — idle and hover. The hover state eases the
// grayscale so the warm gold marker doesn't sit on a pure-grey field.
const FILTER_IDLE = 'grayscale(1) invert(0.92) contrast(0.9) brightness(0.8)'
const FILTER_HOVER = 'grayscale(0.7) invert(0.92) contrast(0.85) brightness(0.88)'

function toGoogleEmbedUrl(url: URL) {
  const directQuery = url.searchParams.get('q')
  if (directQuery) {
    return `https://www.google.com/maps?q=${encodeURIComponent(directQuery)}&output=embed`
  }

  const pathPlaceOrSearch = url.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/i)?.[1]
  if (pathPlaceOrSearch) {
    const query = decodeURIComponent(pathPlaceOrSearch).replace(/\+/g, ' ')
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
  }

  const coordinates = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (coordinates) {
    return `https://www.google.com/maps?q=${coordinates[1]},${coordinates[2]}&output=embed`
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(url.toString())}&output=embed`
}

function resolveMapEmbedUrl(rawUrl?: string) {
  const value = rawUrl?.trim()
  if (!value) return DEFAULT_EMBED_URL

  // Admins often paste the full Google/Yandex iframe snippet instead of only
  // the src URL. Extract the src so we never put raw HTML into iframe.src.
  const iframeSrc = value.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1]
  const candidate = (iframeSrc || value)
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .trim()

  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol)) return DEFAULT_EMBED_URL

    const host = url.hostname.toLowerCase()
    const isGoogleMaps =
      host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      (host.includes('google.') && url.pathname.includes('/maps'))

    // Regular Google Maps share/place/search links are valid URLs, but they are
    // not always embeddable as iframe.src. Convert them to a stable embed URL.
    if (isGoogleMaps && !url.pathname.includes('/maps/embed') && url.searchParams.get('output') !== 'embed') {
      return toGoogleEmbedUrl(url)
    }

    return url.toString()
  } catch {
    return DEFAULT_EMBED_URL
  }
}

export default function LocationSection({
  address = DEFAULT_ADDRESS,
  mapEmbedUrl,
  hours = DEFAULT_HOURS,
  phone = DEFAULT_PHONE,
}: LocationSectionProps) {
  const [hover, setHover] = useState(false)
  const safeMapEmbedUrl = resolveMapEmbedUrl(mapEmbedUrl)
  const telHref = `tel:${phone.replace(/[^+\d]/g, '')}`

  return (
    <section
      id="location"
      data-scroll-section
      aria-labelledby="location-heading"
      className="relative bg-[#0a0a0a] text-[#D4AF37] min-h-[calc(100vh-5rem)] flex flex-col justify-center py-10 md:py-12 px-6 md:px-10 scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <p className="label-line text-[#D4AF37]/55 mb-6">Visit the studio</p>

        <h2
          id="location-heading"
          className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-[0.06em] uppercase mb-6 md:mb-8 leading-none"
        >
          Location
        </h2>

        {/* Map figure — max-h caps height on tall screens so the map fits
            in one viewport together with the heading above it.
            aspect-[16/7] gives a cinematic panoramic crop that still reads
            well as a map without dominating the page. */}
        <figure
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="relative w-full h-[220px] md:h-[260px] overflow-hidden border border-[#D4AF37]/25 bg-black mb-6 transition-shadow duration-500 hover:shadow-[0_0_60px_rgba(212,175,55,0.18)]"
        >
          <iframe
            src={safeMapEmbedUrl}
            title="Aurora & Ash studio location — Google Maps"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            aria-label={`Map of ${address}`}
            className="w-full h-full"
            style={{
              border: 0,
              filter: hover ? FILTER_HOVER : FILTER_IDLE,
              transition: 'filter 0.7s ease',
            }}
          />

          {/* Gold marker overlay — sits exactly in the middle. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="absolute block w-12 h-12 rounded-full border border-[#D4AF37]/45 animate-ping [animation-duration:2.6s]" />
            <span className="block w-3.5 h-3.5 rounded-full bg-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.65)] ring-2 ring-[#0a0a0a]" />
          </div>
        </figure>

        {/* Address line — fluid size + tighter mobile tracking so
            "Santa Monica" never orphans. On md+ lock to one line. */}
        <p className="font-serif text-[clamp(0.65rem,2.2vw,1rem)] tracking-[0.1em] md:tracking-[0.28em] uppercase text-[#D4AF37] mb-4 md:whitespace-nowrap">
          {address}
        </p>
        <p className="label-line text-[#D4AF37]/60 mb-2">{hours}</p>
        <a
          href={telHref}
          className="label-line text-[#D4AF37]/75 hover:text-[#D4AF37] transition-colors"
        >
          {phone}
        </a>

        {/* Hairline separator + small CTA back to inquiry */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <span aria-hidden="true" className="block w-12 h-px bg-[#D4AF37]/30" />
          <Link
            href="/inquiry"
            className="inline-flex items-center min-h-11 px-6 py-3 border border-[#D4AF37]/55 text-[11px] tracking-[0.28em] uppercase text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
          >
            Make an appointment
          </Link>
        </div>
      </div>
    </section>
  )
}
