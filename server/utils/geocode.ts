const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const USER_AGENT = 'TierschutzFlugpatenPortal/1.0 (contact@example.com)'
const NOMINATIM_EMAIL = 'contact@example.com'

/** Nominatim liefert bei Ländernamen oft bessere Treffer als bei ISO-Code. */
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  DE: 'Germany',
  AT: 'Austria',
  CH: 'Switzerland',
  NL: 'Netherlands',
  BE: 'Belgium',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  PL: 'Poland',
  CZ: 'Czech Republic',
}

export interface GeocodeParams {
  address?: string
  postalCode?: string
  city?: string
  countryCode?: string
}

export interface GeocodeResult {
  lat: number
  lng: number
}

/** Nominatim-Nutzungsbedingung: max. 1 Anfrage/Sekunde. */
function waitOneSecond(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1100))
}

async function fetchNominatim(searchParams: URLSearchParams): Promise<GeocodeResult | null> {
  const url = new URL(NOMINATIM_SEARCH_URL)
  searchParams.set('format', 'json')
  searchParams.set('limit', '1')
  url.search = searchParams.toString()

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) return null

  const data = (await res.json()) as Array<{ lat: string; lon: string }>
  const first = data?.[0]
  if (!first?.lat || !first?.lon) return null

  const lat = parseFloat(first.lat)
  const lng = parseFloat(first.lon)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null

  return { lat, lng }
}

/**
 * Geocode an address using Nominatim (OpenStreetMap). Returns { lat, lng } or null if not found.
 * Tries structured search first (better for full addresses), then free-form query.
 * Per Nominatim usage policy: use a valid User-Agent and avoid heavy usage (max 1 req/sec).
 */
export async function geocode(params: GeocodeParams): Promise<GeocodeResult | null> {
  const address = params.address?.trim()
  const postalCode = params.postalCode?.trim()
  const city = params.city?.trim()
  const countryCode = params.countryCode?.trim().toUpperCase()
  const countryName = countryCode ? (COUNTRY_CODE_TO_NAME[countryCode] ?? countryCode) : ''

  if (!city && !address && !postalCode) return null

  // 1. Strukturierte Suche (Nominatim: street, city, postalcode, country – ohne q=)
  const structured = new URLSearchParams()
  if (address) structured.set('street', address)
  if (city) structured.set('city', city)
  if (postalCode) structured.set('postalcode', postalCode)
  if (countryName) structured.set('country', countryName)

  if (structured.toString()) {
    const result = await fetchNominatim(structured)
    if (result) return result
    await waitOneSecond()
  }

  // 2. Fallback: Freitext-Suche (q=)
  const parts: string[] = []
  if (address) parts.push(address)
  if (postalCode) parts.push(postalCode)
  if (city) parts.push(city)
  if (countryName) parts.push(countryName)
  const query = parts.join(', ')
  if (query) {
    const freeform = new URLSearchParams()
    freeform.set('q', query)
    const result = await fetchNominatim(freeform)
    if (result) return result
    await waitOneSecond()
  }

  // 3. Fallback: nur Ort (PLZ + Stadt + Land) – Karte zeigt Ortslage (strukturiert oder Freitext)
  if (city || postalCode) {
    const placeOnly = new URLSearchParams()
    if (postalCode) placeOnly.set('postalcode', postalCode)
    if (city) placeOnly.set('city', city)
    if (countryName) placeOnly.set('country', countryName)
    if (placeOnly.toString()) {
      let result = await fetchNominatim(placeOnly)
      if (result) return result
      await waitOneSecond()
      // Fallback: gleiche Daten als Freitext (z. B. "73666, Baltmannsweiler, Germany")
      const placeQuery = [postalCode, city, countryName].filter(Boolean).join(', ')
      if (placeQuery) {
        const placeQ = new URLSearchParams()
        placeQ.set('q', placeQuery)
        result = await fetchNominatim(placeQ)
        if (result) return result
      }
    }
  }

  return null
}

export interface ReverseGeocodeResult {
  lat: number
  lng: number
  address: string
  postalCode: string
  city: string
  countryCode: string
  state?: string
  displayName: string
}

/**
 * Reverse geocode: lat/lng → structured address using Nominatim.
 * Returns address components for form prefill; rate limit 1 req/sec.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  await waitOneSecond()

  const url = new URL(NOMINATIM_REVERSE_URL)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('email', NOMINATIM_EMAIL)

  let res: Response
  try {
    res = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Accept-Language': 'de,en',
      },
    })
  } catch {
    return null
  }

  if (!res.ok) {
    return null
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    return null
  }
  const parsed = data as {
    lat?: string
    lon?: string
    display_name?: string
    address?: {
      road?: string
      house_number?: string
      postcode?: string
      city?: string
      town?: string
      village?: string
      neighbourhood?: string
      suburb?: string
      state?: string
      country?: string
      country_code?: string
    }
  }

  const addr = parsed?.address ?? {}
  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? addr.neighbourhood ?? ''
  const countryCode = (addr.country_code ?? '').toUpperCase().slice(0, 2)
  const road = [addr.road, addr.house_number].filter(Boolean).join(' ').trim()
  const postalCode = addr.postcode ?? ''

  const resultLat = parsed.lat != null ? parseFloat(parsed.lat) : lat
  const resultLng = parsed.lon != null ? parseFloat(parsed.lon) : lng
  if (Number.isNaN(resultLat) || Number.isNaN(resultLng)) return null

  return {
    lat: resultLat,
    lng: resultLng,
    address: road,
    postalCode,
    city,
    countryCode,
    state: addr.state,
    displayName: parsed.display_name ?? '',
  }
}
