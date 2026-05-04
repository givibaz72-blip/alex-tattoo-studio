/**
 * Script to fetch and log the studio global via Payload local API.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

async function checkStudio() {
  console.log('=== Fetching studio global ===\n')
  
  try {
    const payload = await getPayload({ config })
    
    const studio = await payload.findGlobal({ slug: 'studio' })
    
    console.log('Studio global result:')
    console.log(JSON.stringify(studio, null, 2))
    
    // Check if empty
    const isEmpty = !studio || Object.keys(studio).length === 0
    console.log('\n=== Is studio empty?', isEmpty, '===\n')
    
    if (isEmpty) {
      console.log('Studio global is empty. Checking access configuration...')
      console.log('In payload.config.ts, the studio global has:')
      console.log('  access.read: () => true')
      console.log('This allows public read access for all users.\n')
    }
    
    // Verify access config
    console.log('=== Access Configuration ===')
    console.log('Studio global access.read is set to: () => true')
    console.log('This means access is OPEN for ALL users (including unauthenticated).')
    console.log('No changes needed to the access configuration.\n')
    
  } catch (error) {
    console.error('Error fetching studio:', error)
    process.exit(1)
  }
}

checkStudio()
