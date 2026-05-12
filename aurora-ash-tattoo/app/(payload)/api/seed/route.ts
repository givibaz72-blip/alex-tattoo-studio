/**
 * One-shot seed endpoint.
 *
 * Orchestrates the full seed in the correct order:
 *
 *   1. Generate placeholder images (public/seed-images/) if missing.
 *   2. Run content seed: styles, artists, works (drafts), inquiries,
 *      siteSettings global (fill-empty).
 *   3. Run media seed: upload all referenced images, attach to siteSettings,
 *      artists and works, return mediaIdsByFilename map.
 *   4. Run page-block seed (using the media map) so home + about + aftercare
 *      + faq + privacy + terms + accessibility + contact pages get assembled
 *      from real Payload blocks.
 *
 * Idempotent: safe to call repeatedly. Pages are always re-published with the
 * canonical block layout from `scripts/seed-blocks.ts`; everything else is
 * fill-empty.
 *
 * Open  http://localhost:3000/api/seed  while the dev server is running.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { runSeed } from '../../../../scripts/seed-runner'
import { runMediaSeed } from '../../../../scripts/seed-media-runner'
import { seedPages } from '../../../../scripts/seed-blocks'
import { ensureSeedPlaceholders } from '../../../../scripts/generate-placeholders'

export async function GET() {
  const payload = await getPayload({ config })

  try {
    // 1) Make sure placeholder source files exist on disk.
    const placeholders = await ensureSeedPlaceholders()

    // 2) Content seed (styles / artists / works / inquiries / siteSettings).
    const content = await runSeed(payload)

    // 3) Media seed — uploads media + returns id map.
    const media = await runMediaSeed(payload)

    // 4) Page-block seed — assembles all pages from blocks using the id map.
    const pages = await seedPages(payload, media.mediaIdsByFilename)

    return NextResponse.json({
      ok: true,
      placeholders,
      content,
      media: {
        uploaded: media.uploaded,
        pageMedia: media.pageMedia,
        artists: media.artists,
        works: media.works,
        placeholders: media.placeholders,
        skipped: media.skipped,
      },
      pages,
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[seed] failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: (error as any).cause,
    })
    return NextResponse.json(
      { ok: false, error: error.message, name: error.name, stack: error.stack },
      { status: 500 },
    )
  }
}
