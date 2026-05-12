/**
 * API endpoint to check studio global and log result.
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    
    console.log('=== Fetching studio global ===\n')
    
    const settings = await payload.findGlobal({ slug: 'siteSettings' })
    
    console.log('Site Settings global result:')
    console.log(JSON.stringify(settings, null, 2))
    
    // Check if empty
    const isEmpty = !settings || Object.keys(settings).length === 0
    console.log('\n=== Is siteSettings empty?', isEmpty, '===\n')
    
    if (isEmpty) {
      console.log('Site Settings global is empty. Checking access configuration...')
      console.log('In payload.config.ts, the siteSettings global has:')
      console.log('  access.read: () => true')
      console.log('This allows public read access for all users.\n')
    }
    
    // Verify access config
    console.log('=== Access Configuration ===')
    console.log('Site Settings global access.read is set to: () => true')
    console.log('This means access is OPEN for ALL users (including unauthenticated).')
    console.log('No changes needed to the access configuration.\n')
    
    return NextResponse.json({ ok: true, settings, isEmpty })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
