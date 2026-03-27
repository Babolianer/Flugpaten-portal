import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { buildEmailHtml } from '~~/server/utils/emailTemplate'

const schema = z.object({
  toEmail: z.string().email().optional(),
  subject: z.string().min(1).optional(),
  bodyPlain: z.string().min(1).optional(),
  resetToQueued: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id fehlt.' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const existing = await prisma.outboundEmail.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Nicht gefunden.' })

  const editable = existing.status === 'QUEUED' || existing.status === 'FAILED'
  if (!editable && (parsed.data.toEmail || parsed.data.subject || parsed.data.bodyPlain)) {
    throw createError({
      statusCode: 400,
      message: 'Nur E-Mails in der Warteschlange oder mit Fehlerstatus können bearbeitet werden.',
    })
  }

  const config = useRuntimeConfig()
  const appUrl = (config.public?.appUrl || 'http://localhost:3000').replace(/\/$/, '')
  const mailLogoUrl = config.mailLogoUrl || ''

  let bodyHtml = existing.bodyHtml
  let bodyPlain = existing.bodyPlain ?? undefined
  if (parsed.data.bodyPlain !== undefined) {
    bodyPlain = parsed.data.bodyPlain
    bodyHtml = buildEmailHtml(bodyPlain, 'PawTransfer', {
      appUrl,
      logoUrl: mailLogoUrl,
      footerText: null,
    })
  }

  const data: Prisma.OutboundEmailUpdateInput = {}
  if (parsed.data.toEmail !== undefined) data.toEmail = parsed.data.toEmail
  if (parsed.data.subject !== undefined) data.subject = parsed.data.subject
  if (parsed.data.bodyPlain !== undefined) {
    data.bodyPlain = bodyPlain
    data.bodyHtml = bodyHtml
  }
  if (parsed.data.resetToQueued && existing.status === 'FAILED') {
    data.status = 'QUEUED'
    data.errorMessage = null
    data.deliveryStatus = null
  }

  const updated = await prisma.outboundEmail.update({
    where: { id },
    data,
  })

  return { email: updated }
})
