import type { Locale } from '~~/server/utils/airports-global'
import { ensureAirportsLoaded, searchAirports } from '~~/server/utils/airports-global'

const VALID_LOCALES: Locale[] = ['de', 'en', 'es', 'fr']

export default defineEventHandler(async (event) => {
  await ensureAirportsLoaded()
  const query = getQuery(event)
  const q = (query.q || query.query || '').toString().trim()
  const limit = Math.min(50, Math.max(5, parseInt(String(query.limit || 20), 10) || 20))
  const rawLocale = (query.locale || '').toString().toLowerCase()
  const locale: Locale | undefined = VALID_LOCALES.includes(rawLocale as Locale) ? (rawLocale as Locale) : undefined
  const results = searchAirports(q, limit, locale)
  return { airports: results }
})
