import { Suspense } from 'react'

import NavBar from '../../components/NavBar'
import Hero from '../../components/Hero'
import BlockRenderer from '../../components/BlockRenderer'
import Footer from '../../components/Footer'
import ScrollSpy from '../../components/ScrollSpy'
import LocationSection from '../../components/LocationSection'
import type { PageBlock } from '../../components/blocks/types'
import { getPayload } from '../../lib/payload'

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

  return (
    <>
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
