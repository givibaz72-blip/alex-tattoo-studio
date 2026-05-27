import 'server-only'
import { getPayload as getPayloadCore } from 'payload'
import config from '@payload-config'

// Use a Promise-based cache to prevent race conditions
// Multiple concurrent calls will share the same initialization promise
let cachedPromise: Promise<Awaited<ReturnType<typeof getPayloadCore>>> | null = null

/**
 * Get Payload instance (singleton with race-condition protection).
 * Safe to call from server components, server actions, and client components.
 */
export async function getPayload() {
  if (!cachedPromise) {
    cachedPromise = getPayloadCore({ config })
  }
  return cachedPromise
}

export type Locale = 'en' | 'ru'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'ru']
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'ru'
}
