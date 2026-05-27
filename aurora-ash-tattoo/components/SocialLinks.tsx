import { getSocialLinks, type SocialBlock } from '../lib/social'

const ICONS: Record<string, string> = {
  instagram: 'IG',
  tiktok: 'TT',
  telegram: 'TG',
  whatsapp: 'WA',
  email: '@',
  website: 'WWW',
}

interface SocialLinksProps {
  social?: SocialBlock | null
  className?: string
  variant?: 'default' | 'footer'
}

export default function SocialLinks({ social, className, variant = 'default' }: SocialLinksProps) {
  const links = getSocialLinks(social)
  if (links.length === 0) return null

  // Footer variant: gold-aligned, consistent with the rest of the site
  if (variant === 'footer') {
    return (
      <div className={`flex flex-col gap-5 ${className ?? ''}`}>
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 text-[14px] text-[var(--text-secondary)] hover:text-[var(--color-gold)] transition-colors min-h-11"
            aria-label={link.label}
          >
            <span className="flex items-center justify-center w-9 h-9 border border-[#D4AF37]/30 text-[10px] font-sans font-medium text-[#D4AF37] tracking-wider">
              {ICONS[link.platform] ?? '·'}
            </span>
            <span className="underline underline-offset-2 decoration-[#D4AF37]/30 hover:decoration-[#D4AF37] transition-colors">
              {link.label}
            </span>
          </a>
        ))}
      </div>
    )
  }

  // Default variant: gold accent pill row
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
