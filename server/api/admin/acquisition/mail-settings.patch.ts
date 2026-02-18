import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<{ subject?: string; body?: string; footerText?: string }>(event)
  const subject = typeof body?.subject === 'string' ? body.subject.trim() || null : undefined
  const bodyText = typeof body?.body === 'string' ? body.body.trim() || null : undefined
  const footerText = typeof body?.footerText === 'string' ? body.footerText.trim() || null : undefined

  const updateData: { subject?: string | null; body?: string | null; footerText?: string | null } = {}
  if (subject !== undefined) updateData.subject = subject
  if (bodyText !== undefined) updateData.body = bodyText
  if (footerText !== undefined) updateData.footerText = footerText

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, message: 'Mindestens ein Feld (subject, body, footerText) erwartet.' })
  }

  await prisma.acquisitionMailSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...updateData },
    update: updateData,
  })

  return { ok: true }
})
