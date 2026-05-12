import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'

import NavBar from '../../../components/NavBar'
import Footer from '../../../components/Footer'
import BlockRenderer from '../../../components/BlockRenderer'
import ScrollTopButton from '../../../components/ScrollTopButton'
import type { PageBlock } from '../../../components/blocks/types'
import { getPayload } from '../../../lib/payload'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

// Slugs reserved for hand-built routes; never let the [slug] route catch them.
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'portfolio',
  'inquiry',
  'media',
  '_next',
  'favicon.ico',
])

// Slugs whose content was merged into the homepage one-page scroll.
// Visits to /about, /aftercare, /faq, /contact are permanently redirected
// to the matching anchor on /. Old links keep working; SEO collapses to
// the homepage as the canonical address.
const MERGED_INTO_HOME = new Set(['about', 'studio', 'aftercare', 'faq', 'contact', 'location', 'artists'])

async function findPage(slug: string, draft: boolean) {
  const payload = await getPayload()
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    depth: 2, // need depth=2 so block.backgroundImage / image populates
    limit: 1,
    draft,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) return {}
  if (MERGED_INTO_HOME.has(slug)) return { robots: { index: false, follow: true } }
  try {
    const doc: any = await findPage(slug, false)
    if (!doc) return { title: 'Page not found' }
    return {
      title: doc.seo?.title ?? `${doc.title} - Aurora & Ash`,
      description: doc.seo?.description ?? undefined,
    }
  } catch {
    return { title: slug }
  }
}

export default async function StaticPage({ params, searchParams }: Props) {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) notFound()
  if (MERGED_INTO_HOME.has(slug)) permanentRedirect(`/#${slug}`)

  const sp = await searchParams
  const draft = sp.preview === '1'

  let doc: any = null
  try {
    doc = await findPage(slug, draft)
  } catch (err) {
    console.error('[StaticPage] failed to load page', err)
  }

  if (!doc) notFound()

  const blocks = (doc.blocks as PageBlock[] | undefined) ?? []
  const hasBlocks = blocks.length > 0
  const showScrollTop = blocks.length >= 3

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      <main id="main" className="min-h-screen bg-[#121212] text-[#D4AF37]">
        {hasBlocks ? (
          <BlockRenderer blocks={blocks} />
        ) : (
          // Fallback for pages with no blocks yet.
          <section className="px-6 md:px-10 pt-32 pb-24">
            <div className="max-w-3xl mx-auto">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-6">
                {doc.title}
              </h1>
              <p className="text-[#D4AF37]/60 italic">
                This page has no blocks yet. Add blocks in the admin panel.
              </p>
            </div>
          </section>
        )}
      </main>

      {showScrollTop ? <ScrollTopButton /> : null}
      <Footer />
    </>
  )
}
