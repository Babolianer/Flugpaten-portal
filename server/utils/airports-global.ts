import Fuse from 'fuse.js'
import airportsData from '../../data/airports.json'
import translationsData from '../../data/airport-translations.json'

export type Locale = 'de' | 'en' | 'es' | 'fr'

export interface AirportGlobal {
  iata: string
  name: string
  city: string
  country: string
  lat: number
  lon: number
}

interface AirportTranslations {
  airports: Record<string, { city: Record<Locale, string>; country: Record<Locale, string>; searchAliases: string[] }>
  countries?: Record<string, Record<Locale, string>>
}

interface AirportWithAliases extends AirportGlobal {
  searchAliases: string
}

/* Zur Build-Zeit gebündelt – funktioniert auf Vercel und lokal (kein Storage/FS nötig) */
const airportsCache: AirportGlobal[] = airportsData as AirportGlobal[]
const translationsCache: AirportTranslations = translationsData as AirportTranslations

/** No-Op, bleibt für API-Kompatibilität */
export async function ensureAirportsLoaded(): Promise<void> {}

function loadAirports(): AirportGlobal[] {
  return airportsCache
}

function loadTranslations(): AirportTranslations | null {
  return translationsCache
}

function getSearchList(): AirportWithAliases[] {
  const list = loadAirports()
  const tr = loadTranslations()
  return list.map((a) => {
    const aliases = tr?.airports[a.iata]?.searchAliases ?? [a.city, a.country, a.name, a.iata].filter(Boolean)
    return {
      ...a,
      searchAliases: aliases.join(' '),
    }
  })
}

/** Einträge für Ländersuche: { canonical, searchText } */
function getCountrySearchList(): { canonical: string; searchText: string }[] {
  const list: { canonical: string; searchText: string }[] = []
  const countries = (translationsData as { countries?: Record<string, Record<string, string>> }).countries
  if (!countries) return list
  for (const [canonical, variants] of Object.entries(countries)) {
    const names = [canonical, ...Object.values(variants).filter(Boolean)]
    list.push({ canonical, searchText: names.join(' ') })
  }
  return list
}

const countrySearchList = getCountrySearchList()
const countryFuse = new Fuse(countrySearchList, {
  keys: ['searchText'],
  threshold: 0.2,
  includeScore: true,
})

/** Findet ein passendes Land (exakt oder unscharf); gibt kanonischen Ländernamen zurück oder null */
function matchCountry(query: string): string | null {
  const q = query.trim()
  if (q.length < 2) return null
  const qLower = q.toLowerCase()
  for (const { canonical, searchText } of countrySearchList) {
    const parts = searchText.toLowerCase().split(/\s+/)
    if (parts.some((p) => p === qLower)) return canonical
  }
  const [best] = countryFuse.search(q, { limit: 1 })
  if (best && best.score != null && best.score < 0.3) return best.item.canonical
  return null
}

let fuseCache: Fuse<AirportWithAliases> | null = null

function getFuse(): Fuse<AirportWithAliases> {
  if (fuseCache) return fuseCache
  const list = getSearchList()
  fuseCache = new Fuse(list, {
    keys: [
      { name: 'iata', weight: 0.4 },
      { name: 'searchAliases', weight: 0.4 },
      { name: 'name', weight: 0.1 },
      { name: 'city', weight: 0.05 },
      { name: 'country', weight: 0.05 },
    ],
    threshold: 0.3,
    includeScore: true,
  })
  return fuseCache
}

function applyLocale(a: AirportGlobal, locale: Locale | undefined): AirportGlobal {
  if (!locale) return a
  const tr = loadTranslations()
  const t = tr?.airports[a.iata]
  if (!t) return a
  const city = (t.city as Record<string, string>)?.[locale] ?? a.city
  const country = (t.country as Record<string, string>)?.[locale] ?? a.country
  return { ...a, city, country }
}

const MAX_COUNTRY_AIRPORTS = 500

export function searchAirports(query: string, limit = 20, locale?: Locale): AirportGlobal[] {
  const q = (query || '').trim()
  if (q.length < 2) return getPopularAirports(locale).slice(0, limit)
  const matchedCountry = matchCountry(q)
  if (matchedCountry) {
    const list = loadAirports().filter((a) => a.country === matchedCountry)
    return list.slice(0, MAX_COUNTRY_AIRPORTS).map((a) => applyLocale(a, locale))
  }
  const fuse = getFuse()
  const results = fuse.search(q, { limit })
  return results.map((r) => applyLocale(r.item, locale))
}

const POPULAR_IATAS = ['FRA', 'MUC', 'BER', 'HAM', 'VIE', 'ZRH', 'LCA', 'BCN', 'MAD', 'LIS', 'ATH', 'FCO', 'CDG', 'AMS', 'JFK']

function getPopularAirports(locale?: Locale): AirportGlobal[] {
  const list = loadAirports()
  const byIata = new Map(list.map((a) => [a.iata, a]))
  const popular = POPULAR_IATAS.map((c) => byIata.get(c)).filter(Boolean) as AirportGlobal[]
  return popular.map((a) => applyLocale(a, locale))
}

/** Rückgabe mit lng-Alias für Kompatibilität mit pins API */
export function getAirportByIata(code: string): (AirportGlobal & { lng: number }) | undefined {
  const c = (code || '').trim().toUpperCase()
  if (!c) return undefined
  const a = loadAirports().find((x) => x.iata === c)
  if (!a) return undefined
  return { ...a, lng: a.lon }
}
