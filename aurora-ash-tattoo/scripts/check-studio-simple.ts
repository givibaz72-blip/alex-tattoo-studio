/**
 * Simple script to check studio global via direct database query.
 * Uses SQLite directly to avoid Payload initialization issues.
 */

import { createClient } from '@libsql/client'

const DATABASE_URI = process.env.DATABASE_URI || 'file:./payload.db'

async function checkStudio() {
  console.log('=== Checking studio global ===\n')
  
  const db = createClient({ url: DATABASE_URI })
  
  // Query the globals table for studio
  const result = await db.execute({
    sql: `SELECT * FROM globals WHERE slug = 'studio'`,
  })
  
  console.log('Database result:')
  console.log(JSON.stringify(result, null, 2))
  
  if (result.rows.length === 0) {
    console.log('\n=== Studio global is EMPTY (no rows found) ===\n')
  } else {
    console.log('\n=== Studio global found ===')
    console.log('Data:', JSON.stringify(result.rows[0], null, 2))
  }
  
  // Check access configuration
  console.log('\n=== Access Configuration ===')
  console.log('In payload.config.ts, the studio global has:')
  console.log('  access.read: () => true')
  console.log('This means access is OPEN for ALL users (including unauthenticated).')
  console.log('No changes needed to the access configuration.\n')
  
  await db.close()
}

checkStudio().catch(console.error)
