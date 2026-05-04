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
      telegram,
      references,
      budget,
      ageConfirmed,
      privacyConsent,
    } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Create the inquiry
    const inquiry = await payload.create({
      collection: 'inquiries',
      data: {
        name,
        contact,
        artist: artist || null,
        vision,
        placement,
        size,
        email,
        telegram: telegram || null,
        references: references || null,
        budget: budget || null,
        ageConfirmed: ageConfirmed || false,
        privacyConsent: privacyConsent || false,
        status: 'new',
      },
    })

    return NextResponse.json({ ok: true, inquiry }, { status: 200 })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[api/inquiries] failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
