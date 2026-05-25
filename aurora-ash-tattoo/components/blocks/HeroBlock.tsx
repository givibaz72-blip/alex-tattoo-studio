'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

import type { MediaDoc } from '../MediaImage'
import type { HeroBlockData } from './types'

interface Props {
  block: HeroBlockData
}

/**
 * Hero block with parallax background.
 *
 * Uses "Clip-Path Window" technique:
 * - The image is fixed to the viewport (locked in place)
 * - A subtle y transform creates gentle "lag" as you scroll
 * - The parent section's clip-path creates the viewing window
 *
 * Respects `prefers-reduced-motion` - in that case the image stays static.
 */
export default function HeroBlock({ block }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Counter-scroll with extra overscan to avoid fractional-pixel seams.
  const y = useTransform(scrollYProgress, [0, 1], ['18vh', '-18vh'])

  const media = block.backgroundImage
  const imageUrl =
    media && typeof media === 'object'
      ? ((media as MediaDoc).sizes?.hero?.url ?? (media as MediaDoc).url)
      : null

  return (
    <section
      ref={sectionRef}
      // The "window" - clip-path creates the viewing frame
      className="relative w-full min-h-screen [clip-path:inset(0)] bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center overflow-hidden"
    >
      {imageUrl && (
        // Fixed canvas with generous overscan. This prevents 1px seams from
        // appearing when the transformed image lands on fractional pixels.
        <motion.div
          aria-hidden="true"
          style={reduceMotion ? {} : { y, willChange: 'transform', transform: 'translateZ(0)' }}
          className="fixed -top-[25vh] left-0 w-full h-[150vh] -z-10 pointer-events-none"
        >
          <Image
            src={imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover scale-[1.08]"
          />
        </motion.div>
      )}

      {/* Edge masks hide sub-pixel compositing seams at the parallax window. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-20 h-4 pointer-events-none bg-gradient-to-b from-[#0a0a0a] to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-20 h-4 pointer-events-none bg-gradient-to-t from-[#0a0a0a] to-transparent"
      />

      {/* Dark wash overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,10,0.5)_100%)]"
      />

      {/* Content — no max-w on subtitle so "Santa Monica" centres freely */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-[clamp(3rem,8vw,6rem)] tracking-tight leading-[1.05] text-[#D4AF37]"
        >
          AURORA & ASH
        </motion.h1>

        {block.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto text-center mt-6 font-serif italic text-[clamp(1rem,2vw,1.5rem)] tracking-[0.02em] md:tracking-[0.12em] text-[#D4AF37]/80 md:max-w-none"
          >
            A private creative sanctuary for permanent art{' '}
            <br className="hidden md:block" />
            in{' '}
            <span className="whitespace-nowrap">Santa Monica.</span>
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col sm:flex-row gap-5 sm:gap-8"
        >
          <Link
            href="/inquiry"
            className="inline-flex items-center justify-center min-h-11 px-8 py-3 border border-[#D4AF37] bg-[#D4AF37] text-[#0a0a0a] font-sans text-sm uppercase tracking-[0.18em] transition-all duration-300 hover:bg-transparent hover:text-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
          >
            Make an appointment
          </Link>
          <Link
            href="/#team"
            className="inline-flex items-center justify-center min-h-11 px-8 py-3 border border-[#D4AF37]/55 text-[#D4AF37] font-sans text-sm uppercase tracking-[0.18em] transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
          >
            Meet the artists
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

