import { redirect, permanentRedirect } from 'next/navigation'

/**
 * /artists is no longer a standalone page — its content lives as the
 * Artists section on the homepage. Send any old links to the anchor.
 */
export default function ArtistsPage(): never {
  permanentRedirect('/#artists')
  redirect('/#artists')
}
