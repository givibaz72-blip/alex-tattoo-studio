import { getPayload } from './payload'
import {
  DEFAULT_STUDIO_CONTACT,
  formatAddressInline,
  type StudioContact,
} from './studio-contact-defaults'

export type { StudioContact, StudioSocial } from './studio-contact-defaults'
export { DEFAULT_STUDIO_CONTACT, formatAddressInline, mailHref, telHref } from './studio-contact-defaults'

export async function loadStudioContact(depth = 1): Promise<StudioContact> {
  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth,
    })) as Partial<StudioContact> & {
      social?: StudioContact['social'] | null
    }

    const address = settings.address?.trim() || DEFAULT_STUDIO_CONTACT.address

    return {
      studioName: settings.studioName?.trim() || DEFAULT_STUDIO_CONTACT.studioName,
      phone: settings.phone?.trim() || DEFAULT_STUDIO_CONTACT.phone,
      email: settings.email?.trim() || DEFAULT_STUDIO_CONTACT.email,
      address,
      addressInline: formatAddressInline(address),
      addressLocality: settings.addressLocality?.trim() || DEFAULT_STUDIO_CONTACT.addressLocality,
      addressRegion: settings.addressRegion?.trim() || DEFAULT_STUDIO_CONTACT.addressRegion,
      postalCode: settings.postalCode?.trim() || DEFAULT_STUDIO_CONTACT.postalCode,
      addressCountry: settings.addressCountry?.trim() || DEFAULT_STUDIO_CONTACT.addressCountry,
      mapEmbedUrl: settings.mapEmbedUrl?.trim() || DEFAULT_STUDIO_CONTACT.mapEmbedUrl,
      hours: settings.hours?.trim() || DEFAULT_STUDIO_CONTACT.hours,
      social: settings.social ?? DEFAULT_STUDIO_CONTACT.social,
    }
  } catch {
    return DEFAULT_STUDIO_CONTACT
  }
}
