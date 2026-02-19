/**
 * Liest die gewünschte Sprache aus Request (Cookie, Query, Accept-Language).
 * Cookie pawbridge_locale hat Priorität (wird vom Frontend gesetzt).
 */
const COOKIE_KEY = 'pawbridge_locale'
const SUPPORTED = ['de', 'en', 'fr', 'es'] as const

export function getRequestLocale(event: { node: { req: { headers?: Record<string, string | string[] | undefined>; url?: string } }; context?: { params?: Record<string, string> } }): string {
  try {
    const headers = event.node?.req?.headers
    const cookieHeader = headers?.cookie
    if (cookieHeader && typeof cookieHeader === 'string') {
      const match = cookieHeader.match(new RegExp(`(?:^| )${COOKIE_KEY}=([^;]+)`))
      if (match && SUPPORTED.includes(match[1] as (typeof SUPPORTED)[number])) return match[1]
    }

    const url = event.node?.req?.url ?? ''
    const queryMatch = url.match(/[?&]locale=([^&]+)/)
    if (queryMatch) {
      const locale = queryMatch[1].toLowerCase()
      if (SUPPORTED.includes(locale as (typeof SUPPORTED)[number])) return locale
    }

    const acceptLang = headers?.['accept-language']
    if (acceptLang && typeof acceptLang === 'string') {
      const first = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
      if (first && SUPPORTED.includes(first as (typeof SUPPORTED)[number])) return first
    }
  } catch {
    // Fallback
  }
  return 'de'
}
