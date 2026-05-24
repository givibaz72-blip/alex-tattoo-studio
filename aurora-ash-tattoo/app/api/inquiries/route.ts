import { NextResponse } from 'next/server'
import { getPayload } from '../../../lib/payload'
import { inquiryFormSchema } from '../../../components/InquiryForm.schema'

// ---------------------------------------------------------------------------
// Telegram notification
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget Telegram notification.
 *
 * Never throws — a failed notification must not block the API response.
 * Logs a warning so the error is visible in server logs / Vercel dashboard.
 */
async function notifyTelegram(data: {
  name: string
  email: string
  phone: string
  artistName: string
  vision: string
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('[api/inquiries] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification.')
    return
  }

  const text = [
    '🖋 *Новая заявка — Aurora \\& Ash*',
    '',
    `👤 *Имя:* ${escMd(data.name)}`,
    `📧 *Email:* ${escMd(data.email)}`,
    `📱 *Телефон:* ${escMd(data.phone)}`,
    `🎨 *Мастер:* ${escMd(data.artistName)}`,
    '',
    `💬 *Идея:*`,
    escMd(data.vision),
  ].join('\n')

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'MarkdownV2',
        }),
      },
    )

    if (!res.ok) {
      const body = await res.text()
      console.warn('[api/inquiries] Telegram API error:', res.status, body)
    }
  } catch (err) {
    console.warn('[api/inquiries] Telegram fetch failed:', err)
  }
}

/**
 * Escape special MarkdownV2 characters.
 * Telegram MarkdownV2 requires escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
function escMd(str: string): string {
  return str.replace(/[_*[\]()~`>#+=|{}.!\-\\]/g, (c) => `\\${c}`)
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Parse raw body ---------------------------------------------------------
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // 2. Server-side Zod validation --------------------------------------------
  //    Mirrors the client schema so the endpoint can't be bypassed via curl.
  const parsed = inquiryFormSchema.safeParse(raw)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    return NextResponse.json({ errors }, { status: 422 })
  }

  const { name, email, phone, vision, artist, ageConfirmed, privacyConsent } =
    parsed.data

  // 3. Persist to Payload CMS ------------------------------------------------
  let inquiry: { id: string | number }
  try {
    const payload = await getPayload()

    inquiry = await payload.create({
      collection: 'inquiries',
      data: {
        name,
        // `contact` stores a human-readable summary for ops staff at a glance.
        contact: `${email} · ${phone}`,
        email,
        // The schema's `telegram` field holds any non-email channel — we use
        // phone here since the form collects phone, not a TG handle.
        telegram: phone,
        artist: artist as string | number,
        vision,
        ageConfirmed,
        privacyConsent,
        status: 'new',
      } as any,
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[api/inquiries] Payload create failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. Telegram notification (non-blocking) ----------------------------------
  //    We resolve the artist name for the message. Failure here is silent.
  let artistName = String(artist)
  try {
    const payload = await getPayload()
    const artistDoc = await payload.findByID({
      collection: 'artists',
      id: artist as string | number,
      depth: 0,
    })
    if (artistDoc && (artistDoc as any).name) {
      artistName = (artistDoc as any).name
    }
  } catch {
    // Non-critical — proceed with raw ID if lookup fails.
  }

  void notifyTelegram({ name, email, phone, artistName, vision })

  // 5. Respond ---------------------------------------------------------------
  return NextResponse.json({ ok: true, id: inquiry.id }, { status: 200 })
}
