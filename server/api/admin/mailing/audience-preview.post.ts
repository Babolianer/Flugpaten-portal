import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const segmentSchema = z.enum([
  'ACQUISITION_CONTACTS',
  'ALL_FLUGPATEN',
  'ORG_ACCOUNT_HOLDERS',
  'APPROVED_ORG_CONTACT_EMAILS',
  'NEWSLETTER_FLUGPATEN',
  'NEWSLETTER_ORG_USERS',
])
const languageSchema = z.enum(['de', 'en', 'fr', 'es', 'it', 'pl'])
const orgStatusSchema = z.enum(['PENDING', 'APPROVED', 'CANCELLED', 'REJECTED'])
const userFiltersSchema = z.object({
  emailVerified: z.enum(['all', 'verified', 'unverified']).optional(),
  doubleOptIn: z.enum(['all', 'only', 'exclude']).optional(),
  newsletter: z.enum(['all', 'optIn', 'optOut']).optional(),
  blocked: z.enum(['exclude', 'all', 'only']).optional(),
})
const orgFiltersSchema = z.object({
  status: z.union([z.literal('all'), orgStatusSchema]).optional(),
  hasWebsite: z.boolean().optional(),
  hasDescription: z.boolean().optional(),
  excludeAquiseStatuses: z.array(z.enum(['nicht kontaktiert', 'kontaktiert', 'keine antwort', 'registriert', 'interessiert'])).optional(),
  excludeContactedWithinDays: z.number().int().min(1).max(3650).optional(),
})
const audienceFiltersSchema = z.object({
  user: userFiltersSchema.optional(),
  org: orgFiltersSchema.optional(),
})

const bodySchema = z.object({
  segment: segmentSchema,
  language: languageSchema.optional(),
  filters: audienceFiltersSchema.optional(),
  limit: z.number().int().min(1).max(200).optional(),
})

type PreviewRecipient = {
  email: string
  name: string
  type: 'USER' | 'ORG_USER' | 'ORG_CONTACT' | 'ACQUISITION_CONTACT'
}

function dedupe(list: PreviewRecipient[]): PreviewRecipient[] {
  const m = new Map<string, PreviewRecipient>()
  for (const r of list) {
    const key = r.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) continue
    if (!m.has(key)) m.set(key, { ...r, email: r.email.trim() })
  }
  return [...m.values()]
}

async function loadRecipients(
  segment: z.infer<typeof segmentSchema>,
  language?: z.infer<typeof languageSchema>,
  filters?: z.infer<typeof audienceFiltersSchema>
): Promise<PreviewRecipient[]> {
  const userFilters = filters?.user
  const orgFilters = filters?.org

  const baseUserWhere: Record<string, unknown> = {}
  if (userFilters?.emailVerified === 'verified') baseUserWhere.emailVerified = true
  if (userFilters?.emailVerified === 'unverified') baseUserWhere.emailVerified = false
  if (userFilters?.doubleOptIn === 'only') baseUserWhere.emailVerified = true
  if (userFilters?.doubleOptIn === 'exclude') baseUserWhere.emailVerified = false
  if (userFilters?.newsletter === 'optIn') baseUserWhere.newsletterOptIn = true
  if (userFilters?.newsletter === 'optOut') baseUserWhere.newsletterOptIn = false
  if (userFilters?.blocked === 'exclude') baseUserWhere.blockedAt = null
  if (userFilters?.blocked === 'only') baseUserWhere.blockedAt = { not: null }

  const baseOrgWhere: Record<string, unknown> = {}
  if (orgFilters?.status && orgFilters.status !== 'all') baseOrgWhere.status = orgFilters.status
  if (orgFilters?.hasWebsite === true) baseOrgWhere.website = { not: null }
  if (orgFilters?.hasDescription === true) baseOrgWhere.description = { not: null }

  const normalized = (v: string | null | undefined) => (v ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  let excludedOrganizationIds = new Set<string>()
  if ((orgFilters?.excludeAquiseStatuses?.length ?? 0) > 0 || orgFilters?.excludeContactedWithinDays) {
    const statusList = (orgFilters?.excludeAquiseStatuses ?? []).map((s) => (s === 'interessiert' ? 'registriert' : s))
    const contactedSince = orgFilters?.excludeContactedWithinDays
      ? new Date(Date.now() - orgFilters.excludeContactedWithinDays * 24 * 60 * 60 * 1000)
      : null

    const where: Record<string, unknown> = {}
    if (statusList.length > 0 && contactedSince) {
      where.OR = [{ kontaktStatus: { in: statusList } }, { letzteKontaktaufnahme: { gte: contactedSince } }]
    } else if (statusList.length > 0) {
      where.kontaktStatus = { in: statusList }
    } else if (contactedSince) {
      where.letzteKontaktaufnahme = { gte: contactedSince }
    }

    const [aquise, organizations] = await Promise.all([
      prisma.orgaAquise.findMany({
        where: Object.keys(where).length ? where : undefined,
        select: { name: true },
      }),
      prisma.organization.findMany({
        where: Object.keys(baseOrgWhere).length ? (baseOrgWhere as never) : undefined,
        select: { id: true, name: true },
      }),
    ])
    const blockedNames = new Set(aquise.map((a) => normalized(a.name)).filter(Boolean))
    const blockedIds = organizations.filter((o) => blockedNames.has(normalized(o.name))).map((o) => o.id)
    excludedOrganizationIds = new Set(blockedIds)
  }

  switch (segment) {
    case 'ACQUISITION_CONTACTS': {
      const rows = await prisma.acquisitionContact.findMany({
        where: {
          email: { not: null, notIn: [''] },
          ...(language ? { websiteLanguage: { equals: language, mode: 'insensitive' } } : {}),
        },
        select: { name: true, email: true },
      })
      return rows.map((c) => ({ email: c.email!, name: c.name, type: 'ACQUISITION_CONTACT' }))
    }
    case 'ALL_FLUGPATEN': {
      const rows = await prisma.user.findMany({
        where: { role: 'USER', ...baseUserWhere, ...(language ? { preferredLanguage: language } : {}) },
        select: { email: true, displayName: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, type: 'USER' }))
    }
    case 'ORG_ACCOUNT_HOLDERS': {
      const orgRestriction = excludedOrganizationIds.size > 0
        ? { memberships: { some: { organizationId: { notIn: [...excludedOrganizationIds] } } } }
        : {}
      const rows = await prisma.user.findMany({
        where: { role: 'ORG_USER', ...baseUserWhere, ...orgRestriction, ...(language ? { preferredLanguage: language } : {}) },
        select: { email: true, displayName: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, type: 'ORG_USER' }))
    }
    case 'APPROVED_ORG_CONTACT_EMAILS': {
      const rows = await prisma.organization.findMany({
        where: {
          status: orgFilters?.status && orgFilters.status !== 'all' ? orgFilters.status : 'APPROVED',
          ...baseOrgWhere,
          ...(excludedOrganizationIds.size > 0 ? { id: { notIn: [...excludedOrganizationIds] } } : {}),
          ...(language ? { preferredLanguage: language } : {}),
        },
        select: { contactEmail: true, name: true },
      })
      return rows.map((o) => ({ email: o.contactEmail, name: o.name, type: 'ORG_CONTACT' }))
    }
    case 'NEWSLETTER_FLUGPATEN': {
      const rows = await prisma.user.findMany({
        where: {
          role: 'USER',
          newsletterOptIn: true,
          ...baseUserWhere,
          ...(language ? { preferredLanguage: language } : {}),
        },
        select: { email: true, displayName: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, type: 'USER' }))
    }
    case 'NEWSLETTER_ORG_USERS': {
      const orgRestriction = excludedOrganizationIds.size > 0
        ? { memberships: { some: { organizationId: { notIn: [...excludedOrganizationIds] } } } }
        : {}
      const rows = await prisma.user.findMany({
        where: { role: 'ORG_USER', newsletterOptIn: true, ...baseUserWhere, ...orgRestriction, ...(language ? { preferredLanguage: language } : {}) },
        select: { email: true, displayName: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, type: 'ORG_USER' }))
    }
  }
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const raw = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige Eingabe' })
  }

  const { segment, language, filters, limit = 25 } = parsed.data
  const recipients = dedupe(await loadRecipients(segment, language, filters))

  return {
    segment,
    language: language ?? null,
    filters: filters ?? null,
    total: recipients.length,
    preview: recipients.slice(0, limit),
    hasMore: recipients.length > limit,
  }
})
