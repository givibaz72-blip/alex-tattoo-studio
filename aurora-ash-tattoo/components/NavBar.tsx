import { getPayload } from '../lib/payload'
import { loadStudioContact } from '../lib/studio-contact'
import NavMenu, { type ArtistLink, type StudioInfo } from './NavMenu'

/**
 * Server-side wrapper. Fetches the artists list and Studio global so the
 * client-side `<NavMenu>` can render the contact footer and the Artists
 * sub-menu without an additional client fetch.
 */
export default async function NavBar() {
  let artists: ArtistLink[] = []
  const studio: StudioInfo = await loadStudioContact(1)

  try {
    const payload = await getPayload()
    const artistsRes = await payload.find({
      collection: 'artists',
      sort: 'order',
      limit: 12,
      depth: 0,
    })
    artists = (artistsRes.docs as unknown as Array<{ slug: string; name: string }>).map((a) => ({
      slug: a.slug,
      name: a.name,
    }))
  } catch {
    // Fall through with shared studio-contact defaults and an empty artist list.
  }

  return <NavMenu artists={artists} studio={studio} />
}
