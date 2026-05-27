/**
 * Script to upload footer logo to Media collection and link to siteSettings.
 * Run with: npx tsx scripts/upload-footer-logo.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const payload = await getPayload({ config })

  console.log('=== Uploading footer logo to Media collection ===\n')

  try {
    // Read the SVG file
    const svgPath = path.resolve(__dirname, '../public/footer-logo.svg')
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

    console.log('✅ Media uploaded successfully!')
    console.log('Media ID:', media.id)
    console.log('Media URL:', media.url)

    // Update siteSettings with the footerLogo
    const result = await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        footerLogo: media.id,
      },
      locale: 'en',
    })

    console.log('\n✅ Site settings updated with footerLogo!')
    console.log('Updated data:', JSON.stringify(result, null, 2))
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('❌ Failed:', {
      message: error.message,
      stack: error.stack,
    })
    process.exit(1)
  }

  process.exit(0)
}

main()
