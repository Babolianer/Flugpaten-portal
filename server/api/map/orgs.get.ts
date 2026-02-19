import { prisma } from '~~/server/utils/prisma'
import { getRequestLocale } from '~~/server/utils/locale'
import { translateStrings } from '~~/server/utils/translateContent'

/** Pins für die Karte: ein Pin pro Standort einer Tierschutzorganisation */
type Pin = {
  id: string
  type: 'org'
  lat: number
  lng: number
  title?: string
  orgId?: string
  organization?: { name: string; slug: string }
}

/** Organisation für die Seitenliste (mit Standorten) */
type OrgListItem = {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  locationCount: number
  locations: { id: string; title: string; city: string; countryCode: string; lat: number; lng: number }[]
}

export default defineEventHandler(async (event) => {
  try {
    const locale = getRequestLocale(event)
    const query = getQuery(event)
    const countryCode = query.countryCode ? String(query.countryCode).trim().toUpperCase() : null
    const search = query.search ? String(query.search).trim() : null

    const orgWhere: Record<string, unknown> = {
      status: 'APPROVED',
    }

    if (search) {
      orgWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (countryCode) {
      orgWhere.locations = { some: { countryCode } }
    }

    const orgs = await prisma.organization.findMany({
      where: orgWhere,
      include: {
        locations: {
          where: countryCode ? { countryCode } : undefined,
        },
      },
    })

    const organizations: OrgListItem[] = []
    const pins: Pin[] = []

    for (const org of orgs) {
      const locs = org.locations.filter((loc) => loc.lat !== 0 || loc.lng !== 0)
      if (locs.length === 0) continue

      organizations.push({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        logoUrl: org.logoUrl,
        locationCount: locs.length,
        locations: locs.map((l) => ({
          id: l.id,
          title: l.title,
          city: l.city,
          countryCode: l.countryCode,
          lat: l.lat,
          lng: l.lng,
        })),
      })

      for (const loc of locs) {
        pins.push({
          id: `loc-${loc.id}`,
          type: 'org',
          lat: loc.lat,
          lng: loc.lng,
          orgId: org.id,
          title: loc.title ? `${loc.title} (${org.name})` : org.name,
          organization: { name: org.name, slug: org.slug },
        })
      }
    }

    if (locale !== 'de') {
      const allTexts: string[] = []
      for (const o of organizations) {
        allTexts.push(o.name, o.description ?? '')
        for (const loc of o.locations) {
          allTexts.push(loc.title)
        }
      }
      const translated = await translateStrings(allTexts, locale)
      let i = 0
      for (const o of organizations) {
        o.name = translated[i++] ?? o.name
        o.description = o.description ? (translated[i++] ?? o.description) : (i++, null)
        for (const loc of o.locations) {
          loc.title = translated[i++] ?? loc.title
        }
      }
      for (const pin of pins) {
        const orgItem = organizations.find((o) => o.id === pin.orgId)
        if (orgItem) {
          const loc = orgItem.locations.find((l) => pin.id === `loc-${l.id}`)
          pin.title = loc?.title ? `${loc.title} (${orgItem.name})` : orgItem.name
          pin.organization = { ...pin.organization, name: orgItem.name }
        }
      }
    }

    return { organizations, pins }
  } catch (err) {
    console.error('[api/map/orgs]', err)
    throw createError({ statusCode: 500, statusMessage: 'Fehler beim Laden der Organisationen' })
  }
})
