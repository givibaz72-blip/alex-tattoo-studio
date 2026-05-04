/**
 * Media seed endpoint.
 *
 * Open  http://localhost:3000/api/seed-images  in the browser while logged in
 * as admin. Reads files from public/seed-images, generates placeholders for
 * what is missing, and attaches everything to studio / artists / works.
 *
 * Idempotent: existing media is reused, already-set fields are not overwritten.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { runMediaSeed } from '../../../../scripts/seed-media-runner'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const result = await runMediaSeed(payload)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('[seed-images] failed', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err), stack: err?.stack },
      { status: 500 },
    )
  }
}
