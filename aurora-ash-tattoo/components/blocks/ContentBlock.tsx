import { RichText } from '@payloadcms/richtext-lexical/react'

import ScrollAnimate from '../ui/ScrollAnimate'
import type { ContentBlockData } from './types'

interface Props {
  block: ContentBlockData
}

// Font-family overrides applied via CSS class on the prose container.
// The corresponding rules live in `app/globals.css` (`.t-family-*`).
const FAMILY_CLASS: Record<NonNullable<NonNullable<ContentBlockData['typography']>['family']>, string> = {
  'default':       '',
  'modern-gothic': 't-family-modern-gothic',
  'minimalist':    't-family-minimalist',
}

const SCALE_CLASS: Record<NonNullable<NonNullable<ContentBlockData['typography']>['scale']>, string> = {
  sm:   't-scale-sm',
  base: '',
  lg:   't-scale-lg',
  xl:   't-scale-xl',
}

export default function ContentBlock({ block }: Props) {
  const bgClass = block.accentBackground ? 'bg-[#0a0a0a]' : 'bg-[#121212]'
  if (!block.body) return null

  const family = (block.typography?.family ?? 'default') as NonNullable<NonNullable<ContentBlockData['typography']>['family']>
  const scale = (block.typography?.scale ?? 'base') as NonNullable<NonNullable<ContentBlockData['typography']>['scale']>
  const typographyClass = [FAMILY_CLASS[family] || '', SCALE_CLASS[scale] || ''].filter(Boolean).join(' ')

  return (
    <section className={`${bgClass} text-[#D4AF37] pt-20 pb-12 md:pt-24 md:pb-16 px-6 md:px-10`}>
      {/* ScrollAnimate wraps only the inner content div so the outer section
          retains its full background coverage without layout shift. */}
      <ScrollAnimate className={`max-w-3xl mx-auto aurora-richtext ${typographyClass} [&_p:last-child]:mb-0`}>
        <RichText data={block.body} />
      </ScrollAnimate>
    </section>
  )
}
