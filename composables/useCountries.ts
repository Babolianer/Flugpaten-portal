/**
 * Weltweite Länderliste (ISO 3166-1 alpha-2) für Filter und Formulare.
 * Mehrsprachige Suche: Name, Code und Aliase (z. B. Zypern, England → GB).
 */
import countriesData from '~/data/countries.json'
import countryAliasesData from '~/data/country-aliases.json'

export interface CountryOption {
  code: string
  name: string
}

const ALL_COUNTRIES: CountryOption[] = Array.isArray(countriesData) ? (countriesData as CountryOption[]) : []
const ALIASES: Record<string, string[]> = typeof countryAliasesData === 'object' && countryAliasesData !== null ? (countryAliasesData as Record<string, string[]>) : {}

/** Suchbare Begriffe für ein Land (Name, Code + Aliase), Kleinbuchstaben. */
function getSearchTerms(c: CountryOption): string[] {
  const terms = [c.name, c.code]
  const aliases = ALIASES[c.code]
  if (Array.isArray(aliases)) terms.push(...aliases)
  return terms.map((s) => s.toLowerCase())
}

export function useCountries() {
  const { t } = useI18n()

  /** Alle Länder (code + Name), sortiert nach Name. */
  const countries = computed<CountryOption[]>(() => ALL_COUNTRIES)

  /**
   * Anzeigename für ein Land: Übersetzung aus orgsMap.countries.{CODE} falls vorhanden, sonst englischer Name aus der Liste.
   */
  function getCountryLabel(code: string): string {
    if (!code) return ''
    const key = `orgsMap.countries.${code}`
    const translated = t(key)
    if (translated !== key) return translated
    const c = ALL_COUNTRIES.find((x) => x.code === code)
    return c?.name ?? code
  }

  /**
   * Gefilterte Länder für Autocomplete: Suchbegriff gegen Name, Code und mehrsprachige Aliase (case-insensitive).
   */
  function filterCountries(query: string, limit = 50): CountryOption[] {
    if (!ALL_COUNTRIES.length) return []
    const q = (query || '').trim().toLowerCase()
    if (!q) return ALL_COUNTRIES.slice(0, limit)
    const filtered = ALL_COUNTRIES.filter((c) => {
      const terms = getSearchTerms(c)
      return terms.some((term) => term.includes(q))
    })
    return filtered.slice(0, limit)
  }

  return { countries, getCountryLabel, filterCountries, ALL_COUNTRIES }
}
