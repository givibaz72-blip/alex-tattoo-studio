import { RichText } from '@payloadcms/richtext-lexical/react'

import MediaImage, { type MediaDoc } from '../MediaImage'
import type { ColumnsBlockData, ColumnsItem } from './types'

interface Props {
  block: ColumnsBlockData
}

const LAYOUT_GRID_CLASS: Record<NonNullable<ColumnsBlockData['layout']>, string> = {
  '50_50':     'grid-cols-1 md:grid-cols-2',
  '33_66':     'grid-cols-1 md:grid-cols-[1fr_2fr]',
  '66_33':     'grid-cols-1 md:grid-cols-[2fr_1fr]',
  '33_33_33':  'grid-cols-1 md:grid-cols-3',
}

const GAP_CLASS: Record<NonNullable<ColumnsBlockData['gap']>, string> = {
  sm: 'gap-6 md:gap-8',
  md: 'gap-10 md:gap-14',
  lg: 'gap-14 md:gap-20',
}

function Column({ item }: { item: ColumnsItem }) {
  const hasImage = item.image && typeof item.image === 'object'
  if (hasImage) {
    return (
      <figure>
        <div className="relative aspect-[4/5] bg-[#0a0a0a] border border-[#D4AF37]/10 overflow-hidden">
          <MediaImage
            media={item.image as MediaDoc}
            size="feature"
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
          />
        </div>
        {item.imageCaption ? (
          <figcaption className="text-[#D4AF37]/60 text-sm italic text-center mt-4 px-2">
            {item.imageCaption}
          </figcaption>
        ) : null}
      </figure>
    )
  }
  if (!item.body) return <div />
  return (
    <div className="aurora-richtext">
      <RichText data={item.body} />
    </div>
  )
}

export default function ColumnsBlock({ block }: Props) {
  const layout = (block.layout ?? '50_50') as NonNullable<ColumnsBlockData['layout']>
  const gap = (block.gap ?? 'md') as NonNullable<ColumnsBlockData['gap']>
  const items = block.items ?? []
  if (items.length === 0) return null

  return (
    <section className="bg-[#121212] text-[#D4AF37] py-20 md:py-24 px-6 md:px-10">
      <div className={`max-w-7xl mx-auto grid ${LAYOUT_GRID_CLASS[layout]} ${GAP_CLASS[gap]} items-start`}>
        {items.map((it, i) => (
          <Column key={it.id ?? i} item={it} />
        ))}
      </div>
    </section>
  )
}
