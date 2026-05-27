import MediaImage, { type MediaDoc } from '../MediaImage'
import type { ImageFeatureData } from './types'

interface Props {
  block: ImageFeatureData
}

export default function ImageFeature({ block }: Props) {
  const { image, caption, layout = 'content-width' } = block
  if (!image || typeof image !== 'object') return null

  const isFull = layout === 'full-width'
  const wrapperClass = isFull
    ? 'w-full'
    : 'max-w-5xl mx-auto px-6 md:px-10'
  const aspect = isFull ? 'aspect-[21/9] md:aspect-[21/9]' : 'aspect-[16/10] md:aspect-[16/10]'

  return (
    <section className="bg-[#121212] py-20 md:py-24">
      <figure className={wrapperClass}>
        <div
          className={`relative ${aspect} bg-[#0a0a0a] border border-[#D4AF37]/10 overflow-hidden`}
        >
          <MediaImage
            media={image as MediaDoc}
            size={isFull ? 'hero' : 'feature'}
            fill
            sizes={isFull ? '100vw' : '(max-width: 1024px) 100vw, 1024px'}
            className="object-cover"
          />
        </div>
        {caption ? (
          <figcaption className="text-[#D4AF37]/60 text-sm italic text-center mt-5 px-6">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </section>
  )
}
