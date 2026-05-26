import { Suspense } from 'react'
import Link from 'next/link'

import NavBar from '../../../components/NavBar'
import Footer from '../../../components/Footer'
import SocialLinks from '../../../components/SocialLinks'
import { loadStudioContact, mailHref, telHref } from '../../../lib/studio-contact'

export const metadata = {
  title: 'Contact — Aurora & Ash',
  description:
    'Contact Aurora & Ash tattoo studio in West Hollywood: appointment inquiries, studio hours, address, and social channels.',
}

export default async function ContactPage() {
  const info = await loadStudioContact(1)
  const phoneHref = telHref(info.phone)
  const emailHref = mailHref(info.email)

  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      <main id="main" className="min-h-screen bg-[#0a0a0a] text-[#D4AF37]">
        <section className="relative min-h-screen px-6 md:px-10 pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_45%),linear-gradient(180deg,#0a0a0a_0%,#121212_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-6 md:inset-x-10 top-24 bottom-8 border border-[#D4AF37]/12 pointer-events-none"
          />

          <div className="relative z-10 max-w-7xl mx-auto grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center min-h-[calc(100vh-10rem)]">
            <div>
              <p className="text-[11px] tracking-[0.42em] uppercase text-[#D4AF37]/55 mb-8">
                Contact the studio
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl tracking-tight leading-[0.96] text-[#D4AF37]">
                Visit. Write. Begin.
              </h1>
              <p className="mt-8 max-w-xl font-serif italic text-xl md:text-2xl leading-relaxed text-[#D4AF37]/70">
                A private appointment-only studio in West Hollywood. For tattoo projects, start with the inquiry form — for press or studio questions, write directly.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/inquiry"
                  className="inline-flex min-h-12 items-center justify-center border border-[#D4AF37] px-7 py-3 text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] transition-colors hover:bg-[#D4AF37] hover:text-black"
                >
                  Make an appointment
                </Link>
                <a
                  href={emailHref}
                  className="inline-flex min-h-12 items-center justify-center border border-[#D4AF37]/35 px-7 py-3 text-[11px] tracking-[0.3em] uppercase text-[#D4AF37]/75 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  Email the studio
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ContactCard label="Address">
                <p className="whitespace-pre-line">{info.address}</p>
              </ContactCard>

              <ContactCard label="Hours">
                <p>{info.hours}</p>
              </ContactCard>

              <ContactCard label="Contact">
                <a href={phoneHref} className="block underline decoration-[#D4AF37]/25 underline-offset-4 hover:text-white">
                  {info.phone}
                </a>
                <a href={emailHref} className="mt-3 block underline decoration-[#D4AF37]/25 underline-offset-4 hover:text-white">
                  {info.email}
                </a>
              </ContactCard>

              <ContactCard label="Follow">
                <SocialLinks social={info.social as any} variant="footer" />
              </ContactCard>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

function ContactCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="min-h-44 border border-[#D4AF37]/18 bg-black/20 p-6 md:p-7 backdrop-blur-sm">
      <h2 className="mb-6 text-[11px] tracking-[0.34em] uppercase text-[#D4AF37]/55">
        {label}
      </h2>
      <div className="text-sm md:text-base leading-relaxed text-[#D4AF37]/85">
        {children}
      </div>
    </section>
  )
}
