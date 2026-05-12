'use client'

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import type { MediaDoc } from './MediaImage'

interface Props {
  heading: string
  body: string
  backgroundImage: MediaDoc
}

/**
 * About section with parallax background.
 *
 * Uses "Clip-Path Window" technique:
 * - The image is fixed to the viewport (locked in place)
 * - A subtle y transform creates gentle "lag" as you scroll
 * - The parent section's clip-path creates the viewing window
 */
export default function AboutParallax({ heading, body, backgroundImage }: Props) {
  const reduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
  })

  // Subtle counter-scroll: image moves UP 30vh while we scroll through the section
  const y = useTransform(scrollYProgress, [0, 1], ['15vh', '-15vh'])

  const imageUrl =
    backgroundImage && typeof backgroundImage === 'object'
      ? ((backgroundImage as MediaDoc).sizes?.hero?.url ?? (backgroundImage as MediaDoc).url)
      : null

  return (
    <section
      id="about"
      className="relative w-full min-h-screen [clip-path:inset(0)] bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center scroll-mt-[72px]"
    >
      {imageUrl && (
        <motion.div
          aria-hidden="true"
          style={reduceMotion ? {} : { y, willChange: 'transform', transform: 'translateZ(0)' }}
          className="fixed -top-[15vh] left-0 w-full h-[130vh] -z-10 pointer-events-none"
        >
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </motion.div>
      )}

      {/* Dark wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(10,10,10,0.55)' }}
      />

      {/* Vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,10,0.5)_100%)]"
      />

      <div className="relative z-10 px-6 md:px-10 max-w-4xl mx-auto text-center">
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
