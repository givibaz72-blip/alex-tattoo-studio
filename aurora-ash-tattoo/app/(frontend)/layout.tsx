// Test metadata edit from Hermes: verifying branch commit delivery.
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import '../globals.css'

// Ensure the entire frontend route group — including Footer's Payload fetch —
// is always rendered dynamically so social links and CMS data are never stale.
export const dynamic = 'force-dynamic'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-inter',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Aurora & Ash — Tattoo Studio in West Hollywood',
    template: '%s — Aurora & Ash',
  },
  description:
    'Aurora & Ash is a private, appointment-only tattoo studio in West Hollywood, specializing in Neo-Traditional, Japanese Irezumi, Fine Line, Blackwork, and hand-drawn Lettering.',
  applicationName: 'Aurora & Ash',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Aurora & Ash',
    title: 'Aurora & Ash — Tattoo Studio in West Hollywood',
    description:
      'Private, by-appointment tattoo studio. Five resident artists working in lineages with documented history.',
    url: '/',
    images: [
      { url: '/seed-images/og_image.png', width: 1200, height: 630, alt: 'Aurora & Ash — West Hollywood Tattoo Studio' },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aurora & Ash — Tattoo Studio',
    description: 'Private, by-appointment tattoo studio in West Hollywood.',
    images: ['/seed-images/og_image.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-[#121212] text-[#D4AF37] min-h-screen font-sans antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  )
}
