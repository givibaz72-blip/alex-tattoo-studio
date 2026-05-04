'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const NAV = {
  en: {
    home: 'Home',
    studio: 'Studio',
    artists: 'Artists',
    aftercare: 'Aftercare',
    faq: 'FAQ',
    inquiry: 'Inquiry',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  ru: {
    home: 'Главная',
    studio: 'О студии',
    artists: 'Артисты',
    aftercare: 'Уход',
    faq: 'FAQ',
    inquiry: 'Заявка',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
  },
}

export default function NavBar() {
  const pathname = usePathname()
  const sp = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  const locale: 'en' | 'ru' = sp.get('locale') === 'ru' ? 'ru' : 'en'
  const t = NAV[locale]

  // Закрывать меню при смене маршрута / поисковых параметров
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, sp])

  // Когда меню открыто: блокировать body scroll, ловить Escape, ставить фокус
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      firstLinkRef.current?.focus()
    }, 80)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  function switchLocale(next: 'en' | 'ru') {
    setIsOpen(false)
    const params = new URLSearchParams(sp.toString())
    if (next === 'en') params.delete('locale')
    else params.set('locale', next)
    const qs = params.toString()
    router.push(qs ? pathname + '?' + qs : pathname)
  }

  function withLocale(href: string) {
    if (locale === 'en') return href
    const sep = href.includes('?') ? '&' : '?'
    return href + sep + 'locale=ru'
  }

  const links = [
    { href: '/', label: t.home },
    { href: '/about', label: t.studio },
    { href: '/#team', label: t.artists },
    { href: '/aftercare', label: t.aftercare },
    { href: '/faq', label: t.faq },
  ]

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-40 h-[72px] px-6 md:px-8 flex justify-between items-center bg-[#121212]/85 backdrop-blur-md border-b border-[#D4AF37]/10"
        aria-label="Primary"
      >
        {/* Логотип */}
        <Link
          href={withLocale('/')}
          className="font-serif text-[15px] tracking-[0.25em] uppercase text-[#D4AF37] hover:text-white transition-colors"
        >
          Aurora & Ash
        </Link>

        {/* Desktop-навигация */}
        <div className="hidden md:flex gap-8 items-center label-line text-[#D4AF37]/80">
          {links.map((l) => (
            <Link
              key={l.href}
              href={withLocale(l.href)}
              className="hover:text-[#D4AF37] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={withLocale('/inquiry')}
            className="label-line text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-2 hover:bg-[#D4AF37] hover:text-[#121212] transition-colors"
          >
            {t.inquiry}
          </Link>
        </div>

        {/* Правая часть: переключатель локали + хамбургер */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2 label-line">
            <button
              type="button"
              onClick={() => switchLocale('en')}
              aria-pressed={locale === 'en'}
              className={
                locale === 'en'
                  ? 'text-[#D4AF37]'
                  : 'text-[#D4AF37]/40 hover:text-[#D4AF37]/80 transition-colors'
              }
            >
              EN
            </button>
            <span aria-hidden="true" className="text-[#D4AF37]/30">/</span>
            <button
              type="button"
              onClick={() => switchLocale('ru')}
              aria-pressed={locale === 'ru'}
              className={
                locale === 'ru'
                  ? 'text-[#D4AF37]'
                  : 'text-[#D4AF37]/40 hover:text-[#D4AF37]/80 transition-colors'
              }
            >
              RU
            </button>
          </div>

          {/* Хамбургер: только на мобильных */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? t.closeMenu : t.openMenu}
            className="md:hidden relative w-9 h-9 flex flex-col items-center justify-center"
          >
            <span
              className={`absolute block w-6 h-px bg-[#D4AF37] transition-transform duration-300 ${
                isOpen ? 'rotate-45' : '-translate-y-[5px]'
              }`}
            />
            <span
              className={`absolute block w-6 h-px bg-[#D4AF37] transition-transform duration-300 ${
                isOpen ? '-rotate-45' : 'translate-y-[5px]'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Полноэкранное мобильное меню */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-[72px] bottom-0 z-30 bg-[#121212]/98 backdrop-blur-lg"
          >
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="h-full flex flex-col items-center justify-center gap-7 px-6"
            >
              {links.map((l, idx) => (
                <Link
                  key={l.href}
                  href={withLocale(l.href)}
                  ref={idx === 0 ? firstLinkRef : null}
                  onClick={() => setIsOpen(false)}
                  className="font-serif text-3xl tracking-[0.15em] uppercase text-[#D4AF37] hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              ))}

              <Link
                href={withLocale('/inquiry')}
                onClick={() => setIsOpen(false)}
                className="mt-6 px-10 py-3 border border-[#D4AF37] label-line text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#121212] transition-colors"
              >
                {t.inquiry}
              </Link>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
