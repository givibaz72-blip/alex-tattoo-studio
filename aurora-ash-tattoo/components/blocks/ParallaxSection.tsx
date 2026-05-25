'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import type { MediaDoc } from '../MediaImage'
import type { ParallaxBlockData } from './types'
import ParallaxBackdrop from '../ParallaxBackdrop'

/**
 * Generates a genuine uniform random noise texture via Canvas API.
 * Returns a PNG data-URL that tiles seamlessly.
 *
 * Why canvas and not SVG feTurbulence:
 *  - feTurbulence produces coherent (Perlin-like) noise; browsers render it
 *    differently and it may not have enough high-frequency energy to dither.
 *  - Canvas Math.random() gives true white noise: maximum entropy, guaranteed
 *    pixel-level variation in every browser, works correctly as background-image.
 */
function useCanvasNoise(size = 128): string {
  const [dataUrl, setDataUrl] = useState('')
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = ctx.createImageData(size, size)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(Math.random() * 256)
        img.data[i] = v       // R
        img.data[i + 1] = v   // G
        img.data[i + 2] = v   // B
        img.data[i + 3] = 255 // A — fully opaque; opacity controlled by parent
      }
      ctx.putImageData(img, 0, 0)
      setDataUrl(canvas.toDataURL('image/png'))
    } catch {
      // SSR / canvas blocked — noise layer simply won't render; gradient still works
    }
  }, [size])
  return dataUrl
}

interface Props {
  block: ParallaxBlockData
  /**
   * Pass `true` for the first parallax on the page so the browser
   * treats it as LCP-critical and fetches it at the highest priority
   * (equivalent to <link rel="preload">). Subsequent parallaxes stay lazy.
   */
  priority?: boolean
}

const HEIGHT_CLASS = {
  screen: 'min-h-screen',
  tall: 'min-h-[75vh]',
  half: 'min-h-[50vh]',
} as const

/**
 * Parallax section block.
 *
 * Uses the shared `<ParallaxBackdrop>` implementation with visible parallax:
 *  - Image lives in one shared viewport-fixed layer clipped by the section.
 *  - A y-transform tied to scrollYProgress adds gentle "lag" as the
 *    section moves past the viewing window.
 *  - The section uses `clip-path: inset(0)` to frame the fixed layer consistently.
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
export default function ParallaxSection({ block, priority = false }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  // True white noise generated on the client — eliminates gradient banding
  const noiseUrl = useCanvasNoise(128)

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
      ref={sectionRef}
      id={sectionId}
      className={`relative z-10 w-full ${heightClass} overflow-hidden [clip-path:inset(0)] bg-[#0a0a0a] text-[#D4AF37] flex items-center justify-center scroll-mt-[72px]`}
    >
      <ParallaxBackdrop
        targetRef={sectionRef}
        desktopUrl={desktopUrl}
        mobileUrl={mobileUrl}
        desktopAlt={resolveAlt(block.backgroundImage) || 'Aurora & Ash tattoo studio interior'}
        mobileAlt={resolveAlt(block.mobileImage) || resolveAlt(block.backgroundImage) || 'Aurora & Ash tattoo studio interior'}
        hasDistinctMobile={hasDistinctMobile}
        priority={priority}
      />

      {/*
       * ── OVERLAY STACK ───────────────────────────────────────────────────
       *
       * Three-layer approach that eliminates gradient banding on 8-bit panels:
       *
       * 1. Flat dark wash   — CMS-controlled uniform tint.
       *
       * 2. Scrim gradients  — 8-stop multi-stop curves following a perceptual
       *    (≈ gamma 2.2) ease-in-out. Stops are denser near 0 % where the eye
       *    is most sensitive. PLUS filter:blur(0.6px) on each gradient div —
       *    sub-pixel blur is invisible to the eye but destroys the hard 1–2 px
       *    edges that define banding. willChange:transform forces GPU compositing
       *    which internally uses 16-bit float precision (free dithering).
       *
       * 3. Noise dither     — rendered with a <canvas>-style SVG trick: the
       *    feTurbulence noise is blended with mix-blend-mode:overlay at 6 %
       *    opacity. `overlay` formula on dark tones = 2 × base × blend, so it
       *    amplifies the noise exactly where gradients band (in the shadows)
       *    while staying invisible in midtones and highlights.
       * ────────────────────────────────────────────────────────────────────
       */}

      {/* 1 — Flat dark wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ backgroundColor: `rgba(10,10,10,${overlay})` }}
      />

      {/* 2a — Radial vignette: 8-stop perceptual curve + sub-pixel blur */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center,' +
            'transparent 0%,' +
            'rgba(10,10,10,0.02) 20%,' +
            'rgba(10,10,10,0.07) 35%,' +
            'rgba(10,10,10,0.15) 48%,' +
            'rgba(10,10,10,0.26) 60%,' +
            'rgba(10,10,10,0.38) 72%,' +
            'rgba(10,10,10,0.48) 85%,' +
            'rgba(10,10,10,0.55) 100%)',
          // Sub-pixel blur: imperceptible visually but destroys hard band edges
          filter: 'blur(0.6px)',
          willChange: 'transform', // GPU compositing → internal 16-bit float
        }}
      />

      {/* 2b — Linear bottom scrim: 8-stop ease-out + sub-pixel blur */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top,' +
            'rgba(10,10,10,0.88) 0%,' +
            'rgba(10,10,10,0.70) 10%,' +
            'rgba(10,10,10,0.50) 22%,' +
            'rgba(10,10,10,0.32) 36%,' +
            'rgba(10,10,10,0.17) 52%,' +
            'rgba(10,10,10,0.07) 68%,' +
            'rgba(10,10,10,0.02) 82%,' +
            'transparent 100%)',
          filter: 'blur(0.6px)',
          willChange: 'transform',
        }}
      />

      {/* 3 — Canvas noise dither.
           noiseUrl is a real 128×128 PNG of uniform random pixels generated
           on the client via Math.random() — true white noise, maximum entropy.
           mix-blend-mode:overlay amplifies it in dark areas (exactly where
           banding lives): formula = 2×base×blend when base < 0.5.
           opacity:0.08 is below the perception threshold for static grain
           but high enough to push neighbouring pixels across quantisation
           boundaries, eliminating visible bands.
           Falls back gracefully (noiseUrl='') — gradient still renders. */}
      {noiseUrl && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            backgroundImage: `url(${noiseUrl})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
            opacity: 0.08,
            mixBlendMode: 'overlay',
          }}
        />
      )}

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
          {block.brandPillars && block.brandPillars.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              aria-label={block.brandPillars.map((p) => p.pillar).join(' · ')}
              className="mt-10 flex items-center justify-center space-x-4 text-[clamp(0.5rem,1vw,0.7rem)] font-medium uppercase tracking-[0.5em] text-white/40"
            >
              {block.brandPillars.map((item, i) => (
                <span key={item.id || i} className="flex items-center">
                  <span>{item.pillar}</span>
                  {i < block.brandPillars!.length - 1 && (
                    <span aria-hidden="true" className="ml-4 text-[#D4AF37]/60">
                      &bull;
                    </span>
                  )}
                </span>
              ))}
            </motion.p>
          )}
        </div>
      )}

    </section>
  )
}

function resolveImageUrl(media: ParallaxBlockData['backgroundImage'] | ParallaxBlockData['mobileImage']): string | null {
  if (!media || typeof media !== 'object') return null
  const m = media as MediaDoc
  return m.sizes?.hero?.url ?? m.url ?? null
}

function resolveAlt(media: ParallaxBlockData['backgroundImage'] | ParallaxBlockData['mobileImage']): string {
  if (!media || typeof media !== 'object') return ''
  return (media as MediaDoc).alt ?? ''
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
