'use client'

import type { RefObject } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useIsMobile } from '../lib/useIsMobile'

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
 * Uses one shared viewport-fixed layer clipped by the section. The fixed layer
 * gives visible parallax even when scroll-driven transforms are subtle, while
 * generous vertical overscan keeps the image from exposing page background at
 * section edges. Small in-section edge masks cover the last sub-pixel of the
 * clip boundary, where browsers can otherwise draw a bright antialias seam.
 */
export default function ParallaxBackdrop({
  targetRef,
  desktopUrl,
  mobileUrl,
  desktopAlt = '',
  mobileAlt = '',
  hasDistinctMobile = false,
  priority = false,
  imageClassName = '',
  edgeColor = '#0a0a0a',
}: Props) {
  const reduceMotion = useReducedMotion()
  const isMobile = useIsMobile()
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  })

  // Fixed viewport layer creates the actual "window over a background" parallax.
  // The scroll transform adds a small lag on top; if client JS has not hydrated
  // yet, the fixed layer still keeps the parallax effect visible instead of
  // degrading to a plain static absolute background.
  const travel = isMobile ? '5vh' : '18vh'
  const y = useTransform(scrollYProgress, [0, 1], [travel, `-${travel}`])

  if (!desktopUrl && !mobileUrl) return null

  const baseImageClass = ['object-cover scale-[1.02]', imageClassName].filter(Boolean).join(' ')

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={reduceMotion ? {} : { y, willChange: 'transform' }}
        className="fixed -top-[8vh] left-0 z-0 h-[116vh] w-full pointer-events-none bg-[#0a0a0a] md:-top-[25vh] md:h-[150vh]"
      >
        {desktopUrl ? (
          <Image
            src={desktopUrl}
            alt={desktopAlt}
            fill
            priority={priority}
            quality={85}
            sizes="100vw"
            className={`${baseImageClass} ${hasDistinctMobile ? 'hidden md:block' : 'block'}`}
          />
        ) : null}

        {hasDistinctMobile && mobileUrl ? (
          <Image
            src={mobileUrl}
            alt={mobileAlt || desktopAlt}
            fill
            priority={priority}
            quality={85}
            sizes="100vw"
            className={`${baseImageClass} block md:hidden`}
          />
        ) : null}
      </motion.div>

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
