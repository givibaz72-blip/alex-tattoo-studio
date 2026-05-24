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
      style: Array.isArray(doc.styles) && doc.styles.length
        ? doc.styles.map((s: any) => (typeof s === 'object' ? s.name : s)).join(' · ')
        : null,
      portrait: typeof doc.portrait === 'object' ? doc.portrait : null,
    }))
  } catch (err) {
    console.error('[Inquiry] failed to load artists, fallback used', err)
    return FALLBACK
  }
}

async function loadStudio(): Promise<{ email?: string }> {
  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as any
    return {
      email: settings?.email ?? undefined,
    }
  } catch {
    return {}
  }
}

async function loadInquiryPage(): Promise<{ title: string; subtitle: string }> {
  try {
    const payload = await getPayload()
    const data = (await payload.findGlobal({ slug: 'inquiryPage' })) as any
    return {
      title: data?.title || 'Make an appointment',
      subtitle: data?.subtitle || 'Please complete the form below',
    }
  } catch (err) {
    console.error('[Inquiry] failed to load inquiryPage, defaults used', err)
    return { title: 'Make an appointment', subtitle: 'Please complete the form below' }
  }
}

export const metadata = {
  title: 'Make an appointment — Aurora & Ash',
  description: 'Submit your tattoo inquiry. We answer within 48 hours on weekdays.',
}

export default async function InquiryPage(props: Props) {
  // Next.js 15+: searchParams is a Promise.
  await props.searchParams
  const [artists, studio, inquiryPage] = await Promise.all([loadArtists(), loadStudio(), loadInquiryPage()])

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      {/* Compact page header — no hero image, just typography. */}
      <section
        aria-label="Make an appointment"
        className="w-full bg-[#0a0a0a] pt-24 pb-12 md:pt-32 md:pb-16 px-6 text-center"
      >
        <h1 className="font-serif text-3xl md:text-5xl tracking-wider text-[#D4AF37] uppercase">
          {inquiryPage.title}
        </h1>
        <p className="text-zinc-400 font-light mt-4 text-sm md:text-base">
          {inquiryPage.subtitle}
        </p>
      </section>

      <Suspense fallback={null}>
        <InquiryForm artists={artists} studioEmail={studio.email} />
      </Suspense>

      <Footer />
    </>
  )
}
