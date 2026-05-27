import Link from 'next/link'

export default function LogoutButton() {
  return (
    <Link
      href="/admin/logout"
      prefetch={false}
      className="logout-button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        margin: '18px 12px 12px',
        border: '1px solid rgba(207, 102, 121, 0.45)',
        borderRadius: 3,
        color: '#cf6679',
        textDecoration: 'none',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        background: 'transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Log out
    </Link>
  )
}
