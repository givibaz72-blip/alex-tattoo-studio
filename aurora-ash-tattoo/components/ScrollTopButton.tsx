'use client'

import { useEffect, useState } from 'react'

/**
 * Floating "scroll to top" pill.
 *
 * Fixed in the bottom-right corner of the viewport — independent of the
 * footer's flow, so it never overlaps with the page's primary CTAs (e.g.
 * the inquiry form's NEXT button, which used to sit directly under the
 * absolutely-positioned scroll-top label).
 *
 * Visible only after the user scrolls more than ~one viewport height.
 */
export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 inline-flex items-center gap-2 min-h-11 px-4 py-2 border border-[#D4AF37]/40 bg-[#0a0a0a]/85 backdrop-blur-md text-[11px] font-sans uppercase tracking-[0.28em] text-[#D4AF37]/80 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors shadow-lg shadow-black/40"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span>Top</span>
    </button>
  )
}
