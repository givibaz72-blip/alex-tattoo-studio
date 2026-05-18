'use client'

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

import type { MediaDoc } from '../MediaImage'
import type { ParallaxBlockData } from './types'
import { useIsMobile } from '../../lib/useIsMobile'

interface Props {
  block: ParallaxBlockData
}

const HEIGHT_CLASS = {
  screen: 'min-h-screen',
  tall: 'min-h-[75vh]',
  half: 'min-h-[50vh]',
} as const

/**
 * Parallax section block.
 *
 * Uses "Clip-Path Window" technique with subtle parallax:
 *  - Image is fixed to the viewport (locked in place).
 *  - A y-transform tied to scrollYProgress creates gentle "lag" as the
 *    section moves past the viewing window.
 *  - The parent section's `clip-path: inset(0)` frames the window.
 *
 * Art direction (§14.1):
 *  - Editors can attach `mobileImage` in the CMS — a portrait crop shown
 *    only on `< 768px` viewports. Falls back to `backgroundImage` when
 *    empty.
 *  - Motion amplitude scales down on phones: parallax travel drops from
 *    `±15vh` (desktop) to `±5vh` (mobile) so the vertical crop isn't
 *    stretched aggressively.
 *
 * Respects `prefers-reduced-motion` — image stays static in that case.
 */
export default function ParallaxSection({ block }: Props) {
  const reduceMotion = useReducedMotion()
  const isMobile = useIsMobile()

  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
  })

  // Scale the parallax amplitude on mobile: 15vh → 5vh. Keeps depth cue
  // without stretching the vertical crop or dragging frame-rate down.
  const travel = isMobile ? '5vh' : '15vh'
  const negTravel = isMobile ? '-5vh' : '-15vh'
  const y = useTransform(scrollYProgress, [0, 1], [travel, negTravel])

  // Fixed canvas height needs to accommodate the full travel. We oversize
  // it slightly: viewport height + twice the travel for headroom.
  const canvasOffset = isMobile ? '-top-[5vh]' : '-top-[15vh]'
  const canvasHeight = isMobile ? 'h-[110vh]' : 'h-[130vh]'

  const overlay = clamp(block.overlayIntensity ?? 0.55, 0, 0.95)
  const heightClass = HEIGHT_CLASS[block.height ?? 'screen'] ?? HEIGHT_CLASS.screen
  const sectionId = (block.sectionId ?? '').trim() || undefined

  const desktopUrl = resolveImageUrl(block.backgroundImage)
  const mobileSrc = block.mobileImage ?? block.backgroundImage
  const mobileUrl = resolveImageUrl(mobileSrc)
  // If editor didn't attach a mobile-specific crop, both layers point at the
  // same asset — the responsive visibility classes still hide one of them.
  const hasDistinctMobile = Boolean(block.mobileImage)

  return (
    <section
      id={sectionId}
      className={`relative z-10 w-full ${heightClass} [clip-path:inset(0)] bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center scroll-mt-[72px]`}
    >
      {(desktopUrl || mobileUrl) && (
        <motion.div
          aria-hidden="true"
          style={reduceMotion ? {} : { y, willChange: 'transform', transform: 'translateZ(0)' }}
          className={`fixed ${canvasOffset} left-0 w-full ${canvasHeight} z-0 pointer-events-none`}
        >
          {/* Desktop image — hidden on phones to skip the bandwidth. */}
          {desktopUrl && (
            <img
              src={desktopUrl}
              alt=""
              className={`w-full h-full object-cover ${hasDistinctMobile ? 'hidden md:block' : 'block'}`}
              loading="lazy"
              decoding="async"
            />
          )}
          {/* Mobile-only portrait crop. Always object-cover so the same DOM
              behaves for both vertical phones and rotated devices. */}
          {hasDistinctMobile && mobileUrl && (
            <img
              src={mobileUrl}
              alt=""
              className="w-full h-full object-cover block md:hidden"
              loading="lazy"
              decoding="async"
            />
          )}
        </motion.div>
      )}

      {/* Dark wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{ backgroundColor: `rgba(10,10,10,${overlay})` }}
      />

      {/* Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,10,0.5)_100%)]"
      />

      {(block.title || block.subtitle) && (
        <div className="relative z-30 px-6 md:px-10 max-w-4xl mx-auto text-center">
          {block.title && (
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] text-[#D4AF37]"
            >
              {block.title}
            </motion.h2>
          )}
          {block.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 md:mt-8 font-serif italic text-lg sm:text-xl md:text-2xl text-[#D4AF37]/85 max-w-2xl mx-auto whitespace-pre-line"
            >
              {block.subtitle}
            </motion.p>
          )}
        </div>
      )}

      {/* Gradient fade to neutral-950 at the bottom so the parallax image
          naturally dissolves into the next section (§14.1). */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 md:h-48 bg-gradient-to-b from-transparent to-neutral-950 pointer-events-none z-20"
      />
    </section>
  )
}

function resolveImageUrl(media: ParallaxBlockData['backgroundImage'] | ParallaxBlockData['mobileImage']): string | null {
  if (!media || typeof media !== 'object') return null
  const m = media as MediaDoc
  return m.sizes?.hero?.url ?? m.url ?? null
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
