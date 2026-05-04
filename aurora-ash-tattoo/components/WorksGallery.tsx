'use client'

import { useEffect, useState, useCallback } from 'react'
import MediaImage, { type MediaDoc } from './MediaImage'

type WorkImage = {
  image?: MediaDoc | string | number | null
  caption?: string | null
}

type Work = {
  id: string | number
  title?: string | null
  placement?: string | null
  size?: string | null
  year?: number | null
  description?: string | null
  images?: WorkImage[] | null
}

interface Props {
  works: Work[]
}

export default function WorksGallery({ works }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const [slide, setSlide] = useState(0)

  const closeLightbox = useCallback(() => setActive(null), [])

  const activeWork = active != null ? works[active] : null
  const activeImages = (activeWork?.images ?? []).filter(
    (it) => it && it.image && typeof it.image === 'object',
  ) as Array<{ image: MediaDoc; caption?: string | null }>

  const next = useCallback(() => {
    if (!activeImages.length) return
    setSlide((s) => (s + 1) % activeImages.length)
  }, [activeImages.length])

  const prev = useCallback(() => {
    if (!activeImages.length) return
    setSlide((s) => (s - 1 + activeImages.length) % activeImages.length)
  }, [activeImages.length])

  useEffect(() => {
    if (active == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active, closeLightbox, next, prev])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map((work, idx) => {
          const imgs = (work.images ?? []).filter(
            (it) => it && it.image && typeof it.image === 'object',
          )
          const firstImage = imgs[0]?.image as MediaDoc | undefined
          if (!firstImage) return null
          const count = imgs.length
          return (
            <button
              type="button"
              key={work.id}
              onClick={() => {
                setActive(idx)
                setSlide(0)
              }}
              className="group relative aspect-square overflow-hidden bg-white/5 border border-[#D4AF37]/10 text-left"
            >
              <MediaImage
                media={firstImage}
                size="card"
                alt={work.title ?? ''}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {count > 1 ? (
                <span className="absolute top-3 right-3 z-10 bg-black/60 text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] px-2 py-1 border border-[#D4AF37]/30">
                  +{count - 1}
                </span>
              ) : null}
              <figcaption className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#121212] to-transparent text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                {work.title}
                {work.placement ? <span className="opacity-60"> - {work.placement}</span> : null}
              </figcaption>
            </button>
          )
        })}
      </div>

      {active != null && activeWork && activeImages.length > 0 ? (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-20 text-[#D4AF37] uppercase tracking-[0.3em] text-xs px-3 py-2 border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black transition"
          >
            Close
          </button>

          <div
            className="relative flex-1 flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {activeImages.length > 1 ? (
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 z-10 text-[#D4AF37] text-3xl px-3 py-2 border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black transition"
                aria-label="Previous"
              >
                {'<'}
              </button>
            ) : null}

            <div className="relative w-full max-w-5xl aspect-[4/3]">
              <MediaImage
                media={activeImages[slide].image}
                size="hero"
                alt={activeImages[slide].caption ?? activeWork.title ?? ''}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {activeImages.length > 1 ? (
              <button
                type="button"
                onClick={next}
                className="absolute right-4 z-10 text-[#D4AF37] text-3xl px-3 py-2 border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black transition"
                aria-label="Next"
              >
                {'>'}
              </button>
            ) : null}
          </div>

          <div
            className="px-8 py-6 text-[#D4AF37] text-sm flex flex-col gap-2 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="uppercase tracking-[0.3em] text-xs opacity-70">
              {activeWork.title}
              {activeWork.placement ? <span className="opacity-50"> - {activeWork.placement}</span> : null}
            </p>
            {activeImages[slide].caption ? (
              <p className="opacity-80">{activeImages[slide].caption}</p>
            ) : null}
            {activeImages.length > 1 ? (
              <div className="flex gap-2 mt-2">
                {activeImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    aria-label={`Go to image ${i + 1}`}
                    className={
                      'w-2 h-2 rounded-full transition ' +
                      (i === slide ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/30 hover:bg-[#D4AF37]/60')
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
