/**
 * One-time script to update siteSettings global with West Hollywood data.
 * Run with: npx tsx scripts/update-site-settings.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const SITE_SETTINGS_DATA = {
  phone: '+1 (323) 555-0190',
  email: 'hello@auroraash.com',
  address: '8282 Santa Monica Blvd\nWest Hollywood, CA 90046',
  addressLocality: 'West Hollywood',
  addressRegion: 'CA',
  postalCode: '90046',
  addressCountry: 'US',
  hours: 'Mon — Sun: 12 PM — 8 PM (By Appointment Only)',
  social: {
    instagram: '@aurora_ash_tattoo',
    tiktok: '@aurora_ash_tattoo',
    telegram: '',
    whatsapp: '',
  },
}

async function main() {
  const payload = await getPayload({ config })

  console.log('=== Updating siteSettings global ===\n')

  try {
    const result = await payload.updateGlobal({
      slug: 'siteSettings',
      data: SITE_SETTINGS_DATA,
      locale: 'en',
    })

    console.log('✅ Site settings updated successfully!')
    console.log('Data saved:', JSON.stringify(result, null, 2))
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('❌ Failed to update site settings:', {
      message: error.message,
      stack: error.stack,
    })
    process.exit(1)
  }

  process.exit(0)
}

main()
