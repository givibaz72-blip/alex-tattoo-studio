/**
 * Pure seed logic — accepts a ready Payload instance.
 * Used by app/(payload)/api/seed/route.ts.
 *
 * Idempotent:
 *  - styles, artists, works are skipped (or updated, for works) if they exist
 *  - inquiries are deduped by (name, contact)
 *  - siteSettings global: only fills empty fields, never overwrites edits
 *
 * Pages are NOT created here — they live in `scripts/seed-blocks.ts` because
 * the Pages collection uses a `blocks` field rather than a rich-text `content`
 * field. Page seeding runs in a separate pass (after media-seed) so block
 * images can resolve to real media IDs.
 */

// ---------------------------------------------------------------------------
// Safety limits to prevent infinite loops
// ---------------------------------------------------------------------------

const MAX_SLUG_SUFFIX = 10

// ---------------------------------------------------------------------------
// Lexical rich-text helpers (used for artist long bio)
// ---------------------------------------------------------------------------

function leaf(text: string) {
  return { type: 'text', format: 0, style: '', mode: 'normal', detail: 0, version: 1, text }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    children: [leaf(text)],
  }
}

function richDoc(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => paragraph(text)),
    },
  }
}

function richText(...paragraphs: string[]) {
  return richDoc(paragraphs)
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

// IMPORTANT: The `styles` collection has a `beforeChange` hook that
// auto-generates `slug` from `name` on every create. We must therefore make
// sure each `name` slugifies into exactly the `slug` value we use as a
// reference key everywhere else (artist.styleSlugs, work.styleSlugs).
// That means names cannot contain `/` or `&` (which would produce extra
// hyphens). Simple, single-word names below stay safe.
const STYLES = [
  { slug: 'fine-line', name: 'Fine Line', description: 'Single-needle, hair-thin lines used for delicate florals, micro portraits, and minimal symbols. Heals soft, ages gracefully when placed away from constant friction. One of the most-requested styles in the US.' },
  { slug: 'blackwork', name: 'Blackwork', description: 'Bold, high-contrast designs done entirely in solid black ink — sleeves, panels, ornamental pieces. Reads strong from across a room and ages exceptionally well.' },
  { slug: 'american-traditional', name: 'American Traditional', description: 'The Sailor Jerry lineage: thick black outlines, limited bright palette (red, yellow, green), iconic motifs like daggers, eagles, roses, and panthers. Built to last decades.' },
  { slug: 'neo-traditional', name: 'Neo-Traditional', description: 'Evolution of American Traditional with a wider color range, refined shading, and decorative ornamentation. Big in modern portrait and animal pieces.' },
  { slug: 'realism', name: 'Realism', description: 'Photo-accurate portraits, animals, and objects. Black-and-grey or color. Requires longer sessions and a clean canvas — most realism artists book months out.' },
  { slug: 'japanese', name: 'Japanese', description: 'Traditional Japanese (Irezumi) imagery — koi, dragons, hannya masks, peonies, wind bars and clouds. Designed as full-body compositions; works best as sleeves, back, or chest panels.' },
  { slug: 'geometric', name: 'Geometric', description: 'Sacred geometry, mandalas, dotwork patterns. Precision-driven. Often combined with blackwork or fine line for a contemporary look.' },
  { slug: 'dotwork', name: 'Dotwork', description: 'Imagery built from thousands of stippled dots instead of solid fills. Soft, painterly transitions; pairs naturally with geometric and ornamental work.' },
  { slug: 'minimalism', name: 'Minimalism', description: 'Stripped-down symbols, single shapes, tiny scripts. Quiet pieces that read as personal markers rather than statements.' },
  { slug: 'dark-art', name: 'Dark Art', description: 'Horror, gothic, occult and surreal imagery — etching-inspired linework, heavy shading, unsettling subjects. Strong narrative pieces.' },
  { slug: 'lettering', name: 'Lettering', description: 'Typography-first work: hand-drawn scripts, blackletter, Gothic, calligraphic phrases. Composition and letter spacing matter as much as the words themselves.' },
  { slug: 'watercolor', name: 'Watercolor', description: 'Painterly washes of color, splashes and bleeds, often without traditional outlines. Stunning fresh, but technique and placement matter for longevity.' },
]

type ArtistSeed = {
  slug: string
  name: string
  role: string
  shortBio: string
  longBio: string[]
  styleSlugs: string[]
  social: Record<string, string | undefined>
  availability: 'open' | 'waitlist' | 'closed'
  featured: boolean
  order: number
}

const ARTISTS: ArtistSeed[] = [
  {
    slug: 'marcus-reyes',
    name: 'Marcus "Wolfheart" Reyes',
    role: 'Lead Artist — Neo-Traditional & American Traditional',
    shortBio: 'Twelve years of bold-line work out of Brooklyn. Specializes in mythic animals, daggers and roses with a modern color palette.',
    longBio: [
      'Marcus "Wolfheart" Reyes apprenticed in a Bushwick shop in 2013 and has been resident at Aurora & Ash since 2024. His work is rooted in the American Traditional canon — strong black outlines, deliberate composition, a tight palette — but reaches into Neo-Traditional territory with extra color depth and ornamental detail.',
      'He is best known for animal portraiture (wolves, panthers, eagles, ravens) and large-scale chest plates that read as a single composition. Marcus prefers to design custom pieces from a brief conversation rather than working off references; expect a 3-week waitlist.',
      'Outside the studio, Marcus paints oils and runs a small printing press releasing limited flash sheets each season.',
    ],
    styleSlugs: ['neo-traditional', 'american-traditional', 'blackwork'],
    social: { instagram: '@wolfheart.tattoo', website: 'marcusreyes.art', email: 'marcus@auroraash.com' },
    availability: 'waitlist', featured: true, order: 10,
  },
  {
    slug: 'elena-voss',
    name: 'Elena Voss',
    role: 'Fine Line · Floral · Botanical',
    shortBio: 'Single-needle florals, herbarium studies, and ornamental linework. Quiet pieces with surgical precision.',
    longBio: [
      'Elena trained as a botanical illustrator in Vienna before transitioning to tattooing in 2019. Her practice draws on 19th-century herbarium plates: precise stems, dotted texture, soft anatomical accuracy. The result is jewelry-like work that sits beautifully on forearms, ribs, sternum and behind-ear placements.',
      'She accepts custom flower commissions, symbolic plant collections (birth flowers, family bouquets), and ornamental scripts. Most pieces are completed in a single 1–3 hour session.',
      'Elena is a strong advocate for healed-skin photography — every published image on her Instagram is shot at minimum six months after the session.',
    ],
    styleSlugs: ['fine-line', 'minimalism', 'dotwork'],
    social: { instagram: '@elena.voss.ink', tiktok: '@elenavossink', email: 'elena@auroraash.com' },
    availability: 'open', featured: true, order: 20,
  },
  {
    slug: 'kai-nakamura',
    name: 'Kai Nakamura',
    role: 'Japanese · Irezumi · Large-Scale',
    shortBio: 'Full sleeves, back pieces, and body suits in the traditional Japanese idiom. Long-term collaborations only.',
    longBio: [
      'Kai studied under a Yokohama-based horishi for six years before relocating to the United States in 2021. His work follows traditional Irezumi composition rules — wind bars, clouds, water, seasonal motifs — applied at the scale of full sleeves, back panels, and complete body suits.',
      'Because of the scale and discipline of his work, Kai only accepts long-term clients. A typical project runs 8–24 sessions over 12–18 months, with monthly bookings.',
      'Initial consultations include a discussion of motif symbolism, composition flow with the body, and a written project proposal. He does not take walk-ins or single-session pieces.',
    ],
    styleSlugs: ['japanese', 'blackwork'],
    social: { instagram: '@kai.nakamura.horishi', website: 'kainakamura.studio', email: 'kai@auroraash.com' },
    availability: 'waitlist', featured: true, order: 30,
  },
  {
    slug: 'riley-obrien',
    name: "Riley O'Brien",
    role: 'Blackwork · Geometric · Dotwork',
    shortBio: 'Sacred geometry, mandalas, and graphic blackwork. Comfortable on any placement, sleeves a specialty.',
    longBio: [
      `Riley's practice sits at the intersection of mathematical pattern and bold blackwork. They build mandalas around natural lines of the body — rib lines, deltoid curves, spinal columns — so the design feels grown into the placement rather than stamped onto it.`,
      'They take both small standalone pieces and large composition work, and often collaborate with other artists in the studio for mixed-style sleeves.',
      `Riley keeps Tuesday afternoons reserved for free in-person consultations; book through the Inquiry form and mention "Tuesday".`,
    ],
    styleSlugs: ['blackwork', 'geometric', 'dotwork'],
    social: { instagram: '@riley.geometric', tiktok: '@rileyobrien.ink', telegram: '@rileyobrien', email: 'riley@auroraash.com' },
    availability: 'open', featured: true, order: 40,
  },
  {
    slug: 'sofia-mendez',
    name: 'Sofia Mendez',
    role: 'Lettering · Script · Calligraphy',
    shortBio: 'Hand-drawn typography for personal phrases, blackletter compositions, and ornamental scripts.',
    longBio: [
      'Sofia is a trained calligrapher with a decade of work in editorial design and packaging before moving into tattooing in 2022. Every script she tattoos is hand-drawn from scratch in pencil, then translated to skin at the consultation — no fonts, no AI, no generic flourishes.',
      'She works in blackletter, modern Spencerian script, brush calligraphy, and Cyrillic and Latin alphabets. Best for forearm phrases, collarbone lines, ribcage lyrics, and the inside of biceps.',
      `Bring a draft of the words and a story behind them. Sofia's consultations focus on letter spacing, character emphasis, and how the phrase reads at arm's length vs. up close.`,
    ],
    styleSlugs: ['lettering', 'fine-line'],
    social: { instagram: '@sofia.mendez.script', email: 'sofia@auroraash.com' },
    availability: 'open', featured: true, order: 50,
  },
]

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

const SITE_SETTINGS = {
  phone: '+1 (323) 555-0190',
  email: 'hello@auroraash.com',
  address: '8282 Santa Monica Blvd\nWest Hollywood, CA 90046',
  hours: 'Mon — Sun: 12 PM — 8 PM (By Appointment Only)',
  social: {
    instagram: '@aurora_ash_tattoo',
    tiktok: '@aurora_ash_tattoo',
    telegram: '',
    whatsapp: '',
  },
}

// ---------------------------------------------------------------------------
// Works (artist + metadata only — images attached by media-seed)
// ---------------------------------------------------------------------------

type WorkSeed = {
  artistSlug: string
  title: string
  description?: string
  styleSlugs: string[]
  placement: string
  size: string
  year: number
  featured: boolean
}

const WORKS: WorkSeed[] = [
  // Marcus "Wolfheart" Reyes — Neo-Traditional / American Traditional
  { artistSlug: 'marcus-reyes', title: 'Lone Wolf Chest Plate', description: 'Full chest piece, neo-traditional wolf with mountain backdrop and single moon. 14-hour project across three sessions.', styleSlugs: ['neo-traditional', 'american-traditional'], placement: 'Chest', size: '12 × 10 in', year: 2025, featured: true },
  { artistSlug: 'marcus-reyes', title: 'Dagger and Rose', description: 'Classic American Traditional dagger crossed with a banded rose. Forearm placement, single 5-hour session.', styleSlugs: ['american-traditional'], placement: 'Inner forearm', size: '7 × 4 in', year: 2025, featured: false },
  { artistSlug: 'marcus-reyes', title: 'Eagle and Anchor Sleeve', description: 'Half sleeve composition — eagle in flight over an anchor with rope detail. Solid black outlines, limited red and yellow palette.', styleSlugs: ['american-traditional', 'blackwork'], placement: 'Upper arm', size: 'Half sleeve', year: 2024, featured: true },
  { artistSlug: 'marcus-reyes', title: 'Panther Leap', description: 'Neo-traditional black panther mid-leap with deep shading and ornamental backdrop. One of his signature compositions.', styleSlugs: ['neo-traditional'], placement: 'Outer thigh', size: '10 × 8 in', year: 2024, featured: false },
  { artistSlug: 'marcus-reyes', title: 'Raven and Crescent', description: 'Single raven perched on a crescent moon, classic Sailor Jerry palette with extended grey shading.', styleSlugs: ['neo-traditional'], placement: 'Calf', size: '8 × 6 in', year: 2025, featured: false },
  { artistSlug: 'marcus-reyes', title: 'Mountain Compass', description: 'Geometric compass over layered mountain ridges, bold black with deep teal accent.', styleSlugs: ['blackwork', 'neo-traditional'], placement: 'Bicep', size: '6 × 6 in', year: 2024, featured: false },

  // Elena Voss — Fine Line / Floral
  { artistSlug: 'elena-voss', title: 'Wild Carrot Stem', description: 'Single-needle Daucus carota stem with full umbel — delicate dotwork on the heads, soft stippling on the leaves. Two-hour single session.', styleSlugs: ['fine-line', 'dotwork'], placement: 'Inner forearm', size: '6 × 1.5 in', year: 2025, featured: true },
  { artistSlug: 'elena-voss', title: 'Birth Flower Bouquet', description: 'Custom commission — three birth flowers (peony, daffodil, larkspur) tied with a single ribbon. Fine line throughout.', styleSlugs: ['fine-line'], placement: 'Sternum', size: '5 × 4 in', year: 2025, featured: true },
  { artistSlug: 'elena-voss', title: 'Behind-Ear Wildflower', description: 'Tiny single-stem cornflower behind the ear — the kind of placement that disappears with hair down and reappears in summer.', styleSlugs: ['fine-line', 'minimalism'], placement: 'Behind ear', size: '1.5 × 0.5 in', year: 2025, featured: false },
  { artistSlug: 'elena-voss', title: 'Herbarium Page', description: 'Composition modeled on a 19th-century herbarium plate — three pressed flowers with hand-drawn taxonomic labels in Latin.', styleSlugs: ['fine-line', 'lettering'], placement: 'Outer thigh', size: '8 × 5 in', year: 2024, featured: false },
  { artistSlug: 'elena-voss', title: 'Snake and Magnolia', description: 'A single-line magnolia branch wrapped by a small viper. Quiet, narrative, the snake almost hidden in the negative space.', styleSlugs: ['fine-line'], placement: 'Ribcage', size: '7 × 4 in', year: 2024, featured: false },

  // Kai Nakamura — Japanese / Irezumi
  { artistSlug: 'kai-nakamura', title: 'Koi and Wave Sleeve', description: 'Full sleeve — ascending koi against traditional wave pattern with chrysanthemum accents. 11 sessions over 9 months.', styleSlugs: ['japanese'], placement: 'Full sleeve', size: 'Full arm', year: 2025, featured: true },
  { artistSlug: 'kai-nakamura', title: 'Hannya Mask Back Panel', description: 'Hannya mask centered on the upper back with cherry blossom drift and traditional cloud pattern. Ongoing project, 14 sessions in.', styleSlugs: ['japanese'], placement: 'Upper back', size: '20 × 16 in', year: 2025, featured: true },
  { artistSlug: 'kai-nakamura', title: 'Dragon and Pearl', description: 'Coiled black-ink dragon clutching a single red pearl. Composition wraps from shoulder around to chest.', styleSlugs: ['japanese', 'blackwork'], placement: 'Shoulder & chest', size: '18 × 14 in', year: 2024, featured: true },
  { artistSlug: 'kai-nakamura', title: 'Peony and Leaf Cluster', description: 'Standalone peony composition with traditional leaf detail. Bridge piece on a larger ongoing back project.', styleSlugs: ['japanese'], placement: 'Lower back', size: '8 × 7 in', year: 2024, featured: false },
  { artistSlug: 'kai-nakamura', title: 'Tiger and Bamboo', description: 'Tiger emerging from a bamboo grove with cloud and wind-bar fill. Outer thigh placement, classic composition.', styleSlugs: ['japanese'], placement: 'Outer thigh', size: '14 × 10 in', year: 2024, featured: false },

  // Riley O'Brien — Blackwork / Geometric / Dotwork
  { artistSlug: 'riley-obrien', title: 'Spinal Mandala', description: 'Symmetrical mandala running along the spine — point-balanced from neck to lower back. Three sessions, full dotwork shading.', styleSlugs: ['geometric', 'dotwork', 'blackwork'], placement: 'Full back / spine', size: '24 × 6 in', year: 2025, featured: true },
  { artistSlug: 'riley-obrien', title: 'Sacred Geometry Sleeve', description: 'Half sleeve built around the Flower of Life with concentric ornamental rings. Solid blackwork with controlled negative space.', styleSlugs: ['geometric', 'blackwork'], placement: 'Half sleeve', size: 'Bicep to wrist', year: 2025, featured: true },
  { artistSlug: 'riley-obrien', title: 'Forearm Mandala', description: 'Single mandala that follows the natural taper of the forearm — tighter pattern at the wrist, opening at the elbow.', styleSlugs: ['geometric', 'dotwork'], placement: 'Forearm', size: '10 × 4 in', year: 2024, featured: false },
  { artistSlug: 'riley-obrien', title: 'Dotwork Moon Phase', description: 'Eight phases of the moon rendered entirely in graduated dotwork. Subtle, almost printed look.', styleSlugs: ['dotwork', 'minimalism'], placement: 'Forearm band', size: '12 × 1.5 in', year: 2024, featured: false },
  { artistSlug: 'riley-obrien', title: 'Geometric Wolf', description: 'Wolf head broken into geometric facets with solid black fill. A geometric take on a classic motif.', styleSlugs: ['geometric', 'blackwork'], placement: 'Outer shoulder', size: '8 × 6 in', year: 2024, featured: false },

  // Sofia Mendez — Lettering / Script
  { artistSlug: 'sofia-mendez', title: 'Spencerian Forearm Phrase', description: 'Hand-drawn Spencerian script — "still I rise" — across the inner forearm. Custom letter construction, no fonts.', styleSlugs: ['lettering', 'fine-line'], placement: 'Inner forearm', size: '7 × 1.5 in', year: 2025, featured: true },
  { artistSlug: 'sofia-mendez', title: 'Blackletter Collarbone', description: 'Blackletter composition along the collarbone — dense, gothic, with extended swashes. Single 4-hour session.', styleSlugs: ['lettering', 'blackwork'], placement: 'Collarbone', size: '8 × 1 in', year: 2025, featured: true },
  { artistSlug: 'sofia-mendez', title: 'Cyrillic Brush Script', description: 'Russian-language quote in modern brush calligraphy. Loose, painterly, with deliberate ink-pull texture.', styleSlugs: ['lettering'], placement: 'Inner bicep', size: '6 × 2 in', year: 2024, featured: false },
  { artistSlug: 'sofia-mendez', title: 'Ribcage Lyric', description: 'Long single-line lyric down the ribcage in modern script. The kind of piece that asks for a 90-minute session and a steady jaw.', styleSlugs: ['lettering'], placement: 'Ribcage', size: '10 × 1 in', year: 2024, featured: false },
  { artistSlug: 'sofia-mendez', title: 'Bilingual Family Names', description: 'Two family names — one in Latin script, one in Cyrillic — balanced as a single composition on the inside of the bicep.', styleSlugs: ['lettering', 'fine-line'], placement: 'Inner bicep', size: '5 × 3 in', year: 2025, featured: false },
]

// ---------------------------------------------------------------------------
// Sample inquiries (showcase + admin demo)
// ---------------------------------------------------------------------------

type InquirySeed = {
  name: string
  contact: string
  artistSlug?: string
  vision: string
  placement: string
  size: string
  status: 'new' | 'contacted' | 'scheduled' | 'done' | 'declined'
  ageConfirmed: boolean
  privacyConsent: boolean
}

const INQUIRIES: InquirySeed[] = [
  {
    name: 'Hannah Park',
    contact: 'hannah.park@email.com',
    artistSlug: 'elena-voss',
    vision:
      'Looking for a small fine-line bouquet on the sternum — three birth flowers for my sisters. Saw the "Birth Flower Bouquet" piece on the site and would love something in that vein.',
    placement: 'Sternum',
    size: '4 × 4 in',
    status: 'new',
    ageConfirmed: true,
    privacyConsent: true,
  },
  {
    name: 'Daniel Voss',
    contact: '+1 (310) 555-0184',
    artistSlug: 'marcus-reyes',
    vision:
      'Half sleeve — American Traditional, classic motifs (eagle, dagger, rose), willing to take 2-3 sessions. Available weekends.',
    placement: 'Upper arm / shoulder',
    size: 'Half sleeve',
    status: 'contacted',
    ageConfirmed: true,
    privacyConsent: true,
  },
  {
    name: 'Aiko Tanaka',
    contact: 'Telegram: @aiko_t',
    artistSlug: 'kai-nakamura',
    vision:
      'Koi and wave back panel, eventually expanding to full back. Understands this is a multi-session project — very serious.',
    placement: 'Full back',
    size: 'Back panel',
    status: 'scheduled',
    ageConfirmed: true,
    privacyConsent: true,
  },
  {
    name: 'Marcus Lee',
    contact: 'marcus.l@email.com',
    vision:
      'A small dragon on the side of my neck. I am 22 and this would be my first tattoo.',
    placement: 'Side of neck',
    size: '3 × 2 in',
    status: 'declined',
    ageConfirmed: true,
    privacyConsent: true,
  },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

export type SeedResult = {
  styles: string[]
  artists: string[]
  works: string[]
  inquiries: string[]
  studioInfo: boolean
  skipped: {
    styles: string[]
    artists: string[]
    works: string[]
    inquiries: string[]
  }
  workErrors?: Array<{ work: string; error: string; stack?: string }>
  artistIdsBySlug: Record<string, any>
}

export async function runSeed(payload: any): Promise<SeedResult> {
  const created: SeedResult = {
    styles: [],
    artists: [],
    works: [],
    inquiries: [],
    studioInfo: false,
    skipped: {
      styles: [],
      artists: [],
      works: [],
      inquiries: [],
    },
    artistIdsBySlug: {},
  }

  // ---- STYLES ----
  // The Styles collection has a beforeChange hook that auto-generates `slug`
  // from `name` on creation. We pass `slug` explicitly (so it's never empty
  // and the validation can't fail), but also index the result map by BOTH
  // our canonical slug and the doc's actual slug — that way downstream
  // lookups by artistSeed.styleSlugs / workSeed.styleSlugs always resolve,
  // even if the hook normalizes the slug to a different value.
  const styleIdsBySlug: Record<string, any> = {}
  for (const s of STYLES) {
    try {
      const existing = await payload.find({
        collection: 'styles',
        where: { slug: { equals: s.slug } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        styleIdsBySlug[s.slug] = existing.docs[0].id
        if (typeof existing.docs[0].slug === 'string') {
          styleIdsBySlug[existing.docs[0].slug] = existing.docs[0].id
        }
        created.skipped.styles.push(s.slug)
        continue
      }
      const doc = await payload.create({
        collection: 'styles',
        data: { slug: s.slug, name: s.name, description: s.description },
        locale: 'en',
      })
      styleIdsBySlug[s.slug] = doc.id
      if (typeof doc.slug === 'string' && doc.slug !== s.slug) {
        styleIdsBySlug[doc.slug] = doc.id
      }
      created.styles.push(s.slug)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed] Style create failed:', {
        slug: s.slug,
        name: s.name,
        message: error.message,
        stack: error.stack,
      })
      created.skipped.styles.push(`${s.slug} (FAILED: ${error.message.slice(0, 120)})`)
    }
  }

  // ---- ARTISTS ----
  const artistIdsBySlug: Record<string, any> = {}
  for (const a of ARTISTS) {
    try {
      const existing = await payload.find({
        collection: 'artists',
        where: { slug: { equals: a.slug } },
        limit: 1,
        draft: true,
      })
      if (existing.docs.length > 0) {
        artistIdsBySlug[a.slug] = existing.docs[0].id
        created.skipped.artists.push(a.slug)
        continue
      }
      const styleIds = a.styleSlugs.map((sl) => styleIdsBySlug[sl]).filter(Boolean)
      const doc = await payload.create({
        collection: 'artists',
        data: {
          name: a.name,
          slug: a.slug,
          role: a.role,
          shortBio: a.shortBio,
          longBio: richText(...a.longBio),
          styles: styleIds,
          social: a.social,
          availability: a.availability,
          featured: a.featured,
          order: a.order,
          _status: 'published',
        },
        locale: 'en',
      })
      artistIdsBySlug[a.slug] = doc.id
      created.artists.push(a.slug)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed] Artist create failed:', {
        slug: a.slug,
        name: a.name,
        message: error.message,
        stack: error.stack,
        errorName: error.name,
      })
      created.skipped.artists.push(`${a.slug} :: ${a.name} (FAILED: ${error.message.slice(0, 120)})`)
    }
  }

  // Re-resolve IDs for artists that already existed (the loop above stored
  // their IDs in `artistIdsBySlug`, but defensively pick up any missed).
  for (const a of ARTISTS) {
    if (!artistIdsBySlug[a.slug]) {
      const r = await payload.find({
        collection: 'artists',
        where: { slug: { equals: a.slug } },
        limit: 1,
        draft: true,
      })
      if (r.docs[0]) artistIdsBySlug[a.slug] = r.docs[0].id
    }
  }
  created.artistIdsBySlug = artistIdsBySlug

  // ---- WORKS ----
  const workErrors: Array<{ work: string; error: string; stack?: string }> = []
  for (const w of WORKS) {
    const artistId = artistIdsBySlug[w.artistSlug]
    if (!artistId) {
      created.skipped.works.push(`${w.artistSlug} :: ${w.title} (artist missing)`)
      continue
    }

    try {
      const { generateSlug } = await import('../lib/slug')
      const baseSlug = generateSlug(w.title)
      let slug = baseSlug
      let suffix = 2
      while (suffix <= MAX_SLUG_SUFFIX) {
        const conflict = await payload.find({
          collection: 'works',
          where: { slug: { equals: slug } },
          limit: 1,
          draft: true,
        })
        if (conflict.docs.length === 0) break
        const same =
          conflict.docs[0].artist === artistId ||
          (typeof conflict.docs[0].artist === 'object' && conflict.docs[0].artist?.id === artistId)
        if (same && conflict.docs[0].title === w.title) break
        slug = `${baseSlug}-${suffix++}`
      }

      const styleIds = w.styleSlugs.map((sl) => styleIdsBySlug[sl]).filter(Boolean)

      const existing = await payload.find({
        collection: 'works',
        where: {
          and: [
            { artist: { equals: artistId } },
            { title: { equals: w.title } },
          ],
        },
        limit: 1,
        draft: true,
      })

      if (existing.docs.length > 0) {
        const existingWork = existing.docs[0]
        // Only update text fields here; image attachment is handled by media-seed.
        await payload.update({
          collection: 'works',
          id: existingWork.id,
          data: {
            title: w.title,
            slug,
            artist: artistId,
            description: w.description,
            styles: styleIds,
            placement: w.placement,
            size: w.size,
            year: w.year,
            featured: w.featured,
          },
          locale: 'en',
        })
        created.skipped.works.push(`${w.artistSlug} :: ${w.title} (updated)`)
      } else {
        // Create as DRAFT — `images` is a required-when-published field, but
        // can be empty in a draft. Media-seed will attach images and publish.
        await payload.create({
          collection: 'works',
          data: {
            title: w.title,
            slug,
            artist: artistId,
            description: w.description,
            styles: styleIds,
            placement: w.placement,
            size: w.size,
            year: w.year,
            featured: w.featured,
            _status: 'draft',
          },
          locale: 'en',
        })
        created.works.push(`${w.artistSlug} :: ${w.title}`)
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed] Work upsert failed:', {
        work: `${w.artistSlug} :: ${w.title}`,
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
      workErrors.push({
        work: `${w.artistSlug} :: ${w.title}`,
        error: error.message,
        stack: error.stack,
      })
      created.skipped.works.push(`${w.artistSlug} :: ${w.title} (FAILED: ${error.message.slice(0, 120)})`)
    }
  }
  if (workErrors.length > 0) {
    created.workErrors = workErrors
  }

  // ---- INQUIRIES (sample showroom data) ----
  for (const i of INQUIRIES) {
    try {
      const existing = await payload.find({
        collection: 'inquiries',
        where: {
          and: [
            { name: { equals: i.name } },
            { contact: { equals: i.contact } },
          ],
        },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        created.skipped.inquiries.push(i.name)
        continue
      }
      const artistId = i.artistSlug ? artistIdsBySlug[i.artistSlug] : undefined
      await payload.create({
        collection: 'inquiries',
        data: {
          name: i.name,
          contact: i.contact,
          artist: artistId,
          vision: i.vision,
          placement: i.placement,
          size: i.size,
          status: i.status,
          ageConfirmed: i.ageConfirmed,
          privacyConsent: i.privacyConsent,
        },
      })
      created.inquiries.push(i.name)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed] Inquiry create failed:', {
        inquiryName: i.name,
        contact: i.contact,
        message: error.message,
        stack: error.stack,
        errorName: error.name,
      })
      created.skipped.inquiries.push(`${i.name} (FAILED: ${error.message.slice(0, 120)})`)
    }
  }

  // ---- SITE SETTINGS (global, fill-empty only) ----
  try {
    const current = (await payload.findGlobal({ slug: 'siteSettings' })) as any
    const patch: Record<string, any> = {}

    if (!current?.phone) patch.phone = SITE_SETTINGS.phone
    if (!current?.email) patch.email = SITE_SETTINGS.email
    if (!current?.address) patch.address = SITE_SETTINGS.address
    if (!current?.hours) patch.hours = SITE_SETTINGS.hours

    const social = current?.social ?? {}
    const newSocial: Record<string, string> = {}
    if (!social.instagram) newSocial.instagram = SITE_SETTINGS.social.instagram
    if (!social.tiktok) newSocial.tiktok = SITE_SETTINGS.social.tiktok
    if (!social.telegram) newSocial.telegram = SITE_SETTINGS.social.telegram
    if (!social.whatsapp) newSocial.whatsapp = SITE_SETTINGS.social.whatsapp
    if (Object.keys(newSocial).length > 0) {
      patch.social = { ...social, ...newSocial }
    }

    if (Object.keys(patch).length > 0) {
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: patch,
        locale: 'en',
      })
      created.studioInfo = true
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[seed] Site settings global update failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
  }

  return created
}

