import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['drizzle-kit', '@libsql/client', '@payloadcms/db-sqlite'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/api/media/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/media/**' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
