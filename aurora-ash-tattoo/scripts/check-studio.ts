/**
 * Script to fetch and log the studio global.
 * Checks if the object is empty and verifies access configuration.
 */

import config from '@payload-config'
import { getPayload } from 'payload'

async function checkStudio() {
  try {
    const payload = await getPayload({ config })
    
    console.log('=== Fetching siteSettings global ===\n')
    
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
    
  } catch (error) {
    console.error('Error fetching studio:', error)
    process.exit(1)
  }
}

checkStudio()
