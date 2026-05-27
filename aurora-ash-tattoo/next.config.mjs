import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { withPayload } from '@payloadcms/next/withPayload'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin Turbopack to this project — without this, Next walks up the tree,
  // sees .git in the parent folder and tries to resolve modules from there.
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['drizzle-kit', '@libsql/client', '@payloadcms/db-sqlite'],
  // Next.js 16 removed the `eslint.ignoreDuringBuilds` config key — lint now
  // lives in `next lint` only. We rely on TypeScript checks during build.
  images: {
    remotePatterns: [
      // Local development (Payload dev server)
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/api/media/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/media/**' },
      // Production — replace with your actual domain before deploy
      { protocol: 'https', hostname: 'aurora-ash.tattoo', pathname: '/media/**' },
      { protocol: 'https', hostname: 'aurora-ash.tattoo', pathname: '/api/media/**' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
