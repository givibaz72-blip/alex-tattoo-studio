'use client'

import type { RefObject } from 'react'

interface Props {
  targetRef: RefObject<HTMLElement | null>
  desktopUrl: string | null
  mobileUrl?: string | null
  desktopAlt?: string
  mobileAlt?: string
  hasDistinctMobile?: boolean
  priority?: boolean
  imageClassName?: string
  edgeColor?: string
}

/**
 * Shared parallax backdrop for all site parallax sections.
 *
 * Uses CSS `background-attachment: fixed` on an in-section background layer.
 * This preserves the visible "window over background" parallax effect without
 * rendering a viewport-fixed DOM node through `clip-path`, which was the source
 * of intermittent bright seams during scroll.
 */
export default function ParallaxBackdrop({
  desktopUrl,
  mobileUrl,
  hasDistinctMobile = false,
  imageClassName = '',
  edgeColor = '#0a0a0a',
}: Props) {
  if (!desktopUrl && !mobileUrl) return null

  const baseLayerClass = [
    'absolute inset-0 z-0 pointer-events-none bg-[#0a0a0a] bg-cover bg-center bg-no-repeat bg-fixed',
    imageClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const fallbackMobileUrl = mobileUrl || desktopUrl

  return (
    <>
      {desktopUrl ? (
        <div
          aria-hidden="true"
          className={`${baseLayerClass} ${hasDistinctMobile ? 'hidden md:block' : 'block'}`}
          style={{ backgroundImage: cssBackgroundUrl(desktopUrl) }}
        />
      ) : null}

      {hasDistinctMobile && fallbackMobileUrl ? (
        <div
          aria-hidden="true"
          className={`${baseLayerClass} block md:hidden`}
          style={{ backgroundImage: cssBackgroundUrl(fallbackMobileUrl) }}
        />
      ) : null}

      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-px z-40 h-10 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${edgeColor} 0%, transparent 100%)` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px z-40 h-10 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${edgeColor} 0%, transparent 100%)` }}
      />
    </>
  )
}

function cssBackgroundUrl(url: string) {
  return `url("${url.replace(/"/g, '\\"')}")`
}
