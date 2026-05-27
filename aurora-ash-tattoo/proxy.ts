import { NextResponse, type NextRequest } from 'next/server'

const MAINTENANCE_PATH = '/maintenance'

const isMaintenanceEnabled = () => process.env.MAINTENANCE_MODE === 'true'

const PUBLIC_FILE = /\.[^/]+$/

function isAllowedDuringMaintenance(pathname: string) {
  return (
    pathname === MAINTENANCE_PATH ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/seed-images') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  )
}

export function proxy(request: NextRequest) {
  if (!isMaintenanceEnabled()) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  if (isAllowedDuringMaintenance(pathname)) {
    return NextResponse.next()
  }

  const maintenanceUrl = request.nextUrl.clone()
  maintenanceUrl.pathname = MAINTENANCE_PATH
  maintenanceUrl.search = ''

  return NextResponse.rewrite(maintenanceUrl, {
    status: 503,
    headers: {
      'Retry-After': '3600',
      'X-Maintenance-Mode': 'true',
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
