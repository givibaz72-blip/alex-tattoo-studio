/**
 * Atmospheric placeholder generator for the seed flow.
 *
 * Generates SVG-based placeholders, rasterizes them to JPG/PNG via Sharp, and
 * writes them into `public/seed-images/`. The placeholders are intentionally
 * tasteful (deep charcoal gradient + faint horizon line + thin gold corner
 * ticks + watermark "PLACEHOLDER · REPLACE WITH REAL PHOTO") so they look
 * presentable on the site while you swap in real photography.
 *
 * Idempotent: existing files are kept as-is. Set `force: true` to overwrite.
 */

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const SEED_DIR = path.join(process.cwd(), 'public', 'seed-images')

// ---------------------------------------------------------------------------
// Spec for every placeholder we generate
// ---------------------------------------------------------------------------

type Aspect = 'wide' | 'square' | 'portrait' | 'banner'
type Format = 'jpg' | 'png'

type PlaceholderSpec = {
  filename: string
  title: string
  subtitle: string
  aspect: Aspect
  format: Format
  /** Hue offset in degrees applied to the deep charcoal+gold gradient (0–60). */
  hue: number
  /** Optional silhouette decoration baked into the SVG. */
  motif?: 'horizon' | 'arch' | 'frame' | 'circle' | 'dotgrid'
}

// Default placeholders the seed flow needs. Extend this list as new pages
// or blocks are added.
export const DEFAULT_PLACEHOLDERS: PlaceholderSpec[] = [
  // --- Studio / hero / og ---
  { filename: 'studio_hero.png',        title: 'AURORA & ASH',     subtitle: 'Home hero · placeholder',   aspect: 'wide',     format: 'png', hue: 0,  motif: 'horizon' },
  { filename: 'studio_philosophy.png',  title: 'PHILOSOPHY',       subtitle: 'About hero · placeholder',  aspect: 'portrait', format: 'png', hue: 8,  motif: 'arch' },
  { filename: 'og_image.png',           title: 'AURORA & ASH',     subtitle: 'Open Graph · placeholder',  aspect: 'banner',   format: 'png', hue: 0,  motif: 'frame' },

  // --- Parallax sections ---
  { filename: 'parallax_studio.jpg',    title: 'A PRIVATE GALLERY', subtitle: 'Studio · placeholder',     aspect: 'wide', format: 'jpg', hue: 4,  motif: 'horizon' },
  { filename: 'parallax_craft.jpg',     title: 'CRAFT · LINEAGE',   subtitle: 'Process · placeholder',    aspect: 'wide', format: 'jpg', hue: 18, motif: 'circle' },
  { filename: 'parallax_cta.jpg',       title: 'BEGIN A PROJECT',   subtitle: 'CTA · placeholder',        aspect: 'wide', format: 'jpg', hue: 28, motif: 'arch' },
  { filename: 'parallax_aftercare.jpg', title: 'AFTERCARE',         subtitle: 'Healing · placeholder',    aspect: 'wide', format: 'jpg', hue: 12, motif: 'dotgrid' },
  { filename: 'parallax_contact.jpg',   title: 'WEST HOLLYWOOD',    subtitle: 'Visit · placeholder',      aspect: 'wide', format: 'jpg', hue: 22, motif: 'horizon' },

  // --- Image features ---
  { filename: 'feature_room.jpg',       title: 'STUDIO FLOOR',      subtitle: 'Image feature · placeholder', aspect: 'wide', format: 'jpg', hue: 6,  motif: 'frame' },
  { filename: 'feature_work.jpg',       title: 'SELECTED WORK',     subtitle: 'Image feature · placeholder', aspect: 'wide', format: 'jpg', hue: 14, motif: 'circle' },
  { filename: 'feature_aftercare.jpg',  title: 'HEALED AT 6 MONTHS', subtitle: 'Image feature · placeholder', aspect: 'wide', format: 'jpg', hue: 10, motif: 'frame' },
  { filename: 'feature_map.jpg',        title: '8282 SANTA MONICA BLVD', subtitle: 'Map · placeholder',     aspect: 'wide', format: 'jpg', hue: 0,  motif: 'dotgrid' },
]

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

const DIMS: Record<Aspect, { w: number; h: number }> = {
  wide:     { w: 2000, h: 1125 }, // 16:9
  square:   { w: 1500, h: 1500 },
  portrait: { w: 1200, h: 1500 }, // 4:5
  banner:   { w: 1200, h: 630 },  // OG / Twitter card
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/**
 * Derives 4-stop charcoal-to-gold gradient with a small hue shift.
 * Output is always low-luminance — these are dark backgrounds.
 */
function paletteFromHue(hueOffset: number) {
  // Hue offset bends the warm tone slightly. We never push to true cool tones.
  const base = `#0a0a0a`
  const mid  = `#161616`
  const tinted =
    hueOffset < 8
      ? `#1a1614`
      : hueOffset < 18
        ? `#1f160d` // deeper amber
        : hueOffset < 26
          ? `#251a0e`
          : `#2a1d0d`
  return { base, mid, tinted }
}

// ---------------------------------------------------------------------------
// SVG composition
// ---------------------------------------------------------------------------

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function motifSvg(motif: PlaceholderSpec['motif'], w: number, h: number): string {
  if (!motif) return ''
  const cx = w / 2
  const cy = h / 2

  switch (motif) {
    case 'horizon':
      // A faint warm haze along the lower third + a single thin gold horizon line.
      return `
        <ellipse cx="${cx}" cy="${h * 0.78}" rx="${w * 0.55}" ry="${h * 0.18}" fill="#3a280f" opacity="0.45" />
        <line x1="${w * 0.18}" y1="${h * 0.62}" x2="${w * 0.82}" y2="${h * 0.62}" stroke="#D4AF37" stroke-width="1" opacity="0.35" />
      `
    case 'arch':
      // Soft archway silhouette — two columns with a top arc.
      return `
        <g fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.28">
          <path d="M ${w * 0.32} ${h * 0.85} L ${w * 0.32} ${h * 0.32} A ${w * 0.18} ${h * 0.18} 0 0 1 ${w * 0.68} ${h * 0.32} L ${w * 0.68} ${h * 0.85}" />
        </g>
        <ellipse cx="${cx}" cy="${h * 0.45}" rx="${w * 0.32}" ry="${h * 0.32}" fill="#211810" opacity="0.55" />
      `
    case 'frame':
      // Inner gold rectangle frame at 78% of canvas.
      return `
        <rect x="${w * 0.11}" y="${h * 0.11}" width="${w * 0.78}" height="${h * 0.78}"
              fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.28" />
      `
    case 'circle':
      // Concentric thin circles, golden, evoking craft / lineage.
      return `
        <g fill="none" stroke="#D4AF37" opacity="0.22">
          <circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.22}" stroke-width="1" />
          <circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.30}" stroke-width="0.7" />
          <circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.40}" stroke-width="0.5" />
        </g>
      `
    case 'dotgrid':
      // Subtle dotted grid overlay.
      return `
        <pattern id="dotgrid" patternUnits="userSpaceOnUse" width="40" height="40">
          <circle cx="20" cy="20" r="1" fill="#D4AF37" opacity="0.18" />
        </pattern>
        <rect x="${w * 0.12}" y="${h * 0.18}" width="${w * 0.76}" height="${h * 0.64}" fill="url(#dotgrid)" />
      `
  }
}

function placeholderSvg(spec: PlaceholderSpec): string {
  const { w, h } = DIMS[spec.aspect]
  const { base, mid, tinted } = paletteFromHue(spec.hue)
  const cx = w / 2
  const cy = h / 2

  const titleSize = spec.aspect === 'banner' ? 72 : Math.round(w * 0.038)
  const subtitleSize = spec.aspect === 'banner' ? 22 : Math.round(w * 0.0125)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="${mid}" />
      <stop offset="0.55" stop-color="${tinted}" />
      <stop offset="1"   stop-color="${base}" />
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
      <stop offset="0"   stop-color="#000" stop-opacity="0" />
      <stop offset="1"   stop-color="#000" stop-opacity="0.55" />
    </radialGradient>
    <pattern id="grain" patternUnits="userSpaceOnUse" width="3" height="3">
      <circle cx="1.5" cy="1.5" r="0.4" fill="#ffffff" opacity="0.018" />
    </pattern>
  </defs>

  <!-- gradient backdrop -->
  <rect width="${w}" height="${h}" fill="url(#bg)" />
  <!-- film grain -->
  <rect width="${w}" height="${h}" fill="url(#grain)" />
  <!-- vignette -->
  <rect width="${w}" height="${h}" fill="url(#vignette)" />

  <!-- motif silhouette -->
  ${motifSvg(spec.motif, w, h)}

  <!-- gold corner ticks -->
  <g stroke="#D4AF37" stroke-width="1.4" fill="none" opacity="0.7">
    <path d="M 60 110 L 60 60 L 110 60" />
    <path d="M ${w - 110} 60 L ${w - 60} 60 L ${w - 60} 110" />
    <path d="M 60 ${h - 110} L 60 ${h - 60} L 110 ${h - 60}" />
    <path d="M ${w - 110} ${h - 60} L ${w - 60} ${h - 60} L ${w - 60} ${h - 110}" />
  </g>

  <!-- thin gold rule under the title -->
  <line x1="${cx - 90}" y1="${cy + 20}" x2="${cx + 90}" y2="${cy + 20}"
        stroke="#D4AF37" stroke-width="1" opacity="0.85" />

  <!-- title -->
  <text x="${cx}" y="${cy - 4}" text-anchor="middle"
        fill="#D4AF37" font-family="Georgia, 'Playfair Display', 'Times New Roman', serif"
        font-size="${titleSize}" font-style="italic" letter-spacing="2">
    ${escapeXml(spec.title)}
  </text>

  <!-- subtitle -->
  <text x="${cx}" y="${cy + 60}" text-anchor="middle"
        fill="#9a8b5d" font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="${subtitleSize}" letter-spacing="6">
    ${escapeXml(spec.subtitle.toUpperCase())}
  </text>

  <!-- bottom watermark -->
  <text x="${cx}" y="${h - 90}" text-anchor="middle"
        fill="#5a5040" font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="14" letter-spacing="6">
    PLACEHOLDER · REPLACE WITH REAL PHOTO
  </text>
</svg>`
}

// ---------------------------------------------------------------------------
// Rasterize
// ---------------------------------------------------------------------------

async function rasterizeSpec(spec: PlaceholderSpec): Promise<Buffer> {
  const svg = placeholderSvg(spec)
  const pipeline = sharp(Buffer.from(svg))
  if (spec.format === 'png') {
    return pipeline.png({ quality: 92, compressionLevel: 9 }).toBuffer()
  }
  return pipeline.flatten({ background: '#0a0a0a' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function ensureSeedDir(): Promise<void> {
  await fs.mkdir(SEED_DIR, { recursive: true })
}

/**
 * Generate any placeholder files in DEFAULT_PLACEHOLDERS that don't yet exist
 * on disk. Returns the list of files that were created (or replaced if force).
 */
export async function ensureSeedPlaceholders(opts?: {
  force?: boolean
  specs?: PlaceholderSpec[]
}): Promise<{ created: string[]; kept: string[] }> {
  await ensureSeedDir()
  const force = Boolean(opts?.force)
  const specs = opts?.specs ?? DEFAULT_PLACEHOLDERS
  const created: string[] = []
  const kept: string[] = []

  for (const spec of specs) {
    const fullPath = path.join(SEED_DIR, spec.filename)
    if (!force) {
      try {
        await fs.access(fullPath)
        kept.push(spec.filename)
        continue
      } catch {
        // file doesn't exist — fall through and generate
      }
    }
    const buf = await rasterizeSpec(spec)
    await fs.writeFile(fullPath, buf)
    created.push(spec.filename)
  }

  return { created, kept }
}

