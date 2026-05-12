'use client'

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

import type { MediaDoc } from '../MediaImage'
import type { ParallaxBlockData } from './types'

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
 * - The image is fixed to the viewport (locked in place)
 * - A subtle y transform creates gentle "lag" as you scroll
 * - The parent section's clip-path creates the viewing window
 *
 * Respects `prefers-reduced-motion` - in that case the image stays static.
 */
export default function ParallaxSection({ block }: Props) {
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
  })

  // Counter-scroll: image moves UP 30vh while we scroll through the section
  // This creates a "Bang Bang" parallax effect - expressive movement
  const y = useTransform(scrollYProgress, [0, 1], ['15vh', '-15vh'])

  const overlay = clamp(block.overlayIntensity ?? 0.55, 0, 0.95)
  const heightClass = HEIGHT_CLASS[block.height ?? 'screen'] ?? HEIGHT_CLASS.screen
  const sectionId = (block.sectionId ?? '').trim() || undefined

  const media = block.backgroundImage
  const imageUrl =
    media && typeof media === 'object'
      ? ((media as MediaDoc).sizes?.hero?.url ?? (media as MediaDoc).url)
      : null

  return (
    <section
      id={sectionId}
      // The "window" - clip-path creates the viewing frame
      className={`relative w-full ${heightClass} [clip-path:inset(0)] bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center scroll-mt-[72px]`}
    >
      {imageUrl && (
        // Fixed canvas with parallax - h-[130vh] accommodates 30vh movement
        // will-change + translateZ(0) for 60fps on mobile
        <motion.div
          aria-hidden="true"
          style={reduceMotion ? {} : { y, willChange: 'transform', transform: 'translateZ(0)' }}
          className="fixed -top-[15vh] left-0 w-full h-[130vh] -z-10 pointer-events-none"
        >
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Dark wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(10,10,10,${overlay})` }}
      />

      {/* Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,10,0.5)_100%)]"
      />

      {(block.title || block.subtitle) && (
        // Content scrolls normally over the window
        <div className="relative z-10 px-6 md:px-10 max-w-4xl mx-auto text-center">
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
    </section>
  )
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
