import { prisma } from '~~/server/utils/prisma'
import { ensureAirportsLoaded, getAirportByIata, getIatasInCountry, parseCountryFilter } from '~~/server/utils/airports-global'
import { haversineKm } from '~~/server/utils/geo'
import { getRequestLocale } from '~~/server/utils/locale'
import { translateStrings } from '~~/server/utils/translateContent'

export type MatchType = 'DIRECT' | 'RADIUS' | 'COUNTRY'

function getMatchScore(matchType: MatchType, distanceKm?: number): number {
  if (matchType === 'DIRECT') return 100
  if (matchType === 'RADIUS') {
    const d = distanceKm ?? 200
    return Math.max(10, 70 - d / 10)
  }
  if (matchType === 'COUNTRY') return 40
  return 0
}

export default defineEventHandler(async (event) => {
  const locale = getRequestLocale(event)
  await ensureAirportsLoaded()
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
  const onlyDirectMatches = query.onlyDirectMatches === 'true' || query.onlyDirectMatches === '1'

  const originCountryFilter = parseCountryFilter(originAirport || '')
  const destCountryFilter = parseCountryFilter(destAirport || '')
  const useExtendedMatch =
    !!(origin_iata && dest_iata) && !originCountryFilter && !destCountryFilter
  const userDestLat = dest_lat ?? (dest_iata ? getAirportByIata(dest_iata)?.lat : null)
  const userDestLng = dest_lng ?? (dest_iata ? getAirportByIata(dest_iata)?.lng : null)
  const userDestCountry = dest_country ?? (dest_iata ? getAirportByIata(dest_iata)?.country : null)

  const requestsWhere: Record<string, unknown> = {
    status: { in: ['OPEN', 'MATCHED'] },
    organization: { status: 'APPROVED' },
  }

  if (dateFrom) {
    requestsWhere.latestDate = { gte: new Date(dateFrom) }
  }
  if (dateTo) {
    requestsWhere.earliestDate = { lte: new Date(dateTo) }
  }
  if (!useExtendedMatch) {
    if (originCountryFilter) {
      const iatas = getIatasInCountry(originCountryFilter)
      if (iatas.length > 0) {
        requestsWhere.originAirport = { in: iatas }
      } else {
        requestsWhere.originAirport = { in: ['__none__'] }
      }
    } else if (originAirport) {
      requestsWhere.originAirport = { contains: originAirport, mode: 'insensitive' }
    }
    if (destCountryFilter) {
      const iatas = getIatasInCountry(destCountryFilter)
      if (iatas.length > 0) {
        requestsWhere.destAirport = { in: iatas }
      } else {
        requestsWhere.destAirport = { in: ['__none__'] }
      }
    } else if (destAirport) {
      requestsWhere.destAirport = { contains: destAirport, mode: 'insensitive' }
    }
  }
  if (species && species !== 'all') {
    requestsWhere.animal = { species }
  }

  const requests = await prisma.transportRequest.findMany({
    where: requestsWhere,
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      animal: { select: { id: true, name: true, species: true, imageUrl: true } },
      destinations: { orderBy: { sortOrder: 'asc' }, select: { id: true, airportCode: true, lat: true, lng: true, sortOrder: true } },
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
      const dests = (r as { destinations?: Array<{ airportCode: string; lat: number | null; lng: number | null }> }).destinations ?? []
      const destCodes = dests.length > 0 ? dests.map((d) => (d.airportCode || '').toUpperCase().replace(/\s+/g, ' ').trim()) : [(r.destAirport || '').toUpperCase().replace(/\s+/g, ' ').trim()]
      const destLats = dests.length > 0 ? dests.map((d) => d.lat) : [r.destLat]
      const destLngs = dests.length > 0 ? dests.map((d) => d.lng) : [r.destLng]
      const originMatch = reqOrigin === origin_iata || reqOrigin.includes(origin_iata!)
      const destMatch = destCodes.some((dc) => dc && (dc === dest_iata || dc.includes(dest_iata!)))

      let matchType: MatchType | null = null
      let distanceKm: number | undefined

      if (originMatch && destMatch) {
        matchType = 'DIRECT'
      } else {
        let bestDist = Infinity
        for (let i = 0; i < destCodes.length; i++) {
          const lat = destLats[i] ?? null
          const lng = destLngs[i] ?? null
          const code = destCodes[i]
          const reqDestCountry = (code ? getAirportByIata(code)?.country : null)?.toUpperCase()
          const sameCountry = userDestCountry && reqDestCountry && reqDestCountry === userDestCountry
          if (lat != null && lng != null && userDestLat != null && userDestLng != null) {
            const d = haversineKm(lat, lng, userDestLat, userDestLng)
            if (d <= radius_km && d < bestDist) {
              matchType = 'RADIUS'
              distanceKm = Math.round(d)
              bestDist = d
            }
          }
          if (!matchType && sameCountry) {
            matchType = 'COUNTRY'
          }
        }
      }

      if (matchType) {
        enrichedList.push({ ...r, matchType, distanceKm })
      }
    }
    enrichedList.sort((a, b) => {
      const scoreA = getMatchScore(a.matchType!, a.distanceKm)
      const scoreB = getMatchScore(b.matchType!, b.distanceKm)
      return scoreB - scoreA
    })
  }

  if (onlyDirectMatches && useExtendedMatch) {
    enrichedList = enrichedList.filter((r) => r.matchType === 'DIRECT')
  }

  // "Gemeinsam fliegen" / Partner-Requests für die Map-Karten.
  // Wir ergänzen pro Request ein `group`-Objekt mit allen Partner-Requests (alle ausser dem aktuellen Request).
  const groupIds = Array.from(
    new Set(
      enrichedList
        .map((r) => (r as { groupId?: string | null }).groupId ?? null)
        .filter((gid): gid is string => typeof gid === 'string' && gid.length > 0),
    ),
  )

  const groupTitlesById = new Map<string, string>()
  const groupRequestsByGroupId = new Map<
    string,
    Array<{
      id: string
      title: string
      status: string
      earliestDate: Date
      latestDate: Date
      originAirport: string
      destAirport: string
    }>
  >()

  if (groupIds.length > 0) {
    const groups = await prisma.transportRequestGroup.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, title: true },
    })
    for (const g of groups) groupTitlesById.set(g.id, g.title)

    const groupRequests = await prisma.transportRequest.findMany({
      where: {
        groupId: { in: groupIds },
        status: { in: ['OPEN', 'MATCHED'] },
      },
      select: {
        id: true,
        groupId: true,
        title: true,
        status: true,
        earliestDate: true,
        latestDate: true,
        originAirport: true,
        destAirport: true,
      },
    })

    for (const r of groupRequests) {
      if (!r.groupId) continue
      const arr = groupRequestsByGroupId.get(r.groupId) ?? []
      arr.push({
        id: r.id,
        title: r.title,
        status: r.status,
        earliestDate: r.earliestDate,
        latestDate: r.latestDate,
        originAirport: r.originAirport,
        destAirport: r.destAirport,
      })
      groupRequestsByGroupId.set(r.groupId, arr)
    }
  }

  type Pin = {
    id: string
    type: 'request'
    lat: number
    lng: number
    requestId?: string
    title?: string
    organization?: { id: string; name: string; slug: string }
    animal?: { id: string; name: string; species: string }
    matchType?: MatchType
    distanceKm?: number
  }

  const pins: Pin[] = []
  const addedOriginDest = new Set<string>()

  const connections: Array<{ from: [number, number]; to: [number, number] }> = []
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
    addPin(originLat, originLng, '-origin')
    const dests = (r as { destinations?: Array<{ lat: number | null; lng: number | null }> }).destinations
    if (dests && dests.length > 0) {
      dests.forEach((d, i) => {
        const lat = d.lat ?? 0
        const lng = d.lng ?? 0
        if (lat !== 0 || lng !== 0) {
          addPin(lat, lng, `-dest-${i}`)
          if (originLat !== 0 || originLng !== 0) {
            connections.push({ from: [originLng, originLat], to: [lng, lat] })
          }
        }
      })
    } else {
      const destLat = r.destLat ?? 0
      const destLng = r.destLng ?? 0
      if (destLat !== 0 || destLng !== 0) {
        addPin(destLat, destLng, '-dest')
        if (originLat !== 0 || originLng !== 0) {
          connections.push({ from: [originLng, originLat], to: [destLng, destLat] })
        }
      }
    }
  }

  let requestList = enrichedList.map((r) => {
    const dests = (r as { destinations?: Array<{ airportCode: string; lat: number | null; lng: number | null }> }).destinations
    const firstDest = dests && dests.length > 0 ? dests[0] : null
    return {
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
    destLat: firstDest?.lat ?? r.destLat,
    destLng: firstDest?.lng ?? r.destLng,
    destinations: dests ?? undefined,
    organization: r.organization,
    animal: r.animal,
    animalCanFlyInCargo: r.animalCanFlyInCargo,
    animalCanFlyInCabin: r.animalCanFlyInCabin,
    group: (() => {
      const groupId = (r as { groupId?: string | null }).groupId ?? null
      if (!groupId) return null
      const partners = (groupRequestsByGroupId.get(groupId) ?? []).filter((p) => p.id !== r.id)
      if (partners.length === 0) return null
      return {
        id: groupId,
        title: groupTitlesById.get(groupId) ?? '',
        partners,
      }
    })(),
    matchType: r.matchType,
    distanceKm: r.distanceKm,
  }
  })

  if (locale !== 'de') {
    const allTexts = enrichedList.flatMap((r) => [r.title, r.organization?.name].filter(Boolean))
    const translated = await translateStrings(allTexts, locale)
    let i = 0
    const translatedByReqId = new Map<string, { title: string; orgName: string }>()
    requestList = requestList.map((req, idx) => {
      const r = enrichedList[idx]
      const title = r.title ? (translated[i++] ?? r.title) : r.title
      const orgName = r.organization?.name ? (translated[i++] ?? r.organization.name) : r.organization?.name ?? ''
      if (r.id) translatedByReqId.set(r.id, { title, orgName })
      return {
        ...req,
        title,
        organization: req.organization ? { ...req.organization, name: orgName || req.organization.name } : undefined,
      }
    })
    for (const pin of pins) {
      if (pin.requestId) {
        const t = translatedByReqId.get(pin.requestId)
        if (t) {
          pin.title = t.title
          if (pin.organization) pin.organization = { ...pin.organization, name: t.orgName }
        }
      }
    }
  }

  return { pins, requests: requestList, connections }
})
