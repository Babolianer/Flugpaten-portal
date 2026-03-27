import { getCookie, getHeader, getQuery } from 'h3'

/**
 * Liest die gewünschte Sprache aus Request (Cookie, Query, Accept-Language).
 * Cookie pawbridge_locale hat Priorität (wird vom Frontend gesetzt).
 */
const COOKIE_KEY = 'pawbridge_locale'
const SUPPORTED = ['de', 'en', 'fr', 'es', 'it', 'pl'] as const

export function getRequestLocale(event: Parameters<typeof getCookie>[0]): string {
  try {
    const fromCookie = getCookie(event, COOKIE_KEY)
    if (fromCookie && SUPPORTED.includes(fromCookie as (typeof SUPPORTED)[number])) return fromCookie

    const query = getQuery(event)
    const fromQuery = query.locale ? String(query.locale).toLowerCase() : null
    if (fromQuery && SUPPORTED.includes(fromQuery as (typeof SUPPORTED)[number])) return fromQuery

    const acceptLang = getHeader(event, 'accept-language')
    if (acceptLang) {
      const first = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
      if (first && SUPPORTED.includes(first as (typeof SUPPORTED)[number])) return first
    }
  } catch {
    // Fallback
  }
  return 'de'
}
