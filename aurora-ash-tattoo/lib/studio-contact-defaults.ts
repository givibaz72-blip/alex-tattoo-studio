export type StudioSocial = {
  instagram?: string | null
  tiktok?: string | null
  telegram?: string | null
  whatsapp?: string | null
}

export type StudioContact = {
  studioName: string
  phone: string
  email: string
  address: string
  addressInline: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string
  mapEmbedUrl: string
  hours: string
  social: StudioSocial
}

export const DEFAULT_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4065.69233176963!2d-118.37259442370754!3d34.090485315709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2beb884d7a495%3A0x4abda10eb14fc5f6!2s8282%20Santa%20Monica%20Blvd%2C%20West%20Hollywood%2C%20CA%2090046%2C%20%D0%A1%D0%A8%D0%90!5e1!3m2!1sru!2sru!4v1779624430736!5m2!1sru!2sru'

export const DEFAULT_STUDIO_CONTACT: StudioContact = {
  studioName: 'Aurora & Ash Tattoo',
  phone: '+1 (323) 555-0190',
  email: 'hello@auroraash.com',
  address: '8282 Santa Monica Blvd\nWest Hollywood, CA 90046',
  addressInline: '8282 Santa Monica Blvd · West Hollywood, CA 90046',
  addressLocality: 'West Hollywood',
  addressRegion: 'CA',
  postalCode: '90046',
  addressCountry: 'US',
  mapEmbedUrl: DEFAULT_MAP_EMBED_URL,
  hours: 'Mon — Sun: 12 PM — 8 PM (By Appointment Only)',
  social: {
    instagram: '@aurora_ash_tattoo',
    tiktok: '@aurora_ash_tattoo',
    telegram: '',
    whatsapp: '',
  },
}

export function formatAddressInline(address: string) {
  return address.replace(/\s*\n\s*/g, ' · ').trim()
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

export function mailHref(email: string) {
  return `mailto:${email}`
}
