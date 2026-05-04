'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

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
  locale?: 'en' | 'ru'
}

const COPY = {
  en: {
    eyebrow: 'Fine line · Blackwork · Ornamental',
    tagline: 'Fine art for the body.',
    primaryCta: 'Book a consultation',
    secondaryCta: 'Meet the artists',
    badge: 'Est. 2026 · By appointment · West Hollywood',
  },
  ru: {
    eyebrow: 'Fine line · Blackwork · Орнамент',
    tagline: 'Тонкое искусство для тела.',
    primaryCta: 'Записаться на консультацию',
    secondaryCta: 'Посмотреть артистов',
    badge: 'С 2026 · Только по записи · West Hollywood',
  },
}

const Hero = ({ heroImage, locale = 'en' }: HeroProps) => {
  const t = COPY[locale]
  const inquiryHref = locale === 'en' ? '/inquiry' : '/inquiry?locale=ru'
  const teamHref = locale === 'en' ? '/#team' : '/?locale=ru#team'

  const bgUrl =
    heroImage?.sizes?.hero?.url ||
    heroImage?.sizes?.feature?.url ||
    heroImage?.url ||
    null

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#121212] text-[#D4AF37] px-6 text-center overflow-hidden pt-[72px] pb-32">
      {bgUrl ? (
        <>
          <Image
            src={bgUrl}
            alt={heroImage?.alt ?? ''}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/30 via-[#121212]/55 to-[#121212]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(18,18,18,0.4)_100%)]" />
        </>
      ) : null}

      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
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
          className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight mb-6 leading-none"
        >
          AURORA{' '}
          <span className="font-serif italic text-3xl sm:text-5xl md:text-6xl lg:text-7xl align-middle">
            &
          </span>{' '}
          ASH
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="font-serif italic text-lg sm:text-xl md:text-2xl text-[#D4AF37]/85 mb-12"
        >
          {t.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto"
        >
          <Link
            href={inquiryHref}
            className="label-line bg-[#D4AF37] text-[#121212] border border-[#D4AF37] px-8 py-4 hover:bg-transparent hover:text-[#D4AF37] transition-colors text-center"
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
        <p className="label-line text-[#D4AF37]/55 text-center">
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
