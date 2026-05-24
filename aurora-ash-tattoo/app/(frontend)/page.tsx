import { Suspense } from 'react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

import NavBar from '../../components/NavBar'
import Hero from '../../components/Hero'
import BlockRenderer from '../../components/BlockRenderer'
import Footer from '../../components/Footer'
import ScrollSpy from '../../components/ScrollSpy'
import LocationSection from '../../components/LocationSection'
import type { PageBlock } from '../../components/blocks/types'
import { getPayload } from '../../lib/payload'

// ---------------------------------------------------------------------------
// Dynamic metadata (Title, Description, Open Graph) — Next.js Metadata API
// ---------------------------------------------------------------------------
export async function generateMetadata(): Promise<Metadata> {
  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({ slug: 'siteSettings', depth: 1 })) as any

    return {
      title: settings?.metaTitle || 'Aurora & Ash Tattoo | Эксклюзивная тату-студия',
      description:
        settings?.metaDescription ||
        'Профессиональная тату-студия Aurora & Ash. Индивидуальные эскизы, опытные мастера, премиальное качество и полная безопасность.',
      openGraph: {
        title: settings?.metaTitle || 'Aurora & Ash Tattoo',
        description: settings?.metaDescription,
        images: settings?.ogImage?.url ? [{ url: settings.ogImage.url }] : [],
        type: 'website',
      },
      alternates: {
        canonical: '/',
      },
    }
  } catch {
    return {
      title: 'Aurora & Ash Tattoo | Эксклюзивная тату-студия',
    }
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function Home() {
  let heroImage: any = null
  let homeBlocks: PageBlock[] | null = null
  let studio: {
    address?: string | null
    hours?: string | null
    phone?: string | null
  } = {}

  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({ slug: 'siteSettings', depth: 1 })) as any
    heroImage = settings?.heroImage ?? null
    studio = {
      address: settings?.address ?? null,
      hours: settings?.hours ?? null,
      phone: settings?.phone ?? null,
    }

    const homePage = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      depth: 2,
    })

    if (homePage.docs.length > 0) {
      homeBlocks = ((homePage.docs[0] as any).blocks ?? null) as PageBlock[] | null
    }
  } catch {
    // fall back to defaults
  }

  const hasBlocks = Array.isArray(homeBlocks) && homeBlocks.length > 0

  // LocationSection is rendered as a hand-rolled component (live Google Maps
  // iframe + gold marker, "Bang Bang Forever"-style). To keep its position
  // between the Artists and Aftercare sections, we split the CMS block list
  // at the first block whose `sectionId === 'aftercare'` and inject the
  // component between the two halves.
  let blocksBefore: PageBlock[] = []
  let blocksAfter: PageBlock[] = []
  if (hasBlocks) {
    const list = homeBlocks as PageBlock[]
    const aftercareIdx = list.findIndex((b) => (b as any).sectionId === 'aftercare')
    if (aftercareIdx >= 0) {
      blocksBefore = list.slice(0, aftercareIdx)
      blocksAfter = list.slice(aftercareIdx)
    } else {
      blocksBefore = list
      blocksAfter = []
    }
  }

  const addressLine = studio.address
    ? studio.address.replace(/\n/g, ' · ')
    : '8282 Santa Monica Blvd · West Hollywood, CA 90046'

  // ---------------------------------------------------------------------------
  // Structured data — JSON-LD (TattooParlor) for local SEO
  // ---------------------------------------------------------------------------
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: 'Aurora & Ash Tattoo',
    description: 'Премиальная тату-студия с фокусом на индивидуальное искусство и безопасность.',
    url: 'https://aurora-ash.tattoo',
    logo: 'https://aurora-ash.tattoo/logo.png',
    address: {
      '@type': 'PostalAddress',
      streetAddress: studio.address ?? 'Улица и дом студии',
      addressLocality: 'Город',
      addressCountry: 'RU',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '12:00',
      closes: '21:00',
    },
    priceRange: '$$',
  }

  return (
    <>
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <NavBar />
      </Suspense>
      <main id="main">
        {hasBlocks ? (
          <>
            <BlockRenderer blocks={blocksBefore} />
            <LocationSection
              address={addressLine}
              hours={studio.hours ?? undefined}
              phone={studio.phone ?? undefined}
            />
            <BlockRenderer blocks={blocksAfter} />
          </>
        ) : (
          <>
            <Hero heroImage={heroImage} />
            <LocationSection />
          </>
        )}
      </main>
      {/* Scroll-spy: keeps the URL hash in sync with the visible section. */}
      <ScrollSpy />
      <Footer />
    </>
  )
}
