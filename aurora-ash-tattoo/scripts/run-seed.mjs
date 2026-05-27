const url = process.env.SEED_URL || 'http://localhost:3000/api/seed'

console.log(`Running Payload seed via ${url}`)
console.log('If this fails, start the dev server first: npm run dev')

try {
  const startedAt = Date.now()
  const response = await fetch(url)
  const text = await response.text()
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)

  if (!response.ok) {
    console.error(`Seed failed with HTTP ${response.status} after ${elapsed}s`)
    console.error(text)
    process.exit(1)
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    console.log(text)
    process.exit(0)
  }

  console.log(`Seed completed in ${elapsed}s`)
  console.log(JSON.stringify(data, null, 2))

  const failedPages = data?.pages?.failed ?? []
  if (Array.isArray(failedPages) && failedPages.length > 0) {
    console.warn(`Warning: ${failedPages.length} page(s) reported seed warnings/failures.`)
  }
} catch (error) {
  console.error('Could not reach the seed endpoint.')
  console.error('Make sure the site is running in another terminal: npm run dev')
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
