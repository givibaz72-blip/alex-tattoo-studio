'use client'

import { useEffect, useRef, type RefObject } from 'react'
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
 * Parallax backdrop — CSS-driven, zero React re-renders on scroll.
 * Uses a ref to set CSS transform directly, bypassing setState entirely.
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
  const desktopRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)

  useParallaxY(targetRef, reduceMotion, [desktopRef, mobileRef])

  if (!desktopUrl && !mobileUrl) return null

  const layerClass = [
    'absolute inset-0 z-0 pointer-events-none',
    'bg-[#0a0a0a] bg-cover bg-center bg-no-repeat',
    'will-change-transform',
    imageClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const fallbackMobileUrl = mobileUrl || desktopUrl

  return (
    <>
      {desktopUrl ? (
        <div
          ref={desktopRef}
          aria-hidden="true"
          className={`${layerClass} ${hasDistinctMobile ? 'hidden md:block' : 'block'}`}
          style={{ backgroundImage: cssUrl(desktopUrl) }}
        />
      ) : null}

      {hasDistinctMobile && fallbackMobileUrl ? (
        <div
          ref={mobileRef}
          aria-hidden="true"
          className={`${layerClass} block md:hidden`}
          style={{ backgroundImage: cssUrl(fallbackMobileUrl) }}
        />
      ) : null}

      {/* Edge gradients — no change */}
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

/**
 * Zero-render parallax: applies transform directly to DOM refs.
 * No useState, no setState, no React re-renders on scroll.
 */
function useParallaxY(
  targetRef: RefObject<HTMLElement | null>,
  reduceMotion: boolean | null,
  layerRefs: RefObject<HTMLDivElement | null>[],
) {
  useEffect(() => {
    if (reduceMotion) {
      for (const ref of layerRefs) {
        if (ref.current) ref.current.style.transform = ''
      }
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
      const y = Math.round((clamped - 0.5) * viewport * 0.16)

      for (const ref of layerRefs) {
        if (ref.current) {
          ref.current.style.transform = `translate3d(0, ${y}px, 0)`
        }
      }
    }

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [reduceMotion, targetRef, layerRefs])
}

function cssUrl(url: string) {
  return `url("${url.replace(/"/g, '\\"')}")`
}