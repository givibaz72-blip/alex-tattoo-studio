import { Suspense } from 'react'

import NavBar from '../../components/NavBar'
import Hero from '../../components/Hero'
import About from '../../components/About'
import FeaturedWorks from '../../components/FeaturedWorks'
import Team from '../../components/Team'
import Footer from '../../components/Footer'
import { getPayload, isLocale, DEFAULT_LOCALE } from '../../lib/payload'

interface Props {
  searchParams: Promise<{ locale?: string }>
}

export default async function Home({ searchParams }: Props) {
  const sp = await searchParams
  const locale = isLocale(sp.locale) ? sp.locale : DEFAULT_LOCALE
  const resolvedLocale = locale || 'en'

  let heroImage: any = null
  try {
    const payload = await getPayload()
    const studio = (await payload.findGlobal({ slug: 'studio', locale: resolvedLocale, depth: 1 })) as any
    heroImage = studio?.heroImage ?? null
  } catch {
    // ignore - Hero falls back to plain dark background
  }

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>
      <main id="main">
        <Hero heroImage={heroImage} locale={resolvedLocale} />
        <About locale={resolvedLocale} />
        <FeaturedWorks locale={resolvedLocale} />
        <Team locale={resolvedLocale} />
      </main>
      <Footer locale={resolvedLocale} />
    </>
  )
}
