/**
 * API route to upload footer logo to Media collection and link to siteSettings.
 * Access this at /api/upload-footer-logo while the dev server is running.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Read the SVG file
    const svgPath = path.resolve(__dirname, '../../../public/footer-logo.svg')
    const svgContent = fs.readFileSync(svgPath, 'utf-8')
    
    // Create a buffer from the SVG content
    const buffer = Buffer.from(svgContent, 'utf-8')
    
    // Upload to media collection
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Aurora & Ash Footer Logo',
      },
      file: {
        data: buffer,
        name: 'footer-logo.svg',
        mimetype: 'image/svg+xml',
        size: buffer.length,
      },
    })

    // Update siteSettings with the footerLogo
    const result = await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        footerLogo: media.id,
      },
      locale: 'en',
    })

    return Response.json({
      success: true,
      mediaId: media.id,
      mediaUrl: media.url,
      message: 'Footer logo uploaded and linked to site settings',
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
