import { Suspense } from 'react'

import InquiryForm, { type ArtistOption } from '../../../components/InquiryForm'
import {
  getPayload,
  isLocale,
  DEFAULT_LOCALE,
  type Locale,
} from '../../../lib/payload'

interface Props {
  searchParams: Promise<{ locale?: string; artist?: string }>
}

const FALLBACK: ArtistOption[] = [
  {
    id: 'alex',
    slug: 'alex',
    name: 'Alex White North',
    style: 'Blackwork & Realism',
    portrait: { url: '/portfolio/alex.png', alt: 'Alex' },
  },
  {
    id: 'aurora',
    slug: 'aurora',
    name: 'Aurora White',
    style: 'Fine Line & Ornamental',
    portrait: { url: '/portfolio/aurora.png', alt: 'Aurora' },
  },
  {
    id: 'julian',
    slug: 'julian',
    name: 'Julian White',
    style: 'Minimalism & Dark Art',
    portrait: { url: '/portfolio/julian.png', alt: 'Julian' },
  },
]

async function loadArtists(locale: Locale): Promise<ArtistOption[]> {
  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'artists',
      where: { availability: { not_equals: 'closed' } },
      sort: 'order',
      locale,
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

export const metadata = { title: 'Inquiry - Aurora & Ash' }

export default async function InquiryPage({ searchParams }: Props) {
  const sp = await searchParams
  const locale = isLocale(sp.locale) ? sp.locale : DEFAULT_LOCALE
  const artists = await loadArtists(locale)
  return (
    <Suspense>
      <InquiryForm artists={artists} />
    </Suspense>
  )
}
