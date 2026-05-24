import { getPayload } from '../lib/payload'

import TeamGrid, { type TeamMember } from './TeamGrid'

const FALLBACK: TeamMember[] = [
  { id: 1, name: 'Alex White North', slug: 'alex', styles: [{ id: 1, name: 'Blackwork' }], portrait: { url: '/portfolio/alex.png', alt: 'Alex' } },
  { id: 2, name: 'Aurora', slug: 'aurora', styles: [{ id: 2, name: 'Fine Line' }, { id: 3, name: 'Ornamental' }], portrait: { url: '/portfolio/aurora.png', alt: 'Aurora' } },
  { id: 3, name: 'Julian', slug: 'julian', styles: [{ id: 4, name: 'Minimalism' }, { id: 5, name: 'Dark Art' }], portrait: { url: '/portfolio/julian.png', alt: 'Julian' } },
]

const COPY = {
  eyebrow: 'The collective',
  heading: 'Artists',
}

export default async function Team() {
  let members: TeamMember[] = FALLBACK

  try {
    const payload = await getPayload()
    const res = await payload.find({
      collection: 'artists',
      where: { featured: { equals: true } },
      sort: 'order',
      depth: 1,
      limit: 12,
    })

    if (res.docs.length > 0) {
      members = res.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
        styles: Array.isArray(doc.styles) ? doc.styles : null,
        portrait: typeof doc.portrait === 'object' ? doc.portrait : null,
      }))
    }
  } catch (err) {
    console.error('[Team] failed to load artists from Payload, using fallback', err)
  }

  return (
    <section
      id="team"
      className="py-24 md:py-32 bg-[#121212] text-[#D4AF37] border-t border-[#D4AF37]/10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16 md:mb-20">
          <p className="label-line text-[#D4AF37]/55 mb-4">{COPY.eyebrow}</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight">
            {COPY.heading}
          </h2>
        </div>
        <TeamGrid members={members} />
      </div>
    </section>
  )
}
