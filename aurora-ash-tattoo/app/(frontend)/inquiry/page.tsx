import Image from 'next/image'
import { Suspense } from 'react'

import NavBar from '../../../components/NavBar'
import Footer from '../../../components/Footer'
import InquiryForm, { type ArtistOption } from '../../../components/InquiryForm'
import { getPayload } from '../../../lib/payload'

interface Props {
  searchParams: Promise<{ artist?: string }>
}

const FALLBACK: ArtistOption[] = [
  { id: 'marcus-reyes', slug: 'marcus-reyes', name: 'Marcus Reyes',  style: 'Neo-Traditional · American Traditional', portrait: null },
  { id: 'elena-voss',   slug: 'elena-voss',   name: 'Elena Voss',    style: 'Fine Line · Floral',                  portrait: null },
  { id: 'kai-nakamura', slug: 'kai-nakamura', name: 'Kai Nakamura',  style: 'Japanese · Irezumi',                  portrait: null },
  { id: 'riley-obrien', slug: 'riley-obrien', name: "Riley O'Brien", style: 'Blackwork · Geometric · Dotwork',     portrait: null },
  { id: 'sofia-mendez', slug: 'sofia-mendez', name: 'Sofia Mendez',  style: 'Lettering · Script · Calligraphy',   portrait: null },
]

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
      style: doc.role,
      portrait: typeof doc.portrait === 'object' ? doc.portrait : null,
    }))
  } catch (err) {
    console.error('[Inquiry] failed to load artists, fallback used', err)
    return FALLBACK
  }
}

async function loadStudio(): Promise<{ email?: string; heroImageUrl?: string }> {
  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({ slug: 'siteSettings', depth: 1 })) as any
    const hero = settings?.heroImage
    const heroImageUrl =
      hero && typeof hero === 'object'
        ? (hero?.sizes?.hero?.url ?? hero?.url ?? undefined)
        : undefined
    return {
      email: settings?.email ?? undefined,
      heroImageUrl,
    }
  } catch {
    return {}
  }
}

export const metadata = {
  title: 'Make an appointment — Aurora & Ash',
  description: 'Submit your tattoo inquiry. We answer within 48 hours on weekdays.',
}

export default async function InquiryPage(props: Props) {
  // Next.js 15+: searchParams is a Promise.
  await props.searchParams
  const [artists, studio] = await Promise.all([loadArtists(), loadStudio()])

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      {/* ─── Editorial hero band ──────────────────────────────────────────
          Mirrors the Bang Bang "Make an Appointment" header strip:
          full-width city/atmosphere image, dark wash, big centred title. */}
      <section
        id="main"
        className="relative w-full h-[55vh] min-h-[420px] md:h-[60vh] md:min-h-[520px] overflow-hidden"
      >
        {studio.heroImageUrl ? (
          <Image
            src={studio.heroImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,#161616_0%,#1a1410_55%,#0a0a0a_100%)]"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/55 via-[#0a0a0a]/65 to-[#0a0a0a]" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.04em] uppercase text-[#D4AF37] leading-none">
            Make an appointment
          </h1>
          <p className="mt-8 label-line text-[#D4AF37]/65">
            Please complete the form below
          </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <InquiryForm artists={artists} studioEmail={studio.email} />
      </Suspense>

      <Footer />
    </>
  )
}
