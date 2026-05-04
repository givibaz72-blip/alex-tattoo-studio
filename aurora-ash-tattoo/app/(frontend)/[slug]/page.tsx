import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import NavBar from '../../../components/NavBar'
import Footer from '../../../components/Footer'
import { getPayload, DEFAULT_LOCALE, isLocale } from '../../../lib/payload'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locale?: string; preview?: string }>
}

// Slugs reserved for hand-built routes; never let the [slug] route catch them.
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'portfolio',
  'inquiry',
  'privacy',
  'media',
  '_next',
  'favicon.ico',
])

async function findPage(slug: string, locale: 'en' | 'ru', draft: boolean) {
  const payload = await getPayload()
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale,
    depth: 1,
    limit: 1,
    draft,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) return {}
  const sp = await searchParams
  const locale = isLocale(sp.locale) ? sp.locale : DEFAULT_LOCALE
  try {
    const doc: any = await findPage(slug, locale, false)
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

  const sp = await searchParams
  const locale = isLocale(sp.locale) ? sp.locale : DEFAULT_LOCALE
  const draft = sp.preview === '1'

  let doc: any = null
  try {
    doc = await findPage(slug, locale, draft)
  } catch (err) {
    console.error('[StaticPage] failed to load page', err)
  }

  if (!doc) notFound()

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      <main id="main" className="min-h-screen px-6 md:px-8 pt-32 pb-24 bg-[#121212] text-[#D4AF37]">
        <article className="max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl tracking-tight mb-10">{doc.title}</h1>
          {doc.content ? (
            <div className="prose prose-invert max-w-none text-[#D4AF37]/85 leading-relaxed">
              <RichText data={doc.content} />
            </div>
          ) : null}
        </article>
      </main>
      <Footer locale={locale} />
    </>
  )
}
