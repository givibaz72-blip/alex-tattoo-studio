/**
 * DEPRECATED endpoint.
 *
 * Media seeding is now part of the main `/api/seed` orchestrator (which runs
 * placeholders → content → media → pages in the right order). This route is
 * kept for backwards compatibility — it just runs the media-seed step in
 * isolation. Prefer `/api/seed`.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { runMediaSeed } from '../../../../scripts/seed-media-runner'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const result = await runMediaSeed(payload)
    return NextResponse.json({
      ok: true,
      deprecated: true,
      hint: 'Use /api/seed instead — it orchestrates content + media + pages in one pass.',
      ...result,
    })
  } catch (err: any) {
    console.error('[seed-images] failed', err)
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err), stack: err?.stack },
      { status: 500 },
    )
  }
}
