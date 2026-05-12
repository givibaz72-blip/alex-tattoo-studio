import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })

    const body = await request.json()
    const {
      artist,
      vision,
      placement,
      size,
      name,
      contact,
      email,
      phone,
      telegram,
      references,
      budget,
      ageConfirmed,
      privacyConsent,
    } = body as Record<string, unknown>

    // Validate required fields. The client guarantees at least one contact
    // channel; we mirror that here so the API can't be bypassed.
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      )
    }
    if (!email && !phone && !telegram) {
      return NextResponse.json(
        { error: 'Provide at least one contact channel: email, phone, or Telegram.' },
        { status: 400 },
      )
    }

    // The `telegram` field in the CMS holds whichever non-email channel the
    // client provided — Telegram handle wins, otherwise phone. The
    // human-readable `contact` field carries the concatenation for ops.
    const telegramOrPhone =
      (typeof telegram === 'string' && telegram.trim()) ||
      (typeof phone === 'string' && phone.trim()) ||
      ''

    const inquiry = await payload.create({
      collection: 'inquiries',
      data: {
        name,
        contact: (typeof contact === 'string' && contact) || [email, phone, telegram].filter(Boolean).join(' · '),
        artist: artist || null,
        vision,
        placement,
        size,
        email: (typeof email === 'string' && email) || undefined,
        telegram: telegramOrPhone || null,
        references: references || null,
        budget: budget || null,
        ageConfirmed: Boolean(ageConfirmed),
        privacyConsent: Boolean(privacyConsent),
        status: 'new',
      } as any,
    })

    return NextResponse.json({ ok: true, inquiry }, { status: 200 })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[api/inquiries] failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    )
  }
}
