import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { sendEmail } from '~~/server/utils/sendEmail'
import { buildEmailHtml } from '~~/server/utils/emailTemplate'
import { loadMailFooterSettings, pickFooterForLocale } from '~~/server/utils/mailFooterSettings'

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
  segment: segmentSchema.optional(),
  language: languageSchema.optional(),
  filters: audienceFiltersSchema.optional(),
  manualRecipients: z.array(z.string().email()).optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  footerText: z.string().optional().nullable(),
  footerHtml: z.string().optional().nullable(),
  testTo: z.string().email().optional(),
  testName: z.string().optional(),
})

type Recipient = {
  email: string
  name: string
  locale?: string | null
  acquisitionContactId?: string
  userId?: string
  organizationId?: string
}

function replacePlaceholders(text: string, name: string): string {
  return text
    .replace(/\{\{Tierschutzorga\.\}\}/g, name)
    .replace(/\{\{Tierschutzorga\}\}/g, name)
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{organisation\}\}/g, name)
}

function dedupeRecipients(list: Recipient[]): Recipient[] {
  const m = new Map<string, Recipient>()
  for (const r of list) {
    const k = r.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k)) continue
    if (!m.has(k)) m.set(k, { ...r, email: r.email.trim() })
  }
  return [...m.values()]
}

async function loadRecipients(
  segment: z.infer<typeof segmentSchema>,
  language?: z.infer<typeof languageSchema>,
  filters?: z.infer<typeof audienceFiltersSchema>
): Promise<Recipient[]> {
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
        select: { id: true, name: true, email: true, websiteLanguage: true },
      })
      return rows.map((c) => ({
        email: c.email!,
        name: c.name,
        locale: c.websiteLanguage,
        acquisitionContactId: c.id,
      }))
    }
    case 'ALL_FLUGPATEN': {
      const rows = await prisma.user.findMany({
        where: {
          role: 'USER',
          ...baseUserWhere,
          ...(language ? { preferredLanguage: language } : {}),
        },
        select: { id: true, email: true, displayName: true, preferredLanguage: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, locale: u.preferredLanguage, userId: u.id }))
    }
    case 'ORG_ACCOUNT_HOLDERS': {
      const orgRestriction = excludedOrganizationIds.size > 0
        ? { memberships: { some: { organizationId: { notIn: [...excludedOrganizationIds] } } } }
        : {}
      const rows = await prisma.user.findMany({
        where: {
          role: 'ORG_USER',
          ...baseUserWhere,
          ...orgRestriction,
          ...(language ? { preferredLanguage: language } : {}),
        },
        select: { id: true, email: true, displayName: true, preferredLanguage: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, locale: u.preferredLanguage, userId: u.id }))
    }
    case 'APPROVED_ORG_CONTACT_EMAILS': {
      const rows = await prisma.organization.findMany({
        where: {
          status: orgFilters?.status && orgFilters.status !== 'all' ? orgFilters.status : 'APPROVED',
          ...baseOrgWhere,
          ...(excludedOrganizationIds.size > 0 ? { id: { notIn: [...excludedOrganizationIds] } } : {}),
          ...(language ? { preferredLanguage: language } : {}),
        },
        select: { id: true, name: true, contactEmail: true, preferredLanguage: true },
      })
      return rows.map((o) => ({
        email: o.contactEmail,
        name: o.name,
        locale: o.preferredLanguage,
        organizationId: o.id,
      }))
    }
    case 'NEWSLETTER_FLUGPATEN': {
      const rows = await prisma.user.findMany({
        where: {
          role: 'USER',
          newsletterOptIn: true,
          ...baseUserWhere,
          ...(language ? { preferredLanguage: language } : {}),
        },
        select: { id: true, email: true, displayName: true, preferredLanguage: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, locale: u.preferredLanguage, userId: u.id }))
    }
    case 'NEWSLETTER_ORG_USERS': {
      const orgRestriction = excludedOrganizationIds.size > 0
        ? { memberships: { some: { organizationId: { notIn: [...excludedOrganizationIds] } } } }
        : {}
      const rows = await prisma.user.findMany({
        where: {
          role: 'ORG_USER',
          newsletterOptIn: true,
          ...baseUserWhere,
          ...orgRestriction,
          ...(language ? { preferredLanguage: language } : {}),
        },
        select: { id: true, email: true, displayName: true, preferredLanguage: true },
      })
      return rows.map((u) => ({ email: u.email, name: u.displayName, locale: u.preferredLanguage, userId: u.id }))
    }
    default:
      return []
  }
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const config = useRuntimeConfig()
  const mailFrom = config.mailFrom
  const mailLogoUrl = config.mailLogoUrl || ''
  const appUrl = config.public.appUrl

  if (!config.smtpUser || !config.smtpPass) {
    throw createError({
      statusCode: 500,
      message: 'SMTP ist nicht konfiguriert. Bitte SMTP_USER und SMTP_PASS in .env eintragen.',
    })
  }

  const raw = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const {
    segment,
    language,
    filters,
    manualRecipients,
    subject: subjectRaw,
    body: bodyRaw,
    footerText: footerFromBody,
    footerHtml: footerHtmlFromBody,
    testTo,
    testName,
  } = parsed.data
  const subject = subjectRaw.trim()
  const bodyText = bodyRaw

  let footerSettings = {
    footerTextDe: footerFromBody?.trim() || null,
    footerTextEn: footerFromBody?.trim() || null,
    footerHtmlDe: footerHtmlFromBody && footerHtmlFromBody.trim().length > 0 ? footerHtmlFromBody : null,
    footerHtmlEn: footerHtmlFromBody && footerHtmlFromBody.trim().length > 0 ? footerHtmlFromBody : null,
  }
  try {
    const persisted = await loadMailFooterSettings()
    if (!footerSettings.footerTextDe && !footerSettings.footerTextEn) {
      footerSettings = persisted
    } else {
      if (!footerSettings.footerHtmlDe && !footerSettings.footerHtmlEn) {
        footerSettings.footerHtmlDe = persisted.footerHtmlDe
        footerSettings.footerHtmlEn = persisted.footerHtmlEn
      }
    }
  } catch {
    // ignore
  }

  const triggerKey = segment ? `MANUAL_SEGMENT_${segment}` : 'MANUAL_AUDIENCE'

  if (testTo) {
    const name = (testName && testName.trim()) || 'Test'
    const bodyWithPlaceholders = replacePlaceholders(bodyText, name)
    const selectedFooter = pickFooterForLocale(language ?? 'de', footerSettings)
    const html = buildEmailHtml(bodyWithPlaceholders, name, {
      appUrl,
      logoUrl: mailLogoUrl,
      footerText: selectedFooter.footerText,
      footerHtml: selectedFooter.footerHtml,
      showAppInterestLink: true,
      showDefaultSignOff: true,
    })
    const { messageId } = await sendEmail({
      from: mailFrom,
      to: testTo,
      subject: replacePlaceholders(subject, name),
      html,
    })
    await prisma.outboundEmail.create({
      data: {
        triggerKey,
        status: 'SENT',
        toEmail: testTo,
        subject: replacePlaceholders(subject, name),
        bodyHtml: html,
        bodyPlain: bodyWithPlaceholders,
        metadata: { segment: segment ?? 'MANUAL', language: language ?? null, filters: filters ?? null, test: true },
        sentAt: new Date(),
        providerMessageId: messageId ?? null,
      },
    })
    return { test: true, sent: 1, total: 1, failed: 0 }
  }

  let recipients: Recipient[] = []
  if (manualRecipients && manualRecipients.length > 0) {
    recipients = dedupeRecipients(
      manualRecipients.map((email) => ({
        email,
        name: email.split('@')[0] || 'Empfänger',
      }))
    )
  } else if (segment) {
    recipients = dedupeRecipients(await loadRecipients(segment, language, filters))
  } else {
    throw createError({
      statusCode: 400,
      message: 'Bitte Segment oder manuelle Empfängerliste angeben.',
    })
  }
  if (recipients.length === 0) {
    return { sent: 0, failed: 0, total: 0, message: 'Keine Empfänger für die ausgewählte Audience.' }
  }

  let sent = 0
  const errors: string[] = []

  for (const r of recipients) {
    const bodyWithPlaceholders = replacePlaceholders(bodyText, r.name)
    const selectedFooter = pickFooterForLocale(r.locale ?? language ?? 'de', footerSettings)
    const html = buildEmailHtml(bodyWithPlaceholders, r.name, {
      appUrl,
      logoUrl: mailLogoUrl,
      footerText: selectedFooter.footerText,
      footerHtml: selectedFooter.footerHtml,
      showAppInterestLink: true,
      showDefaultSignOff: true,
    })
    const subj = replacePlaceholders(subject, r.name)
    try {
      const { messageId } = await sendEmail({
        from: mailFrom,
        to: r.email,
        subject: subj,
        html,
      })
      sent++
      await prisma.outboundEmail.create({
        data: {
          triggerKey,
          status: 'SENT',
          toEmail: r.email,
          subject: subj,
          bodyHtml: html,
          bodyPlain: bodyWithPlaceholders,
          metadata: { segment: segment ?? 'MANUAL', language: language ?? null, filters: filters ?? null, name: r.name },
          userId: r.userId ?? null,
          organizationId: r.organizationId ?? null,
          sentAt: new Date(),
          providerMessageId: messageId ?? null,
        },
      })

      if (segment === 'ACQUISITION_CONTACTS' && r.acquisitionContactId) {
        const smtpId = `smtp-${Date.now()}-${r.acquisitionContactId}`
        try {
          await prisma.acquisitionMailLog.create({
            data: {
              acquisitionContactId: r.acquisitionContactId,
              resendId: smtpId,
              status: 'SENT',
            },
          })
          await prisma.acquisitionContact.update({
            where: { id: r.acquisitionContactId },
            data: { emailSent: true },
          })
        } catch {
          // ignore
        }
      }
    } catch (e) {
      const err = e as Error
      errors.push(`${r.name} (${r.email}): ${err.message}`)
      try {
        await prisma.outboundEmail.create({
          data: {
            triggerKey,
            status: 'FAILED',
            toEmail: r.email,
            subject: subj,
            bodyHtml: html,
            bodyPlain: bodyWithPlaceholders,
            metadata: { segment: segment ?? 'MANUAL', language: language ?? null, filters: filters ?? null, name: r.name },
            userId: r.userId ?? null,
            organizationId: r.organizationId ?? null,
            errorMessage: err.message,
          },
        })
      } catch {
        // ignore
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return {
    sent,
    failed: recipients.length - sent,
    total: recipients.length,
    errors: errors.length > 0 ? errors : undefined,
  }
})
