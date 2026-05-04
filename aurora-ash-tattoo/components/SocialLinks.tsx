import { getSocialLinks, type SocialBlock } from '../lib/social'

interface SocialLinksProps {
  social?: SocialBlock | null
  className?: string
}

const ICONS: Record<string, string> = {
  instagram: 'IG',
  tiktok: 'TT',
  telegram: 'TG',
  whatsapp: 'WA',
  email: '@',
  website: 'WWW',
}

export default function SocialLinks({ social, className }: SocialLinksProps) {
  const links = getSocialLinks(social)
  if (links.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-4 items-center ${className ?? ''}`}>
      {links.map((link) => (
        <li key={link.platform}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#D4AF37]/30 rounded-sm text-[10px] uppercase tracking-[0.3em] hover:bg-[#D4AF37] hover:text-black transition-colors"
            aria-label={link.label}
          >
            <span className="font-mono">{ICONS[link.platform] ?? '-'}</span>
            <span>{link.label}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
