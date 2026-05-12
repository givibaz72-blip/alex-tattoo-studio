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
 * already renders its own section[id], so we skip the outer wrap for that
 * block type to avoid nested IDs.
 */
export default function BlockRenderer({ blocks }: Props) {
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map((block, idx) => {
        const key = block.id ?? `${block.blockType}-${idx}`
        const node = renderBlock(block, key)
        if (!node) return null

        // ParallaxSection renders its own <section id=>. Other block types
        // with a sectionId get wrapped so they participate in the in-page
        // anchor / scroll-spy machinery.
        if (block.blockType === 'parallax') return node
        const sectionId = (block as any).sectionId as string | null | undefined
        if (sectionId) {
          return (
            <section
              key={key}
              id={sectionId}
              data-scroll-section
              className="scroll-mt-[72px]"
            >
              {node}
            </section>
          )
        }
        return node
      })}
    </>
  )
}

function renderBlock(block: PageBlock, key: string) {
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
      return <ParallaxSection key={key} block={block} />
    case 'columns':
      return <ColumnsBlock key={key} block={block} />
    default:
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BlockRenderer] Unknown block type:', (block as any).blockType)
      }
      return null
  }
}
