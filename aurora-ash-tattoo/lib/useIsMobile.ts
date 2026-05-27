'use client'

import { useEffect, useState } from 'react'

/**
 * `useIsMobile` — single source of truth for the "is this a phone-sized
 * viewport?" question used by parallax components to switch to vertical
 * art-direction crops and to soften scroll-driven motion amplitude.
 *
 * Matches `(max-width: 767px)` to stay in lock-step with Tailwind's `md:`
 * breakpoint (`min-width: 768px`). SSR-safe: starts as `false` and
 * synchronises after mount, so the desktop layout is the default during
 * hydration (preventing a flash of the mobile-only image on first paint).
 */
export function useIsMobile(query = '(max-width: 767px)'): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mq = window.matchMedia(query)
    const apply = () => setMatches(mq.matches)
    apply()
    // `addEventListener` is available in all modern browsers — Safari < 14
    // (no longer supported) used the legacy `addListener`.
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [query])

  return matches
}
