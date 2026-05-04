import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import '../globals.css'

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

export const metadata: Metadata = {
  title: 'Aurora & Ash',
  description: 'Luxury tattoo studio',
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
