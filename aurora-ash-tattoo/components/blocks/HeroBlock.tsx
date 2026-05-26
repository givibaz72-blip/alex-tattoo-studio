'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

import type { MediaDoc } from '../MediaImage'
import type { HeroBlockData } from './types'
import ParallaxBackdrop from '../ParallaxBackdrop'

interface Props {
  block: HeroBlockData
}

/**
 * Hero block with parallax background.
 *
 * Uses the shared `<ParallaxBackdrop>` implementation:
 * - The image is rendered as an in-section CSS fixed background layer.
 * - The browser creates the visible "window over background" parallax as you scroll.
 * - The section uses `overflow-hidden`, avoiding fixed DOM/clip-path seams.
 *
 * Respects `prefers-reduced-motion` - in that case the image stays static.
 */
export default function HeroBlock({ block }: Props) {
  const sectionRef = useRef<HTMLElement>(null)

  const media = block.backgroundImage
  const imageUrl =
    media && typeof media === 'object'
      ? ((media as MediaDoc).sizes?.hero?.url ?? (media as MediaDoc).url ?? null)
      : null

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center"
    >
      <ParallaxBackdrop
        targetRef={sectionRef}
        desktopUrl={imageUrl}
        desktopAlt=""
        priority
      />

      {/* Dark wash overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,10,0.5)_100%)]"
      />

      {/* Content — no max-w on subtitle so "Santa Monica" centres freely */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto px-6 text-center">
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-[clamp(3rem,8vw,6rem)] tracking-tight leading-[1.05] text-[#D4AF37]"
        >
          AURORA & ASH
        </motion.h1>

        {block.subtitle && (
          <motion.p
            initial={false}
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
          initial={false}
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

