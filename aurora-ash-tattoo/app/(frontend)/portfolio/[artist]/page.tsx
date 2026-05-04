import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

import MediaImage from '../../../../components/MediaImage'
import SocialLinks from '../../../../components/SocialLinks'
import NavBar from '../../../../components/NavBar'
import Footer from '../../../../components/Footer'
import WorksGallery from '../../../../components/WorksGallery'
import { getPayload, DEFAULT_LOCALE, isLocale } from '../../../../lib/payload'

interface Props {
  params: Promise<{ artist: string }>
  searchParams: Promise<{ locale?: string; preview?: string }>
}

const COPY = {
  en: {
    back: 'Back',
    inquiry: 'Inquiry',
    selectedWorks: 'Selected works',
    statusOpen: 'Accepting bookings',
    statusWaitlist: 'Waitlist',
    statusClosed: 'Closed for now',
    notFound: 'Artist not found',
  },
  ru: {
    back: 'Назад',
    inquiry: 'Записаться',
    selectedWorks: 'Избранные работы',
    statusOpen: 'Принимает заявки',
    statusWaitlist: 'Лист ожидания',
    statusClosed: 'Запись закрыта',
    notFound: 'Артист не найден',
  },
} as const

async function findArtist(slug: string, locale: 'en' | 'ru', draft: boolean) {
  const payload = await getPayload()
  const res = await payload.find({
    collection: 'artists',
    where: { slug: { equals: slug } },
    locale,
    depth: 2,
    limit: 1,
    draft,
  })
  return res.docs[0] ?? null
}

async function findWorks(artistId: string | number, locale: 'en' | 'ru') {
  const payload = await getPayload()
  const res = await payload.find({
    collection: 'works',
    where: { artist: { equals: artistId } },
    locale,
    depth: 2,
    sort: '-createdAt',
    limit: 100,
  })
  return res.docs
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { artist: slug } = await params
  const sp = await searchParams
  const locale = isLocale(sp.locale) ? sp.locale : DEFAULT_LOCALE
  const safeLocale: 'en' | 'ru' = locale === 'ru' ? 'ru' : 'en'
  try {
    const doc: any = await findArtist(slug, safeLocale, false)
    if (!doc) return { title: COPY[safeLocale].notFound }
    return {
      title: doc.seo?.title ?? `${doc.name} - Aurora & Ash`,
      description: doc.seo?.description ?? doc.shortBio ?? undefined,
    }
  } catch {
    return { title: slug }
  }
}

export default async function ArtistPage({ params, searchParams }: Props) {
  const { artist: slug } = await params
  const sp = await searchParams
  const locale = isLocale(sp.locale) ? sp.locale : DEFAULT_LOCALE
  const safeLocale: 'en' | 'ru' = locale === 'ru' ? 'ru' : 'en'
  const t = COPY[safeLocale]
  const draft = sp.preview === '1'

  let doc: any = null
  try {
    doc = await findArtist(slug, safeLocale, draft)
  } catch (err) {
    console.error('[ArtistPage] failed to load artist', err)
  }

  if (!doc) notFound()

  const works = await findWorks(doc.id, safeLocale).catch(() => [])

  const homeHref = safeLocale === 'en' ? '/' : '/?locale=ru'
  const inquiryHref =
    safeLocale === 'en'
      ? `/inquiry?artist=${doc.slug}`
      : `/inquiry?artist=${doc.slug}&locale=ru`

  const statusLabel =
    doc.availability === 'open'
      ? t.statusOpen
      : doc.availability === 'waitlist'
        ? t.statusWaitlist
        : t.statusClosed

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      <main id="main">
        <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
          {doc.heroImage ? (
            <MediaImage
              media={doc.heroImage}
              size="hero"
              alt={doc.name}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : doc.portrait ? (
            <MediaImage
              media={doc.portrait}
              size="hero"
              alt={doc.name}
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-70"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pb-16 w-full">
            <Link
              href={homeHref}
              className="label-line text-[#D4AF37]/65 hover:text-[#D4AF37] transition-colors"
            >
              {'←'} {t.back}
            </Link>
            <h1 className="mt-6 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
              {doc.name}
            </h1>
            {doc.role ? (
              <p className="mt-3 label-line text-[#D4AF37]/75">{doc.role}</p>
            ) : null}
          </div>
        </section>

        <section className="py-24 px-6 md:px-8">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-2 space-y-6">
              {doc.shortBio ? (
                <p className="text-lg md:text-xl text-[#D4AF37]/90 leading-relaxed">
                  {doc.shortBio}
                </p>
              ) : null}
              {doc.longBio ? (
                <div className="prose prose-invert max-w-none text-[#D4AF37]/80 leading-relaxed">
                  <RichText data={doc.longBio} />
                </div>
              ) : null}
            </div>
            <aside className="space-y-6">
              <SocialLinks social={doc.social} />
              {doc.availability ? (
                <div className="label-line border border-[#D4AF37]/25 px-4 py-3 text-[#D4AF37]/85 text-center">
                  {statusLabel}
                </div>
              ) : null}
              <Link
                href={inquiryHref}
                className="label-line block text-center px-6 py-3 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
              >
                {t.inquiry}
              </Link>
            </aside>
          </div>
        </section>

        {works.length > 0 ? (
          <section className="pb-32 px-6 md:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-12 text-center">
                {t.selectedWorks}
              </h2>
              <WorksGallery works={works as any} />
            </div>
          </section>
        ) : null}
      </main>
      <Footer locale={safeLocale} />
    </>
  )
}
