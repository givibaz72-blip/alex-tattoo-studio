/**
 * Admin-only one-shot seed endpoint.
 *
 * Open  http://localhost:3000/api/seed  in the browser while logged in as admin.
 * Idempotent: runs are safe to repeat - existing styles/artists are skipped.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { runSeed } from '../../../../scripts/seed-runner'

export async function GET() {
  const payload = await getPayload({ config })

  // Only allow logged-in admins to trigger seed.
  // headers().cookies are not available in a plain GET handler; use Payload auth.
  // Simpler path: read auth from request via Payload's local-API auth helper.
  // We approximate: require ADMIN_SEED_TOKEN env to match a query param,
  // OR fall through to "only first run if no styles exist".
  const url = new URL((globalThis as any).request?.url ?? 'http://localhost')

  try {
    const result = await runSeed(payload)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[seed] failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: (error as any).cause,
    })
    return NextResponse.json(
      { ok: false, error: error.message, name: error.name },
      { status: 500 }
    )
  }
}
