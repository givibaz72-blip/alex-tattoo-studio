"use client"

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { type MediaDoc } from './MediaImage'
import {
  inquiryFormSchema,
  type InquiryFormPayload,
} from './InquiryForm.schema'

// ── Re-exported for page consumers ────────────────────────────────────────

export type ArtistOption = {
  id: string | number
  slug: string
  name: string
  style?: string | null
  portrait?: MediaDoc | null
}

// ── Props ─────────────────────────────────────────────────────────────────

interface InquiryFormProps {
  artists: ArtistOption[]
  /** Studio email from CMS siteSettings — used for the error-state fallback link. */
  studioEmail?: string
}

// ── Constants ─────────────────────────────────────────────────────────────

const STUDIO_EMAIL_FALLBACK = 'hello@auroraash.com'

// ── Input style tokens (shared across all fields) ─────────────────────────

/** Base ring + border transition for 60-fps interactions. */
const INPUT_RING =
  'transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 focus:border-[var(--color-gold)] focus:shadow-[0_0_12px_rgba(212,175,55,0.25)]'

const INPUT_BASE = [
  'w-full',
  'bg-transparent',
  'border',
  'border-[var(--border-subtle)]',
  'text-white/85',
  'font-sans',
  'text-base',
  'px-4 py-3',
  'placeholder:text-[var(--text-faint)]',
  'hover:border-[var(--border-strong)]',
  INPUT_RING,
].join(' ')

const INPUT_ERROR = 'border-rose-400/60 focus:ring-rose-400/40 focus:border-rose-400'

// ── Component ─────────────────────────────────────────────────────────────

export default function InquiryForm({ artists, studioEmail }: InquiryFormProps) {
  const errorEmail = studioEmail || STUDIO_EMAIL_FALLBACK
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<InquiryFormPayload>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      message: '',
      artistId: '' as unknown as string | number,
      ageConfirm: false,
      privacyConsent: false,
      termsConsent: false,
    },
  })

  const onSubmit = async (data: InquiryFormPayload) => {
    setSubmitError(null)
    console.log('[InquiryForm] submit payload:', data)
    console.log('[InquiryForm] isSubmitting:', isSubmitting)

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.errors?.[0]?.message ?? `HTTP ${res.status}`)
      }

      reset()
    } catch (err) {
      console.error('[InquiryForm] submit failed', err)
      setSubmitError(
        `Something went wrong. Please try again or write to ${errorEmail}.`,
      )
    }
  }

  // ── Success state ───────────────────────────────────────────────────
  if (isSubmitSuccessful && !submitError) {
    return (
      <main
        id="main"
        className="min-h-screen bg-[var(--color-charcoal)] flex flex-col items-center justify-center px-6 text-center"
      >
        <h2 className="font-serif text-4xl md:text-5xl tracking-tight text-[var(--color-gold)] mb-6">
          Thank you
        </h2>
        <p className="text-[var(--text-secondary)] max-w-md mb-12 leading-relaxed">
          Your request is in our hands — expect a personal reply within 48
          hours.
        </p>
        <Link
          href="/"
          className="label-line px-10 py-3 border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          Back to home
        </Link>
      </main>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────
  return (
    <main
      id="main"
      className="min-h-screen bg-[var(--color-charcoal)] px-6 py-20 md:py-28 flex flex-col items-center"
    >
      <div className="w-full max-w-2xl">
        {/* Heading */}
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight text-[var(--color-gold)] mb-3 text-center">
          Tell us about your idea
        </h2>
        <p className="font-sans text-[var(--text-muted)] text-center mb-12 text-sm leading-relaxed">
          Fill in the details below and we&rsquo;ll match you with the right
          artist.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Tattoo inquiry form"
          className="space-y-8"
        >
          {/* ── Artist selector ──────────────────────────────────── */}
          <div>
            <label
              htmlFor="inquiry-artist"
              className="block font-sans text-sm text-[var(--text-secondary)] mb-2"
            >
              Preferred artist
            </label>
            <select
              id="inquiry-artist"
              {...register('artistId', {
                setValueAs: (v: string) => {
                  if (v === '') return v // let Zod reject empty string
                  const n = Number(v)
                  return Number.isNaN(n) ? v : n
                },
              })}
              aria-invalid={Boolean(errors.artistId)}
              aria-describedby={errors.artistId ? 'err-artist' : undefined}
              className={`${INPUT_BASE} ${errors.artistId ? INPUT_ERROR : ''} cursor-pointer appearance-none`}
            >
              <option value="">Select an artist…</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.style ? ` — ${a.style}` : ''}
                </option>
              ))}
            </select>
            {errors.artistId && (
              <p id="err-artist" className="mt-1.5 text-rose-400 text-xs" role="alert">
                {errors.artistId.message}
              </p>
            )}
          </div>

          {/* ── Message (textarea) ────────────────────────────────── */}
          <div>
            <label
              htmlFor="inquiry-message"
              className="block font-sans text-sm text-[var(--text-secondary)] mb-2"
            >
              Describe your idea
            </label>
            <textarea
              id="inquiry-message"
              rows={5}
              {...register('message')}
              placeholder="The story or symbols you want to carry on your skin…"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'err-message' : undefined}
              className={`${INPUT_BASE} ${errors.message ? INPUT_ERROR : ''} resize-y`}
            />
            {errors.message && (
              <p id="err-message" className="mt-1.5 text-rose-400 text-xs" role="alert">
                {errors.message.message}
              </p>
            )}
          </div>

          {/* ── Full name ─────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="inquiry-name"
              className="block font-sans text-sm text-[var(--text-secondary)] mb-2"
            >
              Full name
            </label>
            <input
              id="inquiry-name"
              type="text"
              autoComplete="name"
              {...register('fullName')}
              placeholder="Your full name"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'err-name' : undefined}
              className={`${INPUT_BASE} ${errors.fullName ? INPUT_ERROR : ''}`}
            />
            {errors.fullName && (
              <p id="err-name" className="mt-1.5 text-rose-400 text-xs" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* ── Email ─────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="inquiry-email"
              className="block font-sans text-sm text-[var(--text-secondary)] mb-2"
            >
              Email
            </label>
            <input
              id="inquiry-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register('email')}
              placeholder="you@email.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'err-email' : undefined}
              className={`${INPUT_BASE} ${errors.email ? INPUT_ERROR : ''}`}
            />
            {errors.email && (
              <p id="err-email" className="mt-1.5 text-rose-400 text-xs" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* ── Phone ─────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor="inquiry-phone"
              className="block font-sans text-sm text-[var(--text-secondary)] mb-2"
            >
              Phone
            </label>
            <input
              id="inquiry-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...register('phone')}
              placeholder="+1 555 0123"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'err-phone' : undefined}
              className={`${INPUT_BASE} ${errors.phone ? INPUT_ERROR : ''}`}
            />
            {errors.phone && (
              <p id="err-phone" className="mt-1.5 text-rose-400 text-xs" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* ── Consent checkboxes ────────────────────────────────── */}
          <fieldset className="border border-[var(--border-subtle)] rounded-sm p-5 pt-3">
            <legend className="font-sans text-sm text-[var(--text-muted)] px-2">
              Confirmations
            </legend>

            <div className="space-y-4 mt-2">
              {/* Age confirm */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('ageConfirm')}
                  aria-invalid={Boolean(errors.ageConfirm)}
                  className="mt-0.5 w-4 h-4 accent-[var(--color-gold)] cursor-pointer flex-shrink-0"
                />
                <span className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">
                  I confirm I am 18 years of age or older.
                </span>
              </label>

              {/* Privacy consent */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('privacyConsent')}
                  aria-invalid={Boolean(errors.privacyConsent)}
                  className="mt-0.5 w-4 h-4 accent-[var(--color-gold)] cursor-pointer flex-shrink-0"
                />
                <span className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">
                  I have read and agree to the{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-[var(--color-gold)] transition-colors"
                  >
                    Privacy policy
                  </Link>
                  .
                </span>
              </label>

              {/* Terms consent */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('termsConsent')}
                  aria-invalid={Boolean(errors.termsConsent)}
                  className="mt-0.5 w-4 h-4 accent-[var(--color-gold)] cursor-pointer flex-shrink-0"
                />
                <span className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors">
                  I agree to the terms of service.
                </span>
              </label>
            </div>

            {/* Aggregate consent errors */}
            {(errors.ageConfirm || errors.privacyConsent || errors.termsConsent) && (
              <ul className="mt-4 space-y-1" role="alert">
                {[errors.ageConfirm, errors.privacyConsent, errors.termsConsent]
                  .filter(Boolean)
                  .map((e, i) => (
                    <li key={i} className="text-rose-400 text-xs">
                      {e?.message}
                    </li>
                  ))}
              </ul>
            )}
          </fieldset>

          {/* ── Server error ──────────────────────────────────────── */}
          {submitError && (
            <p className="text-rose-400 text-sm text-center" role="alert">
              {submitError}
            </p>
          )}

          {/* ── Submit ────────────────────────────────────────────── */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`label-line w-full sm:w-auto px-14 py-3.5 border transition-all duration-300 ${
                isSubmitting
                  ? 'border-[var(--color-gold)]/30 text-[var(--color-gold)]/40 cursor-not-allowed'
                  : 'border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-charcoal)] shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)]'
              }`}
            >
              {isSubmitting ? 'Sending…' : 'Submit inquiry'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
