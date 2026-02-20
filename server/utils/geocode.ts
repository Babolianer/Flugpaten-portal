const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'TierschutzFlugpatenPortal/1.0 (contact@example.com)'

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

/**
 * Geocode an address using Nominatim (OpenStreetMap). Returns { lat, lng } or null if not found.
 * Per Nominatim usage policy: use a valid User-Agent and avoid heavy usage (max 1 req/sec).
 */
export async function geocode(params: GeocodeParams): Promise<GeocodeResult | null> {
  const parts: string[] = []
  if (params.address?.trim()) parts.push(params.address.trim())
  if (params.postalCode?.trim()) parts.push(params.postalCode.trim())
  if (params.city?.trim()) parts.push(params.city.trim())
  if (params.countryCode?.trim()) parts.push(params.countryCode.trim().toUpperCase())
  const query = parts.join(', ')
  if (!query) return null

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '1')

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
