import Fuse from 'fuse.js'
import { readFileSync } from 'fs'
import { join } from 'path'

export type Locale = 'de' | 'en' | 'es' | 'fr'

export interface AirportGlobal {
  iata: string
  name: string
  city: string
  country: string
  lat: number
  lon: number
}

interface AirportWithAliases extends AirportGlobal {
  searchAliases: string
}

interface AirportTranslations {
  airports: Record<string, { city: Record<Locale, string>; country: Record<Locale, string>; searchAliases: string[] }>
}

let airportsCache: AirportGlobal[] | null = null
let translationsCache: AirportTranslations | null = null

function loadAirports(): AirportGlobal[] {
  if (airportsCache) return airportsCache
  try {
    const path = join(process.cwd(), 'data', 'airports.json')
    const raw = readFileSync(path, 'utf-8')
    airportsCache = JSON.parse(raw)
    return airportsCache!
  } catch {
    airportsCache = []
    return []
  }
}

function loadTranslations(): AirportTranslations | null {
  if (translationsCache) return translationsCache
  try {
    const path = join(process.cwd(), 'data', 'airport-translations.json')
    const raw = readFileSync(path, 'utf-8')
    translationsCache = JSON.parse(raw) as AirportTranslations
    return translationsCache
  } catch {
    return null
  }
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

export function searchAirports(query: string, limit = 20, locale?: Locale): AirportGlobal[] {
  const q = (query || '').trim()
  if (q.length < 2) return getPopularAirports(locale).slice(0, limit)
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
