/**
 *       URL.
 * : "@username", "username", "instagram.com/username", "https://...".
 */
export function normalizeSocialUrl(
  platform: 'instagram' | 'tiktok' | 'telegram' | 'whatsapp' | 'website',
  raw?: string | null,
): string | null {
  if (!raw) return null
  const v = raw.trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v

  const handle = v.replace(/^@/, '').replace(/^\/+/, '')

  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle.replace(/^instagram\.com\//, '')}`
    case 'tiktok':
      return `https://tiktok.com/@${handle.replace(/^tiktok\.com\/@?/, '')}`
    case 'telegram':
      return `https://t.me/${handle.replace(/^t\.me\//, '')}`
    case 'whatsapp':
      return `https://wa.me/${handle.replace(/[^\d]/g, '')}`
    case 'website':
      return `https://${handle}`
    default:
      return null
  }
}

export type SocialBlock = {
  instagram?: string | null
  tiktok?: string | null
  telegram?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
}

export function getSocialLinks(s?: SocialBlock | null) {
  if (!s) return []
  const items: Array<{ platform: string; url: string; label: string }> = []
  const ig = normalizeSocialUrl('instagram', s.instagram)
  if (ig) items.push({ platform: 'instagram', url: ig, label: 'Instagram' })
  const tt = normalizeSocialUrl('tiktok', s.tiktok)
  if (tt) items.push({ platform: 'tiktok', url: tt, label: 'TikTok' })
  const tg = normalizeSocialUrl('telegram', s.telegram)
  if (tg) items.push({ platform: 'telegram', url: tg, label: 'Telegram' })
  const wa = normalizeSocialUrl('whatsapp', s.whatsapp)
  if (wa) items.push({ platform: 'whatsapp', url: wa, label: 'WhatsApp' })
  if (s.email) items.push({ platform: 'email', url: `mailto:${s.email}`, label: 'Email' })
  const ws = normalizeSocialUrl('website', s.website)
  if (ws) items.push({ platform: 'website', url: ws, label: 'Website' })
  return items
}
