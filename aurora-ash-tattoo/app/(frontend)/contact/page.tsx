import { redirect, permanentRedirect } from 'next/navigation'

/**
 * /contact is no longer a standalone page — its content lives as the
 * Contact section on the homepage. Send any old links to the anchor.
 */
export default function ContactPage(): never {
  // 308 permanent redirect — preserves SEO and tells caches not to come back.
  permanentRedirect('/#contact')
  // unreachable, but keeps TS happy
  redirect('/#contact')
}
