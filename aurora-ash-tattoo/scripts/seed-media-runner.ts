/**
 * Media seed.
 *
 * Runs in two passes:
 *
 *   1. Page-level media (hero, parallax, image-feature) — uploaded into the
 *      Media collection so blocks in `pages` can reference them by ID.
 *   2. Artist + work media — attached to the Artists / Works collections.
 *
 * Source files come from `public/seed-images/`. Anything missing is generated
 * on the fly as a tasteful charcoal+gold placeholder via Sharp.
 *
 * Returns a `mediaIdsByFilename` map so the page-block seeder can resolve
 * `imageFile: 'studio_hero.png'` references to real media IDs.
 *
 * Idempotent:
 *  - media is matched by filename in DB; existing records are reused.
 *  - existing artist/work fields are NOT overwritten if already set.
 *  - `siteSettings.heroImage` is filled only if currently empty.
 */

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

import { DEFAULT_PLACEHOLDERS, ensureSeedPlaceholders } from './generate-placeholders'

const SEED_DIR = path.join(process.cwd(), 'public', 'seed-images')

// ---------------------------------------------------------------------------
// Page-level media targets
// ---------------------------------------------------------------------------
//
// Filenames here MUST match the `imageFile` values used in `scripts/seed-blocks.ts`.
// They are uploaded to the Media collection and their IDs are returned in the
// `mediaIdsByFilename` map used by the page-block seeder.
//
// `assignToSiteSettings` marks the file used as the global hero image — it
// fills `siteSettings.heroImage` only if currently empty.

type PageMediaTarget = {
  file: string
  alt: string
  ratio: 'square' | 'portrait' | 'wide' | 'banner'
  placeholderTitle: string
  placeholderSubtitle: string
  assignToSiteSettings?: 'heroImage' | 'footerLogo'
}

const PAGE_MEDIA_TARGETS: PageMediaTarget[] = [
  // hero / studio
  { file: 'studio_hero.png',        alt: 'Aurora & Ash studio interior — placeholder', ratio: 'wide',     placeholderTitle: 'AURORA & ASH', placeholderSubtitle: 'Home hero · placeholder', assignToSiteSettings: 'heroImage' },
  { file: 'studio_philosophy.png',  alt: 'Studio interior, soft daylight — placeholder', ratio: 'portrait', placeholderTitle: 'PHILOSOPHY', placeholderSubtitle: 'About hero · placeholder' },

  // parallax
  { file: 'parallax_studio.jpg',    alt: 'Studio interior — parallax placeholder',    ratio: 'wide', placeholderTitle: 'A PRIVATE GALLERY', placeholderSubtitle: 'Studio · placeholder' },
  { file: 'parallax_craft.jpg',     alt: 'Tools and craft — parallax placeholder',    ratio: 'wide', placeholderTitle: 'CRAFT · LINEAGE',   placeholderSubtitle: 'Process · placeholder' },
  { file: 'parallax_cta.jpg',       alt: 'CTA backdrop — parallax placeholder',       ratio: 'wide', placeholderTitle: 'BEGIN A PROJECT',   placeholderSubtitle: 'CTA · placeholder' },
  { file: 'parallax_aftercare.jpg', alt: 'Aftercare backdrop — parallax placeholder', ratio: 'wide', placeholderTitle: 'AFTERCARE',         placeholderSubtitle: 'Healing · placeholder' },
  { file: 'parallax_contact.jpg',   alt: 'West Hollywood — parallax placeholder',     ratio: 'wide', placeholderTitle: 'WEST HOLLYWOOD',    placeholderSubtitle: 'Visit · placeholder' },

  // image features
  { file: 'feature_room.jpg',       alt: 'Studio floor — image feature placeholder',  ratio: 'wide', placeholderTitle: 'STUDIO FLOOR',      placeholderSubtitle: 'Image feature · placeholder' },
  { file: 'feature_work.jpg',       alt: 'Selected work — image feature placeholder', ratio: 'wide', placeholderTitle: 'SELECTED WORK',     placeholderSubtitle: 'Image feature · placeholder' },
  { file: 'feature_aftercare.jpg',  alt: 'Healed at six months — placeholder',        ratio: 'wide', placeholderTitle: 'HEALED AT 6 MONTHS', placeholderSubtitle: 'Image feature · placeholder' },
  { file: 'feature_map.jpg',        alt: '8282 Santa Monica Blvd — placeholder',      ratio: 'wide', placeholderTitle: '8282 SANTA MONICA',  placeholderSubtitle: 'Map · placeholder' },

  // share image
  { file: 'og_image.png',           alt: 'Aurora & Ash — Open Graph share',           ratio: 'banner', placeholderTitle: 'AURORA & ASH', placeholderSubtitle: 'OG · placeholder' },
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
  { artistSlug: 'marcus-reyes',  file: 'marcus_portrait.jpg', field: 'portrait',  alt: 'Marcus "Wolfheart" Reyes — portrait', placeholderTitle: 'MARCUS REYES' },
  { artistSlug: 'marcus-reyes',  file: 'marcus_cover.png',    field: 'heroImage', alt: 'Marcus Reyes — cover',                placeholderTitle: 'MARCUS · COVER' },
  { artistSlug: 'elena-voss',    file: 'elena_portrait.jpg',  field: 'portrait',  alt: 'Elena Voss — portrait',               placeholderTitle: 'ELENA VOSS' },
  { artistSlug: 'elena-voss',    file: 'elena_cover.png',     field: 'heroImage', alt: 'Elena Voss — cover',                  placeholderTitle: 'ELENA · COVER' },
  { artistSlug: 'kai-nakamura',  file: 'kai_portrait.jpg',    field: 'portrait',  alt: 'Kai Nakamura — portrait',             placeholderTitle: 'KAI NAKAMURA' },
  { artistSlug: 'kai-nakamura',  file: 'kai_cover.png',       field: 'heroImage', alt: 'Kai Nakamura — cover',                placeholderTitle: 'KAI · COVER' },
  { artistSlug: 'riley-obrien',  file: 'riley_portrait.jpg',  field: 'portrait',  alt: "Riley O'Brien — portrait",            placeholderTitle: "RILEY O'BRIEN" },
  { artistSlug: 'riley-obrien',  file: 'riley_cover.png',     field: 'heroImage', alt: "Riley O'Brien — cover",               placeholderTitle: 'RILEY · COVER' },
  { artistSlug: 'sofia-mendez',  file: 'sofia_portrait.jpg',  field: 'portrait',  alt: 'Sofia Mendez — portrait',             placeholderTitle: 'SOFIA MENDEZ' },
  { artistSlug: 'sofia-mendez',  file: 'sofia_cover.png',     field: 'heroImage', alt: 'Sofia Mendez — cover',                placeholderTitle: 'SOFIA · COVER' },
]

// ---------------------------------------------------------------------------
// Work images — each work gets ONE image (real or placeholder)
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
// Inline placeholder generator (used for artist/work files that aren't in
// generate-placeholders.ts's DEFAULT list).
// ---------------------------------------------------------------------------

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function inlinePlaceholderSvg(
  title: string,
  subtitle: string,
  ratio: 'square' | 'portrait' | 'wide' | 'banner',
) {
  const dims =
    ratio === 'wide'     ? { w: 2000, h: 1125 } :
    ratio === 'portrait' ? { w: 1200, h: 1500 } :
    ratio === 'banner'   ? { w: 1200, h: 630 } :
                           { w: 1500, h: 1500 }

  const cx = dims.w / 2
  const cy = dims.h / 2
  const titleSize = ratio === 'banner' ? 64 : Math.round(dims.w * 0.04)
  const subSize = ratio === 'banner' ? 20 : Math.round(dims.w * 0.013)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.w} ${dims.h}" width="${dims.w}" height="${dims.h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#181818"/>
      <stop offset="0.5" stop-color="#1a1410"/>
      <stop offset="1" stop-color="#0a0a0a"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  <rect width="${dims.w}" height="${dims.h}" fill="url(#bg)"/>
  <rect width="${dims.w}" height="${dims.h}" fill="url(#vignette)"/>

  <g stroke="#D4AF37" stroke-width="1.4" fill="none" opacity="0.6">
    <path d="M 60 110 L 60 60 L 110 60"/>
    <path d="M ${dims.w - 110} 60 L ${dims.w - 60} 60 L ${dims.w - 60} 110"/>
    <path d="M 60 ${dims.h - 110} L 60 ${dims.h - 60} L 110 ${dims.h - 60}"/>
    <path d="M ${dims.w - 110} ${dims.h - 60} L ${dims.w - 60} ${dims.h - 60} L ${dims.w - 60} ${dims.h - 110}"/>
  </g>

  <line x1="${cx - 90}" y1="${cy + 20}" x2="${cx + 90}" y2="${cy + 20}" stroke="#D4AF37" stroke-width="1" opacity="0.85"/>

  <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#D4AF37"
        font-family="Georgia, 'Playfair Display', 'Times New Roman', serif"
        font-size="${titleSize}" font-style="italic" letter-spacing="2">
    ${escapeXml(title)}
  </text>

  <text x="${cx}" y="${cy + 60}" text-anchor="middle" fill="#9a8b5d"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="${subSize}" letter-spacing="6">
    ${escapeXml(subtitle.toUpperCase())}
  </text>

  <text x="${cx}" y="${dims.h - 90}" text-anchor="middle" fill="#5a5040"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="14" letter-spacing="6">
    PLACEHOLDER · REPLACE WITH REAL PHOTO
  </text>
</svg>`
}

async function generateInlinePlaceholder(
  title: string,
  subtitle: string,
  ratio: 'square' | 'portrait' | 'wide' | 'banner',
  format: 'png' | 'jpg' = 'png',
) {
  const svg = inlinePlaceholderSvg(title, subtitle, ratio)
  const pipeline = sharp(Buffer.from(svg))
  if (format === 'png') {
    return pipeline.png({ quality: 92, compressionLevel: 9 }).toBuffer()
  }
  return pipeline.flatten({ background: '#0a0a0a' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
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
  placeholder: { title: string; subtitle: string; ratio: 'square' | 'portrait' | 'wide' | 'banner' },
): Promise<{ buffer: Buffer; mimetype: string; name: string; isPlaceholder: boolean }> {
  const fullPath = path.join(SEED_DIR, filename)
  try {
    const buffer = await fs.readFile(fullPath)
    return { buffer, mimetype: mimeFromName(filename), name: filename, isPlaceholder: false }
  } catch {
    const ext = filename.split('.').pop()?.toLowerCase()
    const format: 'png' | 'jpg' = ext === 'jpg' || ext === 'jpeg' ? 'jpg' : 'png'
    const buffer = await generateInlinePlaceholder(placeholder.title, placeholder.subtitle, placeholder.ratio, format)
    // Keep the original filename so look-ups by name still resolve.
    return { buffer, mimetype: mimeFromName(filename), name: filename, isPlaceholder: true }
  }
}

// ---------------------------------------------------------------------------
// Payload helpers
// ---------------------------------------------------------------------------

async function uploadOrFindMedia(
  payload: any,
  filename: string,
  alt: string,
  placeholder: { title: string; subtitle: string; ratio: 'square' | 'portrait' | 'wide' | 'banner' },
): Promise<{ id: any; isPlaceholder: boolean; finalName: string }> {
  // Check whether media with this filename already exists.
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return { id: existing.docs[0].id, isPlaceholder: false, finalName: filename }
  }

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

export type MediaSeedResult = {
  /** Map filename → media doc id, used by the page-block seeder to resolve
   *  `imageFile: 'studio_hero.png'` to a real ID. */
  mediaIdsByFilename: Record<string, string | number>
  generatedPlaceholders: { created: string[]; kept: string[] }
  uploaded: string[]
  pageMedia: string[]
  artists: string[]
  works: string[]
  placeholders: string[]
  skipped: string[]
}

export async function runMediaSeed(payload: any): Promise<MediaSeedResult> {
  const result: MediaSeedResult = {
    mediaIdsByFilename: {},
    generatedPlaceholders: { created: [], kept: [] },
    uploaded: [],
    pageMedia: [],
    artists: [],
    works: [],
    placeholders: [],
    skipped: [],
  }

  // 0) Make sure all default placeholder files exist on disk.
  result.generatedPlaceholders = await ensureSeedPlaceholders()

  // ----------------- 1) PAGE-LEVEL MEDIA (hero / parallax / feature / og) -----------------
  for (const t of PAGE_MEDIA_TARGETS) {
    const upload = await uploadOrFindMedia(payload, t.file, t.alt, {
      title: t.placeholderTitle,
      subtitle: t.placeholderSubtitle,
      ratio: t.ratio,
    })
    result.mediaIdsByFilename[t.file] = upload.id
    result.uploaded.push(upload.finalName)
    if (upload.isPlaceholder) result.placeholders.push(upload.finalName)
    result.pageMedia.push(`${t.file} → ${upload.id}${upload.isPlaceholder ? ' [PLACEHOLDER]' : ''}`)

    // Optional binding to siteSettings global.
    if (t.assignToSiteSettings) {
      try {
        const settings = (await payload.findGlobal({ slug: 'siteSettings' })) as any
        const currentValue = settings?.[t.assignToSiteSettings]
        if (!currentValue) {
          await payload.updateGlobal({
            slug: 'siteSettings',
            data: { [t.assignToSiteSettings]: upload.id },
            locale: 'en',
          })
          result.pageMedia.push(`siteSettings.${t.assignToSiteSettings} ← ${t.file}`)
        } else {
          result.skipped.push(`siteSettings.${t.assignToSiteSettings} already set`)
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('[seed-media] siteSettings update failed:', {
          field: t.assignToSiteSettings,
          message: error.message,
          stack: error.stack,
        })
      }
    }
  }

  // ----------------- 2) ARTIST IMAGES -----------------
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

  const artistUpdates: Record<string, Record<string, any>> = {}

  for (const a of ARTIST_IMAGES) {
    const ratio: 'square' | 'portrait' | 'wide' = a.field === 'heroImage' ? 'wide' : 'portrait'
    const upload = await uploadOrFindMedia(payload, a.file, a.alt, {
      title: a.placeholderTitle,
      subtitle: a.field === 'portrait' ? 'Artist portrait' : 'Artist cover',
      ratio,
    })
    if (upload.isPlaceholder) result.placeholders.push(upload.finalName)
    result.mediaIdsByFilename[a.file] = upload.id
    result.uploaded.push(upload.finalName)

    const artist = await getArtist(a.artistSlug)
    if (!artist) {
      result.skipped.push('artist not found: ' + a.artistSlug)
      continue
    }

    const currentVal = artist[a.field]
    if (currentVal) {
      result.skipped.push(`${a.artistSlug}.${a.field} already set`)
      continue
    }

    artistUpdates[a.artistSlug] = artistUpdates[a.artistSlug] ?? {}
    artistUpdates[a.artistSlug][a.field] = upload.id
    result.artists.push(`${a.artistSlug}.${a.field} ← ${upload.finalName}`)
  }

  for (const [slug, patch] of Object.entries(artistUpdates)) {
    const artist = await getArtist(slug)
    if (!artist) continue
    try {
      await payload.update({
        collection: 'artists',
        id: artist.id,
        data: { ...patch, _status: 'published' },
        locale: 'en',
        draft: false,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed-media] artist update failed:', { slug, message: error.message })
      result.skipped.push(`${slug} update failed: ${error.message}`)
    }
  }

  // ----------------- 3) WORK IMAGES -----------------
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

    const hasImages = Array.isArray(work.images) && work.images.length > 0 && work.images[0]?.image
    const isPublished = (work as any)._status === 'published'
    if (hasImages && isPublished) {
      result.skipped.push(`work already filled: ${w.workTitle}`)
      continue
    }

    const upload = await uploadOrFindMedia(payload, w.file, `${w.workTitle} — by ${w.artistDisplay}`, {
      title: w.workTitle,
      subtitle: w.artistDisplay,
      ratio: 'square',
    })
    if (upload.isPlaceholder) result.placeholders.push(upload.finalName)
    result.mediaIdsByFilename[w.file] = upload.id

    const newImages = hasImages
      ? work.images
      : [{ image: upload.id, caption: '' }]

    try {
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
      result.works.push(`${w.workTitle} ← ${upload.finalName}${upload.isPlaceholder ? ' [PLACEHOLDER]' : ''}`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed-media] work update failed:', { workTitle: w.workTitle, message: error.message })
      result.skipped.push(`${w.workTitle} update failed: ${error.message}`)
    }
  }

  // Reference unused export to keep the placeholder spec list reachable for
  // downstream tooling.
  void DEFAULT_PLACEHOLDERS

  return result
}
