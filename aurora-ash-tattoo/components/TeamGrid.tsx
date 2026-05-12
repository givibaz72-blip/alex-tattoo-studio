"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'

import MediaImage, { type MediaDoc } from './MediaImage'

export type TeamMember = {
  id: string | number
  name: string
  slug: string
  role?: string | null
  portrait?: MediaDoc | null
}

interface Props {
  members: TeamMember[]
}

const COPY = {
  viewPortfolio: 'View portfolio',
  noPortrait: 'Portrait coming soon',
}

export default function TeamGrid({ members }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
      {members.map((member, idx) => {
        const portfolioHref = `/portfolio/${member.slug}`

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: idx * 0.12, ease: 'easeOut' }}
            className="group"
          >
            <Link href={portfolioHref} className="block focus:outline-none">
              <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden border border-[#D4AF37]/20 transition-all duration-500 group-hover:border-[#D4AF37]/70 group-focus-within:border-[#D4AF37]/70 bg-white/5">
                {member.portrait ? (
                  <MediaImage
                    media={member.portrait}
                    size="card"
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center label-line text-[#D4AF37]/40">
                    {COPY.noPortrait}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/25 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-45 group-focus-within:opacity-45" />
              </div>

              <div className="mt-6 text-center">
                <h3 className="font-serif text-2xl tracking-wide uppercase mb-2">
                  {member.name}
                </h3>
                {member.role ? (
                  <p className="label-line text-[#D4AF37]/60 mb-3">{member.role}</p>
                ) : null}
                <p className="label-line text-[#D4AF37]/45 transition-colors duration-300 group-hover:text-[#D4AF37] group-focus-within:text-[#D4AF37]">
                  {COPY.viewPortfolio} <span aria-hidden="true">→</span>
                </p>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
