'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScrollAnimateProps {
  children: ReactNode
  /** Extra Tailwind / CSS classes forwarded to the wrapper div. */
  className?: string
  /**
   * Stagger delay in seconds. Pass `index * 0.15` inside `.map()` to get a
   * cascading "waterfall" effect across sibling elements.
   * @default 0
   */
  delay?: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Cinematic cubic-bezier — slow start, fast middle, gentle settle.
 * Matches the "premium editorial" feel used throughout the site.
 */
const EASE: [number, number, number, number] = [0.215, 0.61, 0.355, 1.0]
const DURATION = 0.7

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Wraps any content in a framer-motion `<div>` that fades in and slides up
 * as it enters the viewport.
 *
 * Usage:
 * ```tsx
 * <ScrollAnimate delay={index * 0.15} className="col-span-1">
 *   <ArtistCard ... />
 * </ScrollAnimate>
 * ```
 *
 * Automatically becomes a static wrapper when the user has
 * `prefers-reduced-motion` set — no layout shift, no GSAP fuss.
 */
export default function ScrollAnimate({
  children,
  className,
  delay = 0,
}: ScrollAnimateProps) {
  const reduceMotion = useReducedMotion()

  // Respect OS-level accessibility setting: skip animation entirely.
  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      // Content must be readable even if hydration/IntersectionObserver is
      // delayed or blocked. Do not SSR hidden content with opacity:0.
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: DURATION, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
