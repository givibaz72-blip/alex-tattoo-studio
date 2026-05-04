/**
 * Pure seed logic - accepts a ready Payload instance.
 * Used by app/(payload)/api/seed/route.ts.
 *
 * Idempotent: skips items that already exist (by slug, or by deterministic key).
 * Studio global: fills only empty fields (never overwrites user edits).
 */

// ---------------------------------------------------------------------------
// Safety limits to prevent infinite loops
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 5 // Maximum iterations for any loop (prevents infinite loops)
const MAX_SLUG_SUFFIX = 10 // Maximum suffix attempts for slug uniqueness

// ---------------------------------------------------------------------------
// Lexical rich-text builder
// ---------------------------------------------------------------------------

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }

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

function heading(tag: 'h2' | 'h3', text: string) {
  return {
    type: 'heading',
    tag,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [leaf(text)],
  }
}

function listItem(text: string, value: number) {
  return {
    type: 'listitem',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    value,
    children: [leaf(text)],
  }
}

function list(listType: 'bullet' | 'number', items: string[]) {
  return {
    type: 'list',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    listType,
    start: 1,
    tag: listType === 'bullet' ? 'ul' : 'ol',
    children: items.map((it, i) => listItem(it, i + 1)),
  }
}

function richDoc(blocks: Block[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: blocks.map((b) => {
        switch (b.kind) {
          case 'p':
            return paragraph(b.text)
          case 'h2':
            return heading('h2', b.text)
          case 'h3':
            return heading('h3', b.text)
          case 'ul':
            return list('bullet', b.items)
          case 'ol':
            return list('number', b.items)
        }
      }),
    },
  }
}

// Backwards-compatible: paragraphs only.
function richText(...paragraphs: string[]) {
  return richDoc(paragraphs.map((text) => ({ kind: 'p' as const, text })))
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const STYLES = [
  { slug: 'fine-line', name: 'Fine Line', description: 'Single-needle, hair-thin lines used for delicate florals, micro portraits, and minimal symbols. Heals soft, ages gracefully when placed away from constant friction. One of the most-requested styles in the US.' },
  { slug: 'blackwork', name: 'Blackwork', description: 'Bold, high-contrast designs done entirely in solid black ink - sleeves, panels, ornamental pieces. Reads strong from across a room and ages exceptionally well.' },
  { slug: 'american-traditional', name: 'American Traditional', description: 'The Sailor Jerry lineage: thick black outlines, limited bright palette (red, yellow, green), iconic motifs like daggers, eagles, roses, and panthers. Built to last decades.' },
  { slug: 'neo-traditional', name: 'Neo-Traditional', description: 'Evolution of American Traditional with a wider color range, refined shading, and decorative ornamentation. Big in modern portrait and animal pieces.' },
  { slug: 'realism', name: 'Realism', description: 'Photo-accurate portraits, animals, and objects. Black-and-grey or color. Requires longer sessions and a clean canvas - most realism artists book months out.' },
  { slug: 'japanese', name: 'Japanese / Irezumi', description: 'Traditional Japanese imagery - koi, dragons, hannya masks, peonies, wind bars and clouds. Designed as full-body compositions; works best as sleeves, back, or chest panels.' },
  { slug: 'geometric', name: 'Geometric', description: 'Sacred geometry, mandalas, dotwork patterns. Precision-driven. Often combined with blackwork or fine line for a contemporary look.' },
  { slug: 'dotwork', name: 'Dotwork', description: 'Imagery built from thousands of stippled dots instead of solid fills. Soft, painterly transitions; pairs naturally with geometric and ornamental work.' },
  { slug: 'minimalism', name: 'Minimalism', description: 'Stripped-down symbols, single shapes, tiny scripts. Quiet pieces that read as personal markers rather than statements.' },
  { slug: 'dark-art', name: 'Dark Art', description: 'Horror, gothic, occult and surreal imagery - etching-inspired linework, heavy shading, unsettling subjects. Strong narrative pieces.' },
  { slug: 'lettering', name: 'Lettering & Script', description: 'Typography-first work: hand-drawn scripts, blackletter, Gothic, calligraphic phrases. Composition and letter spacing matter as much as the words themselves.' },
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
    role: 'Lead Artist - Neo-Traditional & American Traditional',
    shortBio: 'Twelve years of bold-line work out of Brooklyn. Specializes in mythic animals, daggers and roses with a modern color palette.',
    longBio: [
      'Marcus "Wolfheart" Reyes apprenticed in a Bushwick shop in 2013 and has been resident at Aurora & Ash since 2024. His work is rooted in the American Traditional canon - strong black outlines, deliberate composition, a tight palette - but reaches into Neo-Traditional territory with extra color depth and ornamental detail.',
      'He is best known for animal portraiture (wolves, panthers, eagles, ravens) and large-scale chest plates that read as a single composition. Marcus prefers to design custom pieces from a brief conversation rather than working off references; expect a 3-week waitlist.',
      'Outside the studio, Marcus paints oils and runs a small printing press releasing limited flash sheets each season.',
    ],
    styleSlugs: ['neo-traditional', 'american-traditional', 'blackwork'],
    social: { instagram: '@wolfheart.tattoo', website: 'marcusreyes.art', email: 'marcus@aurora-ash.com' },
    availability: 'waitlist', featured: true, order: 10,
  },
  {
    slug: 'elena-voss',
    name: 'Elena Voss',
    role: 'Fine Line - Floral - Botanical',
    shortBio: 'Single-needle florals, herbarium studies, and ornamental linework. Quiet pieces with surgical precision.',
    longBio: [
      'Elena trained as a botanical illustrator in Vienna before transitioning to tattooing in 2019. Her practice draws on 19th-century herbarium plates: precise stems, dotted texture, soft anatomical accuracy. The result is jewelry-like work that sits beautifully on forearms, ribs, sternum and behind-ear placements.',
      'She accepts custom flower commissions, symbolic plant collections (birth flowers, family bouquets), and ornamental scripts. Most pieces are completed in a single 1-3 hour session.',
      'Elena is a strong advocate for healed-skin photography - every published image on her Instagram is shot at minimum six months after the session.',
    ],
    styleSlugs: ['fine-line', 'minimalism', 'dotwork'],
    social: { instagram: '@elena.voss.ink', tiktok: '@elenavossink', email: 'elena@aurora-ash.com' },
    availability: 'open', featured: true, order: 20,
  },
  {
    slug: 'kai-nakamura',
    name: 'Kai Nakamura',
    role: 'Japanese - Irezumi - Large-Scale',
    shortBio: 'Full sleeves, back pieces, and body suits in the traditional Japanese idiom. Long-term collaborations only.',
    longBio: [
      'Kai studied under a Yokohama-based horishi for six years before relocating to the United States in 2021. His work follows traditional Irezumi composition rules - wind bars, clouds, water, seasonal motifs - applied at the scale of full sleeves, back panels, and complete body suits.',
      'Because of the scale and discipline of his work, Kai only accepts long-term clients. A typical project runs 8-24 sessions over 12-18 months, with monthly bookings.',
      'Initial consultations include a discussion of motif symbolism, composition flow with the body, and a written project proposal. He does not take walk-ins or single-session pieces.',
    ],
    styleSlugs: ['japanese', 'blackwork'],
    social: { instagram: '@kai.nakamura.horishi', website: 'kainakamura.studio', email: 'kai@aurora-ash.com' },
    availability: 'waitlist', featured: true, order: 30,
  },
  {
    slug: 'riley-obrien',
    name: "Riley O'Brien",
    role: 'Blackwork - Geometric - Dotwork',
    shortBio: 'Sacred geometry, mandalas, and graphic blackwork. Comfortable on any placement, sleeves a specialty.',
    longBio: [
      `Riley's practice sits at the intersection of mathematical pattern and bold blackwork. They build mandalas around natural lines of the body - rib lines, deltoid curves, spinal columns - so the design feels grown into the placement rather than stamped onto it.`,
      'They take both small standalone pieces and large composition work, and often collaborate with other artists in the studio for mixed-style sleeves.',
      `Riley keeps Tuesday afternoons reserved for free in-person consultations; book through the Inquiry form and mention "Tuesday".`,
    ],
    styleSlugs: ['blackwork', 'geometric', 'dotwork'],
    social: { instagram: '@riley.geometric', tiktok: '@rileyobrien.ink', telegram: '@rileyobrien', email: 'riley@aurora-ash.com' },
    availability: 'open', featured: true, order: 40,
  },
  {
    slug: 'sofia-mendez',
    name: 'Sofia Mendez',
    role: 'Lettering - Script - Calligraphy',
    shortBio: 'Hand-drawn typography for personal phrases, blackletter compositions, and ornamental scripts.',
    longBio: [
      'Sofia is a trained calligrapher with a decade of work in editorial design and packaging before moving into tattooing in 2022. Every script she tattoos is hand-drawn from scratch in pencil, then translated to skin at the consultation - no fonts, no AI, no generic flourishes.',
      'She works in blackletter, modern Spencerian script, brush calligraphy, and Cyrillic and Latin alphabets. Best for forearm phrases, collarbone lines, ribcage lyrics, and the inside of biceps.',
      `Bring a draft of the words and a story behind them. Sofia's consultations focus on letter spacing, character emphasis, and how the phrase reads at arm's length vs. up close.`,
    ],
    styleSlugs: ['lettering', 'fine-line'],
    social: { instagram: '@sofia.mendez.script', email: 'sofia@aurora-ash.com' },
    availability: 'open', featured: false, order: 50,
  },
]

// ---------------------------------------------------------------------------
// Studio info (Los Angeles)
// ---------------------------------------------------------------------------

const STUDIO_INFO = {
  name: 'Aurora & Ash',
  tagline: 'WE FEEL IT',
  philosophy:
    'A private gallery for permanent art. Limited bookings, long consultations, and craftsmanship that ages with you.',
  address: 'Aurora & Ash Tattoo Studio\n827 N La Cienega Blvd, Suite 4\nWest Hollywood, CA 90069\nUnited States',
  phone: '+1 (323) 555-0142',
  email: 'studio@aurora-ash.com',
  hours:
    'Tuesday - Saturday  12:00 - 22:00\nSunday  13:00 - 20:00\nMonday  Closed (private appointments only)\n\nBy appointment - we do not take walk-ins.',
  social: {
    instagram: '@aurora.ash.studio',
    tiktok: '@auroraashstudio',
    telegram: '@auroraashstudio',
    whatsapp: '+13235550142',
  },
  about: {
    eyebrow: 'The Philosophy',
    heading: 'A CURATED SPACE FOR PERMANENT ART',
    body:
      'We accept a limited number of bookings each month so every piece receives absolute focus. Aurora & Ash operates as a private gallery on La Cienega - five resident artists, one shared standard of work. Every consultation is in person, every design is original, every photograph on this site is healed skin.',
  },
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

type PageSeed = {
  slug: string
  title: string
  blocks: Block[]
  seo?: { title?: string; description?: string }
}

const PAGES: PageSeed[] = [
  {
    slug: 'about',
    title: 'About the Studio',
    seo: {
      title: 'About Aurora & Ash - Tattoo Studio in West Hollywood',
      description:
        'Aurora & Ash is a private, appointment-only tattoo studio on La Cienega Blvd in West Hollywood. Five resident artists, one shared standard of work.',
    },
    blocks: [
      {
        kind: 'p',
        text:
          'Aurora & Ash was founded in 2022 on a single idea: tattoos should be made the way private galleries make art - one piece at a time, by people who care about the craft, in a space that respects both the client and the work.',
      },
      { kind: 'h2', text: 'How we work' },
      {
        kind: 'p',
        text:
          'Every piece begins with a conversation. We do not pre-draw stock designs and we do not run flash specials. Each artist takes a maximum of two clients per day so consultations are unhurried, designs are original, and sessions stay focused.',
      },
      {
        kind: 'p',
        text:
          'Our resident artists span Neo-Traditional, Japanese Irezumi, Fine Line, Blackwork, Geometric, Dotwork, and hand-drawn Lettering. We do not chase trends - we work in lineages with documented history, because techniques that have lasted decades are also techniques that age well on skin.',
      },
      { kind: 'h2', text: 'The studio' },
      {
        kind: 'p',
        text:
          'We are located on La Cienega Blvd in West Hollywood, between Santa Monica Blvd and Sunset. The studio occupies a converted gallery space with private booths, hospital-grade single-use equipment, and an autoclave for tooling that cannot be disposable.',
      },
      {
        kind: 'p',
        text:
          'Aurora & Ash is licensed by the Los Angeles County Department of Public Health (TFC permit on display) and every artist is OSHA Bloodborne Pathogen certified. We accept clients 18 years and older with a valid government-issued ID.',
      },
      { kind: 'h2', text: 'Booking' },
      {
        kind: 'p',
        text:
          'All projects start with the Inquiry form. We answer within 48 hours on weekdays. A non-refundable design deposit ($150 - $400 depending on size) is required to lock a date; the deposit is applied to the final session.',
      },
    ],
  },
  {
    slug: 'aftercare',
    title: 'Aftercare',
    seo: {
      title: 'Tattoo Aftercare - Aurora & Ash',
      description:
        'Day-by-day instructions for healing your tattoo: cleaning, moisturizing, sun, and what to avoid. Written by the Aurora & Ash residents.',
    },
    blocks: [
      {
        kind: 'p',
        text:
          'A new tattoo is an open wound for the first one to two weeks. The way you treat it during this window decides how the piece will look at one year, five years, and twenty. Read the whole page once before your session.',
      },
      { kind: 'h2', text: 'Day 0 - leaving the studio' },
      {
        kind: 'p',
        text:
          'Your tattoo will be covered with a thin medical film (Saniderm / Tegaderm). Leave it on for 24 hours unless it begins to lift on its own or fluid pools heavily under it. The film makes a clear barrier - some plasma and ink seepage underneath is normal and expected.',
      },
      { kind: 'h2', text: 'Day 1 - 3' },
      {
        kind: 'ol',
        items: [
          'Remove the film in the shower under warm running water - peel slowly, do not yank.',
          'Wash gently with fragrance-free, alcohol-free liquid soap (Dr. Bronner Baby Unscented, Cetaphil, or equivalent). Use clean fingertips, never a washcloth.',
          'Pat dry with a paper towel. Do not rub.',
          'Apply a thin layer of healing balm (Aquaphor, Hustle Butter, or Mad Rabbit) - thin means barely visible. Smother and the skin cannot breathe.',
          'Wash and re-apply 2 - 3 times per day.',
        ],
      },
      { kind: 'h2', text: 'Day 4 - 14' },
      {
        kind: 'p',
        text:
          'The tattoo will scab lightly and start to peel like a sunburn. This is the most important phase. The single rule is: do not pick, do not scratch, do not peel scabs. If it itches (it will), tap firmly with a clean palm or apply a fresh layer of moisturizer - never scratch.',
      },
      {
        kind: 'p',
        text:
          'Switch from healing balm to an unscented lotion (Lubriderm, CeraVe Daily Lotion, Aveeno Fragrance Free) once the heaviest scabbing is gone, usually around day 6 - 8. Keep the area moisturized through day 14.',
      },
      { kind: 'h2', text: 'Things to avoid for at least 14 days' },
      {
        kind: 'ul',
        items: [
          'Direct sunlight on the tattoo, including driving with the area exposed.',
          'Submerging in water - no baths, hot tubs, swimming pools, lakes, or ocean.',
          'Heavy sweating - skip the gym, sauna, hot yoga.',
          'Tight clothing or anything that rubs the tattooed area.',
          'Pet and human contact on the fresh tattoo.',
          'Picking, scratching, or peeling scabs.',
        ],
      },
      { kind: 'h2', text: 'Long term' },
      {
        kind: 'p',
        text:
          'Sun is the single biggest factor in how a tattoo ages. Once the tattoo is fully healed (week 4 onwards), apply SPF 50+ to it any time it is exposed to sunlight. Reapply every 2 hours outdoors. A well-cared-for tattoo will hold its line and color integrity for decades.',
      },
      { kind: 'h2', text: 'When to contact us' },
      {
        kind: 'p',
        text:
          'Some redness, swelling, and minor heat in the first 48 hours is normal. Reach out immediately if you notice spreading redness past the tattoo edge after day 3, fever, foul-smelling discharge, or yellow-green pus. Email studio@aurora-ash.com or call +1 (323) 555-0142 - we will get back to you the same day.',
      },
    ],
  },
  {
    slug: 'faq',
    title: 'FAQ & Studio Rules',
    seo: {
      title: 'FAQ & Studio Rules - Aurora & Ash',
      description:
        'How booking works, pricing, deposits, age policy, what to bring, and our cancellation policy.',
    },
    blocks: [
      { kind: 'h2', text: 'Booking & deposits' },
      { kind: 'h3', text: 'How do I book?' },
      {
        kind: 'p',
        text:
          'Through the Inquiry form on this site. Tell us the artist you want, what you have in mind, where on the body, and rough size. We answer within 48 hours on weekdays.',
      },
      { kind: 'h3', text: 'What does it cost?' },
      {
        kind: 'p',
        text:
          'Pieces under 4 inches: $300 - $600 minimum, depending on artist and complexity. Larger work is quoted at an hourly rate of $250 - $400 per hour after the design deposit. We will give you a written estimate after the consultation.',
      },
      { kind: 'h3', text: 'Is the deposit refundable?' },
      {
        kind: 'p',
        text:
          'No. The deposit pays the artist for design time. It is applied to the final session price if you complete the booking. If you reschedule with 7+ days notice, the deposit transfers to the new date once. Less than 7 days, or a no-show, forfeits the deposit.',
      },
      { kind: 'h2', text: 'Day of the appointment' },
      { kind: 'h3', text: 'What should I do before the session?' },
      {
        kind: 'ul',
        items: [
          'Sleep well the night before.',
          'Eat a real meal 1 - 2 hours before your appointment.',
          'Drink water through the day.',
          'No alcohol for 24 hours before, no aspirin or blood thinners for 48 hours before.',
          'Wear clothing that gives easy access to the area being tattooed.',
        ],
      },
      { kind: 'h3', text: 'Can I bring someone?' },
      {
        kind: 'p',
        text:
          'One support person is welcome in the booth. The studio cannot host larger groups - we are a working space, not a bar.',
      },
      { kind: 'h2', text: 'Studio rules' },
      {
        kind: 'ul',
        items: [
          '18 years and older. We do not tattoo minors, with or without parental consent.',
          'Government-issued photo ID required at every appointment.',
          'No tattoos on hands, fingers, neck, or face for first-time clients - we want to see how you heal first.',
          'No covering up another studio’s recent work without a healing window of at least 6 months.',
          'We reserve the right to decline any design we find offensive, hateful, or that we cannot execute to our standard.',
        ],
      },
      { kind: 'h2', text: 'Touch-ups' },
      {
        kind: 'p',
        text:
          'One free touch-up within 6 months of the original session, scheduled with the same artist, on the same piece. Touch-ups beyond 6 months or on different work are quoted separately.',
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    seo: {
      title: 'Privacy Policy - Aurora & Ash',
      description: 'How Aurora & Ash collects, uses, and protects information from our website and clients.',
    },
    blocks: [
      {
        kind: 'p',
        text:
          'Last updated: May 2026. This policy describes how Aurora & Ash Tattoo Studio LLC ("we") collects, uses, and shares information from visitors to our website and clients of the studio.',
      },
      { kind: 'h2', text: 'Information we collect' },
      {
        kind: 'p',
        text:
          'When you submit the Inquiry form, we collect your name, contact information (email, phone, or messenger handle), and details of your project. When you book a session, we additionally collect a copy of your photo ID, an emergency contact, and a signed consent form. After the session, we may photograph your tattoo for our portfolio.',
      },
      { kind: 'h2', text: 'How we use it' },
      {
        kind: 'ul',
        items: [
          'To respond to your inquiry and schedule your session.',
          'To create and refine your tattoo design.',
          'To meet legal record-keeping requirements (LA County Department of Public Health requires a 7-year retention of consent forms).',
          'With your written permission, to publish portfolio photographs of healed work.',
        ],
      },
      { kind: 'h2', text: 'Sharing' },
      {
        kind: 'p',
        text:
          'We do not sell your information. We share it only with: (a) our payment processor when you pay a deposit or final balance, (b) the LA County Department of Public Health if requested as part of an inspection, (c) our legal counsel or law enforcement if compelled by valid legal process.',
      },
      { kind: 'h2', text: 'Photographs of your tattoo' },
      {
        kind: 'p',
        text:
          'Photos of your healed work are only published with your written consent on the Photo Release form. You may revoke that consent at any time by emailing studio@aurora-ash.com - we will remove the photograph from our website and Instagram within 7 days, although it may persist in third-party caches we do not control.',
      },
      { kind: 'h2', text: 'Cookies' },
      {
        kind: 'p',
        text:
          'Our website uses minimal first-party cookies for language preference (en / ru) and admin authentication. We do not use third-party advertising cookies or session-replay tools.',
      },
      { kind: 'h2', text: 'Your rights' },
      {
        kind: 'p',
        text:
          'California residents have rights under the CCPA, including the right to know what personal information we hold, to request deletion, and to opt out of any sale of personal information (we do not sell). To exercise any of these rights, email studio@aurora-ash.com from the address on file. We respond within 45 days.',
      },
      { kind: 'h2', text: 'Contact' },
      {
        kind: 'p',
        text:
          'Aurora & Ash Tattoo Studio LLC, 827 N La Cienega Blvd, Suite 4, West Hollywood, CA 90069. Email: studio@aurora-ash.com',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Works (without images - user uploads images separately via admin)
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
  // Marcus "Wolfheart" Reyes - Neo-Traditional / American Traditional
  { artistSlug: 'marcus-reyes', title: 'Lone Wolf Chest Plate', description: 'Full chest piece, neo-traditional wolf with mountain backdrop and single moon. 14-hour project across three sessions.', styleSlugs: ['neo-traditional', 'american-traditional'], placement: 'Chest', size: '12 x 10 in', year: 2025, featured: true },
  { artistSlug: 'marcus-reyes', title: 'Dagger and Rose', description: 'Classic American Traditional dagger crossed with a banded rose. Forearm placement, single 5-hour session.', styleSlugs: ['american-traditional'], placement: 'Inner forearm', size: '7 x 4 in', year: 2025, featured: false },
  { artistSlug: 'marcus-reyes', title: 'Eagle and Anchor Sleeve', description: 'Half sleeve composition - eagle in flight over an anchor with rope detail. Solid black outlines, limited red and yellow palette.', styleSlugs: ['american-traditional', 'blackwork'], placement: 'Upper arm', size: 'Half sleeve', year: 2024, featured: true },
  { artistSlug: 'marcus-reyes', title: 'Panther Leap', description: 'Neo-traditional black panther mid-leap with deep shading and ornamental backdrop. One of his signature compositions.', styleSlugs: ['neo-traditional'], placement: 'Outer thigh', size: '10 x 8 in', year: 2024, featured: false },
  { artistSlug: 'marcus-reyes', title: 'Raven and Crescent', description: 'Single raven perched on a crescent moon, classic Sailor Jerry palette with extended grey shading.', styleSlugs: ['neo-traditional'], placement: 'Calf', size: '8 x 6 in', year: 2025, featured: false },
  { artistSlug: 'marcus-reyes', title: 'Mountain Compass', description: 'Geometric compass over layered mountain ridges, bold black with deep teal accent.', styleSlugs: ['blackwork', 'neo-traditional'], placement: 'Bicep', size: '6 x 6 in', year: 2024, featured: false },

  // Elena Voss - Fine Line / Floral
  { artistSlug: 'elena-voss', title: 'Wild Carrot Stem', description: 'Single-needle Daucus carota stem with full umbel - delicate dotwork on the heads, soft stippling on the leaves. Two-hour single session.', styleSlugs: ['fine-line', 'dotwork'], placement: 'Inner forearm', size: '6 x 1.5 in', year: 2025, featured: true },
  { artistSlug: 'elena-voss', title: 'Birth Flower Bouquet', description: 'Custom commission - three birth flowers (peony, daffodil, larkspur) tied with a single ribbon. Fine line throughout.', styleSlugs: ['fine-line'], placement: 'Sternum', size: '5 x 4 in', year: 2025, featured: true },
  { artistSlug: 'elena-voss', title: 'Behind-Ear Wildflower', description: 'Tiny single-stem cornflower behind the ear - the kind of placement that disappears with hair down and reappears in summer.', styleSlugs: ['fine-line', 'minimalism'], placement: 'Behind ear', size: '1.5 x 0.5 in', year: 2025, featured: false },
  { artistSlug: 'elena-voss', title: 'Herbarium Page', description: 'Composition modeled on a 19th-century herbarium plate - three pressed flowers with hand-drawn taxonomic labels in Latin.', styleSlugs: ['fine-line', 'lettering'], placement: 'Outer thigh', size: '8 x 5 in', year: 2024, featured: false },
  { artistSlug: 'elena-voss', title: 'Snake and Magnolia', description: 'A single-line magnolia branch wrapped by a small viper. Quiet, narrative, the snake almost hidden in the negative space.', styleSlugs: ['fine-line'], placement: 'Ribcage', size: '7 x 4 in', year: 2024, featured: false },

  // Kai Nakamura - Japanese / Irezumi
  { artistSlug: 'kai-nakamura', title: 'Koi and Wave Sleeve', description: 'Full sleeve - ascending koi against traditional wave pattern with chrysanthemum accents. 11 sessions over 9 months.', styleSlugs: ['japanese'], placement: 'Full sleeve', size: 'Full arm', year: 2025, featured: true },
  { artistSlug: 'kai-nakamura', title: 'Hannya Mask Back Panel', description: 'Hannya mask centered on the upper back with cherry blossom drift and traditional cloud pattern. Ongoing project, 14 sessions in.', styleSlugs: ['japanese'], placement: 'Upper back', size: '20 x 16 in', year: 2025, featured: true },
  { artistSlug: 'kai-nakamura', title: 'Dragon and Pearl', description: 'Coiled black-ink dragon clutching a single red pearl. Composition wraps from shoulder around to chest.', styleSlugs: ['japanese', 'blackwork'], placement: 'Shoulder & chest', size: '18 x 14 in', year: 2024, featured: true },
  { artistSlug: 'kai-nakamura', title: 'Peony and Leaf Cluster', description: 'Standalone peony composition with traditional leaf detail. Bridge piece on a larger ongoing back project.', styleSlugs: ['japanese'], placement: 'Lower back', size: '8 x 7 in', year: 2024, featured: false },
  { artistSlug: 'kai-nakamura', title: 'Tiger and Bamboo', description: 'Tiger emerging from a bamboo grove with cloud and wind-bar fill. Outer thigh placement, classic composition.', styleSlugs: ['japanese'], placement: 'Outer thigh', size: '14 x 10 in', year: 2024, featured: false },

  // Riley O'Brien - Blackwork / Geometric / Dotwork
  { artistSlug: 'riley-obrien', title: 'Spinal Mandala', description: 'Symmetrical mandala running along the spine - point-balanced from neck to lower back. Three sessions, full dotwork shading.', styleSlugs: ['geometric', 'dotwork', 'blackwork'], placement: 'Full back / spine', size: '24 x 6 in', year: 2025, featured: true },
  { artistSlug: 'riley-obrien', title: 'Sacred Geometry Sleeve', description: 'Half sleeve built around the Flower of Life with concentric ornamental rings. Solid blackwork with controlled negative space.', styleSlugs: ['geometric', 'blackwork'], placement: 'Half sleeve', size: 'Bicep to wrist', year: 2025, featured: true },
  { artistSlug: 'riley-obrien', title: 'Forearm Mandala', description: 'Single mandala that follows the natural taper of the forearm - tighter pattern at the wrist, opening at the elbow.', styleSlugs: ['geometric', 'dotwork'], placement: 'Forearm', size: '10 x 4 in', year: 2024, featured: false },
  { artistSlug: 'riley-obrien', title: 'Dotwork Moon Phase', description: 'Eight phases of the moon rendered entirely in graduated dotwork. Subtle, almost printed look.', styleSlugs: ['dotwork', 'minimalism'], placement: 'Forearm band', size: '12 x 1.5 in', year: 2024, featured: false },
  { artistSlug: 'riley-obrien', title: 'Geometric Wolf', description: 'Wolf head broken into geometric facets with solid black fill. A geometric take on a classic motif.', styleSlugs: ['geometric', 'blackwork'], placement: 'Outer shoulder', size: '8 x 6 in', year: 2024, featured: false },

  // Sofia Mendez - Lettering / Script
  { artistSlug: 'sofia-mendez', title: 'Spencerian Forearm Phrase', description: 'Hand-drawn Spencerian script - "still I rise" - across the inner forearm. Custom letter construction, no fonts.', styleSlugs: ['lettering', 'fine-line'], placement: 'Inner forearm', size: '7 x 1.5 in', year: 2025, featured: true },
  { artistSlug: 'sofia-mendez', title: 'Blackletter Collarbone', description: 'Blackletter composition along the collarbone - dense, gothic, with extended swashes. Single 4-hour session.', styleSlugs: ['lettering', 'blackwork'], placement: 'Collarbone', size: '8 x 1 in', year: 2025, featured: true },
  { artistSlug: 'sofia-mendez', title: 'Cyrillic Brush Script', description: 'Russian-language quote in modern brush calligraphy. Loose, painterly, with deliberate ink-pull texture.', styleSlugs: ['lettering'], placement: 'Inner bicep', size: '6 x 2 in', year: 2024, featured: false },
  { artistSlug: 'sofia-mendez', title: 'Ribcage Lyric', description: 'Long single-line lyric down the ribcage in modern script. The kind of piece that asks for a 90-minute session and a steady jaw.', styleSlugs: ['lettering'], placement: 'Ribcage', size: '10 x 1 in', year: 2024, featured: false },
  { artistSlug: 'sofia-mendez', title: 'Bilingual Family Names', description: 'Two family names - one in Latin script, one in Cyrillic - balanced as a single composition on the inside of the bicep.', styleSlugs: ['lettering', 'fine-line'], placement: 'Inner bicep', size: '5 x 3 in', year: 2025, featured: false },
]

// ---------------------------------------------------------------------------
// Sample inquiries
// ---------------------------------------------------------------------------

type InquirySeed = {
  name: string
  contact: string
  artistSlug?: string
  vision: string
  placement: string
  size: string
  status: 'new' | 'contacted' | 'scheduled' | 'done' | 'declined'
}

const INQUIRIES: InquirySeed[] = [
  {
    name: 'Hannah Park',
    contact: 'hannah.park@email.com',
    artistSlug: 'elena-voss',
    vision:
      'Looking for a small fine-line bouquet on the sternum - three birth flowers for my sisters. Saw the "Birth Flower Bouquet" piece on the site and would love something in that vein.',
    placement: 'Sternum',
    size: '4 x 4 in',
    status: 'new',
  },
  {
    name: 'Daniel Voss',
    contact: '+1 (310) 555-0184',
    artistSlug: 'marcus-reyes',
    vision:
      'Half sleeve - American Traditional, classic motifs (eagle, dagger, rose), willing to take 2-3 sessions. Available weekends.',
    placement: 'Upper arm / shoulder',
    size: 'Half sleeve',
    status: 'contacted',
  },
  {
    name: 'Aiko Tanaka',
    contact: 'Telegram: @aiko_t',
    artistSlug: 'kai-nakamura',
    vision:
      'Koi and wave back panel, eventually expanding to full back. Understands this is a multi-session project - very serious.',
    placement: 'Full back',
    size: 'Back panel',
    status: 'scheduled',
  },
  {
    name: 'Marcus Lee',
    contact: 'marcus.l@email.com',
    vision:
      'A small dragon on the side of my neck. I am 22 and this would be my first tattoo.',
    placement: 'Side of neck',
    size: '3 x 2 in',
    status: 'declined',
  },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

export async function runSeed(payload: any) {
  const created = {
    styles: [] as string[],
    artists: [] as string[],
    works: [] as string[],
    pages: [] as string[],
    inquiries: [] as string[],
    studioInfo: false as boolean,
    skipped: {
      styles: [] as string[],
      artists: [] as string[],
      works: [] as string[],
      pages: [] as string[],
      inquiries: [] as string[],
    },
  }

  // ---- STYLES ----
  const styleIdsBySlug: Record<string, any> = {}
  for (const s of STYLES) {
    const existing = await payload.find({
      collection: 'styles',
      where: { slug: { equals: s.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      styleIdsBySlug[s.slug] = existing.docs[0].id
      created.skipped.styles.push(s.slug)
      continue
    }
    const doc = await payload.create({
      collection: 'styles',
      data: { slug: s.slug, name: s.name, description: s.description },
      locale: 'en',
    })
    styleIdsBySlug[s.slug] = doc.id
    created.styles.push(s.slug)
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

  // Make sure we have IDs for already-existing artists too (skipped above).
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

  // ---- WORKS ----
  // Each work is wrapped in its own try/catch so that one failure does not
  // abort the whole seed run. Full error details are reported so we can
  // diagnose libsql / Payload validation issues.
  const workErrors: Array<{ work: string; error: string; stack?: string }> = []
  for (const w of WORKS) {
    const artistId = artistIdsBySlug[w.artistSlug]
    if (!artistId) {
      created.skipped.works.push(`${w.artistSlug} :: ${w.title} (artist missing)`)
      continue
    }

    try {
      // Pre-compute the slug explicitly, so the auto-slug hook never has to fire
      // mid-insert (which can mask the real error inside libsql).
      const { generateSlug } = await import('../lib/slug')
      const baseSlug = generateSlug(w.title)
      // Ensure uniqueness across all existing works (incl. drafts).
      let slug = baseSlug
      let suffix = 2
      // Use proper loop condition with MAX_SLUG_SUFFIX to prevent infinite loops
      while (suffix <= MAX_SLUG_SUFFIX) {
        const conflict = await payload.find({
          collection: 'works',
          where: { slug: { equals: slug } },
          limit: 1,
          draft: true,
        })
        if (conflict.docs.length === 0) break
        // If the existing doc with this slug also matches our (artist, title) pair,
        // that is "us" - we will then update below. Otherwise bump the suffix.
        const same =
          conflict.docs[0].artist === artistId ||
          (typeof conflict.docs[0].artist === 'object' && conflict.docs[0].artist?.id === artistId)
        if (same && conflict.docs[0].title === w.title) break
        slug = `${baseSlug}-${suffix++}`
      }

      const styleIds = w.styleSlugs.map((sl) => styleIdsBySlug[sl]).filter(Boolean)

      // Check if work already exists by artist and title
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
        // Update existing work
        const existingWork = existing.docs[0]
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
            _status: 'draft',
          },
          locale: 'en',
        })
        created.skipped.works.push(`${w.artistSlug} :: ${w.title} (updated)`)
      } else {
        // Create new work
        // Seeded as DRAFT so the required `images` field can stay empty.
        // Artist page only shows published works, so these stay hidden
        // until photos are attached and "Publish" is clicked.
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
    ;(created as any).workErrors = workErrors
  }

  // ---- PAGES ----
  for (const p of PAGES) {
    try {
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: p.slug } },
        limit: 1,
        draft: true,
      })
      if (existing.docs.length > 0) {
        created.skipped.pages.push(p.slug)
        continue
      }
      await payload.create({
        collection: 'pages',
        data: {
          title: p.title,
          slug: p.slug,
          content: richDoc(p.blocks),
          seo: p.seo,
          _status: 'published',
        },
        locale: 'en',
      })
      created.pages.push(p.slug)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed] Page create failed:', {
        slug: p.slug,
        title: p.title,
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
      created.skipped.pages.push(`${p.slug} :: ${p.title} (FAILED: ${error.message.slice(0, 120)})`)
    }
  }

  // ---- INQUIRIES ----
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

  // ---- STUDIO INFO (global, fill-empty only) ----
  try {
    const current = (await payload.findGlobal({ slug: 'studio' })) as any
    const patch: Record<string, any> = {}

    if (!current?.name || current.name === 'Aurora & Ash')
      patch.name = STUDIO_INFO.name
    if (!current?.tagline) patch.tagline = STUDIO_INFO.tagline
    if (!current?.philosophy) patch.philosophy = STUDIO_INFO.philosophy
    if (!current?.address) patch.address = STUDIO_INFO.address
    if (!current?.phone) patch.phone = STUDIO_INFO.phone
    if (!current?.email) patch.email = STUDIO_INFO.email
    if (!current?.hours) patch.hours = STUDIO_INFO.hours

    const social = current?.social ?? {}
    const newSocial: Record<string, string> = {}
    if (!social.instagram) newSocial.instagram = STUDIO_INFO.social.instagram
    if (!social.tiktok) newSocial.tiktok = STUDIO_INFO.social.tiktok
    if (!social.telegram) newSocial.telegram = STUDIO_INFO.social.telegram
    if (!social.whatsapp) newSocial.whatsapp = STUDIO_INFO.social.whatsapp
    if (Object.keys(newSocial).length > 0) {
      patch.social = { ...social, ...newSocial }
    }

    const about = current?.about ?? {}
    const newAbout: Record<string, string> = {}
    if (!about.eyebrow) newAbout.eyebrow = STUDIO_INFO.about.eyebrow
    if (!about.heading) newAbout.heading = STUDIO_INFO.about.heading
    if (!about.body) newAbout.body = STUDIO_INFO.about.body
    if (Object.keys(newAbout).length > 0) {
      patch.about = { ...about, ...newAbout }
    }

    if (Object.keys(patch).length > 0) {
      await payload.updateGlobal({
        slug: 'studio',
        data: patch,
        locale: 'en',
      })
      created.studioInfo = true
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[seed] Studio global update failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
  }

  return created
}
