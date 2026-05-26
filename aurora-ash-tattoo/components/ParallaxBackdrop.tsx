'use client'

import { useEffect, useState, type RefObject } from 'react'
import { useReducedMotion } from 'framer-motion'

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
 * Uses a desktop CSS fixed background plus a small JS fallback transform.
 * `md:bg-fixed` gives the strong “window over background” parallax on normal
 * desktop browsers; mobile keeps a normal moving layer for reliability.
 */
export default function ParallaxBackdrop({
  targetRef,
  desktopUrl,
  mobileUrl,
  hasDistinctMobile = false,
  imageClassName = '',
  edgeColor = '#0a0a0a',
}: Props) {
  const reduceMotion = useReducedMotion()
  const y = useParallaxY(targetRef, reduceMotion)

  if (!desktopUrl && !mobileUrl) return null

  const baseLayerClass = [
    // Overscan vertically so the moving image never exposes a blank edge.
    'absolute inset-x-0 -top-[12vh] -bottom-[12vh] z-0 pointer-events-none bg-[#0a0a0a] bg-cover bg-center bg-no-repeat md:bg-fixed will-change-transform',
    imageClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const fallbackMobileUrl = mobileUrl || desktopUrl
  const motionStyle = {
    transform: `translate3d(0, ${y}px, 0)`,
  }

  return (
    <>
      {desktopUrl ? (
        <div
          aria-hidden="true"
          className={`${baseLayerClass} ${hasDistinctMobile ? 'hidden md:block' : 'block'}`}
          style={{ backgroundImage: cssBackgroundUrl(desktopUrl), ...motionStyle }}
        />
      ) : null}

      {hasDistinctMobile && fallbackMobileUrl ? (
        <div
          aria-hidden="true"
          className={`${baseLayerClass} block md:hidden`}
          style={{ backgroundImage: cssBackgroundUrl(fallbackMobileUrl), ...motionStyle }}
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

function useParallaxY(targetRef: RefObject<HTMLElement | null>, reduceMotion: boolean | null) {
  const [y, setY] = useState(0)

  useEffect(() => {
    if (reduceMotion) {
      setY(0)
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const target = targetRef.current
      if (!target) return

      const rect = target.getBoundingClientRect()
      const viewport = window.innerHeight || document.documentElement.clientHeight || 1
      const total = viewport + rect.height
      const progress = total > 0 ? (viewport - rect.top) / total : 0.5
      const clamped = Math.max(0, Math.min(1, progress))
      // Move up/down by 8vh. The layer has 12vh overscan on each side, so this
      // keeps image coverage while making the parallax clearly visible.
      const nextY = Math.round((clamped - 0.5) * viewport * 0.16)
      setY((prev) => (prev === nextY ? prev : nextY))
    }

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [reduceMotion, targetRef])

  return y
}

function cssBackgroundUrl(url: string) {
  return `url("${url.replace(/"/g, '\\"')}")`
}
