'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Fullscreen "MENU" overlay - inspired by Bang Bang Forever.
 *
 * Header is fixed and transparent at the top of the page; once the user
 * scrolls past the hero we fade in a subtle dark backdrop. The only
 * interactive element on the right is the MENU/CLOSE label. Clicking it
 * fades in a fullscreen dark overlay with the link list and a contact
 * footer pulled from the Studio global.
 */

export type ArtistLink = {
  slug: string
  name: string
}

export type StudioInfo = {
  phone?: string | null
  address?: string | null
  social?: {
    instagram?: string | null
    tiktok?: string | null
    telegram?: string | null
    whatsapp?: string | null
  } | null
}

interface Props {
  artists: ArtistLink[]
  studio: StudioInfo
}

// Single-page sections — anchors on the homepage. Keep this list in sync with
// the `sectionId` values used in scripts/seed-blocks.ts (home page).
const SECTION_IDS = ['home', 'studio', 'artists', 'location', 'aftercare', 'faq', 'contact'] as const
type SectionId = (typeof SECTION_IDS)[number]

const FALLBACK = {
  address: '827 N La Cienega Blvd, Suite 4\nWest Hollywood, CA 90069',
  phone: '+1 (323) 555-0142',
}

// Soft "expo-out" easing: snappy on entry, slow at finish.
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function NavMenu({ artists, studio }: Props) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [headerSolid, setHeaderSolid] = useState(false)
  const [atTop, setAtTop] = useState(true)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  // ---------------------------------------------------------------------
  // Scroll position: fades the header backdrop in/out, drives Home active
  // ---------------------------------------------------------------------
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setAtTop(y < 80)
      setHeaderSolid(y > 80)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ---------------------------------------------------------------------
  // Section observer (only on home) - drives the active link in the menu
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isHome) {
      setActiveSection(null)
      return
    }
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible: { id: SectionId; ratio: number }[] = []
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            visible.push({
              id: entry.target.id as SectionId,
              ratio: entry.intersectionRatio,
            })
          }
        }
        if (visible.length === 0) return
        visible.sort((a, b) => b.ratio - a.ratio)
        const winner = visible[0].id
        setActiveSection((prev) => (prev === winner ? prev : winner))
      },
      { threshold: [0.5] },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isHome])

  // Reset active section when scrolled back to top
  useEffect(() => {
    if (isHome && atTop) setActiveSection(null)
  }, [atTop, isHome])

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // ---------------------------------------------------------------------
  // Body scroll lock + ESC + autofocus when menu is open
  // Compensates for scrollbar width to avoid horizontal layout shift.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) {
      if (document.body.dataset.scrollLocked === 'true') {
        document.body.dataset.scrollLocked = 'false'
        document.body.style.paddingRight = ''
      }
      return
    }
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const previousPadding = document.body.style.paddingRight
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.dataset.scrollLocked = 'true'

    const focusTimer = window.setTimeout(() => firstLinkRef.current?.focus(), 120)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.dataset.scrollLocked = 'false'
      document.body.style.paddingRight = previousPadding
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  // Defensive cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.dataset.scrollLocked = 'false'
      document.body.style.paddingRight = ''
    }
  }, [])

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  const anchorHref = useCallback(
    (sectionId: SectionId): string => (isHome ? `#${sectionId}` : `/#${sectionId}`),
    [isHome],
  )

  const closeMenu = useCallback(() => setIsOpen(false), [])

  const activeKey = useMemo<string | null>(() => {
    if (pathname === '/inquiry') return 'inquiry'
    if (pathname.startsWith('/portfolio')) return 'artists'
    if (!isHome) return null
    if (activeSection) return activeSection
    if (atTop && activeSection === null) return 'home'
    return null
  }, [pathname, isHome, atTop, activeSection])

  const info = useMemo(
    () => ({
      address: studio.address || FALLBACK.address,
      phone: studio.phone || FALLBACK.phone,
    }),
    [studio],
  )
  const social = studio.social ?? {}

  // ---------------------------------------------------------------------
  // Variants
  // ---------------------------------------------------------------------
  const overlayVariants = {
    closed: { opacity: 0, transition: { duration: 0.25, ease: EASE_OUT_EXPO } },
    open: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT_EXPO } },
  }
  const listVariants = {
    closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
    open: { transition: { staggerChildren: 0.045, delayChildren: 0.15 } },
  }
  const itemVariants = {
    closed: { opacity: 0, y: 18, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
    open: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
  }
  const footerVariants = {
    closed: { opacity: 0, transition: { duration: 0.15 } },
    open: { opacity: 1, transition: { duration: 0.4, delay: 0.45, ease: EASE_OUT_EXPO } },
  }

  return (
    <>
      {/* Header — top-of-page hairline gradient ensures the logo stays
          readable on light hero images even before scroll. */}
      <header
        className={`fixed top-0 inset-x-0 z-[60] h-[72px] px-6 md:px-10 flex justify-between items-center transition-colors duration-300 ${
          headerSolid && !isOpen
            ? 'bg-[#0a0a0a]/95 backdrop-blur-md'
            : 'bg-gradient-to-b from-[#0a0a0a]/45 via-[#0a0a0a]/15 to-transparent'
        }`}
      >
        <Link
          href="/"
          onClick={closeMenu}
          className="font-serif text-[15px] tracking-[0.28em] uppercase text-[#D4AF37] hover:text-white transition-colors min-h-11 inline-flex items-center"
        >
          Aurora &amp; Ash
        </Link>

        <div className="flex items-center gap-x-12 pr-10">
          {/* Persistent Inquiry CTA — visible at every scroll position so the
              main conversion path is always one click away. Hidden when the
              fullscreen overlay is open (the overlay has its own CTA). */}
          {!isOpen ? (
            <Link
              href="/inquiry"
              className="hidden sm:inline-flex items-center min-h-11 px-5 md:px-6 text-[11px] tracking-[0.28em] uppercase font-sans border border-[#D4AF37]/55 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
            >
              Make an appointment
            </Link>
          ) : null}

          {/* Hairline divider between the two header controls so they read as
              distinct actions, not a glued pair. Hidden on mobile where the
              Inquiry pill collapses. */}
          {!isOpen ? (
            <span className="mx-8">
              <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-[#D4AF37]/25" />
            </span>
          ) : null}

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            aria-expanded={isOpen}
            aria-controls="aurora-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="relative inline-flex items-center justify-end px-3 py-1 text-[12px] tracking-[0.32em] uppercase text-[#D4AF37] hover:text-white transition-colors min-w-[88px] min-h-11"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isOpen ? 'close' : 'menu'}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                className="inline-block"
              >
                {isOpen ? 'Close' : 'Menu'}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="aurora-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-50 bg-[#0a0a0a]/98 backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            {/* Scrollable list region */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto px-6 pt-[88px] pb-10">
              <motion.ul
                variants={listVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex flex-col items-center text-center gap-3 md:gap-5 w-full max-w-2xl"
              >
                <motion.li variants={itemVariants}>
                  <Link
                    ref={firstLinkRef}
                    href="/"
                    onClick={closeMenu}
                    className={menuLinkClass(activeKey === 'home')}
                  >
                    Home
                  </Link>
                </motion.li>

                <motion.li variants={itemVariants}>
                  <Link
                    href={anchorHref('studio')}
                    onClick={closeMenu}
                    className={menuLinkClass(activeKey === 'studio')}
                  >
                    Studio
                  </Link>
                </motion.li>

                <motion.li variants={itemVariants}>
                  <Link
                    href={anchorHref('artists')}
                    onClick={closeMenu}
                    className={menuLinkClass(activeKey === 'artists')}
                  >
                    Artists
                  </Link>
                </motion.li>

                <motion.li variants={itemVariants}>
                  <Link
                    href={anchorHref('location')}
                    onClick={closeMenu}
                    className={menuLinkClass(activeKey === 'location')}
                  >
                    Location
                  </Link>
                </motion.li>

                <motion.li variants={itemVariants}>
                  <Link
                    href={anchorHref('aftercare')}
                    onClick={closeMenu}
                    className={menuLinkClass(activeKey === 'aftercare')}
                  >
                    Aftercare
                  </Link>
                </motion.li>

                <motion.li variants={itemVariants}>
                  <Link
                    href={anchorHref('faq')}
                    onClick={closeMenu}
                    className={menuLinkClass(activeKey === 'faq')}
                  >
                    FAQ
                  </Link>
                </motion.li>

                <motion.li variants={itemVariants}>
                  <Link
                    href={anchorHref('contact')}
                    onClick={closeMenu}
                    className={menuLinkClass(activeKey === 'contact')}
                  >
                    Contact
                  </Link>
                </motion.li>

                {/* MAKE AN APPOINTMENT — boxed CTA, points at the form */}
                <motion.li variants={itemVariants} className="mt-6 md:mt-10">
                  <Link
                    href="/inquiry"
                    onClick={closeMenu}
                    className={`inline-block border px-10 py-3 font-serif text-2xl md:text-3xl tracking-tight transition-colors min-h-11 ${
                      activeKey === 'inquiry'
                        ? 'border-[#D4AF37] bg-[#D4AF37] text-black italic'
                        : 'border-[#D4AF37]/50 text-[#D4AF37]/80 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'
                    }`}
                  >
                    Make an appointment
                  </Link>
                </motion.li>
              </motion.ul>
            </div>

            {/* No contact-footer inside the menu overlay on the single-page
                layout — Contact is one of the menu items and the same data
                also lives in the global site footer. Duplicating it inside
                the overlay added visual noise without new information. */}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

// -----------------------------------------------------------------------
// Class helpers
// -----------------------------------------------------------------------

function menuLinkClass(active: boolean) {
  return [
    'inline-block font-serif tracking-tight leading-[1.05]',
    'text-[40px] sm:text-5xl md:text-7xl',
    'transition-colors duration-200',
    active ? 'text-[#D4AF37] italic' : 'text-[#D4AF37]/40 hover:text-[#D4AF37]',
  ].join(' ')
}

function subLinkClass(active: boolean) {
  return [
    'inline-block font-serif tracking-tight transition-colors duration-200',
    'text-xl md:text-2xl',
    active ? 'text-[#D4AF37] italic' : 'text-[#D4AF37]/35 hover:text-[#D4AF37]/85',
  ].join(' ')
}

