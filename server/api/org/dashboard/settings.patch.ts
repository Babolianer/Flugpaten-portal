import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  organizationId: z.string().min(1),
  description: z.string().optional().nullable(),
  landingContent: z.string().optional().nullable(),
  website: z.union([z.string().url(), z.literal('')]).optional().nullable().transform((v) => v === '' ? null : v),
  preferredLanguage: z.enum(['de', 'en', 'fr', 'es', 'it', 'pl']).optional(),
  contactEmail: z
    .string()
    .optional()
    .transform((v) => (v === '' || v == null ? undefined : v))
    .refine((v) => v === undefined || (v.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)), { message: 'Ungültige E-Mail-Adresse' }),
  contactPhone: z.string().optional().nullable().transform((v) => v === '' ? null : v),
  contactInstagram: z.string().optional().nullable().transform((v) => v === '' ? null : v),
  contactFacebook: z.string().optional().nullable().transform((v) => v === '' ? null : v),
  logoUrl: z.union([z.string().url(), z.literal('')]).optional().nullable().transform((v) => v === '' ? null : v),
  automatedMessageTemplate1: z.string().max(2000).optional().nullable().transform((v) => (v === '' ? null : v)),
  automatedMessageTemplate2: z.string().max(2000).optional().nullable().transform((v) => (v === '' ? null : v)),
  automatedMessageTemplate3: z.string().max(2000).optional().nullable().transform((v) => (v === '' ? null : v)),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  let body: unknown
  try {
    body = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, message: 'Ungültiger Request-Body (JSON erwartet)' })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    const msg = first?.message ?? 'Ungültige Eingabe'
    throw createError({ statusCode: 400, message: msg, data: parsed.error.flatten() })
  }

  await ensureOrgAccess(event, parsed.data.organizationId)

  const data: Record<string, unknown> = {}
  if (parsed.data.description !== undefined) data.description = parsed.data.description ?? null
  if (parsed.data.landingContent !== undefined) data.landingContent = parsed.data.landingContent ?? null
  if (parsed.data.website !== undefined) data.website = parsed.data.website ?? null
  if (parsed.data.preferredLanguage !== undefined) data.preferredLanguage = parsed.data.preferredLanguage
  if (parsed.data.contactEmail !== undefined && parsed.data.contactEmail !== '') data.contactEmail = parsed.data.contactEmail
  if (parsed.data.contactPhone !== undefined) data.contactPhone = parsed.data.contactPhone ?? null
  if (parsed.data.contactInstagram !== undefined) data.contactInstagram = parsed.data.contactInstagram ?? null
  if (parsed.data.contactFacebook !== undefined) data.contactFacebook = parsed.data.contactFacebook ?? null
  if (parsed.data.logoUrl !== undefined) data.logoUrl = parsed.data.logoUrl ?? null
  if (parsed.data.automatedMessageTemplate1 !== undefined) data.automatedMessageTemplate1 = parsed.data.automatedMessageTemplate1 ?? null
  if (parsed.data.automatedMessageTemplate2 !== undefined) data.automatedMessageTemplate2 = parsed.data.automatedMessageTemplate2 ?? null
  if (parsed.data.automatedMessageTemplate3 !== undefined) data.automatedMessageTemplate3 = parsed.data.automatedMessageTemplate3 ?? null

  const id = parsed.data.organizationId
  const hasLandingContent = parsed.data.landingContent !== undefined

  try {
    const updated = await prisma.organization.update({
      where: { id },
      data,
    })
    return { organization: updated }
  } catch (dbError: unknown) {
    const msg = dbError instanceof Error ? dbError.message : String(dbError)
    const isUnknownArg = msg.includes('Unknown argument')
    if (isUnknownArg) {
      const dataSafe: Record<string, unknown> = {}
      if (parsed.data.description !== undefined) dataSafe.description = parsed.data.description || null
      if (parsed.data.website !== undefined) dataSafe.website = parsed.data.website || null
      if (parsed.data.preferredLanguage !== undefined) dataSafe.preferredLanguage = parsed.data.preferredLanguage
      if (parsed.data.contactEmail != null) dataSafe.contactEmail = parsed.data.contactEmail
      await prisma.organization.update({
        where: { id },
        data: dataSafe,
      })
      try {
        await prisma.$executeRaw`
          UPDATE "Organization" SET
            landing_content = ${parsed.data.landingContent ?? null},
            contact_phone = ${parsed.data.contactPhone ?? null},
            contact_instagram = ${parsed.data.contactInstagram ?? null},
            contact_facebook = ${parsed.data.contactFacebook ?? null}
          WHERE id = ${id}
        `
      } catch (rawErr: unknown) {
        const rawMsg = rawErr instanceof Error ? rawErr.message : String(rawErr)
        if (rawMsg.includes('does not exist') || rawMsg.includes('column')) {
          throw createError({
            statusCode: 500,
            message: 'Spalten fehlen. Bitte npx prisma db push oder npx prisma migrate deploy ausführen.',
          })
        }
        throw createError({
          statusCode: 500,
          message: 'Datenbankfehler beim Speichern. ' + rawMsg,
        })
      }
      const organization = await prisma.organization.findUnique({ where: { id } })
      const withExtra = organization
        ? {
            ...organization,
            landingContent: parsed.data.landingContent ?? (organization as { landingContent?: string | null }).landingContent ?? null,
            contactPhone: parsed.data.contactPhone ?? null,
            contactInstagram: parsed.data.contactInstagram ?? null,
            contactFacebook: parsed.data.contactFacebook ?? null,
          }
        : null
      return { organization: withExtra ?? organization }
    }
    if (msg.includes('landing_content') || msg.includes('does not exist') || msg.includes('Unknown column')) {
      throw createError({
        statusCode: 500,
        message: 'Datenbank-Schema veraltet. Bitte ausführen: npx prisma migrate dev (oder npx prisma db push) und npx prisma generate',
      })
    }
    throw createError({ statusCode: 500, message: msg })
  }
})
