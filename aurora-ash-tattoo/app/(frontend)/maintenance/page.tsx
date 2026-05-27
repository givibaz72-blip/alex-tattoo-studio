import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scheduled Maintenance',
  description:
    'Aurora & Ash is temporarily offline while we make a few improvements. Please check back soon.',
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] px-6 py-20 text-[#F5E6B8]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#3a2a16_0%,transparent_36%),linear-gradient(135deg,#121212_0%,#19120d_48%,#080808_100%)]" />
      <div className="absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

      <section className="w-full max-w-3xl rounded-[2rem] border border-[#D4AF37]/30 bg-black/35 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur md:p-12">
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.4em] text-[#D4AF37]">
          Scheduled Maintenance
        </p>

        <h1 className="font-serif text-4xl font-bold leading-tight text-[#F7D77A] md:text-6xl">
          We&apos;re refining the studio experience.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#F5E6B8]/85">
          Aurora &amp; Ash is temporarily offline while we make a few improvements.
          Please check back soon.
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#F5E6B8]/70">
          For appointments or urgent questions, contact the studio directly.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-sm text-[#F5E6B8]/70 sm:flex-row">
          <span>West Hollywood, CA</span>
          <span className="hidden text-[#D4AF37]/60 sm:inline">•</span>
          <span>Aurora &amp; Ash Tattoo Studio</span>
        </div>
      </section>
    </main>
  )
}
