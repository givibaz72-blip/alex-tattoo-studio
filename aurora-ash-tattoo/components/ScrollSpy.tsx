'use client'

import { useEffect } from 'react'

/**
 * ScrollSpy — updates the URL fragment as the user scrolls through the
 * one-page sections on the homepage.
 *
 *   <section id="studio">…</section>
 *   <section id="artists">…</section>
 *
 * Observes every element matching `[data-scroll-section]` OR `section[id]`
 * inside `main#main` (configurable via prop). When ≥ 50% of a section is
 * visible, the URL is updated via `history.replaceState` — so the back
 * button still works, and `location.hash` stays in sync with what the user
 * is reading. All writes are throttled to one per animation frame so the
 * URL bar doesn't churn on fast scrolls (a known iOS Safari issue).
 *
 * Disabled when the page is not the homepage — anchors on subpages should
 * not rewrite the URL.
 */
interface ScrollSpyProps {
  /** CSS selector pattern that resolves to the anchor candidates. */
  selector?: string
  /** Restrict to this pathname (default: `/`). Pass null to always run. */
  onlyOn?: string | null
}

export default function ScrollSpy({
  selector = '[data-scroll-section], section[id]',
  onlyOn = '/',
}: ScrollSpyProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (onlyOn !== null && window.location.pathname !== onlyOn) return

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => Boolean(el.id),
    )
    if (elements.length === 0) return

    // If the page is opened with a hash (`/#studio`), do not immediately clear
    // it while the browser is still performing the initial anchor jump.
    let allowTopHashClear = !window.location.hash
    const topHashClearTimer = window.setTimeout(() => {
      allowTopHashClear = true
    }, 1200)

    // Track latest "winning" section and write to URL once per animation frame.
    let latestHash: string | null = null
    let frame = 0
    const flush = () => {
      frame = 0
      if (latestHash == null) return
      const next = latestHash
      if (window.location.hash === next) return
      // Use replaceState so the browser history is not polluted with every
      // section the user scrolls past.
      window.history.replaceState(null, '', next)
      // Notify other listeners (NavMenu reads location.hash for active state).
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry currently most visible.
        const visible = entries.filter((e) => e.isIntersecting && e.intersectionRatio >= 0.5)
        if (visible.length === 0) return
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const winner = visible[0].target as HTMLElement
        const id = winner.id
        if (!id) return
        latestHash = `#${id}`
        if (!frame) frame = window.requestAnimationFrame(flush)
      },
      { threshold: [0.5, 0.75] },
    )

    elements.forEach((el) => observer.observe(el))

    // Special case — when user scrolls to the very top, clear the hash so
    // the URL reverts to the canonical `/`. Without this, the URL would
    // stay at `#home` indefinitely after the first scroll.
    const onScroll = () => {
      if (window.scrollY < 80) {
        if (allowTopHashClear && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          window.dispatchEvent(new HashChangeEvent('hashchange'))
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.clearTimeout(topHashClearTimer)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [selector, onlyOn])

  return null
}
