"use client"

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import MediaImage, { type MediaDoc } from './MediaImage'

export type ArtistOption = {
  id: string | number
  slug: string
  name: string
  style?: string | null
  portrait?: MediaDoc | null
}

interface InquiryFormProps {
  artists: ArtistOption[]
  /** Studio email from CMS siteSettings — used for the error-state fallback link. */
  studioEmail?: string
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const VISION_MIN = 30
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEGRAM_RE = /^@?[a-zA-Z0-9_]{4,32}$/
const PHONE_RE = /^[+\d][\d\s()-]{6,}$/
const STORAGE_KEY = 'aurora-inquiry-draft-v2'

const STUDIO_EMAIL_FALLBACK = 'hello@auroraash.com'

const BUDGET_OPTIONS = [
  { value: 'under_300', label: 'Under $300' },
  { value: '300_800', label: '$300 – $800' },
  { value: '800_1500', label: '$800 – $1500' },
  { value: 'over_1500', label: 'Over $1500' },
  { value: 'undecided', label: 'Not sure yet' },
]

const COPY = {
  pickArtist: 'Pick an artist',
  yourVision: 'Your vision',
  visionPlaceholder:
    'Describe the story or symbols you want to carry on your skin (min 30 characters).',
  referencesLabel: 'Reference links (optional)',
  referencesPh:
    'Pinterest / Instagram / Drive links — one per line. Helps us understand your direction.',
  placement: 'Placement',
  placementPh: 'Forearm, ribs, spine...',
  size: 'Approximate size',
  sizePh: 'e.g. 15 × 10 cm or 6 × 4 in',
  budgetLabel: 'Budget range (optional)',
  budgetHint: 'Helps us match your idea with the right artist and time slot.',
  contact: 'Contact details',
  contactHint: 'Provide at least one — email, phone, or Telegram. We respond on whichever you fill in.',
  nameLabel: 'Full name',
  namePh: 'Your full name',
  emailLabel: 'Email',
  emailPh: 'you@email.com',
  phoneLabel: 'Phone (optional)',
  phonePh: '+1 555 0123',
  telegramLabel: 'Telegram (optional)',
  telegramPh: '@yourhandle',
  age: 'I confirm I am 18 years of age or older.',
  privacyA: 'I have read and agree to the ',
  privacyLink: 'Privacy policy',
  privacyB: '.',
  back: 'Back',
  next: 'Next',
  submit: 'Submit',
  sending: 'Sending...',
  closeAria: 'Close form and return home',
  artistsEmpty: 'Artists are temporarily unavailable. Please try again later.',
  successTitle: 'Thank you',
  successText: (name: string) =>
    name
      ? `Thank you, ${name}. Your request is in our hands — expect a personal reply within 48 hours.`
      : 'Your request is in our hands — expect a personal reply within 48 hours.',
  successHome: 'Back to home',
  submitError: (email: string) =>
    `Something went wrong. Please try again or write to ${email}.`,
  chars: (n: number, min: number) =>
    n >= min ? `${n} characters` : `${n}/${min} characters minimum`,
  errors: {
    artistRequired: 'Please select an artist.',
    visionShort: `Please describe your vision in at least ${VISION_MIN} characters.`,
    placementRequired: 'Please specify the placement.',
    sizeRequired: 'Please specify approximate size.',
    nameRequired: 'Please enter your full name.',
    emailInvalid: 'Please enter a valid email address.',
    phoneInvalid: 'Please enter a valid phone number (digits, +, spaces).',
    telegramInvalid: 'Please enter a Telegram handle (letters, digits, underscore, 4–32 characters).',
    contactRequired: 'Please provide at least one contact: email, phone, or Telegram.',
    ageRequired: 'You must be 18 or older to submit a tattoo inquiry.',
    privacyRequired: 'Please agree to the privacy policy to continue.',
  },
}

type FormData = {
  artist: string
  vision: string
  references: string
  placement: string
  size: string
  budget: string
  name: string
  email: string
  phone: string
  telegram: string
  ageConfirmed: boolean
  privacyConsent: boolean
}

const INITIAL_FORM: FormData = {
  artist: '',
  vision: '',
  references: '',
  placement: '',
  size: '',
  budget: '',
  name: '',
  email: '',
  phone: '',
  telegram: '',
  ageConfirmed: false,
  privacyConsent: false,
}

export default function InquiryForm({ artists, studioEmail }: InquiryFormProps) {
  const errorEmail = studioEmail || STUDIO_EMAIL_FALLBACK
  const searchParams = useSearchParams()
  const initialArtist = searchParams.get('artist') ?? ''
  const t = COPY
  const homeHref = '/'
  const privacyHref = '/privacy'

  const [step, setStep] = useState(1)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM, artist: initialArtist })
  const [initialized, setInitialized] = useState(false)

  // Load draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    let draftFormData: Partial<FormData> = {}
    let draftStep: number | null = null
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.formData && typeof parsed.formData === 'object') {
          draftFormData = parsed.formData as Partial<FormData>
        }
        if (typeof parsed?.step === 'number' && parsed.step >= 1 && parsed.step <= 4) {
          draftStep = parsed.step
        }
      }
    } catch {
      // ignore parse errors
    }

    setFormData((p) => ({
      ...p,
      ...draftFormData,
      // URL ?artist= has priority over draft
      artist: initialArtist || draftFormData.artist || p.artist || '',
    }))
    if (draftStep) setStep(draftStep)
    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist draft on every change after init
  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, step }))
    } catch {
      // ignore quota errors
    }
  }, [formData, step, initialized])

  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (s === 1 && !formData.artist) {
      e.artist = t.errors.artistRequired
    }
    if (s === 2 && formData.vision.trim().length < VISION_MIN) {
      e.vision = t.errors.visionShort
    }
    if (s === 3) {
      if (!formData.placement.trim()) e.placement = t.errors.placementRequired
      if (!formData.size.trim()) e.size = t.errors.sizeRequired
    }
    if (s === 4) {
      if (!formData.name.trim()) e.name = t.errors.nameRequired

      const emailRaw = formData.email.trim()
      const phoneRaw = formData.phone.trim()
      const telegramRaw = formData.telegram.trim()

      // Per-field format validation (only when filled).
      if (emailRaw && !EMAIL_RE.test(emailRaw)) e.email = t.errors.emailInvalid
      if (phoneRaw && !PHONE_RE.test(phoneRaw)) e.phone = t.errors.phoneInvalid
      if (telegramRaw && !TELEGRAM_RE.test(telegramRaw)) e.telegram = t.errors.telegramInvalid

      // Require AT LEAST one valid contact channel.
      const hasValidEmail = Boolean(emailRaw) && !e.email
      const hasValidPhone = Boolean(phoneRaw) && !e.phone
      const hasValidTelegram = Boolean(telegramRaw) && !e.telegram
      if (!hasValidEmail && !hasValidPhone && !hasValidTelegram) {
        e.contact = t.errors.contactRequired
      }

      if (!formData.ageConfirmed) e.ageConfirmed = t.errors.ageRequired
      if (!formData.privacyConsent) e.privacyConsent = t.errors.privacyRequired
    }
    return e
  }

  function tryNext() {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    if (step < 4) setStep(step + 1)
    else void submit()
  }

  async function submit() {
    setStatus('submitting')
    setErrorMsg('')
    try {
      const selectedArtist = artists.find((a) => a.slug === formData.artist)
      const email = formData.email.trim()
      const phone = formData.phone.trim()
      const telegram = formData.telegram.trim()

      // Build a human-readable combined contact string for the legacy field,
      // joining whichever channels the client provided.
      const contactParts = [email, phone, telegram].filter(Boolean)
      const contactCombined = contactParts.join(' · ')

      const payload: Record<string, unknown> = {
        artist: selectedArtist?.id,
        vision: formData.vision,
        placement: formData.placement,
        size: formData.size,
        name: formData.name,
        contact: contactCombined,
        email: email || undefined,
        phone: phone || undefined,
        telegram: telegram || undefined,
        references: formData.references.trim() || undefined,
        budget: formData.budget || undefined,
        ageConfirmed: formData.ageConfirmed,
        privacyConsent: formData.privacyConsent,
      }

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.errors?.[0]?.message ?? `HTTP ${res.status}`)
      }
      setStatus('success')
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    } catch (e) {
      console.error('[Inquiry] submit failed', e)
      setStatus('error')
      setErrorMsg(t.submitError(errorEmail))
    }
  }

  if (status === 'success') {
    return (
      <main
        id="main"
        className="min-h-screen bg-[#121212] text-[#D4AF37] flex flex-col items-center justify-center px-6 text-center"
      >
        <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-6">
          {t.successTitle}
        </h2>
        <p className="opacity-80 max-w-md mb-12 leading-relaxed">
          {t.successText(formData.name)}
        </p>
        <Link
          href={homeHref}
          className="label-line px-10 py-3 border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors"
        >
          {t.successHome}
        </Link>
      </main>
    )
  }

  const visionLen = formData.vision.length
  const visionOk = visionLen >= VISION_MIN

  const inputBase =
    'w-full bg-transparent border-b text-xl py-3 focus:outline-none transition-colors'
  const inputOk = 'border-[#D4AF37]/30 focus:border-[#D4AF37]'
  const inputErr = 'border-rose-400 focus:border-rose-400'

  return (
    <main
      id="main"
      className="min-h-screen bg-[#121212] text-[#D4AF37] p-6 md:p-10 pt-28 md:pt-32 flex flex-col items-center justify-center relative"
    >
      {/* No standalone close button here — the page is wrapped by the global
          NavBar (with Menu/Close + logo link) on `/inquiry`, so a separate
          close cross would just sit on top of the menu button. */}

      <div
        className="mb-12 flex space-x-3 w-full max-w-md"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={step}
      >
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 transition-all duration-500 ${
              step >= s ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-5xl flex flex-col items-center"
        >
          {step === 1 && (
            <>
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-12 text-center">
                {t.pickArtist}
              </h2>
              {artists.length === 0 ? (
                <p className="opacity-60 italic text-center max-w-md">{t.artistsEmpty}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                  {artists.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setFormData((p) => ({ ...p, artist: a.slug }))
                        setErrors((prev) => {
                          const { artist: _ignored, ...rest } = prev
                          return rest
                        })
                      }}
                      aria-pressed={formData.artist === a.slug}
                      className={`group cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-500 text-left ${
                        formData.artist === a.slug
                          ? 'border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)] scale-105'
                          : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <div className="h-80 overflow-hidden relative bg-gradient-to-b from-[#1a1410] to-[#0c0c0c]">
                        {a.portrait ? (
                          <MediaImage
                            media={a.portrait}
                            size="card"
                            alt={a.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#D4AF37]/35">
                            <span className="font-serif italic text-[64px] leading-none mb-3">
                              {a.name
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((w) => w[0]?.toUpperCase())
                                .filter(Boolean)
                                .join('')}
                            </span>
                            <span className="font-serif italic text-sm tracking-wide opacity-75">
                              {a.name}
                            </span>
                            <span className="mt-3 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/30">
                              Portrait coming soon
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`p-4 text-center transition-colors ${
                          formData.artist === a.slug ? 'bg-[#D4AF37] text-black' : 'bg-[#1a1a1a]'
                        }`}
                      >
                        <h3 className="font-serif text-xl tracking-widest uppercase">{a.name}</h3>
                        {a.style ? (
                          <p className="text-xs mt-1 opacity-80 uppercase tracking-tighter">
                            {a.style}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {errors.artist ? (
                <p className="mt-6 text-rose-400 text-sm" role="alert">
                  {errors.artist}
                </p>
              ) : null}
            </>
          )}

          {step === 2 && (
            <div className="w-full max-w-2xl flex flex-col items-stretch">
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-8 text-center">
                {t.yourVision}
              </h2>

              <label htmlFor="vision-field" className="sr-only">
                {t.yourVision}
              </label>
              <textarea
                id="vision-field"
                name="vision"
                value={formData.vision}
                onChange={(e) => setFormData((p) => ({ ...p, vision: e.target.value }))}
                placeholder={t.visionPlaceholder}
                aria-invalid={Boolean(errors.vision)}
                aria-describedby="vision-meta"
                className={`w-full h-48 bg-transparent border-b text-[#D4AF37] text-xl p-4 transition-colors resize-none focus:outline-none ${
                  errors.vision ? inputErr : inputOk
                }`}
              />
              <div id="vision-meta" className="w-full flex justify-between mt-3 text-xs">
                <span className={errors.vision ? 'text-rose-400' : 'text-[#D4AF37]/60'}>
                  {errors.vision ?? '\u00a0'}
                </span>
                <span className={visionOk ? 'text-[#D4AF37]/70' : 'text-[#D4AF37]/40'}>
                  {t.chars(visionLen, VISION_MIN)}
                </span>
              </div>

              <div className="mt-12">
                <label htmlFor="references-field" className="label-line text-[#D4AF37]/60 mb-3 block">
                  {t.referencesLabel}
                </label>
                <textarea
                  id="references-field"
                  name="references"
                  value={formData.references}
                  onChange={(e) => setFormData((p) => ({ ...p, references: e.target.value }))}
                  placeholder={t.referencesPh}
                  rows={3}
                  className="w-full bg-transparent border-b border-[#D4AF37]/30 focus:border-[#D4AF37] focus:outline-none text-[#D4AF37] text-base p-3 transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full max-w-xl space-y-12">
              <div className="flex flex-col items-center">
                <label htmlFor="placement-field" className="label-line text-[#D4AF37]/60 mb-4">
                  {t.placement}
                </label>
                <input
                  id="placement-field"
                  type="text"
                  placeholder={t.placementPh}
                  value={formData.placement}
                  onChange={(e) => setFormData((p) => ({ ...p, placement: e.target.value }))}
                  aria-invalid={Boolean(errors.placement)}
                  className={`${inputBase} text-center text-2xl ${
                    errors.placement ? inputErr : inputOk
                  }`}
                />
                {errors.placement ? (
                  <p className="mt-2 text-rose-400 text-xs" role="alert">
                    {errors.placement}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-center">
                <label htmlFor="size-field" className="label-line text-[#D4AF37]/60 mb-4">
                  {t.size}
                </label>
                <input
                  id="size-field"
                  type="text"
                  placeholder={t.sizePh}
                  value={formData.size}
                  onChange={(e) => setFormData((p) => ({ ...p, size: e.target.value }))}
                  aria-invalid={Boolean(errors.size)}
                  className={`${inputBase} text-center text-2xl ${
                    errors.size ? inputErr : inputOk
                  }`}
                />
                {errors.size ? (
                  <p className="mt-2 text-rose-400 text-xs" role="alert">
                    {errors.size}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-center pt-2">
                <p className="label-line text-[#D4AF37]/60 mb-2">{t.budgetLabel}</p>
                <p className="text-xs text-[#D4AF37]/45 mb-5 text-center max-w-md">
                  {t.budgetHint}
                </p>
                <div
                  role="radiogroup"
                  aria-label={t.budgetLabel}
                  className="flex flex-wrap gap-3 justify-center"
                >
                  {BUDGET_OPTIONS.map((opt) => {
                    const checked = formData.budget === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() =>
                          setFormData((p) => ({ ...p, budget: checked ? '' : opt.value }))
                        }
                        className={`label-line px-5 py-3 border transition-colors ${
                          checked
                            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                            : 'border-[#D4AF37]/30 text-[#D4AF37]/70 hover:border-[#D4AF37]/60 hover:text-[#D4AF37]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="w-full max-w-xl flex flex-col gap-7">
              <div className="text-center">
                <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-3">
                  {t.contact}
                </h2>
                <p className="text-[#D4AF37]/65 text-sm max-w-md mx-auto leading-relaxed">
                  {t.contactHint}
                </p>
              </div>

              <div>
                <label htmlFor="name-field" className="label-line text-[#D4AF37]/65 mb-3 block">
                  {t.nameLabel}
                </label>
                <input
                  id="name-field"
                  type="text"
                  autoComplete="name"
                  placeholder={t.namePh}
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  aria-invalid={Boolean(errors.name)}
                  className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
                />
                {errors.name ? (
                  <p className="mt-2 text-rose-400 text-xs" role="alert">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <fieldset className="border border-[#D4AF37]/15 p-5 pt-4 -mt-1">
                <legend className="label-line text-[#D4AF37]/65 px-2">
                  Reach me by — at least one
                </legend>

                <div className="mt-2">
                  <label htmlFor="email-field" className="label-line text-[#D4AF37]/60 mb-2 block">
                    {t.emailLabel}
                  </label>
                  <input
                    id="email-field"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t.emailPh}
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    aria-invalid={Boolean(errors.email)}
                    className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                  />
                  {errors.email ? (
                    <p className="mt-2 text-rose-400 text-xs" role="alert">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6">
                  <label htmlFor="phone-field" className="label-line text-[#D4AF37]/60 mb-2 block">
                    {t.phoneLabel}
                  </label>
                  <input
                    id="phone-field"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={t.phonePh}
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    aria-invalid={Boolean(errors.phone)}
                    className={`${inputBase} ${errors.phone ? inputErr : inputOk}`}
                  />
                  {errors.phone ? (
                    <p className="mt-2 text-rose-400 text-xs" role="alert">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6">
                  <label htmlFor="telegram-field" className="label-line text-[#D4AF37]/60 mb-2 block">
                    {t.telegramLabel}
                  </label>
                  <input
                    id="telegram-field"
                    type="text"
                    autoComplete="username"
                    placeholder={t.telegramPh}
                    value={formData.telegram}
                    onChange={(e) => setFormData((p) => ({ ...p, telegram: e.target.value }))}
                    aria-invalid={Boolean(errors.telegram)}
                    className={`${inputBase} ${errors.telegram ? inputErr : inputOk}`}
                  />
                  {errors.telegram ? (
                    <p className="mt-2 text-rose-400 text-xs" role="alert">
                      {errors.telegram}
                    </p>
                  ) : null}
                </div>

                {errors.contact ? (
                  <p className="mt-4 text-rose-400 text-xs text-center" role="alert">
                    {errors.contact}
                  </p>
                ) : null}
              </fieldset>

              <div className="pt-4 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.ageConfirmed}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, ageConfirmed: e.target.checked }))
                    }
                    aria-invalid={Boolean(errors.ageConfirmed)}
                    className="mt-1 w-5 h-5 accent-[#D4AF37] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-[#D4AF37]/85 leading-relaxed">{t.age}</span>
                </label>
                {errors.ageConfirmed ? (
                  <p className="text-rose-400 text-xs ml-8" role="alert">
                    {errors.ageConfirmed}
                  </p>
                ) : null}

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.privacyConsent}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, privacyConsent: e.target.checked }))
                    }
                    aria-invalid={Boolean(errors.privacyConsent)}
                    className="mt-1 w-5 h-5 accent-[#D4AF37] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-[#D4AF37]/85 leading-relaxed">
                    {t.privacyA}
                    <Link
                      href={privacyHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-[#D4AF37]"
                    >
                      {t.privacyLink}
                    </Link>
                    {t.privacyB}
                  </span>
                </label>
                {errors.privacyConsent ? (
                  <p className="text-rose-400 text-xs ml-8" role="alert">
                    {errors.privacyConsent}
                  </p>
                ) : null}
              </div>

              {status === 'error' ? (
                <p className="text-rose-400 text-sm text-center" role="alert">
                  {errorMsg}
                </p>
              ) : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-16 flex space-x-12 items-center">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setErrors({})
              setStep(step - 1)
            }}
            className="text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors label-line"
          >
            {t.back}
          </button>
        ) : null}
        <button
          type="button"
          onClick={tryNext}
          disabled={status === 'submitting'}
          className={`label-line px-12 py-3 border border-[#D4AF37] transition-all duration-300 ${
            status === 'submitting'
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-[#D4AF37] hover:text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]'
          }`}
        >
          {status === 'submitting' ? t.sending : step === 4 ? t.submit : t.next}
        </button>
      </div>
    </main>
  )
}
