'use client'

import Image from 'next/image'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import type { MediaDoc } from './MediaImage'
import { useIsMobile } from '../lib/useIsMobile'

interface Props {
  heading: string
  body: string
  /** Landscape/desktop backdrop. Shown on >= 768px viewports. */
  backgroundImage: MediaDoc
  /** Optional portrait crop for < 768px. Falls back to `backgroundImage`. */
  mobileImage?: MediaDoc | null
  /** Set true only when this section is the LCP element (first visible screen). */
  priority?: boolean
}

/**
 * About section with parallax background — same "Clip-Path Window" technique
 * as the `<ParallaxSection>` block, but used by the home page composer to
 * surface a single curated About section.
 *
 * Art direction (§14.1):
 *  - Accepts an optional `mobileImage` portrait crop.
 *  - On phones (< 768px) the parallax travel is reduced from ±15vh to ±5vh,
 *    keeping depth cue without stretching the vertical image.
 */
export default function AboutParallax({ heading, body, backgroundImage, mobileImage, priority = false }: Props) {
  const reduceMotion = useReducedMotion()
  const isMobile = useIsMobile()

  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
  })

  const travel = isMobile ? '5vh' : '15vh'
  const negTravel = isMobile ? '-5vh' : '-15vh'
  const y = useTransform(scrollYProgress, [0, 1], [travel, negTravel])
  const canvasOffset = isMobile ? '-top-[5vh]' : '-top-[15vh]'
  const canvasHeight = isMobile ? 'h-[110vh]' : 'h-[130vh]'

  const desktopUrl = resolveImageUrl(backgroundImage)
  const mobileUrl = resolveImageUrl(mobileImage ?? backgroundImage)
  const hasDistinctMobile = Boolean(mobileImage)

  return (
    <section
      id="about"
      className="relative z-10 w-full min-h-screen [clip-path:inset(0)] bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center scroll-mt-[72px]"
    >
      {(desktopUrl || mobileUrl) && (
        <motion.div
          aria-hidden="true"
          style={reduceMotion ? {} : { y, willChange: 'transform', transform: 'translateZ(0)' }}
          className={`fixed ${canvasOffset} left-0 w-full ${canvasHeight} z-0 pointer-events-none`}
        >
          {desktopUrl && (
            <Image
              src={desktopUrl}
              alt={backgroundImage?.alt || 'Aurora & Ash tattoo studio interior'}
              fill
              priority={priority}
              quality={85}
              sizes="100vw"
              className={`object-cover ${hasDistinctMobile ? 'hidden md:block' : 'block'}`}
            />
          )}
          {hasDistinctMobile && mobileUrl && (
            <Image
              src={mobileUrl}
              alt={mobileImage?.alt || backgroundImage?.alt || 'Aurora & Ash tattoo studio interior'}
              fill
              priority={priority}
              quality={85}
              sizes="100vw"
              className="object-cover block md:hidden"
            />
          )}
        </motion.div>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{ backgroundColor: 'rgba(10,10,10,0.55)' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,10,0.5)_100%)]"
      />

      <div className="relative z-30 px-6 md:px-10 max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] text-[#D4AF37]"
        >
          {heading}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 md:mt-8 font-serif italic text-lg sm:text-xl md:text-2xl text-[#D4AF37]/85 max-w-2xl mx-auto whitespace-pre-line"
        >
          {body}
        </motion.p>
      </div>

    </section>
  )
}

function resolveImageUrl(media: MediaDoc | null | undefined): string | null {
  if (!media || typeof media !== 'object') return null
  return media.sizes?.hero?.url ?? media.url ?? null
}

