import { prisma } from '~~/server/utils/prisma'
import { getAirportByCode } from '~~/server/utils/airports'
import { haversineKm } from '~~/server/utils/geo'

export type MatchType = 'DIRECT' | 'RADIUS' | 'COUNTRY'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const west = query.west ? parseFloat(String(query.west)) : null
  const south = query.south ? parseFloat(String(query.south)) : null
  const east = query.east ? parseFloat(String(query.east)) : null
  const north = query.north ? parseFloat(String(query.north)) : null
  const dateFrom = query.dateFrom ? String(query.dateFrom) : null
  const dateTo = query.dateTo ? String(query.dateTo) : null
  const originAirport = query.originAirport ? String(query.originAirport).trim() : null
  const destAirport = query.destAirport ? String(query.destAirport).trim() : null
  const origin_iata = query.origin_iata ? String(query.origin_iata).trim().toUpperCase() : null
  const dest_iata = query.dest_iata ? String(query.dest_iata).trim().toUpperCase() : null
  const dest_lat = query.dest_lat != null ? parseFloat(String(query.dest_lat)) : null
  const dest_lng = query.dest_lng != null ? parseFloat(String(query.dest_lng)) : null
  const dest_country = query.dest_country ? String(query.dest_country).trim().toUpperCase() : null
  const radius_km = query.radius_km != null ? Math.max(0, parseFloat(String(query.radius_km))) : 200
  const species = query.species ? String(query.species) : null

  const useExtendedMatch = !!(origin_iata && dest_iata)
  const userDestLat = dest_lat ?? (dest_iata ? getAirportByCode(dest_iata)?.lat : null)
  const userDestLng = dest_lng ?? (dest_iata ? getAirportByCode(dest_iata)?.lng : null)
  const userDestCountry = dest_country ?? (dest_iata ? getAirportByCode(dest_iata)?.country : null)

  const requestsWhere: Record<string, unknown> = {
    status: 'OPEN',
    organization: { status: 'APPROVED' },
  }

  if (dateFrom) {
    requestsWhere.latestDate = { gte: new Date(dateFrom) }
  }
  if (dateTo) {
    requestsWhere.earliestDate = { lte: new Date(dateTo) }
  }
  if (!useExtendedMatch) {
    if (originAirport) {
      requestsWhere.originAirport = { contains: originAirport, mode: 'insensitive' }
    }
    if (destAirport) {
      requestsWhere.destAirport = { contains: destAirport, mode: 'insensitive' }
    }
  }
  if (species && species !== 'all') {
    requestsWhere.animal = species === 'cat' || species === 'dog'
      ? { species }
      : undefined
    if (species !== 'cat' && species !== 'dog') {
      delete requestsWhere.animal
    }
  }

  const requests = await prisma.transportRequest.findMany({
    where: requestsWhere,
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      animal: { select: { id: true, name: true, species: true, imageUrl: true } },
    },
  })

  type EnrichedRequest = (typeof requests)[0] & {
    matchType?: MatchType
    distanceKm?: number
  }

  let enrichedList: EnrichedRequest[] = requests.map((r) => ({ ...r }))

  if (useExtendedMatch && (userDestLat != null && userDestLng != null || userDestCountry)) {
    enrichedList = []
    for (const r of requests) {
      const reqOrigin = (r.originAirport || '').toUpperCase().replace(/\s+/g, ' ').trim()
      const reqDest = (r.destAirport || '').toUpperCase().replace(/\s+/g, ' ').trim()
      const originMatch = reqOrigin === origin_iata || reqOrigin.includes(origin_iata!)
      const destMatch = reqDest === dest_iata || reqDest.includes(dest_iata!)

      let matchType: MatchType | null = null
      let distanceKm: number | undefined

      if (originMatch && destMatch) {
        matchType = 'DIRECT'
      } else {
        const reqDestCountry = getAirportByCode(r.destAirport)?.country?.toUpperCase()
        const sameCountry = userDestCountry && reqDestCountry && reqDestCountry === userDestCountry

        if (r.destLat != null && r.destLng != null && userDestLat != null && userDestLng != null) {
          const d = haversineKm(r.destLat, r.destLng, userDestLat, userDestLng)
          if (d <= radius_km) {
            matchType = 'RADIUS'
            distanceKm = Math.round(d)
          }
        }
        if (!matchType && sameCountry) {
          matchType = 'COUNTRY'
        }
      }

      if (matchType) {
        enrichedList.push({ ...r, matchType, distanceKm })
      }
    }
    enrichedList.sort((a, b) => {
      const order: Record<MatchType, number> = { DIRECT: 0, RADIUS: 1, COUNTRY: 2 }
      return (order[a.matchType!] ?? 99) - (order[b.matchType!] ?? 99)
    })
  }

  const orgIds = [...new Set(enrichedList.map((r) => r.organizationId))]
  const locations = await prisma.orgLocation.findMany({
    where: { organizationId: { in: orgIds } },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  })

  type Pin = {
    id: string
    type: 'request' | 'org'
    lat: number
    lng: number
    requestId?: string
    orgId?: string
    title?: string
    organization?: { id: string; name: string; slug: string }
    animal?: { id: string; name: string; species: string }
    matchType?: MatchType
    distanceKm?: number
  }

  const pins: Pin[] = []

  const addedOriginDest = new Set<string>()
  for (const r of enrichedList) {
    const addPin = (lat: number, lng: number, idSuffix: string) => {
      if (lat === 0 && lng === 0) return
      if (west != null && south != null && east != null && north != null) {
        if (lng < west || lat < south || lng > east || lat > north) return
      }
      const key = `${r.id}-${lat}-${lng}`
      if (addedOriginDest.has(key)) return
      addedOriginDest.add(key)
      pins.push({
        id: `${r.id}${idSuffix}`,
        type: 'request',
        lat,
        lng,
        requestId: r.id,
        title: r.title,
        organization: r.organization,
        animal: r.animal || undefined,
        matchType: r.matchType,
        distanceKm: r.distanceKm,
      })
    }
    const originLat = r.originLat ?? 0
    const originLng = r.originLng ?? 0
    const destLat = r.destLat ?? 0
    const destLng = r.destLng ?? 0
    addPin(originLat, originLng, '-origin')
    if (destLat !== 0 || destLng !== 0) addPin(destLat, destLng, '-dest')
  }

  for (const loc of locations) {
    if (west != null && south != null && east != null && north != null) {
      if (loc.lng < west || loc.lat < south || loc.lng > east || loc.lat > north) continue
    }

    pins.push({
      id: `loc-${loc.id}`,
      type: 'org',
      lat: loc.lat,
      lng: loc.lng,
      orgId: loc.organizationId,
      title: loc.title,
      organization: loc.organization,
    })
  }

  const requestList = enrichedList.map((r) => ({
    id: r.id,
    title: r.title,
    details: r.details,
    status: r.status,
    earliestDate: r.earliestDate,
    latestDate: r.latestDate,
    originAirport: r.originAirport,
    destAirport: r.destAirport,
    originLat: r.originLat,
    originLng: r.originLng,
    destLat: r.destLat,
    destLng: r.destLng,
    organization: r.organization,
    animal: r.animal,
    matchType: r.matchType,
    distanceKm: r.distanceKm,
  }))

  return { pins, requests: requestList }
})
