'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AccordionBlockData } from './types'

interface Props {
  block: AccordionBlockData
}

export default function AccordionBlock({ block }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const items = block.items ?? []

  return (
    <section className="bg-[#121212] text-[#D4AF37] py-20 md:py-24 px-6 md:px-10">
      <div className="max-w-3xl mx-auto">
        {block.heading ? (
          <h2 className="font-serif text-3xl md:text-4xl mb-12 tracking-tight">
            {block.heading}
          </h2>
        ) : null}

        <ul className="border-t border-[#D4AF37]/15">
          {items.map((it, i) => {
            const isOpen = openIndex === i
            return (
              <li key={it.id ?? i} className="border-b border-[#D4AF37]/15">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex justify-between items-center gap-6 py-6 md:py-7 text-left group"
                >
                  <span className="font-serif text-lg md:text-xl text-[#D4AF37] group-hover:text-white transition-colors leading-snug">
                    {it.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex-shrink-0 w-6 h-6 relative transition-transform duration-300 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    <span className="absolute left-0 right-0 top-1/2 h-px bg-[#D4AF37]" />
                    <span className="absolute top-0 bottom-0 left-1/2 w-px bg-[#D4AF37]" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="pb-7 pr-12 text-[#D4AF37]/80 leading-relaxed whitespace-pre-line">
                        {it.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
