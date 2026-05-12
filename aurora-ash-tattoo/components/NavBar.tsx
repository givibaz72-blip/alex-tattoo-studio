import { getPayload } from '../lib/payload'
import NavMenu, { type ArtistLink, type StudioInfo } from './NavMenu'

/**
 * Server-side wrapper. Fetches the artists list and Studio global so the
 * client-side `<NavMenu>` can render the contact footer and the Artists
 * sub-menu without an additional client fetch.
 */
export default async function NavBar() {
  let artists: ArtistLink[] = []
  let studio: StudioInfo = {}

  try {
    const payload = await getPayload()
    const [artistsRes, settingsGlobal] = await Promise.all([
      payload.find({
        collection: 'artists',
        sort: 'order',
        limit: 12,
        depth: 0,
      }),
      payload.findGlobal({ slug: 'siteSettings', depth: 0 }),
    ])
    artists = (artistsRes.docs as unknown as Array<{ slug: string; name: string }>).map((a) => ({
      slug: a.slug,
      name: a.name,
    }))
    studio = (settingsGlobal as StudioInfo) ?? {}
  } catch {
    // Fall through with empty defaults; NavMenu has its own fallbacks.
  }

  return <NavMenu artists={artists} studio={studio} />
}
