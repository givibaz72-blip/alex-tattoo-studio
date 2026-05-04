const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function ViewSiteLink() {
  return (
    <a
      href={SITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="view-site-link"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        margin: '12px 12px 18px',
        border: '1px solid #d4af37',
        borderRadius: 3,
        color: '#d4af37',
        textDecoration: 'none',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        background: 'transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      View site
    </a>
  )
}
