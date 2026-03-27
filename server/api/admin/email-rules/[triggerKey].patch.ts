import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureEmailNotificationRules } from '~~/server/utils/emailTriggerEngine'

const schema = z.object({
  enabled: z.boolean().optional(),
  deliveryMode: z.enum(['IMMEDIATE', 'QUEUED']).optional(),
  recipientKind: z.enum(['ORG_CONTACT_EMAIL', 'USER_SELF', 'ADMIN_EMAIL']).optional(),
  subjectTemplate: z.string().min(1).optional(),
  bodyTemplate: z.string().min(1).optional(),
  labelDe: z.string().min(1).optional(),
  descriptionDe: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  await ensureEmailNotificationRules()
  const triggerKey = getRouterParam(event, 'triggerKey')
  if (!triggerKey) {
    throw createError({ statusCode: 400, message: 'triggerKey fehlt.' })
  }
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const existing = await prisma.emailNotificationRule.findUnique({ where: { triggerKey } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Unbekannter Trigger.' })
  }

  const data = parsed.data
  const updated = await prisma.emailNotificationRule.update({
    where: { triggerKey },
    data: {
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      ...(data.deliveryMode !== undefined ? { deliveryMode: data.deliveryMode } : {}),
      ...(data.recipientKind !== undefined ? { recipientKind: data.recipientKind } : {}),
      ...(data.subjectTemplate !== undefined ? { subjectTemplate: data.subjectTemplate } : {}),
      ...(data.bodyTemplate !== undefined ? { bodyTemplate: data.bodyTemplate } : {}),
      ...(data.labelDe !== undefined ? { labelDe: data.labelDe } : {}),
      ...(data.descriptionDe !== undefined ? { descriptionDe: data.descriptionDe } : {}),
    },
  })
  return { rule: updated }
})
