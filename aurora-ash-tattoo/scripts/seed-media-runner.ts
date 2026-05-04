/**
 * Media seed - uploads images from public/seed-images and attaches them to:
 *  - studio global (heroImage, about.image)
 *  - each artist (portrait, heroImage)
 *  - each draft work (images[0]) and publishes it
 *
 * For missing files, generates a tasteful SVG placeholder rendered to PNG via Sharp.
 *
 * Idempotent:
 *  - media is matched by filename in DB; existing records are reused
 *  - existing studio/artist/work fields are NOT overwritten if already set
 */

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const SEED_DIR = path.join(process.cwd(), 'public', 'seed-images')

// ---------------------------------------------------------------------------
// Studio images
// ---------------------------------------------------------------------------

const STUDIO_TARGETS = [
  {
    file: 'studio_hero.png',
    field: 'heroImage' as const,
    alt: 'Aurora & Ash studio interior - West Hollywood',
    placeholder: { title: 'STUDIO HERO', subtitle: 'Home page background' },
  },
  {
    file: 'studio_philosophy.png',
    field: 'about.image' as const,
    alt: 'A quiet corner of the Aurora & Ash studio',
    placeholder: { title: 'PHILOSOPHY', subtitle: 'About-section image' },
  },
] as const

// We also accept og_image - just upload to media library, no auto-attachment.
const EXTRA_MEDIA = [
  { file: 'og_image.png', alt: 'Aurora & Ash - West Hollywood Tattoo Studio' },
]

// ---------------------------------------------------------------------------
// Artist images
// ---------------------------------------------------------------------------

const ARTIST_IMAGES: Array<{
  artistSlug: string
  file: string
  field: 'portrait' | 'heroImage'
  alt: string
  placeholderTitle: string
}> = [
  { artistSlug: 'marcus-reyes',  file: 'marcus_portrait.jpg', field: 'portrait',  alt: 'Marcus "Wolfheart" Reyes - portrait', placeholderTitle: 'MARCUS REYES' },
  { artistSlug: 'marcus-reyes',  file: 'marcus_cover.png',    field: 'heroImage', alt: 'Marcus Reyes - cover',                placeholderTitle: 'MARCUS — COVER' },
  { artistSlug: 'elena-voss',    file: 'elena_portrait.jpg',  field: 'portrait',  alt: 'Elena Voss - portrait',               placeholderTitle: 'ELENA VOSS' },
  { artistSlug: 'elena-voss',    file: 'elena_cover.png',     field: 'heroImage', alt: 'Elena Voss - cover',                  placeholderTitle: 'ELENA — COVER' },
  { artistSlug: 'kai-nakamura',  file: 'kai_portrait.jpg',    field: 'portrait',  alt: 'Kai Nakamura - portrait',             placeholderTitle: 'KAI NAKAMURA' },
  { artistSlug: 'kai-nakamura',  file: 'kai_cover.png',       field: 'heroImage', alt: 'Kai Nakamura - cover',                placeholderTitle: 'KAI — COVER' },
  { artistSlug: 'riley-obrien',  file: 'riley_portrait.jpg',  field: 'portrait',  alt: "Riley O'Brien - portrait",            placeholderTitle: "RILEY O'BRIEN" },
  { artistSlug: 'riley-obrien',  file: 'riley_cover.png',     field: 'heroImage', alt: "Riley O'Brien - cover",               placeholderTitle: 'RILEY — COVER' },
  { artistSlug: 'sofia-mendez',  file: 'sofia_portrait.jpg',  field: 'portrait',  alt: 'Sofia Mendez - portrait',             placeholderTitle: 'SOFIA MENDEZ' },
  { artistSlug: 'sofia-mendez',  file: 'sofia_cover.png',     field: 'heroImage', alt: 'Sofia Mendez - cover',                placeholderTitle: 'SOFIA — COVER' },
]

// ---------------------------------------------------------------------------
// Work images - each work gets ONE image (real or placeholder)
// ---------------------------------------------------------------------------

const WORK_IMAGES: Array<{
  artistSlug: string
  workTitle: string
  file: string
  artistDisplay: string
}> = [
  // Marcus
  { artistSlug: 'marcus-reyes', workTitle: 'Lone Wolf Chest Plate',  file: 'marcus_lone-wolf-chest.jpg',     artistDisplay: 'Marcus Reyes' },
  { artistSlug: 'marcus-reyes', workTitle: 'Dagger and Rose',         file: 'marcus_dagger-rose.jpg',          artistDisplay: 'Marcus Reyes' },
  { artistSlug: 'marcus-reyes', workTitle: 'Eagle and Anchor Sleeve', file: 'marcus_eagle-anchor-sleeve.jpg',  artistDisplay: 'Marcus Reyes' },
  { artistSlug: 'marcus-reyes', workTitle: 'Panther Leap',            file: 'marcus_panther-leap.jpg',         artistDisplay: 'Marcus Reyes' },
  { artistSlug: 'marcus-reyes', workTitle: 'Raven and Crescent',      file: 'marcus_raven-crescent.jpg',       artistDisplay: 'Marcus Reyes' },
  { artistSlug: 'marcus-reyes', workTitle: 'Mountain Compass',        file: 'marcus_mountain-compass.jpg',     artistDisplay: 'Marcus Reyes' },

  // Elena
  { artistSlug: 'elena-voss', workTitle: 'Wild Carrot Stem',          file: 'elena_wild-carrot.jpg',           artistDisplay: 'Elena Voss' },
  { artistSlug: 'elena-voss', workTitle: 'Birth Flower Bouquet',      file: 'elena_birth-flower-bouquet.jpg',  artistDisplay: 'Elena Voss' },
  { artistSlug: 'elena-voss', workTitle: 'Behind-Ear Wildflower',     file: 'elena_behind-ear-flower.jpg',     artistDisplay: 'Elena Voss' },
  { artistSlug: 'elena-voss', workTitle: 'Herbarium Page',            file: 'elena_herbarium-page.jpg',        artistDisplay: 'Elena Voss' },
  { artistSlug: 'elena-voss', workTitle: 'Snake and Magnolia',        file: 'elena_snake-magnolia.jpg',        artistDisplay: 'Elena Voss' },

  // Kai
  { artistSlug: 'kai-nakamura', workTitle: 'Koi and Wave Sleeve',     file: 'kai_koi-wave-sleeve.jpg',         artistDisplay: 'Kai Nakamura' },
  { artistSlug: 'kai-nakamura', workTitle: 'Hannya Mask Back Panel',  file: 'kai_hannya-back.jpg',             artistDisplay: 'Kai Nakamura' },
  { artistSlug: 'kai-nakamura', workTitle: 'Dragon and Pearl',        file: 'kai_dragon-pearl.jpg',            artistDisplay: 'Kai Nakamura' },
  { artistSlug: 'kai-nakamura', workTitle: 'Peony and Leaf Cluster',  file: 'kai_peony-leaf.jpg',              artistDisplay: 'Kai Nakamura' },
  { artistSlug: 'kai-nakamura', workTitle: 'Tiger and Bamboo',        file: 'kai_tiger-bamboo.jpg',            artistDisplay: 'Kai Nakamura' },

  // Riley
  { artistSlug: 'riley-obrien', workTitle: 'Spinal Mandala',          file: 'riley_spinal-mandala.jpg',        artistDisplay: "Riley O'Brien" },
  { artistSlug: 'riley-obrien', workTitle: 'Sacred Geometry Sleeve',  file: 'riley_sacred-geometry-sleeve.jpg', artistDisplay: "Riley O'Brien" },
  { artistSlug: 'riley-obrien', workTitle: 'Forearm Mandala',         file: 'riley_forearm-mandala.jpg',       artistDisplay: "Riley O'Brien" },
  { artistSlug: 'riley-obrien', workTitle: 'Dotwork Moon Phase',      file: 'riley_dotwork-moon-phases.jpg',   artistDisplay: "Riley O'Brien" },
  { artistSlug: 'riley-obrien', workTitle: 'Geometric Wolf',          file: 'riley_geometric-wolf.jpg',        artistDisplay: "Riley O'Brien" },

  // Sofia
  { artistSlug: 'sofia-mendez', workTitle: 'Spencerian Forearm Phrase', file: 'sofia_spencerian-forearm.jpg',     artistDisplay: 'Sofia Mendez' },
  { artistSlug: 'sofia-mendez', workTitle: 'Blackletter Collarbone',    file: 'sofia_blackletter-collarbone.jpg', artistDisplay: 'Sofia Mendez' },
  { artistSlug: 'sofia-mendez', workTitle: 'Cyrillic Brush Script',     file: 'sofia_cyrillic-brush.jpg',         artistDisplay: 'Sofia Mendez' },
  { artistSlug: 'sofia-mendez', workTitle: 'Ribcage Lyric',             file: 'sofia_ribcage-lyric.jpg',          artistDisplay: 'Sofia Mendez' },
  { artistSlug: 'sofia-mendez', workTitle: 'Bilingual Family Names',    file: 'sofia_bilingual-bicep.jpg',        artistDisplay: 'Sofia Mendez' },
]

// ---------------------------------------------------------------------------
// Placeholder generator
// ---------------------------------------------------------------------------

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function placeholderSvg(title: string, subtitle: string, opts?: { ratio?: 'square' | 'portrait' | 'wide' }) {
  const ratio = opts?.ratio ?? 'square'
  const dims =
    ratio === 'wide'     ? { w: 2000, h: 1125 } :
    ratio === 'portrait' ? { w: 1200, h: 1500 } :
                           { w: 1500, h: 1500 }

  const cx = dims.w / 2
  const cy = dims.h / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.w} ${dims.h}" width="${dims.w}" height="${dims.h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#161616"/>
      <stop offset="1" stop-color="#0c0c0c"/>
    </linearGradient>
    <pattern id="grain" patternUnits="userSpaceOnUse" width="3" height="3">
      <circle cx="1.5" cy="1.5" r="0.4" fill="#ffffff" opacity="0.025"/>
    </pattern>
  </defs>
  <rect width="${dims.w}" height="${dims.h}" fill="url(#bg)"/>
  <rect width="${dims.w}" height="${dims.h}" fill="url(#grain)"/>
  <rect x="60" y="60" width="${dims.w - 120}" height="${dims.h - 120}" fill="none" stroke="#2a2a2a" stroke-width="1"/>

  <!-- corner ticks -->
  <g stroke="#D4AF37" stroke-width="1.5" fill="none">
    <path d="M 80 140 L 80 80 L 140 80"/>
    <path d="M ${dims.w - 140} 80 L ${dims.w - 80} 80 L ${dims.w - 80} 140"/>
    <path d="M 80 ${dims.h - 140} L 80 ${dims.h - 80} L 140 ${dims.h - 80}"/>
    <path d="M ${dims.w - 140} ${dims.h - 80} L ${dims.w - 80} ${dims.h - 80} L ${dims.w - 80} ${dims.h - 140}"/>
  </g>

  <!-- + center mark -->
  <g stroke="#D4AF37" stroke-width="2" opacity="0.55">
    <line x1="${cx}" y1="${cy - 60}" x2="${cx}" y2="${cy + 60}"/>
    <line x1="${cx - 60}" y1="${cy}" x2="${cx + 60}" y2="${cy}"/>
  </g>

  <!-- title -->
  <text x="${cx}" y="${cy + 200}" text-anchor="middle" fill="#D4AF37"
        font-family="Georgia, 'Times New Roman', serif" font-size="56" font-style="italic">
    ${escapeXml(title)}
  </text>

  <!-- subtitle -->
  <text x="${cx}" y="${cy + 250}" text-anchor="middle" fill="#9a9a9a"
        font-family="Arial, Helvetica, sans-serif" font-size="20" letter-spacing="6">
    ${escapeXml(subtitle.toUpperCase())}
  </text>

  <!-- bottom watermark -->
  <text x="${cx}" y="${dims.h - 110}" text-anchor="middle" fill="#5a5a5a"
        font-family="Arial, Helvetica, sans-serif" font-size="14" letter-spacing="5">
    PLACEHOLDER · REPLACE WITH REAL PHOTO
  </text>
</svg>`
}

async function generatePlaceholderPng(title: string, subtitle: string, ratio: 'square' | 'portrait' | 'wide' = 'square') {
  const svg = placeholderSvg(title, subtitle, { ratio })
  const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer()
  return png
}

// ---------------------------------------------------------------------------
// File reader: returns either real file buffer or generated placeholder
// ---------------------------------------------------------------------------

function mimeFromName(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'avif') return 'image/avif'
  return 'image/png'
}

async function loadImageOrPlaceholder(
  filename: string,
  placeholder: { title: string; subtitle: string; ratio?: 'square' | 'portrait' | 'wide' },
): Promise<{ buffer: Buffer; mimetype: string; name: string; isPlaceholder: boolean }> {
  const fullPath = path.join(SEED_DIR, filename)
  try {
    const buffer = await fs.readFile(fullPath)
    return { buffer, mimetype: mimeFromName(filename), name: filename, isPlaceholder: false }
  } catch {
    const buffer = await generatePlaceholderPng(placeholder.title, placeholder.subtitle, placeholder.ratio ?? 'square')
    // Save as .png placeholder so we can spot them later
    const placeholderName = filename.replace(/\.\w+$/, '.png')
    return { buffer, mimetype: 'image/png', name: placeholderName, isPlaceholder: true }
  }
}

// ---------------------------------------------------------------------------
// Payload helpers
// ---------------------------------------------------------------------------

async function uploadOrFindMedia(
  payload: any,
  filename: string,
  alt: string,
  placeholder: { title: string; subtitle: string; ratio?: 'square' | 'portrait' | 'wide' },
): Promise<{ id: any; isPlaceholder: boolean; finalName: string }> {
  // First, check if media with this filename already exists.
  const candidates = [filename, filename.replace(/\.\w+$/, '.png')]
  for (const candidate of candidates) {
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: candidate } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      return { id: existing.docs[0].id, isPlaceholder: candidate.includes('.png') && !filename.endsWith('.png'), finalName: candidate }
    }
  }

  // Otherwise upload (real or placeholder).
  const { buffer, mimetype, name, isPlaceholder } = await loadImageOrPlaceholder(filename, placeholder)
  const doc = await payload.create({
    collection: 'media',
    data: { alt: alt + (isPlaceholder ? ' (placeholder)' : '') },
    file: { data: buffer, mimetype, name, size: buffer.length },
  })
  return { id: doc.id, isPlaceholder, finalName: name }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function runMediaSeed(payload: any) {
  const result = {
    studio: [] as string[],
    artists: [] as string[],
    works: [] as string[],
    extras: [] as string[],
    placeholders: [] as string[],
    skipped: [] as string[],
  }

  // ---- STUDIO ----
  const studio = (await payload.findGlobal({ slug: 'studio' })) as any
  const studioPatch: Record<string, any> = {}
  let studioChanged = false

  for (const t of STUDIO_TARGETS) {
    const ratio = t.field === 'heroImage' ? 'wide' : 'portrait'
    const upload = await uploadOrFindMedia(payload, t.file, t.alt, {
      title: t.placeholder.title,
      subtitle: t.placeholder.subtitle,
      ratio,
    })
    if (upload.isPlaceholder) result.placeholders.push(upload.finalName)

    // Set only if currently empty.
    if (t.field === 'heroImage') {
      if (!studio?.heroImage) {
        studioPatch.heroImage = upload.id
        studioChanged = true
        result.studio.push('heroImage <- ' + upload.finalName)
      } else {
        result.skipped.push('studio.heroImage already set')
      }
    } else if (t.field === 'about.image') {
      const currentAboutImg = studio?.about?.image
      if (!currentAboutImg) {
        studioPatch.about = { ...(studio?.about ?? {}), image: upload.id }
        studioChanged = true
        result.studio.push('about.image <- ' + upload.finalName)
      } else {
        result.skipped.push('studio.about.image already set')
      }
    }
  }

  if (studioChanged) {
    await payload.updateGlobal({ slug: 'studio', data: studioPatch, locale: 'en' })
  }

  // ---- EXTRAS ----
  for (const e of EXTRA_MEDIA) {
    const upload = await uploadOrFindMedia(payload, e.file, e.alt, {
      title: 'OG IMAGE',
      subtitle: 'Open Graph share preview',
      ratio: 'wide',
    })
    if (upload.isPlaceholder) result.placeholders.push(upload.finalName)
    result.extras.push(e.file)
  }

  // ---- ARTISTS ----
  // Fetch each artist by slug (incl. drafts), update missing image fields.
  const artistCache: Record<string, any> = {}
  async function getArtist(slug: string) {
    if (artistCache[slug]) return artistCache[slug]
    const r = await payload.find({
      collection: 'artists',
      where: { slug: { equals: slug } },
      limit: 1,
      draft: true,
    })
    artistCache[slug] = r.docs[0]
    return artistCache[slug]
  }

  // Group artist updates so we make one update call per artist.
  const artistUpdates: Record<string, Record<string, any>> = {}

  for (const a of ARTIST_IMAGES) {
    const ratio = a.field === 'heroImage' ? 'wide' : 'portrait'
    const upload = await uploadOrFindMedia(payload, a.file, a.alt, {
      title: a.placeholderTitle,
      subtitle: a.field === 'portrait' ? 'Artist portrait' : 'Artist cover',
      ratio,
    })
    if (upload.isPlaceholder) result.placeholders.push(upload.finalName)

    const artist = await getArtist(a.artistSlug)
    if (!artist) {
      result.skipped.push('artist not found: ' + a.artistSlug)
      continue
    }

    // Skip if already set (don't overwrite).
    const currentVal = artist[a.field]
    if (currentVal) {
      result.skipped.push(`${a.artistSlug}.${a.field} already set`)
      continue
    }

    artistUpdates[a.artistSlug] = artistUpdates[a.artistSlug] ?? {}
    artistUpdates[a.artistSlug][a.field] = upload.id
    result.artists.push(`${a.artistSlug}.${a.field} <- ${upload.finalName}`)
  }

  for (const [slug, patch] of Object.entries(artistUpdates)) {
    const artist = await getArtist(slug)
    if (!artist) continue
    await payload.update({
      collection: 'artists',
      id: artist.id,
      data: { ...patch, _status: 'published' },
      locale: 'en',
      draft: false,
    })
  }

  // ---- WORKS ----
  // Find draft works by (artistSlug, title), attach image, publish.
  for (const w of WORK_IMAGES) {
    const artist = await getArtist(w.artistSlug)
    if (!artist) {
      result.skipped.push(`work artist missing: ${w.artistSlug}`)
      continue
    }

    const found = await payload.find({
      collection: 'works',
      where: {
        and: [
          { artist: { equals: artist.id } },
          { title: { equals: w.workTitle } },
        ],
      },
      limit: 1,
      draft: true,
    })
    const work = found.docs[0]
    if (!work) {
      result.skipped.push(`work missing: ${w.artistSlug} :: ${w.workTitle}`)
      continue
    }

    // Skip if already has at least one image AND is published.
    const hasImages = Array.isArray(work.images) && work.images.length > 0 && work.images[0]?.image
    const isPublished = (work as any)._status === 'published'
    if (hasImages && isPublished) {
      result.skipped.push(`work already filled: ${w.workTitle}`)
      continue
    }

    const upload = await uploadOrFindMedia(payload, w.file, `${w.workTitle} - by ${w.artistDisplay}`, {
      title: w.workTitle,
      subtitle: w.artistDisplay,
      ratio: 'square',
    })
    if (upload.isPlaceholder) result.placeholders.push(upload.finalName)

    const newImages = hasImages
      ? work.images
      : [{ image: upload.id, caption: '' }]

    await payload.update({
      collection: 'works',
      id: work.id,
      data: {
        images: newImages,
        _status: 'published',
      },
      locale: 'en',
      draft: false,
    })
    result.works.push(`${w.workTitle} <- ${upload.finalName}${upload.isPlaceholder ? ' [PLACEHOLDER]' : ''}`)
  }

  return result
}
