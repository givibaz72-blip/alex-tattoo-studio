import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata = {
  title: 'Aurora Ash',
  description: 'Luxury tattoo studio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.className} ${inter.className} bg-[#121212] text-[#D4AF37] min-h-screen`}>{children}</body>
    </html>
  )
}
