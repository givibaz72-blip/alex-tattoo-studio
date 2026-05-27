/**
 * Helpers for role-based access control across collections.
 * Used inside payload.config.ts.
 */
import type { Access, FieldAccess } from 'payload'

type Role = 'admin' | 'artist'

export const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user && (user as any).role === 'admin')

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false
  if ((user as any).role === 'admin') return true
  // logged-in non-admin can only access own user document
  if (id && String(id) === String(user.id)) return true
  return { id: { equals: user.id } }
}

export const isAdminFieldAccess: FieldAccess = ({ req: { user } }) =>
  Boolean(user && (user as any).role === 'admin')

export const anyAuthenticated: Access = ({ req: { user } }) => Boolean(user)

/**
 * Admin: full access; artist: only own linked artist document.
 */
export const isAdminOrLinkedArtist: Access = ({ req: { user } }) => {
  if (!user) return false
  const u = user as any
  if (u.role === 'admin') return true
  if (u.role === 'artist') {
    const linked =
      typeof u.linkedArtist === 'object' ? u.linkedArtist?.id : u.linkedArtist
    if (!linked) return false
    return { id: { equals: linked } }
  }
  return false
}

/**
 * Admin: full access; artist: only works whose `artist` relation = own linked artist.
 */
export const isAdminOrOwnerOfWork: Access = ({ req: { user } }) => {
  if (!user) return false
  const u = user as any
  if (u.role === 'admin') return true
  if (u.role === 'artist') {
    const linked =
      typeof u.linkedArtist === 'object' ? u.linkedArtist?.id : u.linkedArtist
    if (!linked) return false
    return { artist: { equals: linked } }
  }
  return false
}

/**
 * Media access:
 * - Admin: full access.
 * - Artist: can only see/update/delete media they uploaded themselves
 *   (the `uploadedBy` field is populated automatically by a hook).
 * - Anonymous: read-only (so the public site can show images).
 */
export const isAdminOrOwnerOfMedia: Access = ({ req: { user } }) => {
  if (!user) return false
  const u = user as any
  if (u.role === 'admin') return true
  if (u.role === 'artist') {
    return { uploadedBy: { equals: u.id } }
  }
  return false
}

export const publicReadOrOwnerOfMedia: Access = ({ req: { user } }) => {
  // Read remains public for the frontend.
  if (!user) return true
  const u = user as any
  if (u.role === 'admin') return true
  if (u.role === 'artist') {
    return true // artists need to see all public media to pick portraits etc.
  }
  return true
}

export type { Role }
