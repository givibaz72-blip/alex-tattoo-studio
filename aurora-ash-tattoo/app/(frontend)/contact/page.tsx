import { Suspense } from 'react'

import NavBar from '../../../components/NavBar'
import Footer from '../../../components/Footer'
import InquiryForm, { type ArtistOption } from '../../../components/InquiryForm'
import { getPayload } from '../../../lib/payload'

// ── Fallback artist list ───────────────────────────────────────────────
// Used when Payload is unavailable (e.g. first deploy before seeding).
// Mirrors the real CMS data so the select dropdown is never empty.

const FALLBACK: ArtistOption[] = [
  {
    id: 'marcus-reyes',
    slug: 'marcus-reyes',
    name: 'Marcus Reyes',
    style: 'Neo-Traditional · American Traditional',
    portrait: null,
  },
  {
    id: 'elena-voss',
    slug: 'elena-voss',
    name: 'Elena Voss',
    style: 'Fine Line · Floral',
    portrait: null,
  },
  {
    id: 'kai-nakamura',
    slug: 'kai-nakamura',
    name: 'Kai Nakamura',
    style: 'Japanese · Irezumi',
    portrait: null,
  },
  {
    id: 'riley-obrien',
    slug: 'riley-obrien',
    name: "Riley O'Brien",
    style: 'Blackwork · Geometric · Dotwork',
    portrait: null,
  },
  {
    id: 'sofia-mendez',
    slug: 'sofia-mendez',
    name: 'Sofia Mendez',
    style: 'Lettering · Script · Calligraphy',
    portrait: null,
  },
]

// ── Data loaders ───────────────────────────────────────────────────────

async function loadArtists(): Promise<ArtistOption[]> {
  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'artists',
      where: { availability: { not_equals: 'closed' } },
      sort: 'order',
      depth: 1,
      limit: 50,
    })

    if (!res.docs.length) return FALLBACK

    return res.docs.map((doc: any) => ({
      id: doc.id,
      slug: doc.slug,
      name: doc.name,
      style: Array.isArray(doc.styles) && doc.styles.length
        ? doc.styles.map((s: any) => (typeof s === 'object' ? s.name : s)).join(' · ')
        : null,
      portrait: typeof doc.portrait === 'object' ? doc.portrait : null,
    }))
  } catch (err) {
    console.error('[Contact] failed to load artists, fallback used', err)
    return FALLBACK
  }
}

async function loadStudio(): Promise<{ email?: string }> {
  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })) as any
    return { email: settings?.email ?? undefined }
  } catch {
    return {}
  }
}

// ── Metadata ───────────────────────────────────────────────────────────

export const metadata = {
  title: 'Make an appointment — Aurora & Ash',
  description:
    'Submit your tattoo inquiry. We answer within 48 hours on weekdays.',
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function ContactPage() {
  const [artists, studio] = await Promise.all([loadArtists(), loadStudio()])

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      {/* ─── Editorial header strip ────────────────────────────────────
          Dark charcoal section with gold serif heading — premium,
          minimal, focused entirely on the call to action.            */}
      <section className="bg-[var(--color-charcoal)] pt-36 pb-16 md:pt-44 md:pb-20 text-center px-6 border-b border-[var(--border-subtle)]">
        <p className="eyebrow text-[var(--color-gold)]/65 mb-5 tracking-[0.22em]">
          Aurora & Ash
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[0.04em] uppercase text-[var(--color-gold)] leading-[1.05]">
          Make an appointment
        </h1>
        <p className="mt-8 label-line text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          Tell us your idea — we&rsquo;ll match you with the artist whose vision
          aligns with yours.
        </p>
      </section>

      {/* ─── Form section ───────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <InquiryForm artists={artists} studioEmail={studio.email} />
      </Suspense>

      <Footer />
    </>
  )
}
