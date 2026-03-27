import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    subject?: string
    body?: string
    footerText?: string
    footerHtml?: string
    footerTextDe?: string
    footerTextEn?: string
    footerHtmlDe?: string
    footerHtmlEn?: string
  }>(event)
  const subject = typeof body?.subject === 'string' ? body.subject.trim() || null : undefined
  const bodyText = typeof body?.body === 'string' ? body.body.trim() || null : undefined
  const footerText = typeof body?.footerText === 'string' ? body.footerText.trim() || null : undefined
  const footerHtml = typeof body?.footerHtml === 'string'
    ? (body.footerHtml.trim().length > 0 ? body.footerHtml : null)
    : undefined
  const footerTextDe = typeof body?.footerTextDe === 'string' ? body.footerTextDe.trim() || null : undefined
  const footerTextEn = typeof body?.footerTextEn === 'string' ? body.footerTextEn.trim() || null : undefined
  const footerHtmlDe = typeof body?.footerHtmlDe === 'string'
    ? (body.footerHtmlDe.trim().length > 0 ? body.footerHtmlDe : null)
    : undefined
  const footerHtmlEn = typeof body?.footerHtmlEn === 'string'
    ? (body.footerHtmlEn.trim().length > 0 ? body.footerHtmlEn : null)
    : undefined

  const updateData: {
    subject?: string | null
    body?: string | null
    footerText?: string | null
    footerHtml?: string | null
    footerTextDe?: string | null
    footerTextEn?: string | null
    footerHtmlDe?: string | null
    footerHtmlEn?: string | null
  } = {}
  if (subject !== undefined) updateData.subject = subject
  if (bodyText !== undefined) updateData.body = bodyText
  if (footerText !== undefined) updateData.footerText = footerText
  if (footerHtml !== undefined) updateData.footerHtml = footerHtml
  if (footerTextDe !== undefined) updateData.footerTextDe = footerTextDe
  if (footerTextEn !== undefined) updateData.footerTextEn = footerTextEn
  if (footerHtmlDe !== undefined) updateData.footerHtmlDe = footerHtmlDe
  if (footerHtmlEn !== undefined) updateData.footerHtmlEn = footerHtmlEn

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Mindestens ein Feld (subject, body, footerText, footerHtml, footerTextDe, footerTextEn, footerHtmlDe, footerHtmlEn) erwartet.',
    })
  }

  await prisma.acquisitionMailSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...updateData },
    update: updateData,
  })

  return { ok: true }
})
