import { Suspense } from 'react'
import type { Metadata } from 'next'

import NavBar from '../../../components/NavBar'
import Footer from '../../../components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service — Aurora & Ash',
  description: 'Studio policies, booking terms, and conditions of service for Aurora & Ash tattoo studio in West Hollywood.',
}

const SECTIONS = [
  {
    h: '1. Booking & Deposits',
    body:
      'All appointments require a non-refundable deposit to secure your session. The deposit amount is determined at the time of booking and is applied toward your final session cost. Deposits are forfeited if you cancel with less than 72 hours notice or fail to appear.',
  },
  {
    h: '2. Age Requirement',
    body:
      'You must be 18 years of age or older to receive a tattoo at Aurora & Ash. Valid government-issued photo ID is required at every appointment. We reserve the right to refuse service if identification cannot be verified.',
  },
  {
    h: '3. Health & Safety',
    body:
      'You are responsible for disclosing any medical conditions, allergies, or medications that may affect your tattoo or healing process. We reserve the right to decline a booking or stop a session if we believe proceeding would pose a health risk to you or our artists.',
  },
  {
    h: '4. Design & Artwork',
    body:
      'All original artwork created by our artists remains the intellectual property of Aurora & Ash and the individual artist. We are happy to adapt designs to your preferences during consultation, but we do not replicate another artist\'s original work verbatim.',
  },
  {
    h: '5. Cancellation & Rescheduling',
    body:
      'You may reschedule your appointment once without penalty with at least 72 hours notice. Subsequent reschedules, or changes made with less than 72 hours notice, may result in deposit forfeiture. We will always do our best to accommodate genuine emergencies — please contact us as early as possible.',
  },
  {
    h: '6. Aftercare Responsibility',
    body:
      'Proper aftercare is essential to a successful tattoo. Following your session, we will provide detailed written aftercare instructions. Touch-ups within the first three months are complimentary for issues arising from our process, but not from improper aftercare or client neglect.',
  },
  {
    h: '7. Right to Refuse Service',
    body:
      'Aurora & Ash reserves the right to refuse or discontinue service at any time, for any reason, including but not limited to: intoxication, disrespectful conduct toward our artists or staff, or requests for designs that conflict with our studio values.',
  },
  {
    h: '8. Photography & Portfolio',
    body:
      'We may photograph completed work for our portfolio, social media, and marketing materials. If you prefer your tattoo not be photographed, please let us know before your session. By default, submission of an inquiry constitutes implicit consent to our standard studio photography practices unless you opt out.',
  },
  {
    h: '9. Liability',
    body:
      'Tattooing involves inherent risks including temporary discomfort, swelling, and the possibility of allergic reaction. While we take every precaution, Aurora & Ash is not liable for reactions to pigments, complications arising from undisclosed medical conditions, or damage resulting from failure to follow aftercare instructions.',
  },
  {
    h: '10. Changes to These Terms',
    body:
      'We may update these terms from time to time. The current version is always available at this URL. Continued use of our services after any update constitutes acceptance of the revised terms.',
  },
  {
    h: '11. Contact',
    body:
      'Questions about these terms: hello@auroraash.com. For booking inquiries, please use the appointment form.',
  },
]

export default function TermsPage() {
  return (
    <>
      <Suspense>
        <NavBar />
      </Suspense>

      {/* ── Hero header ───────────────────────────────────────────────────── */}
      <section
        aria-label="Terms of Service"
        className="w-full bg-[#0a0a0a] pt-32 pb-16 md:pt-40 md:pb-20 px-6 text-center border-b border-[#D4AF37]/10"
      >
        <p className="label-line text-[#D4AF37]/50 mb-5 tracking-[0.3em]">
          Studio Policies
        </p>
        <h1 className="font-serif text-4xl md:text-6xl tracking-widest text-[#D4AF37] uppercase">
          Terms &amp; Conditions
        </h1>
        <p className="mt-4 text-zinc-500 text-sm md:text-base font-light tracking-wide">
          Last updated: May 2026 &nbsp;·&nbsp; Please read our studio policies carefully before booking.
        </p>
      </section>

      {/* ── Body copy ─────────────────────────────────────────────────────── */}
      <main
        id="main"
        className="bg-[#0a0a0a] px-4 pt-16 pb-28 md:pt-20 md:pb-36"
      >
        <article className="max-w-3xl mx-auto">

          <p className="text-[#D4AF37]/75 text-base md:text-lg leading-relaxed mb-14">
            These terms govern bookings made with Aurora &amp; Ash Tattoo Studio
            LLC ("the studio") at our West Hollywood location. By submitting an
            inquiry or booking an appointment you agree to the following policies.
          </p>

          <div className="space-y-12">
            {SECTIONS.map((s) => (
              <section key={s.h}>
                <h2 className="font-serif text-xl md:text-2xl tracking-tight text-[#D4AF37] mb-3">
                  {s.h}
                </h2>
                <p className="text-[#D4AF37]/70 leading-relaxed">
                  {s.body}
                </p>
              </section>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="mt-16 px-4 py-3 border border-[#D4AF37]/20 text-xs text-[#D4AF37]/50 italic leading-relaxed">
            This is a working template. Before public launch, please have these
            terms reviewed by a qualified attorney in your jurisdiction.
          </p>
        </article>
      </main>

      <Footer />
    </>
  )
}
