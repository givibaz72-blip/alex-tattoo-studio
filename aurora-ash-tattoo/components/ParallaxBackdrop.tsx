'use client'

import type { RefObject } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

interface Props {
  targetRef: RefObject<HTMLElement | null>
  desktopUrl: string | null
  mobileUrl?: string | null
  desktopAlt?: string
  mobileAlt?: string
  hasDistinctMobile?: boolean
  priority?: boolean
  imageClassName?: string
}

/**
 * Shared parallax backdrop for all site parallax sections.
 *
 * Uses an oversized absolute layer inside the section instead of
 * `position: fixed` + `clip-path`. That keeps every parallax block on the same
 * rendering path and avoids 1px compositing seams at the top/bottom edges.
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
}: Props) {
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  })

  // Percentage travel is relative to the oversized backdrop layer. The layer
  // extends 25% beyond both section edges, while movement is only ±8%, so the
  // image can never expose the underlying page background during scroll.
  const y = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])

  if (!desktopUrl && !mobileUrl) return null

  const baseImageClass = ['object-cover scale-[1.02]', imageClassName].filter(Boolean).join(' ')

  return (
    <motion.div
      aria-hidden="true"
      style={reduceMotion ? {} : { y, willChange: 'transform', transform: 'translateZ(0)' }}
      className="absolute -top-[25%] left-0 z-0 h-[150%] w-full pointer-events-none bg-[#0a0a0a]"
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
  )
}
