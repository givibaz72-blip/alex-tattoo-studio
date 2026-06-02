/**
 * Page block specs + Payload block builders.
 *
 * Pages in Payload v3 use a `blocks` field (NOT `content`). Each block is an
 * object shaped like `{ blockType, ...fields }` matching the schema in
 * payload.config.ts (Pages → blocks).
 *
 * This module:
 *  1) Defines small Lexical helpers for the rich-text body of `content` blocks.
 *  2) Defines a Spec format for each page (mix of hero/content/parallax/...).
 *  3) Exposes `buildPageBlocks(specs, mediaIdsByFilename)` that converts specs
 *     into the exact JSON Payload expects, with media references resolved.
 *
 * If a referenced filename is not in the media map, the block is still emitted
 * but the image field is omitted, so the page still renders gracefully.
 */

// ---------------------------------------------------------------------------
// Lexical rich-text helpers (canonical Lexical JSON shape)
// ---------------------------------------------------------------------------

type LeafFmt =
  | 0
  | 1 // bold
  | 2 // italic
  | 8 // underline

function leaf(text: string, format: LeafFmt = 0) {
  return { type: 'text', format, style: '', mode: 'normal', detail: 0, version: 1, text }
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

function paragraphRich(parts: Array<{ text: string; format?: LeafFmt }>) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    children: parts.map((p) => leaf(p.text, p.format ?? 0)),
  }
}

function heading(tag: 'h2' | 'h3' | 'h4', text: string) {
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

function blockquote(text: string) {
  return {
    type: 'quote',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [leaf(text)],
  }
}

function horizontalRule() {
  return { type: 'horizontalrule', version: 1 }
}

// Public RichBlock shape used by content-block specs.
export type RichBlock =
  | { kind: 'p'; text: string }
  | { kind: 'p-rich'; parts: Array<{ text: string; format?: LeafFmt }> }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'h4'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'hr' }

function richDoc(blocks: RichBlock[]) {
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
          case 'p-rich':
            return paragraphRich(b.parts)
          case 'h2':
            return heading('h2', b.text)
          case 'h3':
            return heading('h3', b.text)
          case 'h4':
            return heading('h4', b.text)
          case 'ul':
            return list('bullet', b.items)
          case 'ol':
            return list('number', b.items)
          case 'quote':
            return blockquote(b.text)
          case 'hr':
            return horizontalRule()
        }
      }),
    },
  }
}

// ---------------------------------------------------------------------------
// Block specs — author-friendly intermediate format
// ---------------------------------------------------------------------------

type WithSectionId = { sectionId?: string }

export type HeroSpec = WithSectionId & {
  type: 'hero'
  title: string
  subtitle?: string
  imageFile?: string
  align?: 'center' | 'left'
}
export type ContentSpec = WithSectionId & {
  type: 'content'
  body: RichBlock[]
  accent?: boolean
  typography?: {
    family?: 'default' | 'modern-gothic' | 'minimalist'
    scale?: 'sm' | 'base' | 'lg' | 'xl'
  }
}
export type ImageFeatureSpec = WithSectionId & {
  type: 'imageFeature'
  imageFile: string
  caption?: string
  layout?: 'full-width' | 'content-width'
}
export type ParallaxSpec = {
  type: 'parallax'
  imageFile: string
  /** Optional portrait/vertical crop for < 768px. */
  mobileImageFile?: string
  title?: string
  subtitle?: string
  overlayIntensity?: number
  sectionId?: string
  height?: 'screen' | 'tall' | 'half'
}
export type AccordionSpec = WithSectionId & {
  type: 'accordion'
  heading?: string
  items: Array<{ question: string; answer: string }>
}
export type ArtistGridSpec = WithSectionId & {
  type: 'artistGrid'
  heading?: string
  featuredOnly?: boolean
}
export type ColumnsSpec = WithSectionId & {
  type: 'columns'
  layout?: '50_50' | '33_66' | '66_33' | '33_33_33'
  gap?: 'sm' | 'md' | 'lg'
  items: Array<{
    body?: RichBlock[]
    imageFile?: string
    imageCaption?: string
  }>
}

export type BlockSpec =
  | HeroSpec
  | ContentSpec
  | ImageFeatureSpec
  | ParallaxSpec
  | AccordionSpec
  | ArtistGridSpec
  | ColumnsSpec

// ---------------------------------------------------------------------------
// Spec → Payload block converter
// ---------------------------------------------------------------------------

export function buildPageBlocks(
  specs: BlockSpec[],
  mediaIdsByFilename: Record<string, string | number> = {},
): any[] {
  const out: any[] = []

  for (const s of specs) {
    switch (s.type) {
      case 'hero': {
        const block: Record<string, any> = {
          blockType: 'hero',
          title: s.title,
          align: s.align ?? 'center',
        }
        if (s.subtitle) block.subtitle = s.subtitle
        const id = s.imageFile ? mediaIdsByFilename[s.imageFile] : undefined
        if (id) block.backgroundImage = id
        if (s.sectionId) block.sectionId = s.sectionId
        out.push(block)
        break
      }

      case 'content': {
        const block: Record<string, any> = {
          blockType: 'content',
          body: richDoc(s.body),
          accentBackground: Boolean(s.accent),
        }
        if (s.sectionId) block.sectionId = s.sectionId
        if (s.typography) {
          block.typography = {
            family: s.typography.family ?? 'default',
            scale: s.typography.scale ?? 'base',
          }
        }
        out.push(block)
        break
      }

      case 'imageFeature': {
        const id = mediaIdsByFilename[s.imageFile]
        if (!id) break // imageFeature.image is required — skip gracefully
        const block: Record<string, any> = {
          blockType: 'imageFeature',
          image: id,
          layout: s.layout ?? 'content-width',
        }
        if (s.caption) block.caption = s.caption
        if (s.sectionId) block.sectionId = s.sectionId
        out.push(block)
        break
      }

      case 'parallax': {
        const id = mediaIdsByFilename[s.imageFile]
        if (!id) break // parallax.backgroundImage is required — skip
        const block: Record<string, any> = {
          blockType: 'parallax',
          backgroundImage: id,
          overlayIntensity: s.overlayIntensity ?? 0.55,
          height: s.height ?? 'screen',
        }
        if (s.mobileImageFile) {
          const mobileId = mediaIdsByFilename[s.mobileImageFile]
          if (mobileId) block.mobileImage = mobileId
        }
        if (s.title) block.title = s.title
        if (s.subtitle) block.subtitle = s.subtitle
        if (s.sectionId) block.sectionId = s.sectionId
        out.push(block)
        break
      }

      case 'accordion': {
        const block: Record<string, any> = {
          blockType: 'accordion',
          items: s.items.map((it) => ({ question: it.question, answer: it.answer })),
        }
        if (s.heading) block.heading = s.heading
        if (s.sectionId) block.sectionId = s.sectionId
        out.push(block)
        break
      }

      case 'artistGrid': {
        const block: Record<string, any> = {
          blockType: 'artistGrid',
          featuredOnly: s.featuredOnly ?? true,
        }
        if (s.heading) block.heading = s.heading
        if (s.sectionId) block.sectionId = s.sectionId
        out.push(block)
        break
      }

      case 'columns': {
        const block: Record<string, any> = {
          blockType: 'columns',
          layout: s.layout ?? '50_50',
          gap: s.gap ?? 'md',
          items: s.items.map((it) => {
            const item: Record<string, any> = {}
            if (it.body) item.body = richDoc(it.body)
            if (it.imageFile && mediaIdsByFilename[it.imageFile]) {
              item.image = mediaIdsByFilename[it.imageFile]
            }
            if (it.imageCaption) item.imageCaption = it.imageCaption
            return item
          }),
        }
        if (s.sectionId) block.sectionId = s.sectionId
        out.push(block)
        break
      }
    }
  }

  return out
}

// ---------------------------------------------------------------------------
// Page specs — the actual content of every static page on the site
// ---------------------------------------------------------------------------

export type PageSpec = {
  slug: string
  title: string
  blocks: BlockSpec[]
  seo?: { title?: string; description?: string }
}

export const PAGE_SPECS: PageSpec[] = [
  // =====================================================================
  // HOME — one-page scroll architecture
  //
  // The home page is composed as seven full-bleed sections separated by
  // parallax "marquees". Each parallax block carries the section's
  // `sectionId` — used both as the `id` anchor on the rendered <section>
  // and as a scroll-spy target. Order:
  //
  //   home → studio → artists → location → aftercare → faq → contact
  //
  // Each anchor matches a menu item in NavMenu.tsx. Keep the two in sync.
  // =====================================================================
  {
    slug: 'home',
    title: 'Home',
    seo: {
      title: 'Aurora & Ash — Tattoo Studio in West Hollywood',
      description:
        'A private, appointment-only tattoo studio on La Cienega Blvd. Five resident artists. Neo-Traditional, Japanese, Fine Line, Blackwork, Lettering.',
    },
    blocks: [
      // ─── Section 1: HOME ────────────────────────────────────────────
      {
        type: 'parallax',
        imageFile: 'studio_hero.png',
        title: 'AURORA & ASH',
        subtitle: 'A private studio for permanent art — by appointment, in West Hollywood.',
        overlayIntensity: 0.55,
        sectionId: 'home',
        height: 'screen',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'A studio, not a shop' },
          {
            kind: 'p',
            text:
              'Aurora & Ash is a private, appointment-only studio on La Cienega Blvd. Five resident artists, one shared standard of work — Neo-Traditional, Japanese Irezumi, Fine Line, Blackwork, and hand-drawn Lettering, made deliberately, one client at a time.',
          },
          {
            kind: 'p',
            text:
              'Every consultation is in person. Every design is original. Every photograph on this site is healed skin.',
          },
        ],
      },

      // ─── Section 2: STUDIO ──────────────────────────────────────────
      {
        type: 'parallax',
        imageFile: 'parallax_studio.jpg',
        title: 'The Studio',
        subtitle:
          'A converted gallery on La Cienega — private booths, hospital-grade equipment, daylight when it suits the work.',
        overlayIntensity: 0.6,
        sectionId: 'studio',
        height: 'tall',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'How we work' },
          {
            kind: 'p',
            text:
              'Every piece begins with a conversation. We do not pre-draw stock designs and we do not run flash specials. Each artist takes a maximum of two clients per day so consultations are unhurried, designs are original, and sessions stay focused.',
          },
          {
            kind: 'p',
            text:
              'We work in lineages with documented history — techniques that have lasted decades are also techniques that age well on skin.',
          },
        ],
      },
      {
        type: 'imageFeature',
        imageFile: 'feature_room.jpg',
        caption: 'Sunlit booths where each design is drawn, refined, and tattooed with deliberate focus.',
        layout: 'full-width',
      },
      {
        type: 'content',
        accent: true,
        body: [
          { kind: 'h2', text: 'Craftsmanship Begins with Unseen Discipline' },
          { kind: 'p-rich', parts: [ { text: 'Open practices that let you verify our commitment to safety and craftsmanship' } ] },
          {
            kind: 'ul',
            items: [
              'Every artist maintains OSHA Bloodborne Pathogen certification — ask to see our current credentials, ensuring a clean, professional environment where our artists can focus entirely on your tattoo.',
              'Our TFC permit from LA County Public Health is displayed openly in the studio, reflecting our commitment to the level of professionalism our clients expect.',
              'Single-use supplies (needles, cartridges, gloves, ink caps) are opened in front of you and disposed of immediately after use — so every session begins with sterile equipment and complete peace of mind.',
              'We review signed consent and government-issued ID with you before any work begins, ensuring informed agreement and a foundation of trust for meaningful collaboration.',
              'All published images show tattoos healed a minimum of six months — because we believe in demonstrating art’s longevity transparently, not just promising it.',
            ],
          },
        ],
      },

      // ─── Section 3: ARTISTS ─────────────────────────────────────────
      {
        type: 'parallax',
        imageFile: 'parallax_craft.jpg',
        title: 'The Collective',
        subtitle: 'Five artists, five disciplines — each working in a documented lineage.',
        overlayIntensity: 0.65,
        sectionId: 'artists',
        height: 'half',
      },
      {
        type: 'content',
        body: [
          {
            kind: 'p',
            text:
              'Pick the artist whose work speaks to you — from Marcus\'s American Traditional and Kai\'s Irezumi to Elena\'s herbarium-style fine line and Sofia\'s hand-drawn typography. Each studio resident keeps their own booking calendar; lead times vary from two weeks to six months.',
          },
        ],
      },
      {
        type: 'artistGrid',
        heading: undefined,
        featuredOnly: true,
      },

      // ─── Section 4: LOCATION ────────────────────────────────────────
      //
      // Location is rendered as a hand-rolled <LocationSection /> component
      // on the homepage (see app/(frontend)/page.tsx) so we can ship a real
      // Google Maps iframe with the brand filter pipeline. The CMS block
      // list intentionally has no parallax/imageFeature/content trio for
      // this section. The hardcoded component is injected at the index of
      // the first block whose sectionId === 'aftercare'.

      // ─── Section 5: AFTERCARE ───────────────────────────────────────
      {
        type: 'parallax',
        imageFile: 'parallax_aftercare.jpg',
        title: 'Aftercare',
        subtitle: 'How you treat the first two weeks decides how the piece looks at twenty years.',
        overlayIntensity: 0.6,
        sectionId: 'aftercare',
        height: 'tall',
      },
      {
        type: 'content',
        body: [
          {
            kind: 'p',
            text:
              'A new tattoo is an open wound for the first one to two weeks. Read this once before your session and follow it day by day. If anything is unclear, message the artist who tattooed you.',
          },
        ],
      },
      {
        type: 'accordion',
        heading: 'Day-by-day',
        items: [
          {
            question: 'Day 0 — leaving the studio',
            answer:
              'Your tattoo will be covered with a thin medical film (Saniderm / Tegaderm). Leave it on for 24 hours unless it begins to lift on its own or fluid pools heavily under it. Some plasma and ink seepage under the film is normal and expected.',
          },
          {
            question: 'Day 1 — Day 3',
            answer:
              "1) Remove the film in the shower under warm running water — peel slowly, never yank.\n2) Wash gently with fragrance-free, alcohol-free liquid soap (Dr. Bronner Baby Unscented, Cetaphil, or equivalent). Use clean fingertips, never a washcloth.\n3) Pat dry with a paper towel. Do not rub.\n4) Apply a thin layer of healing balm (Aquaphor, Hustle Butter, or Mad Rabbit) — thin means barely visible.\n5) Wash and re-apply 2–3 times per day.",
          },
          {
            question: 'Day 4 — Day 14',
            answer:
              'The tattoo will scab lightly and start to peel like a sunburn. Do not pick, do not scratch, do not peel scabs. If it itches, tap firmly with a clean palm or apply moisturizer — never scratch.\n\nSwitch from healing balm to an unscented lotion (Lubriderm, CeraVe Daily Lotion, Aveeno Fragrance Free) once the heaviest scabbing is gone, usually around day 6–8.',
          },
          {
            question: 'Long term (week 4 onwards)',
            answer:
              'Sun is the single biggest factor in how a tattoo ages. Once fully healed, apply SPF 50+ any time it is exposed to sunlight. A well-cared-for tattoo will hold its line and color integrity for decades.',
          },
          {
            question: 'When to contact us',
            answer:
              'Reach out the same day if you notice: spreading redness past the tattoo edge after day 3, fever, foul-smelling discharge, yellow-green pus, or red streaks moving away from the tattoo.',
          },
        ],
      },

      // ─── Section 6: FAQ ─────────────────────────────────────────────
      {
        type: 'parallax',
        imageFile: 'parallax_studio.jpg',
        title: 'Quick answers',
        subtitle: 'How booking works, what we charge, what to expect on the day.',
        overlayIntensity: 0.6,
        sectionId: 'faq',
        height: 'tall',
      },
      {
        type: 'accordion',
        heading: 'Booking & deposits',
        items: [
          {
            question: 'How do I book?',
            answer:
              'Through the Inquiry form. Tell us the artist you want, what you have in mind, where on the body, and rough size. We answer within 48 hours on weekdays.',
          },
          {
            question: 'What does it cost?',
            answer:
              'Pieces under 4 inches: $300–$600 minimum, depending on artist and complexity. Larger work is quoted at an hourly rate of $250–$400 per hour. We provide a written estimate after the consultation.',
          },
          {
            question: 'Is the deposit refundable?',
            answer:
              'No. The deposit pays the artist for design time. It is applied to the final session price if you complete the booking. Reschedule with 7+ days notice and the deposit transfers once.',
          },
        ],
      },
      {
        type: 'accordion',
        heading: 'Day of the appointment',
        items: [
          {
            question: 'What should I do before the session?',
            answer:
              '— Sleep well the night before.\n— Eat a real meal 1–2 hours before your appointment.\n— Drink water through the day.\n— No alcohol for 24 hours, no aspirin or blood thinners for 48 hours.\n— Wear clothing that gives easy access to the tattooed area.',
          },
          {
            question: 'Can I bring someone?',
            answer:
              'One support person is welcome in the booth. The studio cannot host larger groups — we are a working space, not a bar.',
          },
          {
            question: 'How long are sessions?',
            answer:
              'A first session is usually 2–4 hours including drawing time and stencil placement. Larger projects are split into multiple 4–6 hour sessions, scheduled 4–8 weeks apart to allow healing.',
          },
          {
            question: 'Is a touch-up included?',
            answer:
              'Yes. One free touch-up within 6 months of the original session, scheduled with the same artist, on the same piece.',
          },
        ],
      },

      // ─── Section 7: CONTACT (final CTA) ─────────────────────────────
      {
        type: 'parallax',
        imageFile: 'parallax_cta.jpg',
        title: 'Begin a project',
        subtitle:
          'Tell us the story you want to carry. We answer within 48 hours on weekdays.',
        overlayIntensity: 0.7,
        sectionId: 'contact',
        height: 'tall',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'Make an appointment' },
          {
            kind: 'p',
            text:
              'All projects start with the Inquiry form — about two minutes to fill out, then we route your brief to the right artist and reply with available windows.',
          },
          { kind: 'h3', text: 'Press, collaborations, editorial' },
          { kind: 'p', text: 'studio@auroraash.com — please use your real name and the publication you write for in the subject line.' },
        ],
      },
    ],
  },

  // ABOUT
  // =====================================================================
  {
    slug: 'about',
    title: 'About the Studio',
    seo: {
      title: 'About — Aurora & Ash',
      description:
        'Founded in 2022 on La Cienega Blvd. Five resident artists, one shared standard of work. Licensed by LA County Department of Public Health.',
    },
    blocks: [
      {
        type: 'hero',
        title: 'About the Studio',
        subtitle: 'Founded in 2022 — one piece at a time, by people who care about the craft.',
        imageFile: 'studio_philosophy.png',
        align: 'center',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'Our story' },
          {
            kind: 'p',
            text:
              'Aurora & Ash was founded in 2022 on a single idea: tattoos should be made the way private galleries make art — one piece at a time, by people who care about the craft, in a space that respects both the client and the work.',
          },
          {
            kind: 'p',
            text:
              'We chose West Hollywood because it sits at the intersection of editorial design, music, and an audience that understands the difference between a fashion piece and a permanent one. Our first booth opened with three artists; today we are five residents and one apprentice.',
          },
        ],
      },
      {
        type: 'parallax',
        imageFile: 'parallax_studio.jpg',
        title: 'A converted gallery, on La Cienega',
        subtitle:
          'Private booths. Hospital-grade single-use equipment. Autoclave for tooling that cannot be disposable. Daylight when it suits the work, controlled lighting when it does not.',
        overlayIntensity: 0.55,
        height: 'tall',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'How we work' },
          {
            kind: 'p',
            text:
              'Every piece begins with a conversation. We do not pre-draw stock designs and we do not run flash specials. Each artist takes a maximum of two clients per day so consultations are unhurried, designs are original, and sessions stay focused.',
          },
          {
            kind: 'p',
            text:
              'Our resident artists span Neo-Traditional, Japanese Irezumi, Fine Line, Blackwork, Geometric, Dotwork, and hand-drawn Lettering. We do not chase trends — we work in lineages with documented history.',
          },
          { kind: 'h2', text: 'Craftsmanship Begins with Unseen Discipline' },
          { kind: 'p-rich', parts: [ { text: 'Open practices that let you verify our commitment to safety and craftsmanship' } ] },
          {
            kind: 'ul',
            items: [
              'Every artist maintains OSHA Bloodborne Pathogen certification — ask to see our current credentials, ensuring a clean, professional environment where our artists can focus entirely on your tattoo.',
              'Our TFC permit from LA County Public Health is displayed openly in the studio, reflecting our commitment to the level of professionalism our clients expect.',
              'Single-use supplies (needles, cartridges, gloves, ink caps) are opened in front of you and disposed of immediately after use — so every session begins with sterile equipment and complete peace of mind.',
              'We review signed consent and government-issued ID with you before any work begins, ensuring informed agreement and a foundation of trust for meaningful collaboration.',
              'All published images show tattoos healed a minimum of six months — because we believe in demonstrating art’s longevity transparently, not just promising it.',
            ],
          },
        ],
      },
      {
        type: 'imageFeature',
        imageFile: 'feature_room.jpg',
        caption: 'Studio floor, looking east — main consultation table and reception.',
        layout: 'full-width',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'Booking' },
          {
            kind: 'p',
            text:
              'All projects start with the Inquiry form. We answer within 48 hours on weekdays. A non-refundable design deposit ($150–$400 depending on size) is required to lock a date; the deposit is applied to the final session.',
          },
          { kind: 'h3', text: 'Hours' },
          { kind: 'p', text: 'Monday–Sunday, 12:00 — 20:00. Walk-ins are not accepted.' },
          { kind: 'h3', text: 'Address' },
          {
            kind: 'p',
            text: '8282 Santa Monica Blvd, West Hollywood, CA 90046. Street parking on Olive Dr; valet at the corner of La Cienega.',
          },
        ],
      },
      {
        type: 'parallax',
        imageFile: 'parallax_cta.jpg',
        title: 'Begin a project',
        subtitle: 'A short conversation is the fastest way to find the right artist for your piece.',
        overlayIntensity: 0.7,
        sectionId: 'cta',
        height: 'half',
      },
    ],
  },

  // =====================================================================
  // AFTERCARE
  // =====================================================================
  {
    slug: 'aftercare',
    title: 'Aftercare',
    seo: {
      title: 'Tattoo Aftercare — Aurora & Ash',
      description:
        'Day-by-day instructions for healing your tattoo: cleaning, moisturizing, sun, and what to avoid. Written by the Aurora & Ash residents.',
    },
    blocks: [
      {
        type: 'hero',
        title: 'Aftercare',
        subtitle: 'How you treat the first two weeks decides how the piece looks at twenty years.',
        imageFile: 'parallax_aftercare.jpg',
        align: 'center',
      },
      {
        type: 'content',
        body: [
          {
            kind: 'p',
            text:
              'A new tattoo is an open wound for the first one to two weeks. Read the whole page once before your session, and follow it day by day. If anything is unclear, message the artist who tattooed you — they will rather answer a small question than fix a healing problem later.',
          },
        ],
      },
      {
        type: 'accordion',
        heading: 'Day-by-day',
        items: [
          {
            question: 'Day 0 — leaving the studio',
            answer:
              'Your tattoo will be covered with a thin medical film (Saniderm / Tegaderm). Leave it on for 24 hours unless it begins to lift on its own or fluid pools heavily under it. Some plasma and ink seepage under the film is normal and expected.',
          },
          {
            question: 'Day 1 — Day 3',
            answer:
              "1) Remove the film in the shower under warm running water — peel slowly, never yank.\n2) Wash gently with fragrance-free, alcohol-free liquid soap (Dr. Bronner Baby Unscented, Cetaphil, or equivalent). Use clean fingertips, never a washcloth.\n3) Pat dry with a paper towel. Do not rub.\n4) Apply a thin layer of healing balm (Aquaphor, Hustle Butter, or Mad Rabbit) — thin means barely visible. Smother and the skin can't breathe.\n5) Wash and re-apply 2–3 times per day.",
          },
          {
            question: 'Day 4 — Day 14',
            answer:
              'The tattoo will scab lightly and start to peel like a sunburn. This is the most important phase. The single rule is: do not pick, do not scratch, do not peel scabs. If it itches (it will), tap firmly with a clean palm or apply a fresh layer of moisturizer — never scratch.\n\nSwitch from healing balm to an unscented lotion (Lubriderm, CeraVe Daily Lotion, Aveeno Fragrance Free) once the heaviest scabbing is gone, usually around day 6–8. Keep the area moisturized through day 14.',
          },
          {
            question: 'Long term (week 4 onwards)',
            answer:
              'Sun is the single biggest factor in how a tattoo ages. Once the tattoo is fully healed, apply SPF 50+ to it any time it is exposed to sunlight. Reapply every two hours outdoors. A well-cared-for tattoo will hold its line and color integrity for decades.',
          },
        ],
      },
      {
        type: 'content',
        accent: true,
        body: [
          { kind: 'h2', text: 'Avoid for at least 14 days' },
          {
            kind: 'ul',
            items: [
              'Direct sunlight on the tattoo, including driving with the area exposed.',
              'Submerging in water — no baths, hot tubs, swimming pools, lakes, or ocean.',
              'Heavy sweating — skip the gym, sauna, hot yoga.',
              'Tight clothing or anything that rubs the tattooed area.',
              'Pet and human contact on the fresh tattoo.',
              'Picking, scratching, or peeling scabs.',
            ],
          },
        ],
      },
      {
        type: 'imageFeature',
        imageFile: 'feature_aftercare.jpg',
        caption: 'Healed skin, six months out — a piece by Elena Voss.',
        layout: 'content-width',
      },
      {
        type: 'accordion',
        heading: 'When to contact us',
        items: [
          {
            question: 'What is normal in the first 48 hours?',
            answer:
              'Some redness, mild swelling, warmth around the tattoo, and minor seepage under the medical film are all normal. Slight bruising near the area is also common, especially on rib, foot, or hand placements.',
          },
          {
            question: 'What is NOT normal?',
            answer:
              'Reach out the same day if you notice: spreading redness past the tattoo edge after day 3, fever, foul-smelling discharge, yellow-green pus, or red streaks moving away from the tattoo. These can indicate an infection and should be checked by a medical professional.',
          },
          {
            question: 'Can I get a touch-up?',
            answer:
              'Yes — one free touch-up is included within 6 months of the original session, with the same artist, on the same piece. Touch-ups beyond 6 months or on different work are quoted separately.',
          },
        ],
      },
      {
        type: 'parallax',
        imageFile: 'parallax_cta.jpg',
        title: 'Questions about your healing?',
        subtitle: 'Message the artist who tattooed you, or write to the studio at hello@auroraash.com — we answer the same day.',
        overlayIntensity: 0.65,
        sectionId: 'cta',
        height: 'half',
      },
    ],
  },

  // =====================================================================
  // FAQ
  // =====================================================================
  {
    slug: 'faq',
    title: 'FAQ & Studio Rules',
    seo: {
      title: 'FAQ & Studio Rules — Aurora & Ash',
      description:
        'How booking works, pricing, deposits, age policy, what to bring, and our cancellation policy.',
    },
    blocks: [
      {
        type: 'hero',
        title: 'FAQ & Studio Rules',
        subtitle: 'How booking works, what we charge, what to expect on the day, and the few rules we keep.',
        imageFile: 'parallax_studio.jpg',
        align: 'center',
      },
      {
        type: 'accordion',
        heading: 'Booking & deposits',
        items: [
          {
            question: 'How do I book?',
            answer:
              'Through the Inquiry form on this site. Tell us the artist you want, what you have in mind, where on the body, and rough size. We answer within 48 hours on weekdays.',
          },
          {
            question: 'What does it cost?',
            answer:
              'Pieces under 4 inches: $300–$600 minimum, depending on artist and complexity. Larger work is quoted at an hourly rate of $250–$400 per hour after the design deposit. We will give you a written estimate after the consultation.',
          },
          {
            question: 'Is the deposit refundable?',
            answer:
              'No. The deposit pays the artist for design time. It is applied to the final session price if you complete the booking. If you reschedule with 7+ days notice, the deposit transfers to the new date once. Less than 7 days, or a no-show, forfeits the deposit.',
          },
          {
            question: 'How far out are bookings?',
            answer:
              'Lead time varies by artist — Marcus and Kai are usually 6–10 weeks out, Elena and Riley 3–5 weeks, Sofia 2–4 weeks. Cancellation slots open up regularly; ask to be added to the short-notice list when you inquire.',
          },
        ],
      },
      {
        type: 'accordion',
        heading: 'Day of the appointment',
        items: [
          {
            question: 'What should I do before the session?',
            answer:
              '— Sleep well the night before.\n— Eat a real meal 1–2 hours before your appointment.\n— Drink water through the day.\n— No alcohol for 24 hours before, no aspirin or blood thinners for 48 hours before.\n— Wear clothing that gives easy access to the area being tattooed.',
          },
          {
            question: 'Can I bring someone?',
            answer:
              'One support person is welcome in the booth. The studio cannot host larger groups — we are a working space, not a bar.',
          },
          {
            question: 'Do you take payment in cash?',
            answer:
              'Yes. We accept cash, card (Visa / Mastercard / Amex), Apple Pay, Google Pay, and Zelle. Tipping is optional — when offered, 15–20% is customary in the US.',
          },
          {
            question: 'How long are sessions?',
            answer:
              'A first session is usually 2–4 hours including drawing time, stencil placement, and the actual tattoo. Larger projects are split into multiple 4–6 hour sessions, scheduled 4–8 weeks apart to allow healing.',
          },
        ],
      },
      {
        type: 'content',
        accent: true,
        body: [
          { kind: 'h2', text: 'Studio rules' },
          {
            kind: 'ul',
            items: [
              '18 years and older. We do not tattoo minors, with or without parental consent.',
              'Government-issued photo ID required at every appointment.',
              'No tattoos on hands, fingers, neck, or face for first-time clients — we want to see how you heal first.',
              "No covering up another studio's recent work without a healing window of at least 6 months.",
              'We reserve the right to decline any design we find offensive, hateful, or that we cannot execute to our standard.',
              'Children and pets cannot be in the booth during a session.',
            ],
          },
        ],
      },
      {
        type: 'accordion',
        heading: 'Touch-ups & corrections',
        items: [
          {
            question: 'Is a touch-up included?',
            answer:
              'Yes. One free touch-up within 6 months of the original session, scheduled with the same artist, on the same piece. Touch-ups beyond 6 months or on different work are quoted separately.',
          },
          {
            question: 'Do you do cover-ups?',
            answer:
              'On a case-by-case basis. Send the inquiry with clear, well-lit photos of the existing tattoo and we will tell you whether a cover-up is feasible, how large the new piece would need to be, and which of our artists is best suited.',
          },
          {
            question: 'Do you remove tattoos?',
            answer:
              'No, we do not offer laser removal. We can recommend two licensed dermatology clinics in the area; ask in your inquiry and we will share the list.',
          },
        ],
      },
      {
        type: 'parallax',
        imageFile: 'parallax_cta.jpg',
        title: 'Still have questions?',
        subtitle: 'Send your question through the Inquiry form. Most answers come back the same business day.',
        overlayIntensity: 0.7,
        sectionId: 'cta',
        height: 'half',
      },
    ],
  },

  // =====================================================================
  // PRIVACY
  // =====================================================================
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    seo: {
      title: 'Privacy Policy — Aurora & Ash',
      description: 'How Aurora & Ash collects, uses, and protects information from our website and clients.',
    },
    blocks: [
      {
        type: 'hero',
        title: 'Privacy Policy',
        subtitle: 'Last updated: May 2026.',
        imageFile: undefined,
        align: 'center',
      },
      {
        type: 'content',
        body: [
          {
            kind: 'p',
            text:
              'This policy describes how Aurora & Ash Tattoo Studio LLC ("we") collects, uses, and shares information from visitors to our website and clients of the studio.',
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
              'Photos of your healed work are only published with your written consent on the Photo Release form. You may revoke that consent at any time by emailing hello@auroraash.com — we will remove the photograph from our website and Instagram within 7 days, although it may persist in third-party caches we do not control.',
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
              'California residents have rights under the CCPA, including the right to know what personal information we hold, to request deletion, and to opt out of any sale of personal information (we do not sell). To exercise any of these rights, email hello@auroraash.com from the address on file. We respond within 45 days.',
          },
          { kind: 'h2', text: 'Contact' },
          {
            kind: 'p',
            text:
              'Aurora & Ash Tattoo Studio LLC, 8282 Santa Monica Blvd, West Hollywood, CA 90046. Email: hello@auroraash.com.',
          },
        ],
      },
    ],
  },

  // =====================================================================
  // TERMS
  // =====================================================================
  {
    slug: 'terms',
    title: 'Terms of Service',
    seo: {
      title: 'Terms of Service — Aurora & Ash',
      description:
        'Booking terms, deposit policy, photo release, and conduct rules for Aurora & Ash Tattoo Studio.',
    },
    blocks: [
      {
        type: 'hero',
        title: 'Terms of Service',
        subtitle: 'Last updated: May 2026.',
        imageFile: undefined,
        align: 'center',
      },
      {
        type: 'content',
        body: [
          {
            kind: 'p',
            text:
              'These Terms govern the relationship between Aurora & Ash Tattoo Studio LLC ("Studio", "we") and the client ("you"). By booking a session, paying a deposit, or attending a consultation, you agree to these terms.',
          },
          { kind: 'h2', text: 'Eligibility' },
          {
            kind: 'p',
            text:
              'You must be 18 years or older to receive a tattoo at the Studio. A valid government-issued photo ID is required at every appointment. We do not tattoo minors with or without parental consent.',
          },
          { kind: 'h2', text: 'Bookings and deposits' },
          {
            kind: 'p',
            text:
              'A non-refundable design deposit is required to lock a date. The deposit ranges from $150 to $400 depending on size and complexity, and is applied to the final session price. Reschedules with 7+ days notice carry the deposit forward once; reschedules with less than 7 days notice, or a no-show, forfeit the deposit and a new deposit is required to rebook.',
          },
          { kind: 'h2', text: 'Right of refusal' },
          {
            kind: 'p',
            text:
              'The Studio reserves the right to decline any design we find offensive, hateful, or that we cannot execute to our standard. We also reserve the right to refuse service to any client who appears under the influence of alcohol or drugs at the appointment.',
          },
          { kind: 'h2', text: 'Aftercare and warranty' },
          {
            kind: 'p',
            text:
              'You are responsible for following the aftercare instructions provided to you. Failure to follow aftercare voids the free touch-up included with each session. The Studio is not responsible for healing complications caused by failure to follow instructions, exposure to the sun before full healing, swimming, or scratching the fresh tattoo.',
          },
          { kind: 'h2', text: 'Photo release' },
          {
            kind: 'p',
            text:
              'You retain ownership of the image of your tattoo. The Studio asks separately for permission to photograph your healed work for the portfolio. Permission is granted only via the signed Photo Release form, can be limited (web only / Instagram only / no face / etc.), and can be revoked at any time.',
          },
          { kind: 'h2', text: 'Limitation of liability' },
          {
            kind: 'p',
            text:
              "To the fullest extent permitted by California law, the Studio's liability for any claim arising from a session is limited to the price of the session. We carry general liability and professional liability insurance.",
          },
          { kind: 'h2', text: 'Governing law' },
          {
            kind: 'p',
            text:
              'These Terms are governed by the laws of the State of California. Any dispute will be resolved in the state or federal courts located in Los Angeles County.',
          },
        ],
      },
    ],
  },

  // =====================================================================
  // ACCESSIBILITY
  // =====================================================================
  {
    slug: 'accessibility',
    title: 'Accessibility Statement',
    seo: {
      title: 'Accessibility — Aurora & Ash',
      description:
        'Our commitment to making the Aurora & Ash website and studio accessible to clients of all abilities.',
    },
    blocks: [
      {
        type: 'hero',
        title: 'Accessibility',
        subtitle: 'A studio and a website that work for clients of all abilities.',
        imageFile: undefined,
        align: 'center',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'Our commitment' },
          {
            kind: 'p',
            text:
              'Aurora & Ash is committed to providing a website and a physical studio that are accessible to people with disabilities. We aim to meet the WCAG 2.1 Level AA standard on this website and to follow ADA guidelines in our physical space. This is an ongoing effort — we audit twice a year and welcome reports of issues.',
          },
        ],
      },
      {
        type: 'accordion',
        heading: 'On this website',
        items: [
          {
            question: 'Keyboard navigation',
            answer:
              'Every interactive element is reachable by Tab, with a visible gold focus ring. The full-screen menu, the inquiry form, and the lightbox all close with Escape. The lightbox supports Left and Right arrow keys to switch images.',
          },
          {
            question: 'Screen readers',
            answer:
              'All images that are not purely decorative carry alt text. The navigation menu, inquiry form, and accordions are wired with proper ARIA roles, expanded states, and labels. Headings follow a single hierarchy per page.',
          },
          {
            question: 'Reduced motion',
            answer:
              'If your device has prefers-reduced-motion enabled, parallax, fade-ins, and scroll-driven animations are reduced or disabled. We do not use auto-playing video.',
          },
          {
            question: 'Color contrast',
            answer:
              'Text and key UI elements meet WCAG 2.1 AA contrast for body text. The site palette is intentionally limited to black, charcoal, and gold; we test contrast each release and welcome reports of any element that feels hard to read.',
          },
        ],
      },
      {
        type: 'accordion',
        heading: 'In the studio',
        items: [
          {
            question: 'Wheelchair access',
            answer:
              'The studio is on the ground floor, with a wide entry door (36 in / 91 cm) and an ADA-compliant restroom. The consultation table and one of our booths can be adjusted to accommodate a wheelchair.',
          },
          {
            question: 'Hearing accommodations',
            answer:
              'If you are Deaf or hard of hearing, please mention this in your inquiry. We can communicate by writing during the consultation and the session, and we can arrange an ASL interpreter for the consultation with one week notice.',
          },
          {
            question: 'Sensory accommodations',
            answer:
              'If you are sensitive to sound or fluorescent lighting, mention it in your inquiry — we can dim the booth, switch to warmer light, allow earplugs or noise-cancelling headphones during the session, and reduce the number of staff present.',
          },
        ],
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'Reporting an issue or requesting an alternative format' },
          {
            kind: 'p',
            text:
              'If anything on this website is hard to use, or if you need an inquiry form, aftercare instructions, or any other content in an alternative format (large print, audio, plain text), email hello@auroraash.com or call +1 (323) 555-0190. We will respond within 5 business days.',
          },
        ],
      },
    ],
  },

  // =====================================================================
  // CONTACT
  // =====================================================================
  {
    slug: 'contact',
    title: 'Visit & Contact',
    seo: {
      title: 'Contact & Hours — Aurora & Ash',
      description: 'Address, hours, phone, email, and parking for Aurora & Ash Tattoo Studio in West Hollywood.',
    },
    blocks: [
      {
        type: 'hero',
        title: 'Visit & contact',
        subtitle: 'A private studio on La Cienega Blvd, West Hollywood. Bookings start with the Inquiry form.',
        imageFile: 'studio_hero.png',
        align: 'center',
      },
      {
        type: 'content',
        body: [
          { kind: 'h2', text: 'Studio' },
          {
            kind: 'p',
            text: '8282 Santa Monica Blvd, West Hollywood, CA 90046',
          },
          { kind: 'h3', text: 'Hours' },
          { kind: 'p', text: 'Monday — Sunday, 12:00 — 20:00. By appointment only.' },
          { kind: 'h3', text: 'Phone' },
          { kind: 'p', text: '+1 (323) 555-0190 (call or text — texts get a faster reply).' },
          { kind: 'h3', text: 'Email' },
          { kind: 'p', text: 'hello@auroraash.com — checked twice a day on weekdays.' },
        ],
      },
      {
        type: 'imageFeature',
        imageFile: 'feature_map.jpg',
        caption: '8282 Santa Monica Blvd. Street parking on Olive Dr; valet at the corner of La Cienega.',
        layout: 'content-width',
      },
      {
        type: 'content',
        accent: true,
        body: [
          { kind: 'h2', text: 'Bookings' },
          {
            kind: 'p',
            text:
              'All bookings begin with the Inquiry form. Tell us the artist you want, what you have in mind, where on the body, and rough size. Most replies come back within 48 hours.',
          },
          { kind: 'h3', text: 'Press, collaborations, and editorial' },
          {
            kind: 'p',
            text: 'studio@auroraash.com — please use your real name and the publication you write for in the subject line.',
          },
        ],
      },
      {
        type: 'parallax',
        imageFile: 'parallax_contact.jpg',
        title: 'Begin a project',
        subtitle: 'A short conversation is the fastest way to find the right artist for your piece.',
        overlayIntensity: 0.7,
        sectionId: 'cta',
        height: 'tall',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Page seeding (idempotent — updates existing pages, creates missing ones)
// ---------------------------------------------------------------------------

export async function seedPages(
  payload: any,
  mediaIdsByFilename: Record<string, string | number>,
): Promise<{ created: string[]; updated: string[]; failed: Array<{ slug: string; error: string }> }> {
  const created: string[] = []
  const updated: string[] = []
  const failed: Array<{ slug: string; error: string }> = []

  for (const spec of PAGE_SPECS) {
    try {
      const blocks = buildPageBlocks(spec.blocks, mediaIdsByFilename)
      const data: Record<string, any> = {
        title: spec.title,
        slug: spec.slug,
        blocks,
        _status: 'published',
      }
      if (spec.seo) data.seo = spec.seo

      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: spec.slug } },
        limit: 1,
        draft: true,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'pages',
          id: existing.docs[0].id,
          data,
          locale: 'en',
          draft: false,
        })
        updated.push(spec.slug)
      } else {
        await payload.create({
          collection: 'pages',
          data,
          locale: 'en',
        })
        created.push(spec.slug)
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[seed-blocks] Page seed failed:', {
        slug: spec.slug,
        title: spec.title,
        message: error.message,
        stack: error.stack,
      })
      failed.push({ slug: spec.slug, error: error.message })
    }
  }

  return { created, updated, failed }
}
