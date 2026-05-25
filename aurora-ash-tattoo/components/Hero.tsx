'use client'

import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ParallaxBackdrop from './ParallaxBackdrop'

type MediaSize = { url?: string | null; width?: number | null; height?: number | null }
type HeroMedia = {
  url?: string | null
  width?: number | null
  height?: number | null
  alt?: string | null
  sizes?: { hero?: MediaSize | null; feature?: MediaSize | null } | null
} | null

interface HeroProps {
  heroImage?: HeroMedia
}

const COPY = {
  eyebrow: 'Fine line · Blackwork · Ornamental',
  tagline: 'Fine art for the body.',
  primaryCta: 'Make an appointment',
  secondaryCta: 'Meet the artists',
  badge: 'Est. 2026 · By appointment · West Hollywood',
} as const

const Hero = ({ heroImage }: HeroProps) => {
  const sectionRef = useRef<HTMLElement>(null)
  const t = COPY
  const inquiryHref = '/inquiry'
  const teamHref = '/#team'
  // (Hero.tsx is a legacy component — the homepage now renders CMS blocks
  // via BlockRenderer + HeroBlock. Kept for backwards-compat with /[slug]
  // pages that opt in to the static hero.)

  const bgUrl =
    heroImage?.sizes?.hero?.url ||
    heroImage?.sizes?.feature?.url ||
    heroImage?.url ||
    null

  return (
    <section ref={sectionRef} className="relative w-full min-h-screen overflow-hidden [clip-path:inset(0)] bg-[#121212] text-[#D4AF37] flex items-center justify-center">
      <ParallaxBackdrop
        targetRef={sectionRef}
        desktopUrl={bgUrl}
        desktopAlt={heroImage?.alt ?? ''}
        priority
        imageClassName="opacity-50"
      />
      {bgUrl ? (
        <>
          <div aria-hidden="true" className="absolute inset-0 z-10 bg-gradient-to-b from-[#121212]/30 via-[#121212]/55 to-[#121212]" />
          <div aria-hidden="true" className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(18,18,18,0.4)_100%)]" />
        </>
      ) : null}

      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="label-line text-[#D4AF37]/70 mb-6"
        >
          {t.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.1, ease: 'easeOut' }}
          className="font-serif text-[clamp(2.5rem,11vw,8rem)] tracking-tight mb-6 leading-none"
        >
          AURORA{' '}
          <span className="font-serif italic text-[clamp(1.5rem,6.5vw,5rem)] align-middle">
            &
          </span>{' '}
          ASH
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="font-serif italic text-[clamp(1rem,3vw,1.5rem)] text-[#D4AF37]/85 mb-12"
        >
          {t.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="flex flex-col sm:flex-row gap-5 sm:gap-8 w-full sm:w-auto"
        >
          <Link
            href={inquiryHref}
            className="label-line bg-[#D4AF37] text-black border border-[#D4AF37] px-8 py-4 hover:bg-transparent hover:text-[#D4AF37] transition-colors text-center"
          >
            {t.primaryCta}
          </Link>
          <Link
            href={teamHref}
            className="label-line text-[#D4AF37] border border-[#D4AF37]/40 px-8 py-4 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors text-center"
          >
            {t.secondaryCta}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10 px-4 w-full"
      >
        <p className="label-line text-[clamp(0.6rem,2vw,0.75rem)] text-[#D4AF37]/55 text-center px-2">
          {t.badge}
        </p>
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [0.2, 0.7, 0.2], y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="block w-px h-10 bg-[#D4AF37]"
        />
      </motion.div>
    </section>
  )
}

export default Hero
