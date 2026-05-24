import HeroBlock from './blocks/HeroBlock'
import ContentBlock from './blocks/ContentBlock'
import ImageFeature from './blocks/ImageFeature'
import AccordionBlock from './blocks/AccordionBlock'
import ArtistGrid from './blocks/ArtistGrid'
import ParallaxSection from './blocks/ParallaxSection'
import ColumnsBlock from './blocks/ColumnsBlock'
import type { PageBlock } from './blocks/types'

interface Props {
  blocks?: PageBlock[] | null
}

/**
 * Render the page blocks in order.
 *
 * If a block carries a `sectionId`, we wrap it in a `<section id=...>` so the
 * homepage scroll-spy and in-page anchors can target it. ParallaxSection
 * renders its own `<section id=>`, so we skip the outer wrapper for parallax
 * blocks to avoid nested IDs.
 */
export default function BlockRenderer({ blocks }: Props) {
  if (!blocks || blocks.length === 0) return null

  // Track whether we've already rendered the first parallax so we can pass
  // priority={true} only to that one image — the LCP candidate on the page.
  let firstParallaxSeen = false

  return (
    <>
      {blocks.map((block, idx) => {
        const key = block.id ?? `${block.blockType}-${idx}`

        // ParallaxSection renders its own <section id=> and needs priority
        // hint for LCP. Return early — no outer wrapper.
        if (block.blockType === 'parallax') {
          const isFirst = !firstParallaxSeen
          firstParallaxSeen = true
          return renderBlock(block, key, isFirst)
        }

        const node = renderBlock(block, key)
        if (!node) return null

        // When the previous block was a parallax, apply a CSS mask so the
        // top edge of the next block fades in via transparency rather than
        // a painted gradient — eliminates hard seams and colour banding (§14.1).
        const prevBlock = idx > 0 ? blocks[idx - 1] : null
        const prevWasParallax = prevBlock?.blockType === 'parallax'

        const maskStyle = prevWasParallax
          ? {
              maskImage: 'linear-gradient(to bottom, transparent 0px, #000 120px)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, #000 120px)',
              marginTop: '-80px',
              zIndex: 10,
            }
          : undefined

        const sectionId = (block as any).sectionId as string | null | undefined
        if (sectionId) {
          return (
            <section
              key={key}
              id={sectionId}
              data-scroll-section
              className={`scroll-mt-[72px]${prevWasParallax ? ' relative' : ''}`}
              style={maskStyle}
            >
              {node}
            </section>
          )
        }

        // Blocks without a sectionId that follow a parallax still need
        // the mask transition — wrap them in a relative container.
        if (prevWasParallax) {
          return (
            <div key={key} className="relative" style={maskStyle}>
              {node}
            </div>
          )
        }

        return node
      })}
    </>
  )
}

function renderBlock(block: PageBlock, key: string, priority = false) {
  switch (block.blockType) {
    case 'hero':
      return <HeroBlock key={key} block={block} />
    case 'content':
      return <ContentBlock key={key} block={block} />
    case 'imageFeature':
      return <ImageFeature key={key} block={block} />
    case 'accordion':
      return <AccordionBlock key={key} block={block} />
    case 'artistGrid':
      return <ArtistGrid key={key} block={block} />
    case 'parallax':
      return <ParallaxSection key={key} block={block} priority={priority} />
    case 'columns':
      return <ColumnsBlock key={key} block={block} />
    default:
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BlockRenderer] Unknown block type:', (block as any).blockType)
      }
      return null
  }
}
