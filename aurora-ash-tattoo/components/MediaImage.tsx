import Image from 'next/image'

type SizeName = 'thumbnail' | 'card' | 'feature' | 'hero'

type MediaSizeEntry = {
  url?: string | null
  width?: number | null
  height?: number | null
}

export type MediaDoc = {
  id?: number | string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  sizes?: Partial<Record<SizeName, MediaSizeEntry>> | null
}

interface MediaImageProps {
  media?: MediaDoc | string | number | null
  size?: SizeName
  alt?: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
}

/**
 *     Payload media   imageSizes.
 *   id/ -    (     depth>=1).
 */
export default function MediaImage({
  media,
  size = 'card',
  alt,
  className,
  fill = false,
  sizes,
  priority = false,
}: MediaImageProps) {
  if (!media || typeof media !== 'object') return null

  const variant = media.sizes?.[size]
  const src = variant?.url ?? media.url
  if (!src) return null

  const width = variant?.width ?? media.width ?? undefined
  const height = variant?.height ?? media.height ?? undefined
  const altText = alt ?? media.alt ?? ''

  if (fill) {
    return (
      <Image
        src={src}
        alt={altText}
        fill
        className={className}
        sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
        priority={priority}
      />
    )
  }

  if (!width || !height) {
    return (
      <Image
        src={src}
        alt={altText}
        fill
        className={className}
        sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={altText}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}
