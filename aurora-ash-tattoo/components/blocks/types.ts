import type { MediaDoc } from '../MediaImage'

/** Anchor id used for in-page scroll links + scroll-spy. Optional. */
type WithSectionId = { sectionId?: string | null }

export type HeroBlockData = WithSectionId & {
  blockType: 'hero'
  id?: string
  title: string
  subtitle?: string | null
  backgroundImage?: MediaDoc | string | number | null
  align?: 'center' | 'left'
}

export type ContentTypography = {
  family?: 'default' | 'modern-gothic' | 'minimalist' | null
  scale?: 'sm' | 'base' | 'lg' | 'xl' | null
}

export type ContentBlockData = WithSectionId & {
  blockType: 'content'
  id?: string
  body: any // Lexical JSON. Renamed from `content` to avoid collision with block slug.
  accentBackground?: boolean | null
  typography?: ContentTypography | null
}

export type ImageFeatureData = WithSectionId & {
  blockType: 'imageFeature'
  id?: string
  image: MediaDoc | string | number
  caption?: string | null
  layout?: 'full-width' | 'content-width'
}

export type AccordionItem = {
  question: string
  answer: string
  id?: string
}

export type AccordionBlockData = WithSectionId & {
  blockType: 'accordion'
  id?: string
  heading?: string | null
  items: AccordionItem[]
}

export type ArtistGridBlockData = WithSectionId & {
  blockType: 'artistGrid'
  id?: string
  heading?: string | null
  featuredOnly?: boolean | null
}

export type ParallaxBlockData = {
  blockType: 'parallax'
  id?: string
  /** Landscape/desktop background. Shown on >= 768px viewports. */
  backgroundImage: MediaDoc | string | number
  /** Optional portrait/vertical crop shown on < 768px. */
  mobileImage?: MediaDoc | string | number | null
  title?: string | null
  subtitle?: string | null
  brandPillars?: Array<{ pillar: string; id?: string | null }> | null
  overlayIntensity?: number | null
  sectionId?: string | null
  height?: 'screen' | 'tall' | 'half' | null
}

export type ColumnsLayout = '50_50' | '33_66' | '66_33' | '33_33_33'

export type ColumnsItem = {
  id?: string
  body?: any // Lexical
  image?: MediaDoc | string | number | null
  imageCaption?: string | null
}

export type ColumnsBlockData = WithSectionId & {
  blockType: 'columns'
  id?: string
  layout?: ColumnsLayout | null
  gap?: 'sm' | 'md' | 'lg' | null
  items: ColumnsItem[]
}

export type PageBlock =
  | HeroBlockData
  | ContentBlockData
  | ImageFeatureData
  | AccordionBlockData
  | ArtistGridBlockData
  | ParallaxBlockData
  | ColumnsBlockData
